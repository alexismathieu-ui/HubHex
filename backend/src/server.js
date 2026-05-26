console.log("[HubHex] Chargement du serveur API...");
const { app } = require("./app");
const { ensureDatabaseSchema } = require("./config/db");
const { env } = require("./config/env");

const startServer = async () => {
  try {
    console.log("[HubHex] Demarrage de l'API...");
    console.log("[HubHex] Connexion PostgreSQL + schema...");
    await ensureDatabaseSchema();
    console.log("[HubHex] Base de donnees OK.");

    app.listen(env.PORT, () => {
      console.log(`[HubHex] API en ligne — http://localhost:${env.PORT}`);
      console.log("[HubHex] Test : http://localhost:4000/api/health");
      console.log("[HubHex] Laissez CE terminal ouvert (Ctrl+C pour arreter).");
    });
  } catch (error) {
    console.error("[HubHex] Echec demarrage:", error.message || error);
    if (error.code === "ECONNREFUSED" || /connect/i.test(String(error.message))) {
      console.error("[HubHex] PostgreSQL ne repond pas. Demarrez PostgreSQL puis relancez npm run dev.");
    }
    process.exit(1);
  }
};

startServer();
