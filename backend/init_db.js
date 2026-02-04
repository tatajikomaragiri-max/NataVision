import pool from "./config/db.js";

const setupDB = async () => {
    try {
        const client = await pool.connect();
        console.log("🚀 Starting database migration...");

        // 1. Add role to users table if it doesn't exist
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin'));
        `);
        console.log("✅ Column 'role' added/verified in 'users' table");

        // 2. Create Questions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                question_text TEXT NOT NULL,
                image_url TEXT,
                options JSONB NOT NULL,
                correct_index INTEGER NOT NULL,
                category VARCHAR(100),
                points INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ 'questions' table created/verified");

        // 3. Create Exams table
        await client.query(`
            CREATE TABLE IF NOT EXISTS exams (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                duration_minutes INTEGER DEFAULT 180,
                question_ids INTEGER[] NOT NULL,
                paper_url TEXT,
                is_published BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ 'exams' table created/verified");

        // 4. Create Exam Results table (to track user performance)
        await client.query(`
            CREATE TABLE IF NOT EXISTS exam_results (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
                score INTEGER NOT NULL,
                total_marks INTEGER NOT NULL,
                correct_count INTEGER NOT NULL,
                wrong_count INTEGER NOT NULL,
                answers JSONB,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ 'exam_results' table created/verified");

        // 5. Create Notifications table
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ 'notifications' table created/verified");

        client.release();
        console.log("✨ Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

setupDB();
