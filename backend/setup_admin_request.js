import pg from 'pg';
import bcrypt from 'bcryptjs';
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

const setupAdmin = async () => {
    const email = 'tatajikomaragiri@gmail.com';
    const password = 'nani@1432';
    const name = 'Admin User';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        const checkRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (checkRes.rows.length > 0) {
            // Update existing
            await pool.query(
                'UPDATE users SET password = $1, role = $2 WHERE email = $3',
                [hashedPassword, 'admin', email]
            );
            console.log(`User ${email} updated to admin with new password.`);
        } else {
            // Create new
            await pool.query(
                'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
                [name, email, hashedPassword, 'admin']
            );
            console.log(`Admin user ${email} created successfully.`);
        }
    } catch (err) {
        console.error('Error setting up admin:', err);
    } finally {
        await pool.end();
    }
};

setupAdmin();
