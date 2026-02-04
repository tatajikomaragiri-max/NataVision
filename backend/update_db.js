import pool from "./config/db.js";

const updateDB = async () => {
    try {
        const client = await pool.connect();
        console.log("🚀 Updating database schema...");

        // Add paper_url to exams table if it doesn't exist
        await client.query(`
            ALTER TABLE exams 
            ADD COLUMN IF NOT EXISTS paper_url TEXT;
        `);
        console.log("✅ Column 'paper_url' added/verified in 'exams' table");

        client.release();
        console.log("✨ Database update completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database update failed:", err.message);
        process.exit(1);
    }
};

updateDB();
