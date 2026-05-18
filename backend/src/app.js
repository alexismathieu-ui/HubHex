const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { env } = require("./config/env");
const { authRouter } = require("./routes/auth.routes");
const { projectsRouter } = require("./routes/projects.routes");
const { errorHandler } = require("./middlewares/error-handler");
const { healthRouter } = require("./routes/health.routes");

const app = express();

app.use(helmet());
app.use(
  cors({
    // En dev, refléter l'Origin (localhost vs 127.0.0.1) pour la preflight CORS.
    origin: env.NODE_ENV === "development" ? true : env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
  }),
);

app.get("/", (_req, res) => {
  res.json({
    name: "HubHex API",
    docs: [
      "/api/health",
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/me (GET, PATCH)",
      "/api/projects",
      "/api/projects/:projectId/tasks",
    ],
  });
});
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);

app.use(errorHandler);

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({
      error: {
        message:
          "Route API introuvable — verifie que le backend HubHex tourne depuis backend/src/server.js (pas un autre service sur le meme port).",
        path: req.originalUrl,
        method: req.method,
      },
    });
  }
  res.status(404).type("text").send("Not found");
});

module.exports = { app };
