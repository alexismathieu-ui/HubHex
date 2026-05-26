"use client";

import { useCallback, useEffect, useState } from "react";

import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { formatApiError } from "../../lib/formatApiError";
import { getDisplayName } from "../../lib/auth/userDisplay";

export function ProjectJournalPanel({ token, projectId }) {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const baseUrl = `${API_BASE_URL}/projects/${projectId}/journal`;

  const load = useCallback(async () => {
    const response = await fetch(baseUrl, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (response.ok) {
      setEntries(data.entries || []);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: title.trim(), content: content.trim() }),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(formatApiError(data) || "Erreur.");
      return;
    }
    setTitle("");
    setContent("");
    await load();
  };

  const onDelete = async (id) => {
    await fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Journal de decisions : historique date des choix techniques sur ce depot.
      </p>
      <form className="flex flex-col gap-2 rounded-lg border border-slate-800 p-4" onSubmit={onSubmit}>
        <input
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Titre (ex. Choix de la BDD)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="min-h-[100px] rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Decision et justification"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit" className="self-start rounded bg-amber-600 px-4 py-2 text-sm font-medium text-slate-950">
          Ajouter une entree
        </button>
      </form>
      <ol className="relative space-y-4 border-l border-amber-900/50 pl-6">
        {entries.map((entry) => (
          <li key={entry.id} className="relative">
            <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-amber-500" />
            <p className="text-xs text-slate-500">
              {new Date(entry.created_at).toLocaleString("fr-FR")} —{" "}
              {getDisplayName({ username: entry.username, display_name: entry.display_name })}
            </p>
            <h3 className="font-semibold text-slate-100">{entry.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{entry.content}</p>
            <button
              type="button"
              className="mt-2 text-xs text-red-400"
              onClick={() => onDelete(entry.id)}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ol>
      {entries.length === 0 ? <p className="text-sm text-slate-500">Journal vide.</p> : null}
    </div>
  );
}
