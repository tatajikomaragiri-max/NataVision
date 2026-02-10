import express from "express";
import fs from "fs";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.js";
import { admin } from "../middleware/admin.js";
import { upload } from "../middleware/uploadMiddleware.js";
import pdfParse from "pdf-parse/lib/pdf-parse.js"; // ✅ FIXED

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
          `INSERT INTO questions 
           (question_text, image_url, options, correct_index, category, points)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            q.text,
            q.imageUrl || null,
            JSON.stringify(q.options),
            q.correctIndex,
            q.category,
            q.points || 1
          ]
        );
        questionIds.push(qRes.rows[0].id);
      }

      let exam = null;
      if (title) {
        const examRes = await client.query(
          `INSERT INTO exams 
           (title, duration_minutes, question_ids, is_published)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [title, duration || 180, questionIds, true]
        );
        exam = examRes.rows[0];

        // ✅ Notify all students about new exam
        await client.query(
          `INSERT INTO notifications (user_id, title, message)
           SELECT id, $1, $2 
           FROM users 
           WHERE role = 'student'`,
          [
            'New Exam Available! 🎯',
            `"${title}" is now available with ${questions.length} questions!`
          ]
        );
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: title
          ? `Exam '${title}' created with ${questions.length} questions`
          : `${questions.length} questions uploaded successfully`,
        questionIds,
        exam
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during upload" });
  }
});

// Extract Questions from PDF
router.post(
  "/extract-pdf",
  protect,
  admin,
  upload.single("paper"),
  async (req, res) => {
    const file = req.file;
    const { answerKey, title, duration } = req.body;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const dataBuffer = fs.readFileSync(file.path);

      // ✅ FIXED pdf-parse usage
      const data = await pdfParse(dataBuffer);
      const text = data.text;

      if (!text || text.length < 10) {
        return res.json({ message: "No text extracted", questions: [] });
      }

      let parsedKey = [];
      if (answerKey) {
        parsedKey = answerKey.replace(/[^A-D]/gi, "").toUpperCase().split("");
      }

      const rawBlocks = text.split(/\n\s*(?=\d+[\.\)])/);
      const questions = [];

      rawBlocks.forEach(block => {
        const optionRegex = /\s*[\(\[]?([A-Da-d])[\)\]\.]\s+/g;
        const matches = [...block.matchAll(optionRegex)];

        if (matches.length >= 2) {
          const qText = block
            .substring(0, matches[0].index)
            .replace(/^\s*\d+[\.\)]\s*/, "")
            .trim();

          const options = [];
          for (let i = 0; i < matches.length; i++) {
            const start = matches[i].index + matches[i][0].length;
            const end = matches[i + 1] ? matches[i + 1].index : block.length;
            options.push(block.substring(start, end).trim());
          }

          if (qText && options.length >= 2) {
            const correctIndex = parsedKey[questions.length]
              ? parsedKey[questions.length].charCodeAt(0) - 65
              : 0;

            questions.push({
              text: qText,
              options: options.slice(0, 4),
              correctIndex,
              category: "NATA General",
              points: 1
            });
          }
        }
      });

      // Store questions
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const ids = [];

        for (const q of questions) {
          const r = await client.query(
            `INSERT INTO questions 
             (question_text, options, correct_index, category, points)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [
              q.text,
              JSON.stringify(q.options),
              q.correctIndex,
              q.category,
              q.points
            ]
          );
          ids.push(r.rows[0].id);
        }

        let exam = null;
        if (title) {
          const er = await client.query(
            `INSERT INTO exams 
             (title, duration_minutes, question_ids, is_published)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [title, duration || 180, ids, true]
          );
          exam = er.rows[0];
        }

        await client.query("COMMIT");

        res.json({
          message: "PDF extracted successfully",
          questionCount: questions.length,
          exam
        });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(err);
      fs.appendFileSync('debug_log.txt', `[PDF_EXTRACT_ERROR] ${err.message}\n${err.stack}\n`);
      res.status(500).json({ message: "PDF extraction failed" });
    } finally {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
);

