import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

console.log("Checking DB Connection...");
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`Port: ${process.env.DB_PORT}`);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const verify = async () => {
    try {
        const client = await pool.connect();
        console.log("✅ Successfully connected to database");

        const res = await client.query('SELECT NOW()');
        console.log("✅ Query test passed:", res.rows[0]);

        // Check if users table exists
        const tableRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'users'
      );
    `);

        if (tableRes.rows[0].exists) {
            console.log("✅ 'users' table exists");

            // Check columns
            const columnsRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
            console.log("Table columns:", columnsRes.rows.map(r => r.column_name).join(", "));
        } else {
            console.error("❌ 'users' table DOES NOT exist");
            process.exit(1);
        }

        client.release();
        process.exit(0);
    } catch (err) {
        console.error("❌ Connection failed:", err.message);
        process.exit(1);
    }
};

verify();
