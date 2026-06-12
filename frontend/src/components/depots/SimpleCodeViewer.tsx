"use client";

import { languageDisplayLabel } from "../../lib/depots/editorLanguage";

interface SimpleCodeViewerProps {
  content: string;
  language: string;
  filePath?: string;
}

/**
 * Apercu lecture seule du code — utilise sur mobile a la place de Monaco
 * (workers CDN lourds / instables sur petit ecran).
 */
export function SimpleCodeViewer({ content, language, filePath }: SimpleCodeViewerProps) {
  const lines = content ? content.split("\n").length : 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e1e]">
      <div className="shrink-0 border-b border-[#252526] px-3 py-2">
        <p className="font-mono text-xs text-slate-400">
          {languageDisplayLabel(language)}
          {lines > 0 ? ` · ${lines} ligne${lines > 1 ? "s" : ""}` : null}
        </p>
        {filePath ? (
          <p className="mt-0.5 truncate font-mono text-[11px] text-cyan-400/80">{filePath}</p>
        ) : null}
      </div>
      <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[13px] leading-relaxed text-slate-200">
        {content || "(fichier vide)"}
      </pre>
      <p className="shrink-0 border-t border-[#252526] px-3 py-1.5 text-[10px] text-slate-500">
        Apercu mobile (lecture seule) — edition complete sur ordinateur
      </p>
    </div>
  );
}
