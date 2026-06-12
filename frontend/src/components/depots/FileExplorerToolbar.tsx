"use client";

import { useEffect, useRef, useState } from "react";

interface FileExplorerToolbarProps {
  importing: boolean;
  hasSelection: boolean;
  selectionCount: number;
  canPaste: boolean;
  canEdit: boolean;
  maxFileSizeLabel: string;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onImportFiles: () => void;
  onImportFolder: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onEdit: () => void;
  onRename: () => void;
  onDelete: () => void;
  onGoRoot: () => void;
}

export function FileExplorerToolbar({
  importing,
  hasSelection,
  selectionCount,
  canPaste,
  canEdit,
  maxFileSizeLabel,
  onCreateFile,
  onCreateFolder,
  onImportFiles,
  onImportFolder,
  onCopy,
  onCut,
  onPaste,
  onEdit,
  onRename,
  onDelete,
  onGoRoot,
}: FileExplorerToolbarProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const itemClass =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div ref={rootRef} className="relative px-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-600/80 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-600/50 hover:text-cyan-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>Actions du depot</span>
        <span className="text-slate-500" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-3 right-3 top-full z-30 mt-1 max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-slate-600/60 bg-slate-900/95 p-2 shadow-xl shadow-black/40 backdrop-blur-md"
        >
          <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
            Creer
          </p>
          <button type="button" role="menuitem" className={itemClass} onClick={() => { onCreateFile(); setOpen(false); }}>
            + Nouveau fichier
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={() => { onCreateFolder(); setOpen(false); }}>
            + Nouveau dossier
          </button>

          <p className="mt-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
            Importer
          </p>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={importing}
            onClick={() => { onImportFiles(); setOpen(false); }}
          >
            Importer des fichiers
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={importing}
            onClick={() => { onImportFolder(); setOpen(false); }}
          >
            Importer un dossier
          </button>

          <p className="mt-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
            Presse-papiers
            {hasSelection ? (
              <span className="ml-1 text-cyan-500">({selectionCount})</span>
            ) : null}
          </p>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={!hasSelection}
            onClick={() => { onCopy(); setOpen(false); }}
          >
            Copier
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={!hasSelection}
            onClick={() => { onCut(); setOpen(false); }}
          >
            Couper
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={!canPaste}
            onClick={() => { onPaste(); setOpen(false); }}
          >
            Coller
          </button>

          <p className="mt-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
            Edition
          </p>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={!canEdit}
            onClick={() => { onEdit(); setOpen(false); }}
          >
            Editer le fichier
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={selectionCount !== 1}
            onClick={() => { onRename(); setOpen(false); }}
          >
            Renommer
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${itemClass} text-red-300 hover:bg-red-950/40`}
            disabled={!hasSelection}
            onClick={() => { onDelete(); setOpen(false); }}
          >
            Supprimer
          </button>

          <p className="mt-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
            Destination
          </p>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => { onGoRoot(); setOpen(false); }}
          >
            Racine /
          </button>

          <p className="mt-2 border-t border-slate-800 px-2 pt-2 text-[10px] leading-relaxed text-slate-500">
            Max {maxFileSizeLabel} par fichier · Ctrl+C / Ctrl+X / Ctrl+V
          </p>
        </div>
      ) : null}
    </div>
  );
}
