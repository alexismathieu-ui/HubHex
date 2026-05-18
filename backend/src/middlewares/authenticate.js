const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }
  return authorizationHeader.slice(7);
};

const authenticate = (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: { message: "Missing token." } });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.auth = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ error: { message: "Invalid token." } });
  }
};

module.exports = { authenticate };
