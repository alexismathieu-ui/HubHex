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
const { sendPasswordResetEmail, isSmtpConfigured } = require("../lib/email");
const { avatarMimeSchema, validateAvatarPayload } = require("../lib/avatar-security");
const { passwordSchema, usernameSchema, passwordMeetsPolicy } = require("../lib/security");
const { fetchUserProfile } = require("../lib/user-profile");
const { authenticate } = require("../middlewares/authenticate");
const {
  authLimiter,
  forgotPasswordLimiter,
  profileLimiter,
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

const optionalTextField = (max) =>
  z
    .union([z.string().trim().max(max), z.literal(""), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (value === "" || value === null) {
        return null;
      }
      return value;
    });

const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    email: z.string().trim().email().max(255).optional(),
    currentPassword: z.string().min(1).max(100).optional(),
    newPassword: passwordSchema.optional(),
    display_name: optionalTextField(80),
    status_message: optionalTextField(120),
    status_emoji: optionalTextField(12),
    clear_avatar: z.boolean().optional(),
    avatar_base64: z.string().optional(),
    avatar_mime: avatarMimeSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasField =
      data.username !== undefined ||
      data.email !== undefined ||
      data.newPassword !== undefined ||
      data.display_name !== undefined ||
      data.status_message !== undefined ||
      data.status_emoji !== undefined ||
      data.clear_avatar === true ||
      data.avatar_base64 !== undefined;
    if (data.avatar_base64 !== undefined && !data.avatar_mime) {
      ctx.addIssue({
        code: "custom",
        message: "Le type MIME est requis avec l'image.",
        path: ["avatar_mime"],
      });
    }
    if (data.clear_avatar && data.avatar_base64) {
      ctx.addIssue({
        code: "custom",
        message: "Impossible de supprimer et d'envoyer une image en meme temps.",
        path: ["clear_avatar"],
      });
    }
    if (!hasField) {
      ctx.addIssue({
        code: "custom",
        message: "Aucune donnee de profil a mettre a jour.",
        path: [],
      });
    }
    const changingPassword =
      data.currentPassword !== undefined || data.newPassword !== undefined;
    if (changingPassword && (!data.currentPassword || !data.newPassword)) {
      ctx.addIssue({
        code: "custom",
        message: "Le mot de passe actuel et le nouveau sont requis.",
        path: ["newPassword"],
      });
    }
    if (data.email !== undefined && !data.currentPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Le mot de passe actuel est requis pour changer l'email.",
        path: ["currentPassword"],
      });
    }
  });

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(100),
  confirmation: z.literal("SUPPRIMER"),
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
      `SELECT id, username, email, password_hash, display_name, status_message, status_emoji,
              (avatar_data IS NOT NULL AND avatar_data <> '') AS has_avatar_data
       FROM users WHERE LOWER(email) = $1`,
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
        display_name: user.display_name ?? null,
        status_message: user.status_message ?? null,
        status_emoji: user.status_emoji ?? null,
        has_avatar: Boolean(user.has_avatar_data),
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

      const resetUrl = `${env.FRONTEND_URL}/connexion?reset=${encodeURIComponent(rawToken)}`;
      if (isSmtpConfigured()) {
        try {
          await sendPasswordResetEmail({ to: user.email, resetUrl });
        } catch (mailError) {
          console.error("[hubhex] Echec envoi email reset:", mailError.message);
        }
      } else if (env.NODE_ENV === "development" && env.ALLOW_DEV_RESET_TOKEN) {
        response.dev_reset = {
          token: rawToken,
          expires_at: expiresAt.toISOString(),
          reset_url: resetUrl,
          hint:
            "SMTP non configure : token expose en dev (ALLOW_DEV_RESET_TOKEN). En production, configurez SMTP_* dans .env.",
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
    const user = await fetchUserProfile(req.auth.userId);
    if (!user) {
      return res.status(404).json({ error: { message: "Utilisateur introuvable." } });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
});

authRouter.patch("/me", authenticate, profileLimiter, async (req, res, next) => {
  try {
    const payload = updateProfileSchema.parse(req.body);

    const existingResult = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE id = $1",
      [req.auth.userId],
    );
    const existing = existingResult.rows[0];
    if (!existing) {
      return res.status(404).json({ error: { message: "Utilisateur introuvable." } });
    }

    const needsPasswordCheck =
      payload.email !== undefined || payload.newPassword !== undefined;

    if (needsPasswordCheck) {
      const isCurrentValid = await bcrypt.compare(
        payload.currentPassword,
        existing.password_hash,
      );
      if (!isCurrentValid) {
        return res.status(401).json({ error: { message: "Mot de passe actuel incorrect." } });
      }
    }

    if (payload.username !== undefined && payload.username !== existing.username) {
      const usernameTaken = await pool.query(
        "SELECT id FROM users WHERE username = $1 AND id <> $2",
        [payload.username, req.auth.userId],
      );
      if (usernameTaken.rows.length > 0) {
        return res.status(409).json({ error: { message: "Ce nom d'utilisateur est deja pris." } });
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
          return res.status(409).json({ error: { message: "Cet email est deja utilise." } });
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

    const customizationChanged =
      payload.display_name !== undefined ||
      payload.status_message !== undefined ||
      payload.status_emoji !== undefined ||
      payload.clear_avatar === true ||
      payload.avatar_base64 !== undefined;

    if (payload.display_name !== undefined) {
      fields.push(`display_name = $${index++}`);
      values.push(payload.display_name);
    }
    if (payload.status_message !== undefined) {
      fields.push(`status_message = $${index++}`);
      values.push(payload.status_message);
    }
    if (payload.status_emoji !== undefined) {
      fields.push(`status_emoji = $${index++}`);
      values.push(payload.status_emoji);
    }
    if (payload.clear_avatar === true) {
      fields.push("avatar_mime = NULL");
      fields.push("avatar_data = NULL");
    } else if (payload.avatar_base64 !== undefined) {
      const avatar = validateAvatarPayload(payload.avatar_base64, payload.avatar_mime);
      fields.push(`avatar_mime = $${index++}`);
      values.push(avatar.mime);
      fields.push(`avatar_data = $${index++}`);
      values.push(avatar.content);
    }
    if (customizationChanged) {
      fields.push("profile_updated_at = NOW()");
    }

    values.push(req.auth.userId);
    const updateQuery = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, username, email, created_at
    `;
    const updateResult = await pool.query(updateQuery, values);
    const updatedUser = updateResult.rows[0];
    const user = await fetchUserProfile(updatedUser.id);

    const identityChanged =
      (payload.username !== undefined && payload.username !== existing.username) ||
      (payload.email !== undefined && payload.email.toLowerCase() !== existing.email);
    const passwordChanged = payload.newPassword !== undefined;

    const response = {
      message: "Profil mis a jour avec succes.",
      user,
    };

    if (identityChanged || passwordChanged) {
      response.token = signAccessToken(updatedUser);
    }

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
});

authRouter.delete("/me", authenticate, profileLimiter, async (req, res, next) => {
  try {
    const payload = deleteAccountSchema.parse(req.body);

    const existingResult = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [req.auth.userId],
    );
    const existing = existingResult.rows[0];
    if (!existing) {
      return res.status(404).json({ error: { message: "Utilisateur introuvable." } });
    }

    const isPasswordValid = await bcrypt.compare(payload.password, existing.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: { message: "Mot de passe incorrect." } });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [req.auth.userId]);

    return res.status(200).json({
      message: "Compte supprime definitivement.",
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = { authRouter };
