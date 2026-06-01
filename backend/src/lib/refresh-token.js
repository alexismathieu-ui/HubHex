const crypto = require("crypto");

const { pool } = require("../config/db");
const { env } = require("../config/env");

const REFRESH_TOKEN_BYTES = 32;

const hashRefreshToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");

const generateRefreshToken = () => crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");

const refreshExpiresAt = () => {
  const days = env.JWT_REFRESH_EXPIRES_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

const createRefreshToken = async (userId, meta = {}) => {
  const rawToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = refreshExpiresAt();

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      tokenHash,
      expiresAt,
      meta.userAgent ? String(meta.userAgent).slice(0, 255) : null,
      meta.ipAddress ? String(meta.ipAddress).slice(0, 45) : null,
    ],
  );

  return { rawToken, expiresAt };
};

const findValidRefreshToken = async (rawToken) => {
  if (!rawToken || typeof rawToken !== "string") {
    return null;
  }
  const tokenHash = hashRefreshToken(rawToken.trim());
  const result = await pool.query(
    `SELECT rt.id AS refresh_id, rt.user_id, rt.expires_at,
            u.id, u.username, u.email, u.password_changed_at,
            u.display_name, u.status_message, u.status_emoji,
            (u.avatar_data IS NOT NULL AND u.avatar_data <> '') AS has_avatar_data
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1
       AND rt.revoked_at IS NULL
       AND rt.expires_at > NOW()`,
    [tokenHash],
  );
  return result.rows[0] || null;
};

const revokeRefreshToken = async (rawToken) => {
  if (!rawToken) {
    return;
  }
  const tokenHash = hashRefreshToken(rawToken.trim());
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash],
  );
};

const revokeAllUserRefreshTokens = async (userId) => {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
};

module.exports = {
  createRefreshToken,
  findValidRefreshToken,
  hashRefreshToken,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
};
