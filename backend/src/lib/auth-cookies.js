const { env } = require("../config/env");

const REFRESH_COOKIE_NAME = "hubhex_refresh";

const refreshCookieOptions = (expiresAt) => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/api/auth",
  expires: expiresAt,
});

const setRefreshTokenCookie = (res, rawToken, expiresAt) => {
  res.cookie(REFRESH_COOKIE_NAME, rawToken, refreshCookieOptions(expiresAt));
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/api/auth",
  });
};

const readRefreshTokenFromRequest = (req) => {
  const fromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  if (fromCookie && typeof fromCookie === "string") {
    return fromCookie.trim();
  }
  const fromBody = req.body?.refreshToken;
  if (fromBody && typeof fromBody === "string") {
    return fromBody.trim();
  }
  return null;
};

module.exports = {
  REFRESH_COOKIE_NAME,
  clearRefreshTokenCookie,
  readRefreshTokenFromRequest,
  setRefreshTokenCookie,
};
