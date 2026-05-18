const jwt = require("jsonwebtoken");

const { pool } = require("../config/db");
const { env } = require("../config/env");
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
      "SELECT id, username, email FROM users WHERE id = $1",
      [userId],
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: { message: "Invalid token." } });
    }

    req.auth = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ error: { message: "Invalid token." } });
  }
};

module.exports = { authenticate };