// Stats
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const students = await pool.query("SELECT COUNT(*) FROM users WHERE role='student'");
    const questions = await pool.query("SELECT COUNT(*) FROM questions");
    const exams = await pool.query("SELECT COUNT(*) FROM exams");

    res.json({
      students: Number(students.rows[0].count),
      questions: Number(questions.rows[0].count),
      exams: Number(exams.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- MISSING EXAM ROUTES ---

// 1. Get All Exams (Admin)
router.get("/exams", protect, admin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM exams ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching exams" });
  }
});

// 1b. Get All Students (Admin)
router.get("/students", protect, admin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching students" });
  }
});


// 2. Get Published Exams (Student)
router.get("/published-exams", protect, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM exams WHERE is_published = true ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching published exams" });
  }
});

// 3. Toggle Publish Status
router.patch("/exams/:id/toggle-publish", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        "UPDATE exams SET is_published = NOT is_published WHERE id = $1 RETURNING *",
        [id]
      );
      const exam = result.rows[0];

      // ✅ If now published, notify students
      if (exam.is_published) {
        await client.query(
          `INSERT INTO notifications (user_id, title, message)
           SELECT id, $1, $2 
           FROM users 
           WHERE role = 'student'`,
          [
            'New Exam Published! 🎯',
            `"${exam.title}" is now available!`
          ]
        );
      }

      await client.query("COMMIT");
      res.json(exam);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating exam" });
  }
});

// 4. Delete Exam
router.delete("/exams/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM exams WHERE id = $1", [id]);
    res.json({ message: "Exam deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error deleting exam" });
  }
});

// 5. Generate Random Exam
router.post("/generate-exam", protect, admin, async (req, res) => {
  const { title, questionCount, duration } = req.body;
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Fetch random question IDs
      const qRes = await client.query(
        "SELECT id FROM questions ORDER BY RANDOM() LIMIT $1",
        [questionCount || 50]
      );

      const questionIds = qRes.rows.map(r => r.id);

      const examResult = await client.query(
        `INSERT INTO exams (title, duration_minutes, question_ids, is_published)
               VALUES ($1, $2, $3, $4) RETURNING *`,
        [title, duration || 180, questionIds, true]  // ✅ Auto-publish
      );
      const exam = examResult.rows[0];

      // ✅ Notify all students
      await client.query(
        `INSERT INTO notifications (user_id, title, message)
         SELECT id, $1, $2 
         FROM users 
         WHERE role = 'student'`,
        [
          'New Exam Available! 🎯',
          `"${title}" is now live with ${questionIds.length} questions!`
        ]
      );

      await client.query("COMMIT");
      res.status(201).json(exam);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error generating exam" });
  }
});

// 6. Get My Results (Student)
router.get("/my-results", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT er.*, e.title as exam_title 
             FROM exam_results er 
             JOIN exams e ON er.exam_id = e.id 
             WHERE er.user_id = $1 
             ORDER BY er.completed_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching results" });
  }
});

// 6b. Get Single Result by ID (Student)
router.get("/results/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT er.*, e.title as exam_title 
             FROM exam_results er 
             JOIN exams e ON er.exam_id = e.id 
             WHERE er.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching result" });
  }
});

