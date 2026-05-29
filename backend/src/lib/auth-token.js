const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

const signAccessToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email, username: user.username, type: "access" },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, algorithm: "HS256" },
  );

const parseExpiresInToSeconds = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const match = String(value).trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 900;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 3600;
  if (unit === "d") return amount * 86400;
  return 900;
};

const getAccessTokenExpiresInSeconds = () => parseExpiresInToSeconds(env.JWT_ACCESS_EXPIRES_IN);

/**
 * Rejette les jetons emis avant le dernier changement de mot de passe.
 */
const isTokenRevokedByPasswordChange = (decoded, passwordChangedAt) => {
  if (!passwordChangedAt || decoded.iat == null) {
    return false;
  }
  const changedMs = new Date(passwordChangedAt).getTime();
  const issuedMs = decoded.iat * 1000;
  return changedMs > issuedMs + 1000;
};

module.exports = {
  getAccessTokenExpiresInSeconds,
  isTokenRevokedByPasswordChange,
  signAccessToken,
};
