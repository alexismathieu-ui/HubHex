const os = require("os");

/** Adresses IPv4 LAN (Wi-Fi / Ethernet) pour partager l'API sur le reseau local. */
const getLanIPv4Addresses = () => {
  const ips = [];
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const config of iface || []) {
      if (config.family === "IPv4" && !config.internal) {
        ips.push(config.address);
      }
    }
  }
  return [...new Set(ips)];
};

module.exports = { getLanIPv4Addresses };
