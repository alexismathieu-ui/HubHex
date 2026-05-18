const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH"]);

const requireJsonBody = (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.toLowerCase().includes("application/json")) {
    return res.status(415).json({
      error: { message: "Content-Type application/json is required." },
    });
  }

  return next();
};

module.exports = { requireJsonBody };
