const { env } = require("../config/env");

const DEV_ORIGINS = new Set([
  env.FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const corsOrigin = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  if (env.NODE_ENV === "production") {
    if (origin === env.FRONTEND_URL) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS."));
  }

  if (DEV_ORIGINS.has(origin)) {
    return callback(null, true);
  }

  return callback(new Error("Origin not allowed by CORS."));
};

module.exports = { corsOrigin, DEV_ORIGINS };
