const jwt = require("jsonwebtoken");

const { pool } = require("../config/db");
const { env } = require("../config/env");
const { isTokenRevokedByPasswordChange } = require("../lib/auth-token");
const { parsePositiveInt } = require("../lib/security");

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }
  return authorizationHeader.slice(7);
};

const authenticate = async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: { message: "Missing token." } });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    const userId = parsePositiveInt(decoded.userId);
    if (!userId) {
      return res.status(401).json({ error: { message: "Invalid token." } });
    }

    const result = await pool.query(
      "SELECT id, username, email, password_changed_at FROM users WHERE id = $1",
      [userId],
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: { message: "Invalid token." } });
    }

    if (isTokenRevokedByPasswordChange(decoded, user.password_changed_at)) {
      return res.status(401).json({ error: { message: "Session expired. Please log in again." } });
    }

    req.auth = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };
    return next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({
        error: {
          message: "Access token expired.",
          code: "ACCESS_TOKEN_EXPIRED",
        },
      });
    }
    return res.status(401).json({ error: { message: "Invalid token." } });
  }
};

module.exports = { authenticate };
