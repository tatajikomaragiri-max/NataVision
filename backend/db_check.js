import pool from "./config/db.js";

const verify = async () => {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.log("Users Table Columns:", res.rows);

        const count = await pool.query("SELECT COUNT(*) FROM users");
        console.log("User count:", count.rows[0].count);

        process.exit(0);
    } catch (err) {
        console.error("Verification failed:", err.message);
        process.exit(1);
    }
};

verify();
