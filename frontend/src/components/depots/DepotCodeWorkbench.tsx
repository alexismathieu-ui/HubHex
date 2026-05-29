"use client";

import { useEffect, useRef, useState } from "react";

import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import {
  fileIconLabel,
  languageDisplayLabel,
  languageFromFileName,
  tabSizeForLanguage,
} from "../../lib/depots/editorLanguage";
import { getErrorMessage } from "../../lib/errors";
import { readApiJsonOrThrow } from "../../lib/readApiJson";
import type { EditorTab, FileContentCacheEntry } from "../../types/depot";
import type { ProjectFileNode } from "../../types/hubhex";
import { MonacoEditorPane } from "./MonacoEditorPane";

interface DepotCodeWorkbenchProps {
  token: string;
  projectId: number;
  tabs: EditorTab[];
  activeTabId: number | null;
  onActivateTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onMarkDirty?: (tabId: number, dirty: boolean) => void;
  onSaved?: () => void;
}

interface FileItemResponse {
  item: ProjectFileNode;
}

/**
 * Mini IDE type VS Code : onglets, Monaco, barre d'etat, raccourcis Ctrl+S.
 * Un seul GET reseau par fichier (cache + anti-recharge).
 */
export function DepotCodeWorkbench({
  token,
  projectId,
  tabs,
  activeTabId,
  onActivateTab,
  onCloseTab,
  onMarkDirty,
  onSaved,
}: DepotCodeWorkbenchProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const cacheRef = useRef(new Map<number, FileContentCacheEntry>());
  const failedIdsRef = useRef(new Set<number>());
  const inflightIdRef = useRef<number | null>(null);
  const onMarkDirtyRef = useRef(onMarkDirty);
  onMarkDirtyRef.current = onMarkDirty;
  const tokenRef = useRef(token);
  const projectIdRef = useRef(projectId);
  tokenRef.current = token;
  projectIdRef.current = projectId;
  const contentRef = useRef("");
  const savedContentRef = useRef("");
  const encodingRef = useRef("text");
  const prevTabRef = useRef<number | null>(null);

  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [encoding, setEncoding] = useState("text");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [wordWrap, setWordWrap] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showMinimap, setShowMinimap] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  const isDirty = content !== savedContent;
  const editorFilePath = activeTab?.path || activeTab?.name || "";
  const language = editorFilePath ? languageFromFileName(editorFilePath) : "plaintext";
  const tabSize = tabSizeForLanguage(language);
  const canEdit = encoding !== "base64" && Boolean(activeTabId);

  contentRef.current = content;
  savedContentRef.current = savedContent;
  encodingRef.current = encoding;

  const fetchFileContent = async (fileId: number) => {
    const url = `${API_BASE_URL}/projects/${projectIdRef.current}/files/${fileId}`;
    const response = await fetch(url, { headers: createAuthHeaders(tokenRef.current, false) });
    const data = await readApiJsonOrThrow<FileItemResponse>(response, url);
    return data.item;
  };

  useEffect(() => {
    const previous = prevTabRef.current;
    if (previous && previous !== activeTabId) {
      cacheRef.current.set(previous, {
        content: contentRef.current,
        savedContent: savedContentRef.current,
        encoding: encodingRef.current,
      });
    }
    prevTabRef.current = activeTabId;

    if (!activeTabId) {
      setContent("");
      setSavedContent("");
      setLoading(false);
      setLoadFailed(false);
      return;
    }

    setLoadFailed(false);

    const cached = cacheRef.current.get(activeTabId);
    if (cached) {
      setEncoding(cached.encoding);
      setContent(cached.content);
      setSavedContent(cached.savedContent);
      setLoading(false);
      onMarkDirtyRef.current?.(activeTabId, cached.content !== cached.savedContent);
      return;
    }

    if (failedIdsRef.current.has(activeTabId)) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }

    if (inflightIdRef.current === activeTabId) {
      return;
    }

    let cancelled = false;
    inflightIdRef.current = activeTabId;
    setLoading(true);
    setStatus("");

    fetchFileContent(activeTabId)
      .then((item) => {
        if (cancelled) {
          return;
        }
        const enc = item.encoding || "text";
        const text = enc === "base64" ? "" : item.content || "";
        const entry = { content: text, savedContent: text, encoding: enc };
        cacheRef.current.set(activeTabId, entry);
        failedIdsRef.current.delete(activeTabId);
        setEncoding(enc);
        setContent(text);
        setSavedContent(text);
        onMarkDirtyRef.current?.(activeTabId, false);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        failedIdsRef.current.add(activeTabId);
        setLoadFailed(true);
        setStatus(getErrorMessage(error));
        setContent("");
        setSavedContent("");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
        if (inflightIdRef.current === activeTabId) {
          inflightIdRef.current = null;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTabId, reloadNonce]);

  const handleContentChange = (next: string) => {
    setContent(next);
    if (!activeTabId) {
      return;
    }
    const dirty = next !== savedContentRef.current;
    onMarkDirtyRef.current?.(activeTabId, dirty);
    const cached = cacheRef.current.get(activeTabId);
    if (cached) {
      cacheRef.current.set(activeTabId, { ...cached, content: next });
    }
  };

  const onSave = async () => {
    if (!activeTabId || encoding === "base64") {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const url = `${API_BASE_URL}/projects/${projectId}/files/${activeTabId}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: createAuthHeaders(tokenRef.current),
        body: JSON.stringify({ content }),
      });
      await readApiJsonOrThrow(response, url);
      setSavedContent(content);
      cacheRef.current.set(activeTabId, { content, savedContent: content, encoding });
      onMarkDirtyRef.current?.(activeTabId, false);
      setStatus("Enregistre");
      onSaved?.();
      setTimeout(() => setStatus(""), 2000);
    } catch (error: unknown) {
      setStatus(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onDownload = async () => {
    if (!activeTabId) {
      return;
    }
    try {
      const url = `${API_BASE_URL}/projects/${projectId}/files/${activeTabId}/download`;
      const response = await fetch(url, { headers: createAuthHeaders(tokenRef.current, false) });
      if (!response.ok) {
        throw new Error("Telechargement impossible.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = activeTab?.name || "fichier";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error: unknown) {
      setStatus(getErrorMessage(error));
    }
  };

  const retryLoad = () => {
    if (!activeTabId) {
      return;
    }
    failedIdsRef.current.delete(activeTabId);
    cacheRef.current.delete(activeTabId);
    setLoadFailed(false);
    setStatus("");
    setReloadNonce((n) => n + 1);
  };

  const handleCloseTab = (tabId: number) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab?.dirty && !window.confirm(`Fermer « ${tab.name} » sans enregistrer ?`)) {
      return;
    }
    cacheRef.current.delete(tabId);
    failedIdsRef.current.delete(tabId);
    onCloseTab(tabId);
  };

  if (tabs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#1e1e1e] text-center">
        <p className="text-4xl opacity-30">{"</>"}</p>
        <p className="mt-4 text-sm font-medium text-slate-300">HubHex Editor</p>
        <p className="mt-2 max-w-xs text-xs text-slate-500">
          Ouvrez un fichier dans l&apos;explorateur (double-clic) ou selectionnez-le puis Editer.
        </p>
        <p className="mt-4 font-mono text-[10px] text-slate-600">
          Ctrl+S enregistrer · Coloration syntaxique · Minimap
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e1e]">
      <div className="flex shrink-0 items-end overflow-x-auto border-b border-[#252526] bg-[#252526]">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`group flex max-w-[220px] shrink-0 items-center gap-1.5 border-r border-[#1e1e1e] text-xs ${
                active ? "bg-[#1e1e1e] text-slate-100" : "bg-[#2d2d2d] text-slate-400"
              }`}
            >
              <button
                type="button"
                onClick={() => onActivateTab(tab.id)}
                className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2 hover:bg-[#323232]"
              >
                <span className="font-mono text-[10px] text-slate-500">
                  {fileIconLabel(tab.path || tab.name)}
                </span>
                <span className="truncate">{tab.name}</span>
                {tab.dirty ? <span className="text-cyan-400">●</span> : null}
              </button>
              <button
                type="button"
                className="mr-1 rounded p-0.5 opacity-60 hover:bg-slate-700 hover:opacity-100"
                aria-label={`Fermer ${tab.name}`}
                onClick={() => handleCloseTab(tab.id)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-[#252526] bg-[#252526] px-2 py-1">
        {encoding === "base64" ? (
          <button
            type="button"
            className="rounded px-2 py-0.5 text-[11px] text-slate-300 hover:bg-[#3c3c3c]"
            onClick={onDownload}
          >
            Telecharger
          </button>
        ) : (
          <button
            type="button"
            className="rounded px-2 py-0.5 text-[11px] text-slate-200 hover:bg-[#3c3c3c] disabled:opacity-40"
            onClick={onSave}
            disabled={saving || loading || !isDirty}
            title="Ctrl+S"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        )}
        {loadFailed ? (
          <button
            type="button"
            className="rounded px-2 py-0.5 text-[11px] text-amber-200 hover:bg-[#3c3c3c]"
            onClick={retryLoad}
          >
            Reessayer
          </button>
        ) : null}
        <span className="mx-1 h-4 w-px bg-[#454545]" />
        <button
          type="button"
          className={`rounded px-2 py-0.5 text-[11px] hover:bg-[#3c3c3c] ${wordWrap ? "text-cyan-300" : "text-slate-400"}`}
          onClick={() => setWordWrap((v) => !v)}
        >
          Retour ligne
        </button>
        <button
          type="button"
          className={`rounded px-2 py-0.5 text-[11px] hover:bg-[#3c3c3c] ${showMinimap ? "text-cyan-300" : "text-slate-400"}`}
          onClick={() => setShowMinimap((v) => !v)}
        >
          Minimap
        </button>
        <button
          type="button"
          className="rounded px-2 py-0.5 text-[11px] text-slate-400 hover:bg-[#3c3c3c]"
          onClick={() => setFontSize((s) => Math.min(22, s + 1))}
        >
          A+
        </button>
        <button
          type="button"
          className="rounded px-2 py-0.5 text-[11px] text-slate-400 hover:bg-[#3c3c3c]"
          onClick={() => setFontSize((s) => Math.max(11, s - 1))}
        >
          A-
        </button>
        {status ? (
          <span
            className={`ml-auto text-[11px] ${status.includes("Trop de requetes") ? "text-amber-300" : "text-emerald-400"}`}
          >
            {status}
          </span>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1">
        {loading ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#1e1e1e]/80 text-sm text-slate-400">
            Chargement...
          </div>
        ) : null}
        {!canEdit && activeTabId && !loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <p className="text-sm">Fichier binaire — previsualisation non disponible.</p>
            <button
              type="button"
              className="rounded border border-slate-600 px-3 py-1 text-xs"
              onClick={onDownload}
            >
              Telecharger le fichier
            </button>
          </div>
        ) : activeTabId ? (
          <MonacoEditorPane
            key={`${activeTabId}-${language}`}
            path={editorFilePath ? `/${editorFilePath}` : undefined}
            value={content}
            language={language}
            tabSize={tabSize}
            onChange={handleContentChange}
            onSave={onSave}
            onCursorChange={setCursor}
            wordWrap={wordWrap}
            fontSize={fontSize}
            showMinimap={showMinimap}
          />
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-4 border-t border-[#007acc] bg-[#007acc] px-3 py-0.5 text-[11px] text-white">
        <span>
          Ln {cursor.line}, Col {cursor.column}
        </span>
        <span>{languageDisplayLabel(language)}</span>
        <span>UTF-8</span>
        <span>Espaces: {tabSize}</span>
        {isDirty ? <span className="text-amber-200">Modifie</span> : <span>Enregistre</span>}
        <span className="ml-auto opacity-80">Ctrl+S</span>
      </div>
    </div>
  );
}
