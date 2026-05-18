const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { env } = require("./config/env");
const { authRouter } = require("./routes/auth.routes");
const { communityRouter } = require("./routes/community.routes");
const { dashboardRouter } = require("./routes/dashboard.routes");
const { projectsRouter } = require("./routes/projects.routes");
const { errorHandler } = require("./middlewares/error-handler");
const { requireJsonBody } = require("./middlewares/require-json");
const { healthRouter } = require("./routes/health.routes");

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    // En dev, refléter l'Origin (localhost vs 127.0.0.1) pour la preflight CORS.
    origin: env.NODE_ENV === "development" ? true : env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use("/api", requireJsonBody);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
  }),
);

app.get("/", (_req, res) => {
  if (env.NODE_ENV === "production") {
    return res.json({ name: "HubHex API", status: "ok" });
  }
  return res.json({
    name: "HubHex API",
    docs: [
      "/api/health",
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/me (GET, PATCH)",
      "/api/dashboard?activityLimit=20",
      "/api/projects",
      "/api/projects/:projectId/tasks",
      "/api/community/projects?q=&technology=&sort=recent|popular",
      "/api/community/projects/:projectId/comments",
    ],
  });
});
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
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
