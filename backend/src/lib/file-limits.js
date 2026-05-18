/** Taille brute max d'un fichier (texte ou binaire decode). */
const MAX_RAW_FILE_BYTES = 10 * 1024 * 1024;

/** Longueur max du contenu base64 en base (~10 Mo bruts). */
const MAX_BASE64_CONTENT_LENGTH = Math.ceil((MAX_RAW_FILE_BYTES * 4) / 3) + 8;

/** Longueur max du contenu texte en base. */
const MAX_TEXT_CONTENT_LENGTH = MAX_RAW_FILE_BYTES;

/** Payload JSON max pour un lot d'import (plusieurs petits fichiers). */
const MAX_IMPORT_BATCH_PAYLOAD = 18 * 1024 * 1024;

const MAX_FILES_PER_PROJECT = 500;
const MAX_TREE_DEPTH = 20;
const MAX_IMPORT_BATCH_ENTRIES = 80;
const MAX_IMPORT_PATH_LENGTH = 2000;

/** Decompression ZIP cote client : plafonds anti zip-bomb. */
const MAX_ZIP_ENTRIES = 500;
const MAX_ZIP_UNCOMPRESSED_TOTAL = 50 * 1024 * 1024;
const MAX_ZIP_ENTRY_BYTES = MAX_RAW_FILE_BYTES;
const MAX_ZIP_COMPRESSION_RATIO = 50;

module.exports = {
  MAX_RAW_FILE_BYTES,
  MAX_BASE64_CONTENT_LENGTH,
  MAX_TEXT_CONTENT_LENGTH,
  MAX_IMPORT_BATCH_PAYLOAD,
  MAX_FILES_PER_PROJECT,
  MAX_TREE_DEPTH,
  MAX_IMPORT_BATCH_ENTRIES,
  MAX_IMPORT_PATH_LENGTH,
  MAX_ZIP_ENTRIES,
  MAX_ZIP_UNCOMPRESSED_TOTAL,
  MAX_ZIP_ENTRY_BYTES,
  MAX_ZIP_COMPRESSION_RATIO,
};
