const { signAccessToken, getAccessTokenExpiresInSeconds } = require("./auth-token");
const { setRefreshTokenCookie } = require("./auth-cookies");
const { createRefreshToken } = require("./refresh-token");

const formatAuthUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  display_name: user.display_name ?? null,
  status_message: user.status_message ?? null,
  status_emoji: user.status_emoji ?? null,
  has_avatar: Boolean(user.has_avatar_data),
});

const requestMeta = (req) => ({
  userAgent: req.headers["user-agent"],
  ipAddress: req.ip || req.socket?.remoteAddress,
});

/**
 * Emission access JWT (court) + refresh token (long, stocke en BDD).
 */
const issueAuthSession = async (req, res, user) => {
  const accessToken = signAccessToken(user);
  const { rawToken, expiresAt } = await createRefreshToken(user.id, requestMeta(req));
  setRefreshTokenCookie(res, rawToken, expiresAt);

  return {
    token: accessToken,
    expiresIn: getAccessTokenExpiresInSeconds(),
    refreshToken: rawToken,
    refreshExpiresAt: expiresAt.toISOString(),
    user: formatAuthUser(user),
  };
};

module.exports = { formatAuthUser, issueAuthSession };
