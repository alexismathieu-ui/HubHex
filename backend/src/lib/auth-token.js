const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

const TOKEN_TTL = "7d";

const signAccessToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    env.JWT_SECRET,
    { expiresIn: TOKEN_TTL, algorithm: "HS256" },
  );

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
  isTokenRevokedByPasswordChange,
  signAccessToken,
  TOKEN_TTL,
};
