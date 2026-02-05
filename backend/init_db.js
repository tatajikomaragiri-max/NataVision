import pool from "./config/db.js";

const setupDB = async () => {
    try {
        const client = await pool.connect();
        console.log("🚀 Starting database migration...");

        // 0. Create Users table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ 'users' table created/verified");

        // 2. Create Questions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.questions (
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
            CREATE TABLE IF NOT EXISTS public.exams (
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
            CREATE TABLE IF NOT EXISTS public.exam_results (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
                exam_id INTEGER REFERENCES public.exams(id) ON DELETE CASCADE,
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
            CREATE TABLE IF NOT EXISTS public.notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
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
