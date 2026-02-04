import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        console.log("Checking for OTP columns...");
        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
      ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
    `);
        console.log("Migration successful: OTP columns added.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
