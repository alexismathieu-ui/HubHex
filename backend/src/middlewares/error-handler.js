const { z } = require("zod");

const { env } = require("../config/env");

const errorHandler = (err, req, res, _next) => {
  if (err instanceof z.ZodError) {
    const issues = err.issues ?? [];
    const first = issues[0];
    const pathLabel = first?.path?.length ? first.path.join(".") : "donnees";
    const summary = first?.message ? `${pathLabel}: ${first.message}` : "Donnees invalides.";
    const payload = {
      error: {
        message: `Validation — ${summary}`,
      },
    };
    if (env.NODE_ENV === "development") {
      payload.error.details = issues;
    }
    return res.status(400).json(payload);
  }

  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal server error." : err.message;

  if (statusCode === 500 && env.NODE_ENV === "development") {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(statusCode).json({
    error: {
      message,
    },
  });
};

module.exports = { errorHandler };
