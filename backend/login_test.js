import pool from "./config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const testLogin = async (email, password) => {
    try {
        console.log(`Testing login for ${email}...`);
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (user.rows.length === 0) {
            console.log("User not found");
            return;
        }

        const userData = user.rows[0];
        console.log("User data found:", { id: userData.id, email: userData.email, role: userData.role });

        const isMatch = await bcrypt.compare(password, userData.password);
        console.log("Password match:", isMatch);

        if (isMatch) {
            const token = jwt.sign({ id: userData.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
            console.log("Token generated successfully");
        }

        process.exit(0);
    } catch (err) {
        console.error("Login simulation failed:", err.message);
        console.error(err.stack);
        process.exit(1);
    }
};

// Admin email from screenshot
testLogin("tatajikomaragiri@gmail.com", "nani@1432");
