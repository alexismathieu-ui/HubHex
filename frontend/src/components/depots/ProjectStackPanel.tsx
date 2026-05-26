"use client";

import { useCallback, useEffect, useState } from "react";

import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { formatApiError } from "../../lib/formatApiError";
import type { StackItem, StackItemStatus } from "../../types/hubhex";

const STATUS_LABELS: Record<StackItemStatus, string> = {
  planned: "Prevu",
  learning: "En apprentissage",
  using: "En production",
};

interface StackFormState {
  name: string;
  url: string;
  status: StackItemStatus;
  snippet: string;
}

interface ProjectStackPanelProps {
  token: string;
  projectId: number;
}

export function ProjectStackPanel({ token, projectId }: ProjectStackPanelProps) {
  const [items, setItems] = useState<StackItem[]>([]);
  const [form, setForm] = useState<StackFormState>({
    name: "",
    url: "",
    status: "using",
    snippet: "",
  });
  const [message, setMessage] = useState("");

  const baseUrl = `${API_BASE_URL}/projects/${projectId}/stack`;

  const load = useCallback(async () => {
    const response = await fetch(baseUrl, { headers: createAuthHeaders(token, false) });
    const data = await response.json();
    if (response.ok) {
      setItems((data.items || []) as StackItem[]);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(formatApiError(data) || "Erreur.");
      return;
    }
    setForm({ name: "", url: "", status: "using", snippet: "" });
    await load();
  };

  const onDelete = async (id: number) => {
    await fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
      headers: createAuthHeaders(token, false),
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Stack vivante : technologies du projet avec lien, statut et extrait de code.
      </p>
      <form className="grid gap-2 rounded-lg border border-slate-800 p-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <input
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Technologie (ex. PostgreSQL)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="URL doc (optionnel)"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />
        <select
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as StackItemStatus })}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white">
          Ajouter
        </button>
        <textarea
          className="min-h-[72px] rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs sm:col-span-2"
          placeholder="Snippet (optionnel)"
          value={form.snippet}
          onChange={(e) => setForm({ ...form, snippet: e.target.value })}
        />
      </form>
      {message ? <p className="text-sm text-red-300">{message}</p> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-emerald-900/40 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="font-semibold text-emerald-200">{item.name}</span>
                <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {STATUS_LABELS[item.status] || item.status}
                </span>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-xs text-cyan-400 hover:underline"
                  >
                    Documentation
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                className="text-xs text-red-400"
                onClick={() => onDelete(item.id)}
              >
                Supprimer
              </button>
            </div>
            {item.snippet ? (
              <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-2 font-mono text-xs text-slate-300">
                {item.snippet}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
