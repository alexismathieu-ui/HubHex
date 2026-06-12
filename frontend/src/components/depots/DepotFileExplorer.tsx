"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ArchiveImportDialog } from "./ArchiveImportDialog";
import { DepotCodeWorkbench } from "./DepotCodeWorkbench";
import { FileExplorerToolbar } from "./FileExplorerToolbar";
import { FileTreeSchemaModal } from "./FileTreeSchemaModal";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { authFetch } from "../../lib/auth/authFetch";
import { getErrorMessage } from "../../lib/errors";
import {
  buildImportPayload,
  chunkEntriesBySize,
  collectFromDataTransfer,
  expandPathEntriesWithArchives,
  pathsFromFileList,
} from "../../lib/depots/fileImportUtils";
import { formatMaxFileSize } from "../../lib/depots/importLimits";
import {
  buildFilePathForNode,
  buildPathLabel,
  collectFolderIds,
  findNodeById,
  idsMatch,
} from "../../lib/depots/fileTreeUtils";
import { formatApiError } from "../../lib/formatApiError";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import type {
  ArchiveImportAction,
  ArchivePromptState,
  ArchiveResolver,
  EditorTab,
  FileTreeClipboard,
  ProjectFileListItem,
} from "../../types/depot";
import type { PathFileEntry } from "../../types/depot";

const emptyClipboard = (): FileTreeClipboard => ({ mode: null, ids: [] });

const SIDEBAR_WIDTH_KEY = "hubhex_file_sidebar_width";
const EXPLORER_HEIGHT_KEY = "hubhex_file_explorer_height";
const DEFAULT_SIDEBAR_WIDTH = 300;
const DEFAULT_EXPLORER_HEIGHT = 520;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 520;
const MIN_EXPLORER_HEIGHT = 320;
const MAX_EXPLORER_HEIGHT = 680;

function readStoredNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = localStorage.getItem(key);
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

interface TreeNodeProps {
  node: ProjectFileListItem;
  depth: number;
  selectedIds: Set<number>;
  expandedIds: Set<number>;
  targetParentId: number | null;
  dragOverId: number | null;
  onSelect: (event: React.MouseEvent, node: ProjectFileListItem) => void;
  onToggleExpand: (id: number) => void;
  onSetTarget: (id: number) => void;
  onDragStart: (event: React.DragEvent, node: ProjectFileListItem) => void;
  onDragOver: (event: React.DragEvent, folderId: number) => void;
  onDragLeave: (folderId: number) => void;
  onDrop: (event: React.DragEvent, folderId: number) => void;
  onExternalDragOver?: (event: React.DragEvent) => void;
  onOpenFile?: (node: ProjectFileListItem) => void;
  renamingId: number | null;
  onRenameCommit: (id: number, name: string) => void;
  onRenameCancel: () => void;
}

