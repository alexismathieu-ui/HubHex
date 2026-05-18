const express = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");

const { pool } = require("../config/db");
const { env } = require("../config/env");
const { signAccessToken } = require("../lib/auth-token");
const {
  generateResetToken,
  hashResetToken,
  resetTokenExpiresAt,
} = require("../lib/password-reset");
const { passwordSchema, usernameSchema, passwordMeetsPolicy } = require("../lib/security");
const { authenticate } = require("../middlewares/authenticate");
const {
  authLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require("../middlewares/rate-limiters");

const authRouter = express.Router();

const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().email().max(255),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(100),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().length(64),
  newPassword: passwordSchema,
});

const GENERIC_RESET_MESSAGE =
  "Si un compte existe avec cet email, un code de reinitialisation a ete genere.";

const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    email: z.string().trim().email().max(255).optional(),
    currentPassword: z.string().min(1).max(100).optional(),
    newPassword: passwordSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasField =
      data.username !== undefined ||
      data.email !== undefined ||
      data.newPassword !== undefined;
    if (!hasField) {
      ctx.addIssue({
        code: "custom",
        message: "No profile data to update.",
        path: [],
      });
    }
    const changingPassword =
      data.currentPassword !== undefined || data.newPassword !== undefined;
    if (changingPassword && (!data.currentPassword || !data.newPassword)) {
      ctx.addIssue({
        code: "custom",
        message: "Current and new password are both required to change password.",
        path: ["newPassword"],
      });
    }
    if (data.email !== undefined && !data.currentPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Current password is required to change email.",
        path: ["currentPassword"],
      });
    }
  });

authRouter.post("/register", authLimiter, async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const normalizedEmail = payload.email.toLowerCase();

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [normalizedEmail, payload.username],
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: { message: "Unable to create account with these credentials." },
      });
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
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

authRouter.post("/login", authLimiter, async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const normalizedEmail = payload.email.toLowerCase();

    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE LOWER(email) = $1",
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

    const token = signAccessToken(user);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      password_needs_upgrade: !passwordMeetsPolicy(payload.password),
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/forgot-password", forgotPasswordLimiter, async (req, res, next) => {
  try {
    const payload = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = payload.email.toLowerCase();

    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE LOWER(email) = $1",
      [normalizedEmail],
    );
    const user = userResult.rows[0];

    const response = {
      message: GENERIC_RESET_MESSAGE,
    };

    if (user) {
      const rawToken = generateResetToken();
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = resetTokenExpiresAt();

      await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt],
      );

      if (env.NODE_ENV === "development" && env.ALLOW_DEV_RESET_TOKEN) {
        response.dev_reset = {
          token: rawToken,
          expires_at: expiresAt.toISOString(),
          hint:
            "Mode developpement (ALLOW_DEV_RESET_TOKEN) : en production le code serait envoye par email uniquement.",
        };
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/reset-password", resetPasswordLimiter, async (req, res, next) => {
  try {
    const payload = resetPasswordSchema.parse(req.body);
    const tokenHash = hashResetToken(payload.token);

    const tokenResult = await pool.query(
      `SELECT prt.id, prt.user_id, prt.expires_at
       FROM password_reset_tokens prt
       WHERE prt.token_hash = $1`,
      [tokenHash],
    );
    const resetRow = tokenResult.rows[0];

    if (!resetRow || new Date(resetRow.expires_at).getTime() < Date.now()) {
      if (resetRow) {
        await pool.query("DELETE FROM password_reset_tokens WHERE id = $1", [resetRow.id]);
      }
      return res.status(400).json({
        error: { message: "Code invalide ou expire. Demande un nouveau code." },
      });
    }

    const passwordHash = await bcrypt.hash(payload.newPassword, 12);
    await pool.query(
      "UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2",
      [passwordHash, resetRow.user_id],
    );
    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [
      resetRow.user_id,
    ]);

    return res.status(200).json({
      message: "Mot de passe reinitialise. Tu peux te connecter.",
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

authRouter.patch("/me", authenticate, async (req, res, next) => {
  try {
    const payload = updateProfileSchema.parse(req.body);

    const existingResult = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE id = $1",
      [req.auth.userId],
    );
    const existing = existingResult.rows[0];
    if (!existing) {
      return res.status(404).json({ error: { message: "User not found." } });
    }

    const needsPasswordCheck =
      payload.email !== undefined || payload.newPassword !== undefined;

    if (needsPasswordCheck) {
      const isCurrentValid = await bcrypt.compare(
        payload.currentPassword,
        existing.password_hash,
      );
      if (!isCurrentValid) {
        return res.status(401).json({ error: { message: "Current password is incorrect." } });
      }
    }

    if (payload.username !== undefined && payload.username !== existing.username) {
      const usernameTaken = await pool.query(
        "SELECT id FROM users WHERE username = $1 AND id <> $2",
        [payload.username, req.auth.userId],
      );
      if (usernameTaken.rows.length > 0) {
        return res.status(409).json({ error: { message: "Username already used." } });
      }
    }

    if (payload.email !== undefined) {
      const normalizedEmail = payload.email.toLowerCase();
      if (normalizedEmail !== existing.email) {
        const emailTaken = await pool.query(
          "SELECT id FROM users WHERE email = $1 AND id <> $2",
          [normalizedEmail, req.auth.userId],
        );
        if (emailTaken.rows.length > 0) {
          return res.status(409).json({ error: { message: "Email already used." } });
        }
      }
    }

    const fields = [];
    const values = [];
    let index = 1;

    if (payload.username !== undefined) {
      fields.push(`username = $${index++}`);
      values.push(payload.username);
    }
    if (payload.email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(payload.email.toLowerCase());
    }
    if (payload.newPassword !== undefined) {
      const passwordHash = await bcrypt.hash(payload.newPassword, 12);
      fields.push(`password_hash = $${index++}`);
      values.push(passwordHash);
      fields.push("password_changed_at = NOW()");
    }

    values.push(req.auth.userId);
    const updateQuery = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, username, email, created_at
    `;
    const updateResult = await pool.query(updateQuery, values);
    const user = updateResult.rows[0];

    const identityChanged =
      (payload.username !== undefined && payload.username !== existing.username) ||
      (payload.email !== undefined && payload.email.toLowerCase() !== existing.email);
    const passwordChanged = payload.newPassword !== undefined;

    const response = {
      message: "Profile updated successfully.",
      user,
    };

    if (identityChanged || passwordChanged) {
      response.token = signAccessToken(user);
    }

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
});

module.exports = { authRouter };
