import express from "express";
import fs from "fs";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.js";
import { admin } from "../middleware/admin.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { PDFParse } from "pdf-parse";

const router = express.Router();

// Store Questions AND optionally Create Exam
router.post("/upload-questions", protect, admin, async (req, res) => {
    const { questions, title, duration } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "Invalid questions data" });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const questionIds = [];
            for (const q of questions) {
                const qRes = await client.query(
                    "INSERT INTO questions (question_text, image_url, options, correct_index, category, points) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
                    [q.text, q.imageUrl || null, JSON.stringify(q.options), q.correctIndex, q.category, q.points || 1]
                );
                questionIds.push(qRes.rows[0].id);
            }

            let exam = null;
            if (title) {
                const examRes = await client.query(
                    "INSERT INTO exams (title, duration_minutes, question_ids, is_published) VALUES ($1, $2, $3, $4) RETURNING *",
                    [title, duration || 180, questionIds, true]
                );
                exam = examRes.rows[0];
            }

            await client.query("COMMIT");

            // Notify all students about the new exam/questions
            if (title) {
                const studentsRes = await pool.query("SELECT id FROM users WHERE role = 'student'");
                for (const student of studentsRes.rows) {
                    await pool.query(
                        "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)",
                        [student.id, "New Exam Available", `The exam "${title}" has been created and is now available.`]
                    );
                }
            }

            res.status(201).json({
                message: title
                    ? `Exam '${title}' created with ${questions.length} questions.`
                    : `${questions.length} questions uploaded to question bank successfully`,
                questionIds,
                exam
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during upload" });
    }
});

// Extract Questions from PDF and Store in Question Bank
router.post("/extract-pdf", protect, admin, upload.single("paper"), async (req, res) => {
    const file = req.file;
    const { answerKey, title, duration } = req.body;

    if (!file) {
        console.log("Extraction Error: No file provided");
        return res.status(400).json({ message: "No file uploaded" });
    }

    console.log(`Starting extraction for file: ${file.path}, size: ${file.size}`);

    try {
        if (!fs.existsSync(file.path)) {
            throw new Error(`File does not exist at path: ${file.path}`);
        }

        const dataBuffer = fs.readFileSync(file.path);
        console.log("PDF buffer read successfully, length:", dataBuffer.length);

        const parser = new PDFParse({ data: dataBuffer });
        const textResult = await parser.getText();
        const text = textResult.text;

        if (!text || text.length < 10) {
            console.warn("Extraction Warning: PDF text is empty or too short");
            return res.json({ questions: [], message: "No text could be extracted from PDF" });
        }

        console.log("PDF parsed successfully, text length:", text.length);

        // 1. Parse Answer Key
        let parsedKey = [];
        if (answerKey) {
            const pairMatches = [...answerKey.matchAll(/(?:Q?\d+[:\-\s]+)?([A-D])/gi)];
            if (pairMatches.length > 0) {
                parsedKey = pairMatches.map(m => m[1].toUpperCase());
            } else {
                parsedKey = answerKey.replace(/[^A-D]/gi, "").toUpperCase().split("");
            }
        }
        console.log("Answer Key parsed, count:", parsedKey.length);

        // 2. Enhanced Heuristic Parser for Questions
        // Split by numbers followed by . or ) at the start of lines or after significant space
        const rawBlocks = text.split(/\n\s*(?=\d+[\.\)])/);
        const questions = [];

        rawBlocks.forEach((block, idx) => {
            if (!block.trim()) return;

            // Look for options like a) or (A) or A. (case insensitive)
            const optionSplitRegex = /\s*[\(\[]?([a-dA-D])[\)\]\.]\s+/g;
            const matches = [...block.matchAll(optionSplitRegex)];

            if (matches.length >= 2) {
                // Determine the start of the first option to isolate question text
                const firstOptionIndex = matches[0].index;
                const questionText = block.substring(0, firstOptionIndex)
                    .replace(/^\s*\d+[\.\)]\s*/, "") // Remove leading question number
                    .trim();

                const options = [];
                for (let i = 0; i < matches.length; i++) {
                    const currentMatch = matches[i];
                    const nextMatch = matches[i + 1];
                    const start = currentMatch.index + currentMatch[0].length;
                    const end = nextMatch ? nextMatch.index : block.length;
                    options.push(block.substring(start, end).trim());
                }

                if (questionText && options.length >= 2) {
                    let correctIndex = 0;
                    if (parsedKey[questions.length]) {
                        const keyChar = parsedKey[questions.length].toUpperCase();
                        correctIndex = keyChar.charCodeAt(0) - 65;
                    }

                    questions.push({
                        text: questionText,
                        options: options.length === 4 ? options : [...options, "N/A", "N/A", "N/A", "N/A"].slice(0, 4),
                        correctIndex,
                        category: "NATA General",
                        points: 1
                    });
                }
            }
        });

        console.log(`Extraction complete. Found ${questions.length} questions.`);

        // Store questions in database
        if (questions.length > 0) {
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                const questionIds = [];

                for (const q of questions) {
                    const qRes = await client.query(
                        "INSERT INTO questions (question_text, image_url, options, correct_index, category, points) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
                        [q.text, q.imageUrl || null, JSON.stringify(q.options), q.correctIndex, q.category, q.points]
                    );
                    questionIds.push(qRes.rows[0].id);
                }

                let exam = null;
                if (title) {
                    const examRes = await client.query(
                        "INSERT INTO exams (title, duration_minutes, question_ids, is_published) VALUES ($1, $2, $3, $4) RETURNING *",
                        [title, duration || 180, questionIds, true]
                    );
                    exam = examRes.rows[0];
                }

                await client.query("COMMIT");
                console.log(`${questions.length} questions stored in database`);

                res.json({
                    message: title
                        ? `Successfully extracted ${questions.length} questions and created exam '${title}'`
                        : `Successfully extracted and stored ${questions.length} questions in question bank`,
                    questionCount: questions.length,
                    questionIds,
                    questions,
                    exam
                });
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            } finally {
                client.release();
            }
        } else {
            res.json({
                message: "No questions could be extracted from this PDF",
                questionCount: 0
            });
        }
    } catch (error) {
        console.error("Extraction error detailed:", error);
        res.status(500).json({
            message: "Failed to extract text from PDF",
            details: error.message
        });
    } finally {
        // Cleanup temp file
        if (file && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
                console.log("Temp file cleaned up:", file.path);
            } catch (unlinkError) {
                console.error("Failed to clean up temp file:", unlinkError);
            }
        }
    }
});

