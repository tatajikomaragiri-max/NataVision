import jwt from "jsonwebtoken";
import pool from "../config/db.js";

import fs from 'fs';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Log headers to debug
    const logMsg = `[AUTH_DEBUG] Headers: ${JSON.stringify(req.headers.authorization)} | Cookie: ${!!req.cookies.token}\n`;
    fs.appendFileSync('debug_log.txt', logMsg);

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];
      } catch (error) {
        console.error("Token split failed:", error);
      }
    } else {
      console.log("No Authorization header found. Checking cookies...");
    }

    if (req.cookies.token) {
      if (!token) console.log("Token found in cookies");
      token = token || req.cookies.token;
    }

    if (!token) {
      fs.appendFileSync('debug_log.txt', `[AUTH_DEBUG] No token found. Sending 401.\n`);
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [decoded.id]
    );

    if (user.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};