// 6c. Get Result Review Data (Questions + Answers) - NEW FOR REVIEW PAGE
router.get("/results/:id/review", protect, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch the result
    const resultQuery = await pool.query(
      `SELECT er.*, e.title as exam_title, e.question_ids
       FROM exam_results er
       JOIN exams e ON er.exam_id = e.id
       WHERE er.id = $1`,
      [id]
    );

    if (resultQuery.rows.length === 0) {
      return res.status(404).json({ message: "Result not found" });
    }

    const result = resultQuery.rows[0];

    // 2. Fetch the questions for this exam
    const questionsQuery = await pool.query(
      `SELECT * FROM questions WHERE id = ANY($1)`,
      [result.question_ids]
    );

    // Map questions to match the order in question_ids
    const questionsMap = new Map(questionsQuery.rows.map(q => [q.id, q]));
    const orderedQuestions = result.question_ids.map(id => questionsMap.get(id)).filter(Boolean);

    // answers is already parsed by PostgreSQL (JSONB type)
    const userAnswers = result.answers;

    // 4. Return combined data
    res.json({
      exam_title: result.exam_title,
      score: result.score,
      total_marks: result.total_marks,
      correct_count: result.correct_count,
      wrong_count: result.wrong_count,
      questions: orderedQuestions,
      answers: userAnswers
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching review data" });
  }
});



// 7. Get Exam Questions (Student Validation)
router.get("/exams/:id/questions", protect, async (req, res) => {
  try {
    const { id } = req.params;
    // FETCH Exam
    const examRes = await pool.query("SELECT * FROM exams WHERE id = $1", [id]);
    if (examRes.rows.length === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }
    const exam = examRes.rows[0];

    // FETCH Questions
    const questionIds = exam.question_ids;
    if (!questionIds || questionIds.length === 0) {
      return res.json({ exam, questions: [] });
    }

    const questionsRes = await pool.query(
      "SELECT * FROM questions WHERE id = ANY($1)",
      [questionIds]
    );

    // Map questions to match the order in questionIds
    const questionsMap = new Map(questionsRes.rows.map(q => [q.id, q]));
    const orderedQuestions = questionIds.map(id => questionsMap.get(id)).filter(Boolean);

    res.json({ exam, questions: orderedQuestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching exam questions" });
  }
});

// 8. Submit Exam (Student)
router.post("/submit-exam", protect, async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const userId = req.user.id;

    // 1. Fetch Exam & Questions
    const examRes = await pool.query("SELECT * FROM exams WHERE id = $1", [examId]);
    if (examRes.rows.length === 0) return res.status(404).json({ message: "Exam not found" });
    const exam = examRes.rows[0];

    const questionsRes = await pool.query(
      "SELECT id, correct_index, points FROM questions WHERE id = ANY($1)",
      [exam.question_ids]
    );

    // Map for easy lookup
    const questionMap = new Map(questionsRes.rows.map(q => [q.id, q]));

    // 2. Calculate Score and Counts
    let score = 0;
    let totalMarks = 0;
    let correctCount = 0;
    let wrongCount = 0;

    // Iterate based on exam.question_ids to maintain order matching the answers array
    exam.question_ids.forEach((qId, idx) => {
      const question = questionMap.get(qId);
      if (question) {
        const points = question.points || 1;
        totalMarks += points; // Increment total possible marks

        // userAnswers array index corresponds to question index
        if (answers[idx] === question.correct_index) {
          score += points;
          correctCount++; // Increment correct answers count
        } else {
          wrongCount++; // Increment wrong answers count
        }
      }
    });

    // Safety net: ensure counts are never null
    correctCount = correctCount ?? 0;
    wrongCount = wrongCount ?? 0;

    // 3. Save Result
    const resultRes = await pool.query(
      `INSERT INTO exam_results (user_id, exam_id, score, total_marks, correct_count, wrong_count, answers, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [userId, examId, score, totalMarks, correctCount, wrongCount, JSON.stringify(answers)]
    );

    res.json({
      id: resultRes.rows[0].id,
      message: "Exam submitted successfully",
      score,
      totalMarks
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error submitting exam" });
  }
});

// 9. Get User Notifications
router.get("/notifications", protect, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
});

// 10. Mark Notification as Read
router.patch("/notifications/:id/read", protect, async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating notification" });
  }
});

// 11. Mark All Notifications as Read
router.patch("/notifications/mark-all-read", protect, async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = true WHERE user_id = $1",
      [req.user.id]
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating notifications" });
  }
});

export default router;
