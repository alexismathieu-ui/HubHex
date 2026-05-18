const {
  MAX_BASE64_CONTENT_LENGTH,
  MAX_RAW_FILE_BYTES,
  MAX_TEXT_CONTENT_LENGTH,
} = require("./file-limits");

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

const validateTextContent = (content) => {
  const value = String(content ?? "");
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
  return value;
};

const validateBase64Content = (content) => {
  const value = String(content ?? "");
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
  return value;
};

const validateFileContent = (content, encoding) => {
  if (encoding === "base64") {
    return validateBase64Content(content);
  }
  return validateTextContent(content);
};

const MIME_TYPE_RE = /^[a-z0-9][a-z0-9!#$&^_.+-]{0,78}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,120}$/i;

const sanitizeMimeType = (mimeType) => {
  if (mimeType == null || mimeType === "") {
    return null;
  }
  const value = String(mimeType).trim().slice(0, 120);
  if (!MIME_TYPE_RE.test(value)) {
    const error = new Error("Invalid MIME type.");
    error.statusCode = 400;
    throw error;
  }
  return value;
};

module.exports = {
  sanitizeMimeType,
  validateBase64Content,
  validateFileContent,
  validateTextContent,
};
