
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("Testing Email configuration...");
console.log(`User: ${process.env.EMAIL_USER}`);
// Mask password for log
console.log(`Pass: ${process.env.EMAIL_PASS ? "******" : "Not Set"}`);

async function main() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ Credentials missing in .env");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        console.log("Attempting to send test email...");
        const info = await transporter.sendMail({
            from: `"Test Script" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: "NATA Vision - Test Email",
            text: "If you are reading this, your email configuration is working correctly! ✅",
            html: "<h1>Success!</h1><p>Your backend email configuration is working.</p>",
        });
        console.log("✅ Message sent: %s", info.messageId);
        console.log("Check your inbox at " + process.env.EMAIL_USER);
    } catch (error) {
        console.error("❌ Error sending email:");
        console.error(error);

        if (error.code === 'EAUTH') {
            console.log("\n⚠️  AUTHENTICATION ERROR");
            console.log("Most likely cause: You are using your normal Gmail password.");
            console.log("Solution: You MUST use an App Password.");
            console.log("1. Go to https://myaccount.google.com/security");
            console.log("2. Enable 2-Step Verification");
            console.log("3. Search for 'App Passwords'");
            console.log("4. Create one and use that 16-character code in .env");
        }
    }
}

main();
