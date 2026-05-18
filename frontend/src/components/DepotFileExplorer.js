"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ArchiveImportDialog } from "./ArchiveImportDialog";
import { API_BASE_URL } from "../lib/apiBaseUrl";
import {
  buildImportPayload,
  chunkEntriesBySize,
  collectFromDataTransfer,
  expandPathEntriesWithArchives,
  pathsFromFileList,
} from "../lib/fileImportUtils";
import { formatMaxFileSize } from "../lib/importLimits";
import { buildPathLabel, collectFolderIds, findNodeById } from "../lib/fileTreeUtils";
import { formatApiError } from "../lib/formatApiError";

const emptyClipboard = () => ({ mode: null, ids: [] });

function TreeNode({
  node,
  depth,
  viewMode,
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
}) {
  const isFolder = node.kind === "folder";
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);
  const isTarget = targetParentId === node.id;
  const isDragOver = dragOverId === node.id;

  const indent = viewMode === "schema" ? depth * 28 : depth * 16;
  const rowClass =
    viewMode === "schema"
      ? `mb-2 rounded-lg border px-3 py-2.5 ${
          isDragOver
            ? "border-cyan-500 bg-cyan-950/40"
            : isTarget
              ? "border-amber-600/60 bg-amber-950/20"
              : isSelected
                ? "border-cyan-700 bg-cyan-950/30"
                : "border-slate-700 bg-slate-900/80"
        }`
      : `flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
          isDragOver
            ? "bg-cyan-950/50 ring-1 ring-cyan-600"
            : isTarget
              ? "bg-amber-950/30 ring-1 ring-amber-600/50"
              : isSelected
                ? "bg-cyan-950/40"
                : "hover:bg-slate-800/80"
        }`;

  return (
    <div style={{ marginLeft: indent }} className={viewMode === "schema" ? "relative" : ""}>
      {viewMode === "schema" && depth > 0 ? (
        <span
          className="absolute -left-3 top-4 h-px w-3 bg-slate-600"
          aria-hidden
        />
      ) : null}
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
        className={`${rowClass}${viewMode === "list" ? " flex items-center gap-2" : ""}`}
        role="treeitem"
        aria-selected={isSelected}
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
          <span className="truncate font-medium text-slate-100">{node.name}</span>
          {viewMode === "schema" && node.kind === "file" && node.content_preview ? (
            <span className="truncate text-xs text-slate-500">
              {String(node.content_preview).slice(0, 40)}
              {String(node.content_preview).length > 40 ? "…" : ""}
            </span>
          ) : null}
        </button>
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
      </div>
      {isFolder && isExpanded && node.children?.length > 0 ? (
        <div className={viewMode === "schema" ? "mt-1 border-l border-slate-700 pl-2" : ""}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              viewMode={viewMode}
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
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DepotFileExplorer({ token, projectId }) {
  const [tree, setTree] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [targetParentId, setTargetParentId] = useState(null);
  const [clipboard, setClipboard] = useState(emptyClipboard);
  const [dragOverId, setDragOverId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [externalDragOver, setExternalDragOver] = useState(false);
  const [archivePrompt, setArchivePrompt] = useState(null);
  const containerRef = useRef(null);
  const uploadRef = useRef(null);
  const folderUploadRef = useRef(null);
  const archiveResolverRef = useRef(null);

  const authHeaders = (json = true) => {
    const headers = { Authorization: `Bearer ${token}` };
    if (json) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  const applyTreeResponse = (data) => {
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
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files`, {
        headers: authHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Impossible de charger les fichiers.");
      }
      applyTreeResponse(data);
    } catch (error) {
      setMessage(error.message);
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

  const createEntry = async (kind) => {
    const label = kind === "folder" ? "dossier" : "fichier";
    const name = window.prompt(`Nom du ${label} :`, kind === "folder" ? "nouveau-dossier" : "nouveau-fichier.txt");
    if (!name?.trim()) {
      return;
    }
    setMessage("");
    try {
      const body = {
        parentId: targetParentId,
        name: name.trim(),
        kind,
        content: kind === "file" ? "" : undefined,
      };
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur a la creation.");
      }
      await loadTree();
      setMessage(`${kind === "folder" ? "Dossier" : "Fichier"} cree.`);
    } catch (error) {
      setMessage(error.message);
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
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files/${id}`, {
          method: "DELETE",
          headers: authHeaders(false),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(formatApiError(data) || "Erreur a la suppression.");
        }
      }
      setSelectedIds(new Set());
      await loadTree();
      setMessage("Suppression effectuee.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const renameSelected = async () => {
    if (selectedArray.length !== 1) {
      setMessage("Selectionne un seul element a renommer.");
      return;
    }
    const node = findNodeById(tree, selectedArray[0]);
    if (!node) {
      return;
    }
    const name = window.prompt("Nouveau nom :", node.name);
    if (!name?.trim()) {
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/files/${node.id}`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ name: name.trim() }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur au renommage.");
      }
      await loadTree();
      setMessage("Renomme.");
    } catch (error) {
      setMessage(error.message);
    }
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
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files/paste`, {
        method: "POST",
        headers: authHeaders(),
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
    } catch (error) {
      setMessage(error.message);
    }
  };

  const moveDragged = async (targetId) => {
    if (!draggedId || draggedId === targetId) {
      return;
    }
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files/move`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ids: [draggedId],
          targetParentId: targetId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur au deplacement.");
      }
      applyTreeResponse(data);
      setMessage("Deplace.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDraggedId(null);
      setDragOverId(null);
    }
  };

  const onDragStart = (event, node) => {
    setDraggedId(node.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(node.id));
  };

  const onDragOver = (event, folderId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverId(folderId);
  };

  const onDragLeave = (folderId) => {
    setDragOverId((current) => (current === folderId ? null : current));
  };

  const onDrop = (event, folderId) => {
    handleDropZone(event, folderId);
  };

  const onSelect = (event, node) => {
    setSelectedIds((prev) => {
      const next = new Set(event.ctrlKey || event.metaKey ? prev : []);
      if (next.has(node.id) && (event.ctrlKey || event.metaKey)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  };

  const onKeyDown = (event) => {
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

  const askArchiveAction = (file, path) =>
    new Promise((resolve, reject) => {
      archiveResolverRef.current = { resolve, reject };
      setArchivePrompt({ file, path });
    });

  const closeArchivePrompt = (action) => {
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

  const runImport = async (pathEntries, parentId = targetParentId) => {
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
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files/import-batch`, {
          method: "POST",
          headers: authHeaders(),
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
    } catch (error) {
      setMessage(error.message);
    } finally {
      setImporting(false);
      setExternalDragOver(false);
    }
  };

  const onUploadFiles = async (event) => {
    const files = event.target.files;
    event.target.value = "";
    await runImport(pathsFromFileList(files));
  };

  const onUploadFolder = async (event) => {
    const files = event.target.files;
    event.target.value = "";
    await runImport(pathsFromFileList(files));
  };

  const onExternalDragOver = (event) => {
    if (draggedId) {
      return;
    }
    if ([...(event.dataTransfer?.types || [])].includes("Files")) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setExternalDragOver(true);
    }
  };

  const importFromDataTransfer = async (dataTransfer, parentId) => {
    const pathEntries = await collectFromDataTransfer(dataTransfer);
    await runImport(pathEntries, parentId);
  };

  const handleDropZone = async (event, parentId) => {
    event.preventDefault();
    event.stopPropagation();
    setExternalDragOver(false);

    if (draggedId) {
      await moveDragged(parentId);
      return;
    }

    if ([...(event.dataTransfer?.types || [])].includes("Files")) {
      await importFromDataTransfer(event.dataTransfer, parentId);
    }
  };

  const pathLabel = buildPathLabel(items, targetParentId);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="mt-2 outline-none"
      role="tree"
      aria-label="Fichiers du depot"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Arborescence
          </p>
          <p className="mt-1 font-mono text-xs text-cyan-400/90">
            Destination : {pathLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-md px-2.5 py-1 text-xs ${
              viewMode === "list"
                ? "bg-cyan-600 text-white"
                : "border border-slate-600 text-slate-300"
            }`}
            onClick={() => setViewMode("list")}
          >
            Liste
          </button>
          <button
            type="button"
            className={`rounded-md px-2.5 py-1 text-xs ${
              viewMode === "schema"
                ? "bg-cyan-600 text-white"
                : "border border-slate-600 text-slate-300"
            }`}
            onClick={() => setViewMode("schema")}
          >
            Schema
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-600"
          onClick={() => createEntry("file")}
        >
          + Fichier
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-600"
          onClick={() => createEntry("folder")}
        >
          + Dossier
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200"
          onClick={() => uploadRef.current?.click()}
          disabled={importing}
        >
          Importer fichiers
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200"
          onClick={() => folderUploadRef.current?.click()}
          disabled={importing}
        >
          Importer dossier
        </button>
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
          webkitdirectory=""
          directory=""
        />
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200"
          onClick={copySelection}
          disabled={!selectedArray.length}
        >
          Copier
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200"
          onClick={cutSelection}
          disabled={!selectedArray.length}
        >
          Couper
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200"
          onClick={pasteClipboard}
          disabled={!clipboard.ids.length}
        >
          Coller
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200"
          onClick={renameSelected}
          disabled={selectedArray.length !== 1}
        >
          Renommer
        </button>
        <button
          type="button"
          className="rounded-md border border-red-900/50 px-2.5 py-1 text-xs text-red-300"
          onClick={deleteSelected}
          disabled={!selectedArray.length}
        >
          Supprimer
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-400"
          onClick={() => setTargetParentId(null)}
        >
          Racine /
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Tous types de fichiers (max {formatMaxFileSize()} chacun) · Archives .zip : choix
        decompresser ou importer tel quel · Ctrl+C / Ctrl+X / Ctrl+V · Double-clic dossier =
        destination
      </p>
      {archivePrompt ? (
        <ArchiveImportDialog
          file={archivePrompt.file}
          path={archivePrompt.path}
          onChoose={(action) => closeArchivePrompt(action)}
          onCancel={() => closeArchivePrompt(null)}
        />
      ) : null}
      {importing ? <p className="mt-1 text-xs text-cyan-300">Import en cours...</p> : null}

      {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}

      <div
        className={`mt-3 min-h-[200px] rounded-lg border p-3 transition ${
          externalDragOver
            ? "border-cyan-500 bg-cyan-950/30"
            : "border-slate-700 bg-slate-950/60"
        } ${viewMode === "schema" ? "overflow-x-auto" : "max-h-[360px] overflow-y-auto"}`}
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
              viewMode={viewMode}
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
            />
          ))
        )}
      </div>
    </div>
  );
}
