import pool from "./config/db.js";

const listUsers = async () => {
    try {
        const res = await pool.query("SELECT id, email, role, created_at FROM users");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
};

listUsers();
