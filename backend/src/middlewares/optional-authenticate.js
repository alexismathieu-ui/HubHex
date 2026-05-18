const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

const optionalAuthenticate = (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authorizationHeader.slice(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.auth = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };
  } catch (_error) {
    // Token invalide : on traite la requête comme non authentifiée.
  }
  return next();
};

module.exports = { optionalAuthenticate };
