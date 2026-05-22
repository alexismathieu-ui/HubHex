const express = require("express");

const { fetchPublicUserByUsername, fetchUserAvatarByUsername } = require("../lib/user-profile");
const { communityReadLimiter } = require("../middlewares/rate-limiters");

const usersRouter = express.Router();

usersRouter.get("/:username/public", communityReadLimiter, async (req, res, next) => {
  try {
    const user = await fetchPublicUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: { message: "Utilisateur introuvable." } });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
});

usersRouter.get("/:username/avatar", communityReadLimiter, async (req, res, next) => {
  try {
    const avatar = await fetchUserAvatarByUsername(req.params.username);
    if (!avatar) {
      return res.status(404).end();
    }
    res.set("Content-Type", avatar.mime || "application/octet-stream");
    res.set("Cache-Control", "public, max-age=3600");
    return res.send(avatar.buffer);
  } catch (error) {
    return next(error);
  }
});

module.exports = { usersRouter };
