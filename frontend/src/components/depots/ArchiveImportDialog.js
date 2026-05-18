"use client";

import { isZipFileName } from "../../lib/depots/archiveImportUtils";

export function ArchiveImportDialog({ file, path, onChoose, onCancel }) {
  if (!file) {
    return null;
  }

  const canExtract = isZipFileName(file.name);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-import-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="archive-import-title" className="text-base font-semibold text-slate-100">
          Fichier compresse detecte
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          <span className="font-mono text-cyan-300">{file.name}</span>
          {path !== file.name ? (
            <span className="mt-1 block font-mono text-xs text-slate-500">{path}</span>
          ) : null}
        </p>
        <p className="mt-3 text-sm text-slate-300">Comment souhaitez-vous l&apos;importer ?</p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className="rounded-lg bg-cyan-600 px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
            disabled={!canExtract}
            onClick={() => onChoose("extract")}
          >
            Decompresser dans un dossier du meme nom
            {!canExtract ? (
              <span className="mt-1 block text-xs font-normal text-cyan-100/80">
                Disponible uniquement pour les fichiers .zip
              </span>
            ) : (
              <span className="mt-1 block text-xs font-normal text-cyan-100/80">
                Le contenu sera extrait dans l&apos;arborescence
              </span>
            )}
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-600 px-4 py-2.5 text-left text-sm text-slate-200 hover:border-cyan-600"
            onClick={() => onChoose("keep")}
          >
            Importer l&apos;archive telle quelle
            <span className="mt-1 block text-xs text-slate-500">
              Le fichier reste compresse sans extraction
            </span>
          </button>
          <button
            type="button"
            className="mt-1 rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-slate-300"
            onClick={onCancel}
          >
            Annuler cet import
          </button>
        </div>
      </div>
    </div>
  );
}
