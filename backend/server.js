import express from "express"; // Restart trigger 3
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import fs from "fs";

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.use((req, res, next) => {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  fs.appendFileSync('debug_log.txt', log);
  next();
});


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  process.env.CLIENT_URL,
].filter(Boolean); // Remove undefined if env var is missing

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(o => origin.startsWith(o))) { // Flexible matching
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin); // Debugging
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});