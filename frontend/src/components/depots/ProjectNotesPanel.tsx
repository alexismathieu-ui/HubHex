"use client";

import { useCallback, useEffect, useState } from "react";

import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { formatApiError } from "../../lib/formatApiError";
import type { TechnicalNote } from "../../types/hubhex";

interface ProjectNotesPanelProps {
  token: string;
  projectId: number;
}

function formatNoteDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ProjectNotesPanel({ token, projectId }: ProjectNotesPanelProps) {
  const [notes, setNotes] = useState<TechnicalNote[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const baseUrl = `${API_BASE_URL}/projects/${projectId}/notes`;

  const load = useCallback(async () => {
    const response = await fetch(baseUrl, {
      headers: createAuthHeaders(token, false),
    });
    const data = await response.json();
    if (response.ok) {
      setNotes((data.notes || []) as TechnicalNote[]);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }
    setMessage("");
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ title: title.trim(), content: content.trim() }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(formatApiError(data) || "Erreur.");
      return;
    }
    setTitle("");
    setContent("");
    await load();
  };

  const onDelete = async (id: number) => {
    const response = await fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
      headers: createAuthHeaders(token, false),
    });
    if (response.ok) {
      await load();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Notes techniques separees de la description du depot (specifications, API, decisions rapides).
      </p>
      <form
        className="flex flex-col gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4"
        onSubmit={onCreate}
      >
        <input
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Titre de la note"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="min-h-[100px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Contenu (Markdown accepte)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          type="submit"
          className="self-start rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          Ajouter une note
        </button>
      </form>
      {message ? <p className="text-sm text-red-300">{message}</p> : null}
      <ul className="space-y-3">
        {notes.map((note) => (
          <li
            key={note.id}
            className="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 transition hover:border-violet-700/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-semibold text-slate-100">{note.title}</h3>
                <time
                  dateTime={note.created_at}
                  className="mt-1 block font-mono text-[11px] text-slate-500"
                >
                  {formatNoteDate(note.created_at)}
                </time>
              </div>
              <button
                type="button"
                className="text-xs text-red-400 transition hover:text-red-300"
                onClick={() => onDelete(note.id)}
              >
                Supprimer
              </button>
            </div>
            {note.content ? (
              <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 font-mono text-xs text-slate-400">
                {note.content}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
      {notes.length === 0 ? <p className="text-sm text-slate-500">Aucune note pour l&apos;instant.</p> : null}
    </div>
  );
}
