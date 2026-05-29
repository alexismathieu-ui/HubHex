console.log("[HubHex] Chargement du serveur API...");
const { app } = require("./app");
const { ensureDatabaseSchema } = require("./config/db");
const { env } = require("./config/env");
const { getLanIPv4Addresses } = require("./lib/network-addresses");

const startServer = async () => {
  try {
    console.log("[HubHex] Demarrage de l'API...");
    console.log("[HubHex] Connexion PostgreSQL + schema...");
    await ensureDatabaseSchema();
    console.log("[HubHex] Base de donnees OK.");

    app.listen(env.PORT, env.HOST, () => {
      console.log(`[HubHex] API en ligne — http://localhost:${env.PORT}`);
      console.log(`[HubHex] Test local : http://localhost:${env.PORT}/api/health`);

      if (env.PUBLIC_API_URL) {
        console.log(`[HubHex] Lien public (a envoyer au prof) : ${env.PUBLIC_API_URL}`);
        console.log(`[HubHex] Test public : ${env.PUBLIC_API_URL}/api/health`);
      }

      const lanIps = getLanIPv4Addresses();
      if (lanIps.length && env.HOST === "0.0.0.0") {
        console.log("[HubHex] Reseau local (meme Wi-Fi) :");
        for (const ip of lanIps) {
          console.log(`  → http://${ip}:${env.PORT}/api/health`);
        }
      }

      console.log("[HubHex] Tunnel Internet : dans un 2e terminal → cd backend && npm run share");
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
