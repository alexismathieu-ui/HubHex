const express = require("express");

const healthRouter = express.Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "hubhex-api",
    timestamp: new Date().toISOString(),
  });
});

module.exports = { healthRouter };
