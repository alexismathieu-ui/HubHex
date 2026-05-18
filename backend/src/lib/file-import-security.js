const {
  MAX_BASE64_CONTENT_LENGTH,
  MAX_IMPORT_BATCH_PAYLOAD,
  MAX_IMPORT_PATH_LENGTH,
  MAX_RAW_FILE_BYTES,
  MAX_TEXT_CONTENT_LENGTH,
} = require("./file-limits");

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

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

const validateImportContent = (content, encoding) => {
  const value = String(content ?? "");
  if (encoding === "base64") {
    if (value.length > MAX_BASE64_CONTENT_LENGTH) {
      const error = new Error("File too large (max 10 Mo per file).");
      error.statusCode = 400;
      throw error;
    }
    if (value.length > 0 && !BASE64_RE.test(value)) {
      const error = new Error("Invalid base64 content.");
      error.statusCode = 400;
      throw error;
    }
    const estimatedRaw = Math.floor((value.length * 3) / 4);
    if (estimatedRaw > MAX_RAW_FILE_BYTES) {
      const error = new Error("File too large (max 10 Mo per file).");
      error.statusCode = 400;
      throw error;
    }
    return;
  }

  if (value.length > MAX_TEXT_CONTENT_LENGTH) {
    const error = new Error("Text file too large (max 10 Mo per file).");
    error.statusCode = 400;
    throw error;
  }
  if (value.includes("\0")) {
    const error = new Error("Text content contains invalid characters.");
    error.statusCode = 400;
    throw error;
  }
};

const validateImportEntry = (entry) => {
  validateImportPath(entry.path);
  const encoding = entry.encoding === "base64" ? "base64" : "text";
  validateImportContent(entry.content, encoding);
  if (entry.mimeType != null && String(entry.mimeType).length > 120) {
    const error = new Error("MIME type too long.");
    error.statusCode = 400;
    throw error;
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
  validateImportContent,
  validateImportEntry,
  validateImportPath,
};
