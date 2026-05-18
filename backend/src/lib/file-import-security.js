const { MAX_IMPORT_BATCH_PAYLOAD, MAX_IMPORT_PATH_LENGTH } = require("./file-limits");
const { sanitizeMimeType, validateFileContent } = require("./file-content-security");

const DANGEROUS_PATH_SEGMENTS = new Set([
  "con",
  "prn",
  "aux",
  "nul",
  "com1",
  "com2",
  "com3",
  "com4",
  "lpt1",
  "lpt2",
  "lpt3",
]);

const normalizeImportPath = (rawPath) => {
  const parts = String(rawPath)
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..");

  for (const part of parts) {
    if (part.includes("\0") || /[\x00-\x1f\x7f]/.test(part)) {
      const error = new Error("Invalid path in import entry.");
      error.statusCode = 400;
      throw error;
    }
    const lower = part.toLowerCase().replace(/\.[^.]+$/, "");
    if (DANGEROUS_PATH_SEGMENTS.has(lower)) {
      const error = new Error(`Invalid path segment: ${part}`);
      error.statusCode = 400;
      throw error;
    }
  }

  return parts;
};

const validateImportPath = (rawPath) => {
  if (!rawPath || String(rawPath).length > MAX_IMPORT_PATH_LENGTH) {
    const error = new Error("Import path too long or empty.");
    error.statusCode = 400;
    throw error;
  }
  const parts = normalizeImportPath(rawPath);
  if (!parts.length) {
    const error = new Error("Invalid import path.");
    error.statusCode = 400;
    throw error;
  }
  return parts;
};

const validateImportEntry = (entry) => {
  validateImportPath(entry.path);
  const encoding = entry.encoding === "base64" ? "base64" : "text";
  validateFileContent(entry.content, encoding);
  if (entry.mimeType != null) {
    sanitizeMimeType(entry.mimeType);
  }
};

const validateImportBatch = (entries) => {
  let payloadSize = 0;
  for (const entry of entries) {
    validateImportEntry(entry);
    payloadSize += String(entry.content ?? "").length + String(entry.path ?? "").length;
    if (payloadSize > MAX_IMPORT_BATCH_PAYLOAD) {
      const error = new Error("Import batch payload too large. Import fewer files at once.");
      error.statusCode = 400;
      throw error;
    }
  }
};

module.exports = {
  normalizeImportPath,
  validateImportBatch,
  validateImportEntry,
  validateImportPath,
};
