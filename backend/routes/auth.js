import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.js";
import dns from "dns";
import { promisify } from "util";
import nodemailer from "nodemailer";

const resolveMx = promisify(dns.resolveMx);

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
};

// --- Email Transporter Configuration ---
const transporter = nodemailer.createTransport({
  service: "gmail", // Or use host/port for other providers
  auth: {
    user: process.env.EMAIL_USER, // Set these in .env
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("[MAIL] Connection error:", error);
  } else {
    console.log("[MAIL] Server is ready to take our messages");
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("[MAIL] Missing EMAIL_USER or EMAIL_PASS. OTP logged to console:", html);
      return;
    }
    await transporter.sendMail({
      from: `"NATA Vision" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[MAIL] Email sent to ${to}`);
  } catch (error) {
    console.error(`[MAIL] Failed to send email to ${to}:`, error);
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// --- Helper: Validate Email Format and Domain ---
const validateEmail = async (email) => {
  // 1. Basic Regex check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Invalid email format" };
  }

  // 2. DNS check for MX records
  const domain = email.split("@")[1];
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, message: "Email domain does not have mail servers (non-existing domain)" };
    }
  } catch (error) {
    console.warn(`DNS check failed for domain: ${domain}`, error.code);
    return { valid: false, message: "Invalid or non-existing email domain" };
  }

  return { valid: true };
};

// --- OTP Generation for Registration ---
router.post("/request-registration-otp", async (req, res) => {
  const { name, password } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide name, email, and password" });
  }

  try {
    // 1. Validate email
    const validation = await validateEmail(email);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // 2. Check if user already exists
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 4. Store/Update OTP in registration_otps table
    await pool.query(
      "INSERT INTO registration_otps (email, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3, created_at = NOW()",
      [email, otp, expiry]
    );

    // 5. Send Email via Nodemailer
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Your verification code for NATA Vision registration is:</p>
        <h1 style="color: #3b6a9a; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    await sendEmail(email, "Verify Your Email - NATA Vision", emailHtml);

    res.json({ message: "Verification code sent to your email!" });
  } catch (error) {
    console.error("OTP Request Error:", error);
    res.status(500).json({ message: "Server error during OTP request" });
  }
});

// Register (Finalize with OTP)
router.post("/register", async (req, res) => {
  const { name, password, otp } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  if (!name || !email || !password || !otp) {
    return res.status(400).json({ message: "Please provide all required fields including the verification code" });
  }

  try {
    // 1. Verify OTP
    const otpRes = await pool.query(
      "SELECT * FROM registration_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW()",
      [email, otp]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    // 2. Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRes = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, "student"]
    );

    // 3. Cleanup OTP
    await pool.query("DELETE FROM registration_otps WHERE email = $1", [email]);

    // 4. Set Cookie & Respond
    const newUser = newUserRes.rows[0];
    const token = generateToken(newUser.id);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({ user: newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { password } = req.body;
  const email = req.body.email?.trim().toLowerCase();
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userData = user.rows[0];

    const isMatch = await bcrypt.compare(password, userData.password);

    console.log(`[LOGIN] Attempt for ${email}: match=${isMatch}`);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(userData.id);

    res.cookie("token", token, cookieOptions);

    res.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
});

// Me
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
  // return info of the logged in user from protect middleware
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
  });
  res.json({ message: "Logged out successfully" });
});

// --- Forgot Password (OTP) Flow ---

// 1. Request OTP
router.post("/forgot-password", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await pool.query(
      "UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE email = $3",
      [otp, expiry, email]
    );

    // 5. Send Email via Nodemailer
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Your password reset code is:</p>
        <h1 style="color: #3b6a9a; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>
    `;

    await sendEmail(email, "Password Reset Request - NATA Vision", emailHtml);

    res.json({ message: "Verification code sent to your email!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;
  const email = req.body.email?.trim().toLowerCase();
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND otp_code = $2 AND otp_expiry > NOW()",
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified correctly" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. Reset Password
router.post("/reset-password", async (req, res) => {
  const { otp, newPassword } = req.body;
  const email = req.body.email?.trim().toLowerCase();
  try {
    // Verify again just to be safe
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND otp_code = $2 AND otp_expiry > NOW()",
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Session expired, please try again" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`[RESET] Hash generated: ${hashedPassword.substring(0, 10)}...`);

    const updateRes = await pool.query(
      "UPDATE users SET password = $1, otp_code = NULL, otp_expiry = NULL WHERE email = $2",
      [hashedPassword, email]
    );

    console.log(`[RESET] Password update rowCount: ${updateRes.rowCount} for ${email}`);

    if (updateRes.rowCount === 0) {
      console.warn(`[RESET] WARNING: Update returned 0 rows for ${email}`);
    }

    res.json({ message: "Password reset successful! You can now log in." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;