// Upload Paper (PDF or Image)
router.post("/upload-paper", protect, admin, upload.single("paper"), async (req, res) => {
    const { title, duration } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    if (!title) {
        return res.status(400).json({ message: "Exam title is required" });
    }

    try {
        const paperUrl = `/uploads/${file.filename}`;

        const newExam = await pool.query(
            "INSERT INTO exams (title, duration_minutes, question_ids, paper_url, is_published) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, duration || 180, [], paperUrl, true]
        );

        res.status(201).json({
            message: "Paper uploaded successfully",
            exam: newExam.rows[0]
        });

        // Notify all students about the new paper
        const studentsRes = await pool.query("SELECT id FROM users WHERE role = 'student'");
        for (const student of studentsRes.rows) {
            await pool.query(
                "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)",
                [student.id, "New Exam Paper Uploaded", `A new exam paper "${title}" has been uploaded and is now available.`]
            );
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during paper upload" });
    }
});


// Generate Exam with Jumbling Logic
router.post("/generate-exam", protect, admin, async (req, res) => {
    const { title, duration, questionCount, category } = req.body;

    try {
        let query = "SELECT id FROM questions";
        let params = [];
        if (category) {
            query += " WHERE category = $1";
            params.push(category);
        }

        const allQuestions = await pool.query(query, params);

        if (allQuestions.rows.length < questionCount) {
            return res.status(400).json({ message: `Only ${allQuestions.rows.length} questions available in this category.` });
        }

        // Jumble logic: Shuffle and pick N
        const shuffled = allQuestions.rows
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value.id)
            .slice(0, questionCount);

        const newExam = await pool.query(
            "INSERT INTO exams (title, duration_minutes, question_ids, is_published) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, duration || 180, shuffled, true]
        );

        res.status(201).json(newExam.rows[0]);

        // Notify all students about the new generated exam
        const studentsRes = await pool.query("SELECT id FROM users WHERE role = 'student'");
        for (const student of studentsRes.rows) {
            await pool.query(
                "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)",
                [student.id, "New Exam Available", `A new mock test "${title}" has been generated and is now available.`]
            );
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during exam generation" });
    }
});

// Get all exams for admin
router.get("/exams", protect, admin, async (req, res) => {
    try {
        const exams = await pool.query("SELECT * FROM exams ORDER BY created_at DESC");
        res.json(exams.rows);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get stats
router.get("/stats", protect, admin, async (req, res) => {
    try {
        const studentCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'");
        const questionCount = await pool.query("SELECT COUNT(*) FROM questions");
        const examCount = await pool.query("SELECT COUNT(*) FROM exams");

        res.json({
            students: parseInt(studentCount.rows[0].count),
            questions: parseInt(questionCount.rows[0].count),
            exams: parseInt(examCount.rows[0].count)
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get all published exams for students
router.get("/published-exams", protect, async (req, res) => {
    try {
        const exams = await pool.query("SELECT * FROM exams WHERE is_published = true ORDER BY created_at DESC");
        res.json(exams.rows);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get specific exam and its questions
router.get("/exams/:id/questions", protect, async (req, res) => {
    const { id } = req.params;
    try {
        const exam = await pool.query("SELECT * FROM exams WHERE id = $1", [id]);
        if (exam.rows.length === 0) return res.status(404).json({ message: "Exam not found" });

        const qIds = exam.rows[0].question_ids;
        const questions = await pool.query(
            "SELECT * FROM questions WHERE id = ANY($1)",
            [qIds]
        );

        // Maintain the order from the exam's question_ids (which was jumbled at creation)
        const orderedQuestions = qIds.map(qid => questions.rows.find(q => q.id === qid));

        res.json({
            exam: exam.rows[0],
            questions: orderedQuestions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Submit Exam Results
router.post("/submit-exam", protect, async (req, res) => {
    const { examId, answers } = req.body; // answers is an array of selected indices

    try {
        const exam = await pool.query("SELECT * FROM exams WHERE id = $1", [examId]);
        if (exam.rows.length === 0) return res.status(404).json({ message: "Exam not found" });

        const qIds = exam.rows[0].question_ids;
        const questions = await pool.query(
            "SELECT * FROM questions WHERE id = ANY($1)",
            [qIds]
        );

        let correctCount = 0;
        let totalMarks = 0;
        let score = 0;

        qIds.forEach((qid, idx) => {
            const question = questions.rows.find(q => q.id === qid);
            if (question) {
                totalMarks += question.points || 1;
                if (answers[idx] === question.correct_index) {
                    correctCount++;
                    score += question.points || 1;
                }
            }
        });

        const result = await pool.query(
            "INSERT INTO exam_results (user_id, exam_id, score, total_marks, correct_count, wrong_count, answers) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [req.user.id, examId, score, totalMarks, correctCount, qIds.length - correctCount, JSON.stringify(answers)]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during submission" });
    }
});

// Get recent results for a user
router.get("/my-results", protect, async (req, res) => {
    try {
        const results = await pool.query(
            "SELECT er.*, e.title as exam_title FROM exam_results er JOIN exams e ON er.exam_id = e.id WHERE er.user_id = $1 ORDER BY er.completed_at DESC",
            [req.user.id]
        );
        res.json(results.rows);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get specific result details
router.get("/results/:id", protect, async (req, res) => {
    try {
        const resultRes = await pool.query(
            "SELECT er.*, e.title as exam_title, e.question_ids FROM exam_results er JOIN exams e ON er.exam_id = e.id WHERE er.id = $1 AND er.user_id = $2",
            [req.params.id, req.user.id]
        );
        if (resultRes.rows.length === 0) return res.status(404).json({ message: "Result not found" });

        const result = resultRes.rows[0];
        const questionsRes = await pool.query(
            "SELECT id, question_text, image_url, options, correct_index, category FROM questions WHERE id = ANY($1)",
            [result.question_ids]
        );

        // Sort questions back to the jumbled order of the exam
        const questions = result.question_ids.map(qid => questionsRes.rows.find(q => q.id === qid));

        res.json({ ...result, questions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all students
router.get("/students", protect, admin, async (req, res) => {
    try {
        const students = await pool.query("SELECT id, name, email, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC");
        res.json(students.rows);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Toggle Exam Publish Status
router.patch("/exams/:id/toggle-publish", protect, admin, async (req, res) => {
    try {
        const exam = await pool.query("SELECT is_published FROM exams WHERE id = $1", [req.params.id]);
        if (exam.rows.length === 0) return res.status(404).json({ message: "Exam not found" });

        const newStatus = !exam.rows[0].is_published;
        await pool.query("UPDATE exams SET is_published = $1 WHERE id = $2", [newStatus, req.params.id]);

        res.json({ message: `Exam ${newStatus ? 'published' : 'unpublished'} successfully`, is_published: newStatus });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Delete Exam
router.delete("/exams/:id", protect, admin, async (req, res) => {
    try {
        await pool.query("DELETE FROM exams WHERE id = $1", [req.params.id]);
        res.json({ message: "Exam deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- Notification Routes ---

// Get User Notifications
router.get("/notifications", protect, async (req, res) => {
    try {
        const notifications = await pool.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            [req.user.id]
        );
        res.json(notifications.rows);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Mark Notification as Read
router.patch("/notifications/:id/read", protect, async (req, res) => {
    try {
        await pool.query(
            "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
            [req.params.id, req.user.id]
        );
        res.json({ message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
