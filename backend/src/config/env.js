const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  JWT_SECRET: z
    .string()
    .trim()
    .min(32, "JWT_SECRET must contain at least 32 random characters.")
    .refine(
      (value) => value !== "change-this-super-secret-key-min-32-chars",
      "JWT_SECRET must not use the example value from .env.example.",
    ),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  /** Uniquement en dev local : expose le token de reset dans la reponse JSON. */
  ALLOW_DEV_RESET_TOKEN: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_HOST: z.string().trim().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().trim().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().trim().optional(),
  /** true pour activer les rate limits en local (defaut: desactive en development). */
  ENABLE_RATE_LIMIT: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const env = envSchema.parse(process.env);

module.exports = { env };
