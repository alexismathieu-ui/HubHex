const rateLimit = require("express-rate-limit");

/** Limite les tentatives d'inscription / connexion (brute force). */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: "Trop de tentatives. Reessaie dans quelques minutes." },
  },
});

/** Limite le scraping des listes publiques. */
const communityReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: "Trop de requetes sur la communaute. Reessaie plus tard." },
  },
});

/** Limite le spam de commentaires. */
const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: "Trop de commentaires envoyes. Reessaie plus tard." },
  },
});

/** Limite les demandes de reinitialisation de mot de passe. */
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: "Trop de demandes de reinitialisation. Reessaie plus tard." },
  },
});

/** Limite les tentatives de validation d'un token de reset. */
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: "Trop de tentatives de reinitialisation. Reessaie plus tard." },
  },
});

/** Limite l'abus du tableau de bord (agregations couteuses). */
const dashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: "Trop de requetes dashboard. Reessaie plus tard." },
  },
});

/** Limite les operations sur l'arborescence fichiers d'un depot. */
const filesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: "Trop d'operations sur les fichiers. Reessaie plus tard." },
  },
});

/** Limite les imports en masse (payload lourd). */
const filesImportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: "Trop d'imports de fichiers. Reessaie plus tard." },
  },
});

module.exports = {
  authLimiter,
  commentLimiter,
  communityReadLimiter,
  dashboardLimiter,
  filesImportLimiter,
  filesLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
};
