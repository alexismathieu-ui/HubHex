const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  JWT_SECRET: z.string().min(12, "JWT_SECRET must contain at least 12 chars."),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

const env = envSchema.parse(process.env);

module.exports = { env };
