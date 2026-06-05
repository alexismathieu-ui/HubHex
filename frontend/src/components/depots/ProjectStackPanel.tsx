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

const STATUS_STYLES: Record<
  StackItemStatus,
  { badge: string; border: string; glow: string; icon: string }
> = {
  planned: {
    badge: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    border: "border-amber-800/35 hover:border-amber-600/45",
    glow: "from-amber-500/5",
    icon: "◌",
  },
  learning: {
    badge: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    border: "border-sky-800/35 hover:border-sky-600/45",
    glow: "from-sky-500/5",
    icon: "◎",
  },
  using: {
    badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    border: "border-emerald-800/35 hover:border-emerald-600/45",
    glow: "from-emerald-500/5",
    icon: "●",
  },
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
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Stack vivante : technologies du projet avec lien, statut et extrait de code.
      </p>

      <form
        className="grid gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 sm:grid-cols-2"
        onSubmit={onSubmit}
      >
        <input
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Technologie (ex. PostgreSQL)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="URL doc (optionnel)"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />
        <select
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as StackItemStatus })}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Ajouter a la stack
        </button>
        <textarea
          className="min-h-[72px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs sm:col-span-2"
          placeholder="Snippet (optionnel)"
          value={form.snippet}
          onChange={(e) => setForm({ ...form, snippet: e.target.value })}
        />
      </form>

      {message ? <p className="text-sm text-red-300">{message}</p> : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const style = STATUS_STYLES[item.status] || STATUS_STYLES.using;
          return (
            <li
              key={item.id}
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-br to-slate-950/80 p-4 transition ${style.border} ${style.glow}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500" aria-hidden>
                      {style.icon}
                    </span>
                    <span className="font-display text-base font-semibold text-slate-100">
                      {item.name}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${style.badge}`}
                    >
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </div>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400 transition hover:text-cyan-300"
                    >
                      Documentation ↗
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-xs text-red-400 transition hover:text-red-300"
                  onClick={() => onDelete(item.id)}
                >
                  Supprimer
                </button>
              </div>
              {item.snippet ? (
                <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900/80 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                  {item.snippet}
                </pre>
              ) : null}
            </li>
          );
        })}
      </ul>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-500">
          Aucune technologie documentee. Ajoutez votre premiere entree de stack.
        </p>
      ) : null}
    </div>
  );
}
