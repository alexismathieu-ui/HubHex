"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useTheme } from "../../context/ThemeContext";
import { applyThemeToElement } from "../../lib/theme/theme";

import {
  buildTreeConnectors,
  connectorPath,
  depthLineColor,
  getRootNodesVerticalMidY,
  getSchemaCanvasSize,
  isDescendantInTree,
  layoutHorizontalForest,
  SCHEMA_NODE_H,
  SCHEMA_NODE_W,
  SCHEMA_ROOT_BOX_H,
  SCHEMA_ROOT_BOX_W,
  SCHEMA_ROOT_HUB_X,
  SCHEMA_ROOT_LEFT,
  SCHEMA_ROOT_RIGHT,
  type TreeLayoutNode,
} from "../../lib/depots/fileTreeLayout";
import { findNodeById, idsMatch } from "../../lib/depots/fileTreeUtils";
import type { ProjectFileListItem } from "../../types/depot";

const MODAL_CLOSE_MS = 240;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.65;
const ZOOM_STEP = 0.12;

interface FileTreeSchemaModalProps {
  open: boolean;
  onClose: () => void;
  tree: ProjectFileListItem[];
  selectedIds: Set<number>;
  onSelect: (event: React.MouseEvent, node: ProjectFileListItem) => void;
  onMove: (ids: number[], targetParentId: number | null) => Promise<void>;
  onOpenFile?: (node: ProjectFileListItem) => void;
  statusMessage?: string;
}

