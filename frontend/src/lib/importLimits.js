/** Aligné sur backend/src/lib/file-limits.js */
export const MAX_RAW_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_BYTES = MAX_RAW_FILE_BYTES;
export const MAX_BINARY_BYTES = MAX_RAW_FILE_BYTES;
export const MAX_IMPORT_CHUNK_BYTES = 12 * 1024 * 1024;
export const MAX_ZIP_ENTRIES = 500;
export const MAX_ZIP_UNCOMPRESSED_TOTAL = 50 * 1024 * 1024;
export const MAX_ZIP_ENTRY_BYTES = MAX_RAW_FILE_BYTES;
export const MAX_ZIP_COMPRESSION_RATIO = 50;

export const formatMaxFileSize = () => "10 Mo";
