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

module.exports = { authLimiter, commentLimiter, communityReadLimiter };