function nodeIcon(node: ProjectFileListItem): string {
  if (node.kind === "folder") {
    return "📁";
  }
  if (node.encoding === "base64") {
    return "🖼";
  }
  return "📄";
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

function SchemaNodeCard({
  entry,
  isSelected,
  isDragOver,
  isDragging,
  onSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenFile,
}: {
  entry: TreeLayoutNode;
  isSelected: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  onSelect: (event: React.MouseEvent, node: ProjectFileListItem) => void;
  onDragStart: (event: React.DragEvent, node: ProjectFileListItem) => void;
  onDragOver: (event: React.DragEvent, folderId: number | null) => void;
  onDragLeave: (folderId: number | null) => void;
  onDrop: (event: React.DragEvent, folderId: number | null) => void;
  onOpenFile?: (node: ProjectFileListItem) => void;
}) {
  const { node, x, y } = entry;
  const isFolder = node.kind === "folder";

  return (
    <div
      className="absolute"
      style={{ left: x, top: y, width: SCHEMA_NODE_W, height: SCHEMA_NODE_H }}
    >
      <div
        draggable
        onDragStart={(event) => onDragStart(event, node)}
        onDragOver={(event) => {
          if (isFolder) {
            onDragOver(event, node.id);
          }
        }}
        onDragLeave={() => onDragLeave(isFolder ? node.id : null)}
        onDrop={(event) => {
          if (isFolder) {
            onDrop(event, node.id);
          }
        }}
        onDoubleClick={() => {
          if (node.kind === "file") {
            onOpenFile?.(node);
          }
        }}
        className={`flex h-full flex-col items-center justify-center rounded-xl border px-2 py-2 text-center shadow-lg transition-all duration-200 ${
          isDragging
            ? "scale-95 opacity-50"
            : isDragOver
              ? "border-cyan-400 bg-cyan-950/50 shadow-cyan-500/25 ring-2 ring-cyan-400/60"
              : isSelected
                ? "border-cyan-600/70 bg-cyan-950/35 shadow-cyan-900/30"
                : "border-slate-600/60 bg-slate-900/90 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-900 hover:shadow-xl"
        }`}
        role="treeitem"
        aria-selected={isSelected}
      >
        <button
          type="button"
          className="flex min-w-0 flex-col items-center gap-1"
          onClick={(event) => onSelect(event, node)}
        >
          <span className="text-2xl leading-none" aria-hidden>
            {nodeIcon(node)}
          </span>
          <span className="line-clamp-2 w-full font-display text-xs font-semibold text-slate-100">
            {node.name}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">
            {isFolder ? "dossier" : "fichier"}
          </span>
        </button>
      </div>
    </div>
  );
}

export function FileTreeSchemaModal({
  open,
  onClose,
  tree,
  selectedIds,
  onSelect,
  onMove,
  onOpenFile,
  statusMessage,
}: FileTreeSchemaModalProps) {
  const { theme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(open);
  const [draggedIds, setDraggedIds] = useState<number[]>([]);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [zoom, setZoom] = useState(1);

  const layout = useMemo(() => layoutHorizontalForest(tree), [tree]);
  const connectors = useMemo(() => buildTreeConnectors(layout), [layout]);
  const canvasSize = useMemo(() => getSchemaCanvasSize(layout), [layout]);
  const rootNodes = useMemo(() => layout.filter((entry) => entry.depth === 0), [layout]);
  const rootMidY = useMemo(() => getRootNodesVerticalMidY(rootNodes), [rootNodes]);
  const scaledWidth = canvasSize.width * zoom;
  const scaledHeight = canvasSize.height * zoom;
  const rootBoxTop = rootMidY - SCHEMA_ROOT_BOX_H / 2;

  const closeModal = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
      setZoom(1);
      onClose();
    }, MODAL_CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
    } else if (!closing) {
      setMounted(false);
    }
  }, [open, closing]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closing) {
        closeModal();
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        setZoom((value) => clampZoom(value + ZOOM_STEP));
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "-") {
        event.preventDefault();
        setZoom((value) => clampZoom(value - ZOOM_STEP));
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "0") {
        event.preventDefault();
        setZoom(1);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, closing, closeModal]);

  useEffect(() => {
    if (mounted && panelRef.current) {
      applyThemeToElement(panelRef.current, theme);
    }
  }, [mounted, theme]);

  const canDropOn = useCallback(
    (targetParentId: number | null): boolean => {
      if (!draggedIds.length) {
        return false;
      }
      for (const draggedId of draggedIds) {
        if (idsMatch(draggedId, targetParentId)) {
          return false;
        }
        const dragged = findNodeById(tree, draggedId);
        if (!dragged) {
          return false;
        }
        if (
          dragged.kind === "folder" &&
          targetParentId != null &&
          isDescendantInTree(tree, draggedId, targetParentId)
        ) {
          return false;
        }
      }
      return true;
    },
    [draggedIds, tree],
  );

  const onDragStart = (event: React.DragEvent, node: ProjectFileListItem) => {
    const ids =
      selectedIds.has(node.id) && selectedIds.size > 1 ? [...selectedIds] : [node.id];
    setDraggedIds(ids);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", ids.join(","));
  };

  const onDragOver = (event: React.DragEvent, folderId: number | null) => {
    if (!canDropOn(folderId)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (folderId == null) {
      setRootDragOver(true);
      setDragOverId(null);
    } else {
      setDragOverId(folderId);
      setRootDragOver(false);
    }
  };

  const onDragLeave = (folderId: number | null) => {
    if (folderId == null) {
      setRootDragOver(false);
    } else {
      setDragOverId((current) => (current === folderId ? null : current));
    }
  };

  const onDrop = async (event: React.DragEvent, folderId: number | null) => {
    event.preventDefault();
    event.stopPropagation();
    if (!draggedIds.length || !canDropOn(folderId)) {
      return;
    }
    const ids = [...draggedIds];
    setDraggedIds([]);
    setDragOverId(null);
    setRootDragOver(false);
    await onMove(ids, folderId);
  };

  const onWheelZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }
    event.preventDefault();
    setZoom((value) => clampZoom(value + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
  };

  const modal =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div
            className={`hubhex-modal-backdrop${closing ? " hubhex-modal-backdrop--closing" : ""} fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md sm:p-5`}
            role="presentation"
            onClick={closing ? undefined : closeModal}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="file-schema-title"
              className={`hubhex-modal-panel hubhex-app-theme${closing ? " hubhex-modal-panel--closing" : ""} flex max-h-[min(94vh,920px)] w-full max-w-[min(96vw,1280px)] flex-col overflow-hidden rounded-2xl border border-slate-600/50 bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl`}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 px-5 py-4 sm:px-6">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-cyan-400/90">// schema</p>
                  <h2 id="file-schema-title" className="font-display text-xl font-semibold text-slate-50">
                    Arborescence du depot
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Glissez un ou plusieurs elements · Ctrl+molette pour zoomer
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg border border-slate-600/70 bg-slate-950/60 p-1">
                    <button
                      type="button"
                      className="rounded-md px-2.5 py-1 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                      onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
                      aria-label="Dezoomer"
                    >
                      −
                    </button>
                    <span className="min-w-[3.5rem] text-center font-mono text-xs text-cyan-300">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      className="rounded-md px-2.5 py-1 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                      onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
                      aria-label="Zoomer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                      onClick={() => setZoom(1)}
                    >
                      Reset
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-600/50 hover:text-cyan-200"
                  >
                    Fermer
                  </button>
                </div>
              </header>

              {statusMessage ? (
                <p className="border-b border-slate-800/80 px-5 py-2 text-sm text-slate-300 sm:px-6">
                  {statusMessage}
                </p>
              ) : null}

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-auto p-4 sm:p-6"
                onWheel={onWheelZoom}
              >
                {tree.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">
                    Depot vide. Ajoutez des fichiers depuis la vue liste.
                  </p>
                ) : (
                  <div style={{ width: scaledWidth, height: scaledHeight }}>
                    <div
                      className="relative origin-top-left"
                      style={{
                        width: canvasSize.width,
                        height: canvasSize.height,
                        transform: `scale(${zoom})`,
                      }}
                    >
                      <svg
                        className="pointer-events-none absolute inset-0"
                        width={canvasSize.width}
                        height={canvasSize.height}
                        aria-hidden
                      >
                        {rootNodes.length > 0 ? (
                          <g aria-hidden>
                            {(() => {
                              const centers = rootNodes.map((entry) => entry.y + SCHEMA_NODE_H / 2);
                              const minY = Math.min(...centers);
                              const maxY = Math.max(...centers);
                              const hubY = rootMidY;
                              const color = depthLineColor(0);
                              return (
                                <>
                                  <path
                                    d={`M ${SCHEMA_ROOT_RIGHT} ${hubY} L ${SCHEMA_ROOT_HUB_X} ${hubY}`}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth={2}
                                    opacity={0.85}
                                  />
                                  <path
                                    d={`M ${SCHEMA_ROOT_HUB_X} ${minY} L ${SCHEMA_ROOT_HUB_X} ${maxY}`}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth={2}
                                    opacity={0.85}
                                  />
                                  {rootNodes.map((entry) => {
                                    const childY = entry.y + SCHEMA_NODE_H / 2;
                                    return (
                                      <path
                                        key={`root-${entry.node.id}`}
                                        d={`M ${SCHEMA_ROOT_HUB_X} ${childY} L ${entry.x} ${childY}`}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={2}
                                        opacity={0.85}
                                      />
                                    );
                                  })}
                                  <circle cx={SCHEMA_ROOT_HUB_X} cy={hubY} r={4} fill={color} />
                                </>
                              );
                            })()}
                          </g>
                        ) : null}
                        {connectors.map((connector) => {
                          const hubX = connector.parentX + 32;
                          const color = depthLineColor(connector.depth);
                          return (
                            <g key={`${connector.parentId}-${connector.childId}`}>
                              <path
                                d={connectorPath(connector)}
                                fill="none"
                                stroke={color}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.85}
                              />
                              <circle cx={hubX} cy={connector.parentY} r={4} fill={color} opacity={0.95} />
                            </g>
                          );
                        })}
                      </svg>

                      <div
                        className={`absolute flex flex-col items-center justify-center rounded-xl border border-dashed px-2 text-center transition-all duration-200 ${
                          rootDragOver
                            ? "border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20"
                            : "border-slate-600/70 bg-slate-950/50 hover:border-slate-500"
                        }`}
                        style={{
                          left: SCHEMA_ROOT_LEFT,
                          top: rootBoxTop,
                          width: SCHEMA_ROOT_BOX_W,
                          height: SCHEMA_ROOT_BOX_H,
                        }}
                        onDragOver={(event) => onDragOver(event, null)}
                        onDragLeave={() => onDragLeave(null)}
                        onDrop={(event) => onDrop(event, null)}
                      >
                        <span className="text-xl" aria-hidden>
                          🏠
                        </span>
                        <span className="mt-1 font-display text-xs font-semibold text-slate-200">Racine</span>
                        <span className="font-mono text-[10px] text-slate-500">/</span>
                      </div>

                      {layout.map((entry) => (
                        <SchemaNodeCard
                          key={entry.node.id}
                          entry={entry}
                          isSelected={selectedIds.has(entry.node.id)}
                          isDragOver={dragOverId != null && idsMatch(dragOverId, entry.node.id)}
                          isDragging={draggedIds.some((id) => idsMatch(id, entry.node.id))}
                          onSelect={onSelect}
                          onDragStart={onDragStart}
                          onDragOver={onDragOver}
                          onDragLeave={onDragLeave}
                          onDrop={onDrop}
                          onOpenFile={onOpenFile}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <footer className="border-t border-slate-800/80 px-5 py-2 text-xs text-slate-500 sm:px-6">
                {selectedIds.size > 0 ? (
                  <span className="text-cyan-400/90">{selectedIds.size} element(s) selectionne(s)</span>
                ) : (
                  <span>Selectionnez plusieurs elements (Ctrl+clic) puis glissez-les ensemble</span>
                )}
              </footer>
            </div>
          </div>,
          document.body,
        )
      : null;

  return modal;
}
