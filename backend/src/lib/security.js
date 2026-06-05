const { z } = require("zod");

/** Echappe % et _ pour eviter les abus ILIKE (recherche trop large). */
const escapeIlikePattern = (input) => String(input).replace(/[%_\\]/g, "\\$&");

/** ID entier positif PostgreSQL-safe. */
const parsePositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 2_147_483_647) {
    return null;
  }
  return parsed;
};

const usernameSchema = z
  .string()
  .trim()
  .min(2)
  .max(50)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username may only contain letters, numbers, underscores and hyphens.",
  );

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100)
  .refine((value) => /[a-z]/.test(value), "Password must include at least one lowercase letter.")
  .refine((value) => /[A-Z]/.test(value), "Password must include at least one uppercase letter.")
  .refine((value) => /[0-9]/.test(value), "Password must include at least one number.")
  .refine(
    (value) => /[^A-Za-z0-9]/.test(value),
    "Password must include at least one special character.",
  );

/** Verifie si un mot de passe respecte la politique actuelle (inscription / changement). */
const passwordMeetsPolicy = (password) => passwordSchema.safeParse(password).success;

module.exports = {
  escapeIlikePattern,
  parsePositiveInt,
  usernameSchema,
  passwordSchema,
  passwordMeetsPolicy,
};
