const { z } = require("zod");

const errorHandler = (err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    const issues = err.issues ?? [];
    const first = issues[0];
    const pathLabel = first?.path?.length ? first.path.join(".") : "donnees";
    const summary = first?.message ? `${pathLabel}: ${first.message}` : "Donnees invalides.";
    return res.status(400).json({
      error: {
        message: `Validation — ${summary}`,
        details: issues,
      },
    });
  }

  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal server error." : err.message;

  res.status(statusCode).json({
    error: {
      message,
    },
  });
};

module.exports = { errorHandler };
