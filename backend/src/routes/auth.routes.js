const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const { pool } = require("../config/db");
const { env } = require("../config/env");
const { authenticate } = require("../middlewares/authenticate");

const authRouter = express.Router();

const registerSchema = z.object({
  username: z.string().trim().min(2).max(50),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(100),
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const normalizedEmail = payload.email.toLowerCase();

    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [
      normalizedEmail,
    ]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: { message: "Email already used." } });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const insertResult = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [payload.username, normalizedEmail, passwordHash],
    );

    return res.status(201).json({
      message: "User registered successfully.",
      user: insertResult.rows[0],
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const normalizedEmail = payload.email.toLowerCase();

    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE email = $1",
      [normalizedEmail],
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: { message: "Invalid credentials." } });
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: { message: "Invalid credentials." } });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = $1",
      [req.auth.userId],
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: { message: "User not found." } });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
});

module.exports = { authRouter };
