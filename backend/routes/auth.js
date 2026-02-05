import express from "express";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.js";
import dns from "dns";
import { promisify } from "util";
const router = express.Router();

/*
// --- Email Transporter Configuration (DISABLED) ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("[MAIL] Connection error:", error);
  } else {
    console.log("[MAIL] Server is ready to take our messages");
  }
});
*/

/*
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
*/

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

  // 2. DNS check for MX records (SKIPPED to prevent local timeouts)
  /*
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
  */
  console.log(`[AUTH] DNS check skipped for ${email}`);

  return { valid: true };
};

// --- OTP Generation for Registration ---
/*
// --- OTP Generation for Registration (DISABLED) ---
router.post("/request-registration-otp", async (req, res) => {
  res.status(404).json({ message: "OTP registration is disabled." });
});
*/

// Register (Finalize with OTP)
// Register (Direct, No OTP)
router.post("/register", async (req, res) => {
  const { name, password } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    // 1. Check if user already exists
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRes = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, "student"]
    );

    // 3. Set Cookie & Respond
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
/*
// --- Forgot Password (OTP) Flow (DISABLED) ---
router.post("/forgot-password", async (req, res) => {
    res.status(404).json({ message: "Forgot password is disabled." });
});
router.post("/verify-otp", async (req, res) => {
    res.status(404).json({ message: "Disabled." });
});
router.post("/reset-password", async (req, res) => {
   res.status(404).json({ message: "Disabled." });
});
*/

export default router;