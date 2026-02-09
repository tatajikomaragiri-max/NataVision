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
    const result = await pool.query(
      "UPDATE exams SET is_published = NOT is_published WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
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
    // Fetch random question IDs
    const qRes = await pool.query(
      "SELECT id FROM questions ORDER BY RANDOM() LIMIT $1",
      [questionCount || 50]
    );

    const questionIds = qRes.rows.map(r => r.id);

    const result = await pool.query(
      `INSERT INTO exams (title, duration_minutes, question_ids, is_published)
             VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, duration || 180, questionIds, false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error generating exam" });
  }
});

export default router;
