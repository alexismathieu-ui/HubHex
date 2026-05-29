const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { env } = require("./config/env");
const { corsOrigin } = require("./lib/cors-options");
const { authRouter } = require("./routes/auth.routes");
const { communityRouter } = require("./routes/community.routes");
const { dashboardRouter } = require("./routes/dashboard.routes");
const { projectsRouter } = require("./routes/projects.routes");
const { usersRouter } = require("./routes/users.routes");
const { errorHandler } = require("./middlewares/error-handler");
const { requireJsonBody } = require("./middlewares/require-json");
const { healthRouter } = require("./routes/health.routes");
const { templatesRouter } = require("./routes/templates.routes");
const { graphRouter } = require("./routes/graph.routes");

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(
  helmet({
    hsts: env.NODE_ENV === "production" ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    // Frontend (ex. :3000) et API (:4000) : same-site mais origines differentes — autoriser les avatars.
    crossOriginResourcePolicy: { policy: "same-site" },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use((req, res, next) => {
  const isFileImport = /\/files\/import-batch/i.test(req.originalUrl);
  const isProfilePatch = /\/api\/auth\/me/i.test(req.originalUrl) && req.method === "PATCH";
  const limit = isFileImport ? "20mb" : isProfilePatch ? "3mb" : "100kb";
  express.json({ limit })(req, res, next);
});
app.use("/api", requireJsonBody);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
if (env.NODE_ENV !== "development" || env.ENABLE_RATE_LIMIT) {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: env.NODE_ENV === "development" ? 10_000 : 800,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: { message: "Trop de requetes. Reessaie dans quelques minutes." },
      },
    }),
  );
}

app.get("/", (_req, res) => {
  if (env.NODE_ENV === "production") {
    return res.json({ name: "HubHex API", status: "ok" });
  }
  if (env.NODE_ENV !== "development") {
    return res.json({ name: "HubHex API", status: "ok" });
  }
  return res.json({
    name: "HubHex API",
    docs: [
      "/api/health",
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/refresh",
      "/api/auth/logout",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
      "/api/auth/me (GET, PATCH, DELETE)",
      "/api/users/:username/public",
      "/api/users/:username/avatar",
      "/api/dashboard?activityLimit=20",
      "/api/projects (slug sur POST/PUT)",
      "/api/projects/:projectId/files/import-batch",
      "/api/projects/:projectId/files (arborescence)",
      "/api/projects/:projectId/tasks",
      "/api/community/projects?q=&technology=&sort=recent|popular",
      "/api/community/projects/:projectId/comments",
      "/api/templates",
      "/api/templates/apply",
      "/api/graph",
      "/api/projects/:projectId/notes|stack|journal",
    ],
  });
});
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/graph", graphRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/community", communityRouter);

app.use(errorHandler);

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    const payload = {
      error: {
        message: "Route API introuvable.",
      },
    };
    if (env.NODE_ENV === "development") {
      payload.error.path = req.originalUrl;
      payload.error.method = req.method;
    }
    return res.status(404).json(payload);
  }
  res.status(404).type("text").send("Not found");
});

module.exports = { app };
