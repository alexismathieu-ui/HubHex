import { unzip } from "fflate";

import type { ArchiveImportAction, PathFileEntry } from "../../types/depot";
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

const extensionOf = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.endsWith(".tar.gz")) {
    return ".tar.gz";
  }
  const index = lower.lastIndexOf(".");
  return index >= 0 ? lower.slice(index) : "";
};

export const isArchiveFileName = (name: string): boolean => ARCHIVE_EXTENSIONS.has(extensionOf(name));

export const isZipFileName = (name: string): boolean => ZIP_EXTENSIONS.has(extensionOf(name));

export const basenameWithoutArchiveExt = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.endsWith(".tar.gz")) {
    return name.slice(0, -7);
  }
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(0, index) : name;
};

const parentPathOf = (path: string): string => {
  const normalized = path.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(0, index) : "";
};

export type AskArchiveAction = (file: File, path: string) => Promise<ArchiveImportAction>;

export const resolveArchivePathEntries = async (
  file: File,
  path: string,
  askArchiveAction: AskArchiveAction,
): Promise<PathFileEntry[]> => {
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

export const extractZipToPathEntries = async (file: File, archivePath: string): Promise<PathFileEntry[]> => {
  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error(`Archive trop volumineuse (max 10 Mo) : ${file.name}`);
  }

  const buffer = await file.arrayBuffer();
  const compressedSize = buffer.byteLength;

  const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
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

  const pathEntries: PathFileEntry[] = [];
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
    const blob = new Blob([new Uint8Array(content)]);
    const extractedFile = new File([blob], leafName, { type: "application/octet-stream" });
    pathEntries.push({ path: fullPath, file: extractedFile });
  }

  if (!pathEntries.length) {
    throw new Error(`Archive vide : ${file.name}`);
  }

  return pathEntries;
};
