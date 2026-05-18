import { unzip } from "fflate";

import {
  MAX_RAW_FILE_BYTES,
  MAX_ZIP_COMPRESSION_RATIO,
  MAX_ZIP_ENTRIES,
  MAX_ZIP_ENTRY_BYTES,
  MAX_ZIP_UNCOMPRESSED_TOTAL,
} from "./importLimits";

const ARCHIVE_EXTENSIONS = new Set([
  ".zip",
  ".tar",
  ".gz",
  ".tgz",
  ".tar.gz",
  ".7z",
  ".rar",
  ".bz2",
  ".xz",
]);

const ZIP_EXTENSIONS = new Set([".zip"]);

const extensionOf = (name) => {
  const lower = name.toLowerCase();
  if (lower.endsWith(".tar.gz")) {
    return ".tar.gz";
  }
  const index = lower.lastIndexOf(".");
  return index >= 0 ? lower.slice(index) : "";
};

export const isArchiveFileName = (name) => ARCHIVE_EXTENSIONS.has(extensionOf(name));

export const isZipFileName = (name) => ZIP_EXTENSIONS.has(extensionOf(name));

export const basenameWithoutArchiveExt = (name) => {
  const lower = name.toLowerCase();
  if (lower.endsWith(".tar.gz")) {
    return name.slice(0, -7);
  }
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(0, index) : name;
};

const parentPathOf = (path) => {
  const normalized = path.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(0, index) : "";
};

/**
 * @param {File} file
 * @param {string} path - chemin relatif dans l'import (ex. dossier/projet.zip)
 * @param {(file: File, path: string) => Promise<'extract'|'keep'>} askArchiveAction
 */
export const resolveArchivePathEntries = async (file, path, askArchiveAction) => {
  if (!isArchiveFileName(file.name)) {
    return [{ path, file }];
  }

  const action = await askArchiveAction(file, path);

  if (action === "extract") {
    if (!isZipFileName(file.name)) {
      throw new Error(
        `Decompression disponible uniquement pour les fichiers .zip (${file.name}). Choisissez « importer tel quel ».`,
      );
    }
    return extractZipToPathEntries(file, path);
  }

  return [{ path, file }];
};

export const extractZipToPathEntries = async (file, archivePath) => {
  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error(`Archive trop volumineuse (max 10 Mo) : ${file.name}`);
  }

  const buffer = await file.arrayBuffer();
  const compressedSize = buffer.byteLength;

  const unzipped = await new Promise((resolve, reject) => {
    unzip(new Uint8Array(buffer), (error, data) => {
      if (error) {
        reject(new Error(`Archive ZIP invalide ou corrompue : ${file.name}`));
        return;
      }
      resolve(data);
    });
  });

  const names = Object.keys(unzipped).filter((name) => !name.endsWith("/"));
  if (names.length > MAX_ZIP_ENTRIES) {
    throw new Error(`Trop de fichiers dans l'archive (max ${MAX_ZIP_ENTRIES}).`);
  }

  const parentPrefix = parentPathOf(archivePath);
  const folderName = basenameWithoutArchiveExt(file.name);
  const basePrefix = parentPrefix ? `${parentPrefix}/${folderName}` : folderName;

  const pathEntries = [];
  let totalUncompressed = 0;

  for (const name of names) {
    const content = unzipped[name];
    if (!content) {
      continue;
    }

    const entryBytes = content.byteLength;
    if (entryBytes > MAX_ZIP_ENTRY_BYTES) {
      throw new Error(`Fichier trop volumineux dans l'archive (max 10 Mo) : ${name}`);
    }

    if (compressedSize > 0 && entryBytes / compressedSize > MAX_ZIP_COMPRESSION_RATIO) {
      throw new Error(`Entree suspecte dans l'archive (ratio trop eleve) : ${name}`);
    }

    totalUncompressed += entryBytes;
    if (totalUncompressed > MAX_ZIP_UNCOMPRESSED_TOTAL) {
      throw new Error("Contenu decompresse total trop volumineux (limite de securite).");
    }

    const safeName = name.replace(/^\/+/, "").replace(/\\/g, "/");
    if (!safeName || safeName.includes("..")) {
      throw new Error(`Chemin invalide dans l'archive : ${name}`);
    }

    const fullPath = `${basePrefix}/${safeName}`;
    const leafName = safeName.split("/").pop() || safeName;
    const blob = new Blob([content]);
    const extractedFile = new File([blob], leafName, { type: "application/octet-stream" });
    pathEntries.push({ path: fullPath, file: extractedFile });
  }

  if (!pathEntries.length) {
    throw new Error(`Archive vide : ${file.name}`);
  }

  return pathEntries;
};
