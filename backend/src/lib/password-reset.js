const crypto = require("crypto");

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const generateResetToken = () => crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const resetTokenExpiresAt = () => new Date(Date.now() + RESET_TOKEN_TTL_MS);

module.exports = {
  generateResetToken,
  hashResetToken,
  resetTokenExpiresAt,
  RESET_TOKEN_TTL_MS,
};
