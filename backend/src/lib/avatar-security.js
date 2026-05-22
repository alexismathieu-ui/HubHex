const { z } = require("zod");

const { sanitizeMimeType, validateBase64Content } = require("./file-content-security");

const MAX_AVATAR_RAW_BYTES = 512 * 1024;

const ALLOWED_AVATAR_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const avatarMimeSchema = z
  .string()
  .trim()
  .refine((value) => ALLOWED_AVATAR_MIMES.has(value), "Type d'image non autorise.");

const validateAvatarPayload = (base64, mimeType) => {
  const content = validateBase64Content(String(base64 ?? ""));
  const mime = sanitizeMimeType(mimeType);
  if (!mime || !ALLOWED_AVATAR_MIMES.has(mime)) {
    const error = new Error("Type d'image non autorise (JPEG, PNG, WebP ou GIF).");
    error.statusCode = 400;
    throw error;
  }
  const estimatedRaw = Math.floor((content.length * 3) / 4);
  if (estimatedRaw > MAX_AVATAR_RAW_BYTES) {
    const error = new Error("Image de profil trop volumineuse (max 512 Ko).");
    error.statusCode = 400;
    throw error;
  }
  return { content, mime };
};

module.exports = {
  ALLOWED_AVATAR_MIMES,
  avatarMimeSchema,
  validateAvatarPayload,
};
