import type { ProjectVisibility } from "./hubhex";

export interface DepotFormFields {
  title: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  selectedTechnologies: string[];
  visibility: ProjectVisibility;
}

export interface EditorTab {
  id: number;
  name: string;
  dirty?: boolean;
}

export interface FileContentCacheEntry {
  content: string;
  savedContent: string;
  encoding: string;
}

export interface ProjectFileListItem {
  id: number;
  name: string;
  kind: "file" | "folder";
  parent_id?: number | null;
  encoding?: string;
  content_preview?: string;
  children?: ProjectFileListItem[];
}

export type ArchiveImportAction = "extract" | "keep";

export interface PathFileEntry {
  path: string;
  file: File;
}

export interface ImportPayloadEntry {
  path: string;
  content: string;
  encoding: string;
  mimeType: string;
}

export type FileTreeClipboardMode = "copy" | "cut" | null;

export interface FileTreeClipboard {
  mode: FileTreeClipboardMode;
  ids: number[];
}

export interface ArchivePromptState {
  file: File;
  path: string;
}

export interface ArchiveResolver {
  resolve: (value: ArchiveImportAction) => void;
  reject: (reason?: unknown) => void;
}
