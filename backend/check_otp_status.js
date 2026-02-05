import pool from './config/db.js';

const checkOtp = async () => {
    try {
        const res = await pool.query("SELECT * FROM registration_otps WHERE email = $1", ['testfix@example.com']);
        console.log("OTP Found:", res.rows);
        pool.end();
    } catch (err) {
        console.error(err);
    }
};

checkOtp();
