import { resolveArchivePathEntries } from "./archiveImportUtils";
import type { AskArchiveAction } from "./archiveImportUtils";
import type { ImportPayloadEntry, PathFileEntry } from "../../types/depot";
import {
  formatMaxFileSize,
  MAX_BINARY_BYTES,
  MAX_IMPORT_CHUNK_BYTES,
  MAX_TEXT_BYTES,
} from "./importLimits";

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".md",
  ".mdx",
  ".txt",
  ".xml",
  ".svg",
  ".yaml",
  ".yml",
  ".env",
  ".sql",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".go",
  ".rs",
  ".php",
  ".rb",
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".bat",
  ".vue",
  ".svelte",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".gitignore",
  ".dockerignore",
  ".editorconfig",
]);

const extensionOf = (name: string): string => {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
};

export const isProbablyTextFile = (file: File): boolean => {
  if (file.size > MAX_TEXT_BYTES) {
    return false;
  }
  if (file.type?.startsWith("text/")) {
    return true;
  }
  const ext = extensionOf(file.name);
  if (TEXT_EXTENSIONS.has(ext)) {
    return true;
  }
  if (file.type && !file.type.startsWith("text/") && file.type !== "application/json") {
    return false;
  }
  return !file.type || file.type === "application/octet-stream";
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

export interface FileImportPayload {
  content: string;
  encoding: "text" | "base64";
  mimeType: string;
}

export const readFileForImport = async (file: File): Promise<FileImportPayload> => {
  if (file.size > MAX_BINARY_BYTES) {
    throw new Error(`Fichier trop volumineux (max ${formatMaxFileSize()}) : ${file.name}`);
  }

  if (isProbablyTextFile(file)) {
    const content = await file.text();
    if (content.length > MAX_TEXT_BYTES) {
      throw new Error(`Fichier texte trop volumineux (max ${formatMaxFileSize()}) : ${file.name}`);
    }
    return {
      content,
      encoding: "text",
      mimeType: file.type || "text/plain",
    };
  }

  const buffer = await file.arrayBuffer();
  return {
    content: arrayBufferToBase64(buffer),
    encoding: "base64",
    mimeType: file.type || "application/octet-stream",
  };
};

export const pathsFromFileList = (fileList: FileList | File[]): PathFileEntry[] =>
  [...fileList].map((file) => ({
    path:
      "webkitRelativePath" in file && file.webkitRelativePath && file.webkitRelativePath.length > 0
        ? file.webkitRelativePath
        : file.name,
    file,
  }));

const readEntryFile = (entry: FileSystemFileEntry): Promise<File> =>
  new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });

const readDirectoryEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> =>
  new Promise((resolve, reject) => {
    const entries: FileSystemEntry[] = [];
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (!batch.length) {
          resolve(entries);
          return;
        }
        entries.push(...batch);
        readBatch();
      }, reject);
    };
    readBatch();
  });

export const collectPathsFromEntry = async (
  entry: FileSystemEntry,
  basePath = "",
): Promise<PathFileEntry[]> => {
  const collected: PathFileEntry[] = [];
  const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;

  if (entry.isFile) {
    const file = await readEntryFile(entry as FileSystemFileEntry);
    collected.push({ path: currentPath, file });
    return collected;
  }

  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await readDirectoryEntries(reader);
    for (const child of children) {
      const nested = await collectPathsFromEntry(child, currentPath);
      collected.push(...nested);
    }
  }

  return collected;
};

export const collectFromDataTransfer = async (dataTransfer: DataTransfer): Promise<PathFileEntry[]> => {
  const items = [...(dataTransfer.items || [])];
  const collected: PathFileEntry[] = [];

  for (const item of items) {
    if (item.kind !== "file") {
      continue;
    }
    const entry = item.webkitGetAsEntry?.();
    if (entry) {
      const paths = await collectPathsFromEntry(entry);
      collected.push(...paths);
      continue;
    }
    const file = item.getAsFile();
    if (file) {
      collected.push({ path: file.name, file });
    }
  }

  if (collected.length === 0 && dataTransfer.files?.length) {
    return pathsFromFileList(dataTransfer.files);
  }

  return collected;
};

export const expandPathEntriesWithArchives = async (
  pathEntries: PathFileEntry[],
  askArchiveAction?: AskArchiveAction,
): Promise<PathFileEntry[]> => {
  if (!askArchiveAction) {
    return pathEntries;
  }

  const expanded: PathFileEntry[] = [];
  for (const entry of pathEntries) {
    const resolved = await resolveArchivePathEntries(entry.file, entry.path, askArchiveAction);
    expanded.push(...resolved);
  }
  return expanded;
};

export const buildImportPayload = async (pathEntries: PathFileEntry[]): Promise<ImportPayloadEntry[]> => {
  const entries: ImportPayloadEntry[] = [];
  for (const { path, file } of pathEntries) {
    const payload = await readFileForImport(file);
    entries.push({
      path,
      content: payload.content,
      encoding: payload.encoding,
      mimeType: payload.mimeType,
    });
  }
  return entries;
};

const estimateEntryBytes = (entry: ImportPayloadEntry): number =>
  entry.path.length + entry.content.length + 128;

export const chunkEntriesBySize = (
  entries: ImportPayloadEntry[],
  maxChunkBytes = MAX_IMPORT_CHUNK_BYTES,
): ImportPayloadEntry[][] => {
  const chunks: ImportPayloadEntry[][] = [];
  let current: ImportPayloadEntry[] = [];
  let size = 0;

  for (const entry of entries) {
    const entrySize = estimateEntryBytes(entry);
    if (entrySize > maxChunkBytes) {
      if (current.length) {
        chunks.push(current);
        current = [];
        size = 0;
      }
      chunks.push([entry]);
      continue;
    }
    if (size + entrySize > maxChunkBytes && current.length) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(entry);
    size += entrySize;
  }

  if (current.length) {
    chunks.push(current);
  }

  return chunks;
};

/** @deprecated Utiliser chunkEntriesBySize */
export const chunkEntries = (entries: ImportPayloadEntry[], size = 40): ImportPayloadEntry[][] => {
  const chunks: ImportPayloadEntry[][] = [];
  for (let index = 0; index < entries.length; index += size) {
    chunks.push(entries.slice(index, index + size));
  }
  return chunks;
};
