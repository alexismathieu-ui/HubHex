const { z } = require("zod");

const ALLOWED_PROVIDERS = ["github", "gitlab", "bitbucket", "other"];

const detectProvider = (hostname) => {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  if (host === "github.com") {
    return "github";
  }
  if (host === "gitlab.com") {
    return "gitlab";
  }
  if (host === "bitbucket.org") {
    return "bitbucket";
  }
  return "other";
};

const normalizeRepositoryInput = (raw) => {
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  let url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!url) {
    return null;
  }
  if (!/^https:\/\//i.test(url)) {
    if (/^[\w.-]+\/[\w.-]+/.test(url) && !url.includes("://")) {
      url = `https://github.com/${url.replace(/^\/+/, "")}`;
    } else {
      url = `https://${url.replace(/^\/+/, "")}`;
    }
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") {
    return null;
  }
  const provider = detectProvider(parsed.hostname);
  return {
    label: label.slice(0, 120),
    url: parsed.href.slice(0, 500),
    provider,
  };
};

const repositoryInputSchema = z.object({
  label: z.string().trim().max(120).optional().default(""),
  url: z.string().trim().min(8).max(500),
});

const repositoriesPayloadSchema = z
  .array(repositoryInputSchema)
  .max(15)
  .default([]);

const normalizeRepositoriesPayload = (body) => {
  if (!body || typeof body !== "object" || !Object.prototype.hasOwnProperty.call(body, "repositories")) {
    return;
  }
  const raw = body.repositories;
  if (raw == null) {
    body.repositories = [];
    return;
  }
  if (!Array.isArray(raw)) {
    body.repositories = [];
    return;
  }
};

const parseAndValidateRepositories = (rawList) => {
  const parsed = repositoriesPayloadSchema.parse(rawList);
  const seen = new Set();
  const result = [];
  for (const item of parsed) {
    const normalized = normalizeRepositoryInput(item);
    if (!normalized) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "Invalid repository URL.",
          path: ["repositories"],
        },
      ]);
    }
    const key = normalized.url.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
};

module.exports = {
  ALLOWED_PROVIDERS,
  detectProvider,
  normalizeRepositoryInput,
  normalizeRepositoriesPayload,
  parseAndValidateRepositories,
  repositoriesPayloadSchema,
};
