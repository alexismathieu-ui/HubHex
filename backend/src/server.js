const { app } = require("./app");
const { ensureDatabaseSchema } = require("./config/db");
const { env } = require("./config/env");

const startServer = async () => {
  try {
    await ensureDatabaseSchema();
    app.listen(env.PORT, () => {
      console.log(
        `HubHex API listening on http://localhost:${env.PORT} — laisse ce terminal ouvert (Ctrl+C pour arreter).`,
      );
    });
  } catch (error) {
    console.error("Failed to start API:", error);
    process.exit(1);
  }
};

startServer();
