import pool from "./config/db.js";

const migrateRegistrationOtps = async () => {
    try {
        const client = await pool.connect();
        console.log("🚀 Migrating registration OTPs...");

        await client.query(`
            CREATE TABLE IF NOT EXISTS registration_otps (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                otp VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("✅ 'registration_otps' table created/verified");
        client.release();
        console.log("✨ Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

migrateRegistrationOtps();
