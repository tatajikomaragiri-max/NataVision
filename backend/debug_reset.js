import pool from "./config/db.js";
import bcrypt from "bcryptjs";

const debugReset = async () => {
    try {
        console.log("--- DEBUGGING PASSWORD RESET FLOW ---");

        // 1. Check Table Schema
        console.log("\n1. Checking 'users' table schema...");
        const schemaRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);

        const columns = schemaRes.rows.map(r => r.column_name);
        console.log("Columns found:", columns.join(", "));

        const hasOtpCode = columns.includes("otp_code");
        const hasOtpExpiry = columns.includes("otp_expiry");

        if (!hasOtpCode || !hasOtpExpiry) {
            console.error("❌ MISSING COLUMNS: otp_code or otp_expiry is missing from users table!");
            if (!hasOtpCode) console.log("   - otp_code missing");
            if (!hasOtpExpiry) console.log("   - otp_expiry missing");
            process.exit(1);
        } else {
            console.log("✅ Schema looks correct (otp_code and otp_expiry exist).");
        }

        // 2. Create/Update Test User
        const testEmail = "debug_reset_test@example.com";
        console.log(`\n2. Setting up test user: ${testEmail}`);

        // Ensure user exists
        let userRes = await pool.query("SELECT * FROM users WHERE email = $1", [testEmail]);
        if (userRes.rows.length === 0) {
            await pool.query("INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
                ["Debug User", testEmail, "hashed_dummy", "student"]);
            console.log("   - Created test user.");
        } else {
            console.log("   - Test user exists.");
        }

        // 3. Simulate Request OTP
        console.log("\n3. Simulating 'Request OTP'...");
        const otp = "123456";
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now

        await pool.query(
            "UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE email = $3",
            [otp, expiry, testEmail]
        );
        console.log(`   - Updated OTP to ${otp} with expiry ${expiry.toISOString()}`);

        // 4. Verify OTP Logic
        console.log("\n4. Verifying OTP (Simulating /verify-otp)...");
        const verifyRes = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND otp_code = $2 AND otp_expiry > NOW()",
            [testEmail, otp]
        );

        if (verifyRes.rows.length > 0) {
            console.log("✅ OTP Verified successfully via SQL.");
        } else {
            console.error("❌ OTP Verification FAILED via SQL. Check timestamps.");
            // Debug timestamps
            const user = (await pool.query("SELECT otp_expiry, NOW() as db_now FROM users WHERE email = $1", [testEmail])).rows[0];
            console.log("   - DB stored expiry:", user.otp_expiry);
            console.log("   - DB NOW():       ", user.db_now);
        }

        // 5. Reset Password Logic
        console.log("\n5. Simulating 'Reset Password'...");
        const newPass = "new_secure_password";
        const hashed = await bcrypt.hash(newPass, 10);

        // Check match again like route does
        const resetCheck = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND otp_code = $2 AND otp_expiry > NOW()",
            [testEmail, otp]
        );

        if (resetCheck.rows.length > 0) {
            await pool.query(
                "UPDATE users SET password = $1, otp_code = NULL, otp_expiry = NULL WHERE email = $2",
                [hashed, testEmail]
            );
            console.log("✅ Password updated successfully.");
        } else {
            console.error("❌ Reset Password Pre-check FAILED.");
        }

        console.log("\n--- DEBUG COMPLETE ---");

    } catch (err) {
        console.error("FATAL ERROR:", err);
    } finally {
        pool.end();
    }
};

debugReset();