function TreeNode({
  node,
  depth,
  selectedIds,
  expandedIds,
  targetParentId,
  dragOverId,
  onSelect,
  onToggleExpand,
  onSetTarget,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onExternalDragOver,
  onOpenFile,
  renamingId,
  onRenameCommit,
  onRenameCancel,
}: TreeNodeProps) {
  const isFolder = node.kind === "folder";
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);
  const isTarget = idsMatch(targetParentId, node.id);
  const isDragOver = idsMatch(dragOverId, node.id);

  const rowClass = `flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
    isDragOver
      ? "bg-cyan-950/50 ring-1 ring-cyan-600"
      : isTarget
        ? "bg-amber-950/30 ring-1 ring-amber-600/50"
        : isSelected
          ? "bg-cyan-950/40"
          : "hover:bg-slate-800/80"
  }`;

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        draggable
        onDragStart={(event) => onDragStart(event, node)}
        onDragOver={(event) => {
          if (isFolder) {
            onDragOver(event, node.id);
          }
          onExternalDragOver?.(event);
        }}
        onDragLeave={() => onDragLeave(node.id)}
        onDrop={(event) => isFolder && onDrop(event, node.id)}
        className={rowClass}
        role="treeitem"
        aria-selected={isSelected}
        onDoubleClick={() => {
          if (node.kind === "file") {
            onOpenFile?.(node);
          }
        }}
      >
        {isFolder ? (
          <button
            type="button"
            className="shrink-0 text-slate-400 hover:text-slate-200"
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpand(node.id);
            }}
            aria-label={isExpanded ? "Replier" : "Deplier"}
          >
            {isExpanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 shrink-0 text-slate-600">·</span>
        )}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={(event) => onSelect(event, node)}
          onDoubleClick={() => isFolder && onSetTarget(node.id)}
        >
          <span className={isFolder ? "text-amber-300" : "text-slate-400"}>
            {isFolder ? "📁" : node.encoding === "base64" ? "🖼" : "📄"}
          </span>
          {renamingId === node.id ? (
            <input
              type="text"
              defaultValue={node.name}
              autoFocus
              className="min-w-0 flex-1 rounded border border-cyan-600 bg-slate-900 px-1.5 py-0.5 font-medium text-slate-100 outline-none ring-1 ring-cyan-500/50"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  onRenameCommit(node.id, event.currentTarget.value);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  onRenameCancel();
                }
              }}
              onBlur={(event) => onRenameCommit(node.id, event.currentTarget.value)}
              onFocus={(event) => event.currentTarget.select()}
            />
        ) : (
          <span className="truncate font-medium text-slate-100">{node.name}</span>
        )}
        </button>
        {!isFolder && onOpenFile ? (
          <button
            type="button"
            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-cyan-400/80 transition hover:bg-cyan-950/50 hover:text-cyan-200 lg:hidden"
            title="Ouvrir dans l'editeur"
            onClick={(event) => {
              event.stopPropagation();
              onOpenFile(node);
            }}
          >
            Ouvrir
          </button>
        ) : null}
        {isFolder ? (
          <button
            type="button"
            className="shrink-0 text-xs text-slate-500 hover:text-cyan-300"
            title="Definir comme destination coller/deplacer"
            onClick={(event) => {
              event.stopPropagation();
              onSetTarget(node.id);
            }}
          >
            →
          </button>
        ) : null}
      </div>
      {isFolder && isExpanded && (node.children?.length ?? 0) > 0 ? (
        <div>
          {(node.children ?? []).map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              targetParentId={targetParentId}
              dragOverId={dragOverId}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onSetTarget={onSetTarget}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onExternalDragOver={onExternalDragOver}
              onOpenFile={onOpenFile}
              renamingId={renamingId}
              onRenameCommit={onRenameCommit}
              onRenameCancel={onRenameCancel}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface DepotFileExplorerProps {
  token: string;
  projectId: number;
}

interface FileTreeResponse {
  tree?: ProjectFileListItem[];
  items?: ProjectFileListItem[];
  imported?: number;
}

export function DepotFileExplorer({ token, projectId }: DepotFileExplorerProps) {
  const [tree, setTree] = useState<ProjectFileListItem[]>([]);
  const [items, setItems] = useState<ProjectFileListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [targetParentId, setTargetParentId] = useState<number | null>(null);
  const [clipboard, setClipboard] = useState<FileTreeClipboard>(emptyClipboard);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [draggedIds, setDraggedIds] = useState<number[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [explorerHeight, setExplorerHeight] = useState(DEFAULT_EXPLORER_HEIGHT);
  const [importing, setImporting] = useState(false);
  const [externalDragOver, setExternalDragOver] = useState(false);
  const [archivePrompt, setArchivePrompt] = useState<ArchivePromptState | null>(null);
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"tree" | "editor">("tree");
  const isMobileLayout = useMediaQuery("(max-width: 1023px)");

  const openFileInEditor = useCallback(
    (node: ProjectFileListItem | null) => {
      if (!node || node.kind !== "file") {
        return;
      }
      setOpenTabs((prev) => {
        if (prev.some((tab) => tab.id === node.id)) {
          return prev;
        }
        const path = buildFilePathForNode(items, tree, node);
        return [...prev, { id: node.id, name: node.name, path, dirty: false }];
      });
      setActiveTabId(node.id);
      setMobilePanel("editor");
    },
    [items, tree],
  );

  const closeTab = useCallback((tabId: number) => {
    setOpenTabs((prev) => {
      const next = prev.filter((tab) => tab.id !== tabId);
      setActiveTabId((current) => (current === tabId ? next[0]?.id ?? null : current));
      return next;
    });
  }, []);

  const markTabDirty = useCallback((tabId: number, dirty: boolean) => {
    setOpenTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab || tab.dirty === dirty) {
        return prev;
      }
      return prev.map((t) => (t.id === tabId ? { ...t, dirty } : t));
    });
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const renameCommittingRef = useRef(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const folderUploadRef = useRef<HTMLInputElement>(null);
  const archiveResolverRef = useRef<ArchiveResolver | null>(null);
  const resizeSessionRef = useRef<{
    kind: "sidebar" | "height";
    startX: number;
    startY: number;
    startSidebar: number;
    startHeight: number;
  } | null>(null);
  const sidebarWidthRef = useRef(sidebarWidth);
  const explorerHeightRef = useRef(explorerHeight);
  sidebarWidthRef.current = sidebarWidth;
  explorerHeightRef.current = explorerHeight;

  useEffect(() => {
    setSidebarWidth(
      Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, readStoredNumber(SIDEBAR_WIDTH_KEY, DEFAULT_SIDEBAR_WIDTH)),
      ),
    );
    setExplorerHeight(
      Math.min(
        MAX_EXPLORER_HEIGHT,
        Math.max(MIN_EXPLORER_HEIGHT, readStoredNumber(EXPLORER_HEIGHT_KEY, DEFAULT_EXPLORER_HEIGHT)),
      ),
    );
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const session = resizeSessionRef.current;
      if (!session) {
        return;
      }
      if (session.kind === "sidebar") {
        const next = Math.min(
          MAX_SIDEBAR_WIDTH,
          Math.max(MIN_SIDEBAR_WIDTH, session.startSidebar + (event.clientX - session.startX)),
        );
        setSidebarWidth(next);
      } else {
        const next = Math.min(
          MAX_EXPLORER_HEIGHT,
          Math.max(MIN_EXPLORER_HEIGHT, session.startHeight + (event.clientY - session.startY)),
        );
        setExplorerHeight(next);
      }
    };

    const onMouseUp = () => {
      const session = resizeSessionRef.current;
      if (!session) {
        return;
      }
      resizeSessionRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (session.kind === "sidebar") {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidthRef.current));
      } else {
        localStorage.setItem(EXPLORER_HEIGHT_KEY, String(explorerHeightRef.current));
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startSidebarResize = (event: React.MouseEvent) => {
    event.preventDefault();
    resizeSessionRef.current = {
      kind: "sidebar",
      startX: event.clientX,
      startY: event.clientY,
      startSidebar: sidebarWidth,
      startHeight: explorerHeight,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const startHeightResize = (event: React.MouseEvent) => {
    event.preventDefault();
    resizeSessionRef.current = {
      kind: "height",
      startX: event.clientX,
      startY: event.clientY,
      startSidebar: sidebarWidth,
      startHeight: explorerHeight,
    };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  const applyTreeResponse = (data: FileTreeResponse) => {
    setTree(data.tree || []);
    setItems(data.items || []);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const id of collectFolderIds(data.tree || [])) {
        next.add(id);
      }
      return next;
    });
  };

  const loadTree = useCallback(async () => {
    if (!token || !projectId) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await authFetch(`${API_BASE_URL}/projects/${projectId}/files`, {
        headers: createAuthHeaders(token, false),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Impossible de charger les fichiers.");
      }
      applyTreeResponse(data);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
      setTree([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, projectId]);

  useEffect(() => {
    setSelectedIds(new Set());
    setClipboard(emptyClipboard());
    setTargetParentId(null);
    loadTree();
  }, [loadTree]);

  const selectedArray = [...selectedIds];

  const createEntry = async (kind: "file" | "folder") => {
    const defaultName = kind === "folder" ? "nouveau-dossier" : "nouveau-fichier.txt";
    setMessage("");
    try {
      const body = {
        parentId: targetParentId,
        name: defaultName,
        kind,
        content: kind === "file" ? "" : undefined,
      };
      const response = await authFetch(`${API_BASE_URL}/projects/${projectId}/files`, {
        method: "POST",
        headers: createAuthHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur a la creation.");
      }
      if (targetParentId) {
        setExpandedIds((prev) => new Set([...prev, targetParentId]));
      }
      await loadTree();
      const createdId = data.item?.id as number | undefined;
      if (createdId) {
        setSelectedIds(new Set([createdId]));
        setRenamingId(createdId);
      }
      setMessage(`${kind === "folder" ? "Dossier" : "Fichier"} cree — renommez puis Entree.`);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  };

  const deleteSelected = async () => {
    if (!selectedArray.length) {
      return;
    }
    if (!window.confirm(`Supprimer ${selectedArray.length} element(s) ?`)) {
      return;
    }
    setMessage("");
    try {
      for (const id of selectedArray) {
        const response = await authFetch(`${API_BASE_URL}/projects/${projectId}/files/${id}`, {
          method: "DELETE",
          headers: createAuthHeaders(token, false),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(formatApiError(data) || "Erreur a la suppression.");
        }
      }
      setSelectedIds(new Set());
      await loadTree();
      setMessage("Suppression effectuee.");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  };

  const openSelectedEditor = () => {
    if (selectedArray.length !== 1) {
      return;
    }
    const node = findNodeById(tree, selectedArray[0]);
    openFileInEditor(node);
  };

  const renameSelected = () => {
    if (selectedArray.length !== 1) {
      setMessage("Selectionne un seul element a renommer.");
      return;
    }
    const node = findNodeById(tree, selectedArray[0]);
    if (!node) {
      return;
    }
    setRenamingId(node.id);
  };

  const commitRename = async (id: number, rawName: string) => {
    if (renameCommittingRef.current) {
      return;
    }
    renameCommittingRef.current = true;
    const name = rawName.trim();
    setRenamingId(null);
    const node = findNodeById(tree, id);
    if (!node) {
      renameCommittingRef.current = false;
      return;
    }
    if (!name || name === node.name) {
      renameCommittingRef.current = false;
      return;
    }
    setMessage("");
    try {
      const response = await authFetch(
        `${API_BASE_URL}/projects/${projectId}/files/${id}`,
        {
          method: "PATCH",
          headers: createAuthHeaders(token),
          body: JSON.stringify({ name }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur au renommage.");
      }
      await loadTree();
      setMessage("Renomme.");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    } finally {
      renameCommittingRef.current = false;
    }
  };

  const cancelRename = () => {
    setRenamingId(null);
  };

  const copySelection = () => {
    if (!selectedArray.length) {
      return;
    }
    setClipboard({ mode: "copy", ids: selectedArray });
    setMessage(`${selectedArray.length} element(s) copies (Ctrl+V pour coller).`);
  };

  const cutSelection = () => {
    if (!selectedArray.length) {
      return;
    }
    setClipboard({ mode: "cut", ids: selectedArray });
    setMessage(`${selectedArray.length} element(s) coupes (Ctrl+V pour coller).`);
  };

  const pasteClipboard = async () => {
    if (!clipboard.mode || !clipboard.ids.length) {
      setMessage("Rien dans le presse-papiers.");
      return;
    }
    setMessage("");
    try {
      const response = await authFetch(`${API_BASE_URL}/projects/${projectId}/files/paste`, {
        method: "POST",
        headers: createAuthHeaders(token),
        body: JSON.stringify({
          sourceIds: clipboard.ids,
          targetParentId,
          mode: clipboard.mode,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur au collage.");
      }
      const mode = clipboard.mode;
      applyTreeResponse(data);
      if (mode === "cut") {
        setClipboard(emptyClipboard());
      }
      setSelectedIds(new Set());
      setMessage(mode === "cut" ? "Deplace." : "Copie.");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  };

  const moveNodesToParent = async (sourceIds: number[], targetParentId: number | null) => {
    if (!sourceIds.length) {
      return;
    }
    setMessage("");
    try {
      const response = await authFetch(`${API_BASE_URL}/projects/${projectId}/files/move`, {
        method: "POST",
        headers: createAuthHeaders(token),
        body: JSON.stringify({
          ids: sourceIds,
          targetParentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur au deplacement.");
      }
      applyTreeResponse(data);
      setMessage(sourceIds.length > 1 ? `${sourceIds.length} elements deplaces.` : "Deplace.");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
      throw error;
    }
  };

  const moveDragged = async (targetId: number | null) => {
    if (!draggedIds.length) {
      return;
    }
    try {
      await moveNodesToParent(draggedIds, targetId);
    } finally {
      setDraggedIds([]);
      setDragOverId(null);
    }
  };

  const onDragStart = (event: React.DragEvent, node: ProjectFileListItem) => {
    const ids =
      selectedIds.has(node.id) && selectedIds.size > 1 ? [...selectedIds] : [node.id];
    setDraggedIds(ids);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", ids.join(","));
  };

  const onDragOver = (event: React.DragEvent, folderId: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverId(folderId);
  };

  const onDragLeave = (folderId: number) => {
    setDragOverId((current) => (current === folderId ? null : current));
  };

  const onDrop = (event: React.DragEvent, folderId: number) => {
    handleDropZone(event, folderId);
  };

  const onSelect = (event: React.MouseEvent, node: ProjectFileListItem) => {
    const multi = event.ctrlKey || event.metaKey;
    setSelectedIds((prev) => {
      const next = new Set(multi ? prev : []);
      if (next.has(node.id) && multi) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
    if (isMobileLayout && node.kind === "file" && !multi) {
      openFileInEditor(node);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === "c") {
      event.preventDefault();
      copySelection();
    } else if (key === "x") {
      event.preventDefault();
      cutSelection();
    } else if (key === "v") {
      event.preventDefault();
      pasteClipboard();
    }
  };

  const askArchiveAction = (file: File, path: string): Promise<ArchiveImportAction> =>
    new Promise((resolve, reject) => {
      archiveResolverRef.current = { resolve, reject };
      setArchivePrompt({ file, path });
    });

  const closeArchivePrompt = (action: ArchiveImportAction | null) => {
    const pending = archiveResolverRef.current;
    archiveResolverRef.current = null;
    setArchivePrompt(null);
    if (pending) {
      if (action) {
        pending.resolve(action);
      } else {
        pending.reject(new Error("Import de l'archive annule."));
      }
    }
  };

  const runImport = async (pathEntries: PathFileEntry[], parentId: number | null = targetParentId) => {
    if (!pathEntries.length) {
      return;
    }
    setImporting(true);
    setMessage("");
    try {
      const expanded = await expandPathEntriesWithArchives(pathEntries, askArchiveAction);
      const allEntries = await buildImportPayload(expanded);
      const chunks = chunkEntriesBySize(allEntries);
      let imported = 0;

      for (const chunk of chunks) {
        const response = await authFetch(`${API_BASE_URL}/projects/${projectId}/files/import-batch`, {
          method: "POST",
          headers: createAuthHeaders(token),
          body: JSON.stringify({ parentId, entries: chunk }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(formatApiError(data) || "Erreur lors de l'import.");
        }
        applyTreeResponse(data);
        imported += data.imported ?? chunk.length;
      }

      setMessage(`${imported} element(s) importe(s).`);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    } finally {
      setImporting(false);
      setExternalDragOver(false);
    }
  };

  const onUploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    event.target.value = "";
    if (files) {
      await runImport(pathsFromFileList(files));
    }
  };

  const onUploadFolder = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    event.target.value = "";
    if (files) {
      await runImport(pathsFromFileList(files));
    }
  };

  const onExternalDragOver = (event: React.DragEvent) => {
    if (draggedIds.length) {
      return;
    }
    if ([...(event.dataTransfer?.types || [])].includes("Files")) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setExternalDragOver(true);
    }
  };

  const importFromDataTransfer = async (dataTransfer: DataTransfer, parentId: number | null) => {
    const pathEntries = await collectFromDataTransfer(dataTransfer);
    await runImport(pathEntries, parentId);
  };

  const handleDropZone = async (event: React.DragEvent, parentId: number | null) => {
    event.preventDefault();
    event.stopPropagation();
    setExternalDragOver(false);

    if (draggedIds.length) {
      await moveDragged(parentId);
      return;
    }

    if ([...(event.dataTransfer?.types || [])].includes("Files")) {
      await importFromDataTransfer(event.dataTransfer, parentId);
    }
  };

  const pathLabel = buildPathLabel(items, targetParentId, tree);

  const showTreePanel = !isMobileLayout || mobilePanel === "tree";
  const showEditorPanel = !isMobileLayout || mobilePanel === "editor";

  const panelBtnClass = (active: boolean) =>
    `rounded-md transition ${
      active
        ? "bg-cyan-600 text-white"
        : "border border-slate-600 text-slate-300 hover:border-cyan-600 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
    }`;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="relative mt-2 flex flex-col outline-none lg:flex-row"
      style={
        isMobileLayout
          ? undefined
          : ({
              height: explorerHeight,
              "--file-sidebar-width": `${sidebarWidth}px`,
            } as React.CSSProperties)
      }
      aria-label="Explorateur et editeur de code"
    >
      {isMobileLayout ? (
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/50 px-2 py-2 lg:hidden">
          <div className="flex gap-1">
            <button
              type="button"
              className={`${panelBtnClass(mobilePanel === "tree")} px-2.5 py-1 text-xs`}
              aria-current={mobilePanel === "tree" ? "true" : undefined}
              onClick={() => setMobilePanel("tree")}
            >
              Liste
            </button>
            <button
              type="button"
              className={`${panelBtnClass(mobilePanel === "editor")} px-2.5 py-1 text-xs`}
              aria-current={mobilePanel === "editor" ? "true" : undefined}
              disabled={openTabs.length === 0}
              onClick={() => setMobilePanel("editor")}
            >
              Editeur
            </button>
          </div>
          <button
            type="button"
            className={`${panelBtnClass(false)} px-2.5 py-1 text-xs`}
            onClick={() => setSchemaModalOpen(true)}
          >
            Schema
          </button>
        </div>
      ) : null}

      <aside
        className={`w-full shrink-0 flex-col border-b border-slate-700 lg:w-[var(--file-sidebar-width)] lg:max-w-[var(--file-sidebar-width)] lg:border-b-0 lg:border-r ${
          showTreePanel ? "flex" : "hidden lg:flex"
        }`}
        style={isMobileLayout ? { minHeight: "min(52vh, 420px)" } : undefined}
      >
        <div
          className={`flex min-w-0 gap-1.5 p-2 ${
            sidebarWidth < 240 ? "flex-col" : "flex-row items-center justify-between"
          }`}
        >
          <div className="min-w-0 flex-1 overflow-hidden">
            <p
              className="truncate font-semibold uppercase tracking-wide text-slate-500"
              style={{ fontSize: "clamp(8px, calc(var(--file-sidebar-width, 300px) / 28), 12px)" }}
              title="Arborescence"
            >
              {sidebarWidth < 200 ? "Arb." : sidebarWidth < 260 ? "Arboresc." : "Arborescence"}
            </p>
            {sidebarWidth >= 220 ? (
              <p
                className="mt-0.5 truncate font-mono text-cyan-400/90"
                style={{ fontSize: "clamp(8px, calc(var(--file-sidebar-width, 300px) / 32), 11px)" }}
              >
                {sidebarWidth < 300 ? pathLabel : `Destination : ${pathLabel}`}
              </p>
            ) : null}
          </div>
          <div className={`hidden shrink-0 gap-1 lg:flex ${sidebarWidth < 240 ? "w-full" : ""}`}>
            <button
              type="button"
              className="rounded-md bg-cyan-600 text-white"
              style={{
                fontSize: "clamp(9px, calc(var(--file-sidebar-width, 300px) / 30), 12px)",
                padding: sidebarWidth < 240 ? "4px 8px" : "4px 10px",
              }}
              aria-current="true"
            >
              Liste
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-600 text-slate-300 transition hover:border-cyan-600 hover:text-cyan-200"
              style={{
                fontSize: "clamp(9px, calc(var(--file-sidebar-width, 300px) / 30), 12px)",
                padding: sidebarWidth < 240 ? "4px 8px" : "4px 10px",
              }}
              onClick={() => setSchemaModalOpen(true)}
            >
              Schema
            </button>
          </div>
        </div>

        <FileExplorerToolbar
          importing={importing}
          hasSelection={selectedArray.length > 0}
          selectionCount={selectedArray.length}
          canPaste={clipboard.ids.length > 0}
          canEdit={selectedArray.length === 1}
          maxFileSizeLabel={formatMaxFileSize()}
          onCreateFile={() => createEntry("file")}
          onCreateFolder={() => createEntry("folder")}
          onImportFiles={() => uploadRef.current?.click()}
          onImportFolder={() => folderUploadRef.current?.click()}
          onCopy={copySelection}
          onCut={cutSelection}
          onPaste={pasteClipboard}
          onEdit={openSelectedEditor}
          onRename={renameSelected}
          onDelete={deleteSelected}
          onGoRoot={() => setTargetParentId(null)}
        />

        <input
          ref={uploadRef}
          type="file"
          multiple
          className="hidden"
          onChange={onUploadFiles}
        />
        <input
          ref={folderUploadRef}
          type="file"
          multiple
          className="hidden"
          onChange={onUploadFolder}
          {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
        />
        {archivePrompt ? (
          <ArchiveImportDialog
            file={archivePrompt.file}
            path={archivePrompt.path}
            onChoose={(action) => closeArchivePrompt(action)}
            onCancel={() => closeArchivePrompt(null)}
          />
        ) : null}
        {importing ? <p className="mt-1 px-3 text-xs text-cyan-300">Import en cours...</p> : null}

        {message ? <p className="mt-2 px-3 text-sm text-slate-300">{message}</p> : null}

        <div
          className={`mx-3 mb-3 min-h-[120px] flex-1 overflow-y-auto rounded-lg border p-2 transition ${
            externalDragOver
              ? "border-cyan-500 bg-cyan-950/30"
              : "border-slate-700 bg-slate-950/60"
          }`}
          role="tree"
          onDragOver={onExternalDragOver}
          onDragLeave={() => setExternalDragOver(false)}
          onDrop={(event) => handleDropZone(event, targetParentId)}
        >
          {loading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : tree.length === 0 ? (
            <p className="text-sm text-slate-500">
              Depot vide. Cree un fichier/dossier, importe ou glisse-depose depuis ton explorateur.
            </p>
          ) : (
            tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                targetParentId={targetParentId}
                dragOverId={dragOverId}
                onSelect={onSelect}
                onToggleExpand={(id) =>
                  setExpandedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) {
                      next.delete(id);
                    } else {
                      next.add(id);
                    }
                    return next;
                  })
                }
                onSetTarget={setTargetParentId}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onExternalDragOver={onExternalDragOver}
                onOpenFile={openFileInEditor}
                renamingId={renamingId}
                onRenameCommit={commitRename}
                onRenameCancel={cancelRename}
              />
            ))
          )}
        </div>
      </aside>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionner la liste de fichiers"
        onMouseDown={startSidebarResize}
        className="hidden w-1.5 shrink-0 cursor-col-resize bg-slate-800/40 transition hover:bg-cyan-600/50 lg:block"
      />

      <main
        className={`min-w-0 flex-1 flex-col lg:min-h-0 ${
          showEditorPanel ? "flex" : "hidden lg:flex"
        }`}
        style={isMobileLayout ? { minHeight: "min(70vh, 640px)" } : { minHeight: 280 }}
      >
        {isMobileLayout ? (
          <div className="flex items-center gap-2 border-b border-slate-700/50 px-2 py-1.5">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-cyan-200"
              onClick={() => setMobilePanel("tree")}
            >
              ← Arborescence
            </button>
            {activeTabId ? (
              <span className="min-w-0 truncate font-mono text-xs text-cyan-300/90">
                {openTabs.find((tab) => tab.id === activeTabId)?.path ||
                  openTabs.find((tab) => tab.id === activeTabId)?.name}
              </span>
            ) : (
              <span className="text-xs text-slate-500">Aucun fichier ouvert</span>
            )}
          </div>
        ) : null}
        <DepotCodeWorkbench
          token={token}
          projectId={projectId}
          tabs={openTabs}
          activeTabId={activeTabId}
          onActivateTab={setActiveTabId}
          onCloseTab={closeTab}
          onMarkDirty={markTabDirty}
          onSaved={loadTree}
        />
      </main>

      {!isMobileLayout ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Redimensionner la hauteur de l'editeur"
          onMouseDown={startHeightResize}
          className="absolute bottom-0 left-0 right-0 z-10 h-2 cursor-row-resize bg-transparent hover:bg-cyan-600/30"
        />
      ) : null}

      <FileTreeSchemaModal
        open={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
        tree={tree}
        selectedIds={selectedIds}
        onSelect={onSelect}
        onMove={moveNodesToParent}
        onOpenFile={openFileInEditor}
        statusMessage={message}
      />

    </div>
  );
}
