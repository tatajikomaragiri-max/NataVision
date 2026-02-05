import pool from './config/db.js';

const checkUser = async () => {
    try {
        const res = await pool.query("SELECT * FROM users WHERE email = $1", ['simple@example.com']);
        console.log("User Found:", res.rows);
        pool.end();
    } catch (err) {
        console.error(err);
    }
};

checkUser();
