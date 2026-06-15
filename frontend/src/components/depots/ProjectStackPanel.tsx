"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { formatApiError } from "../../lib/formatApiError";
import type { StackItem, StackItemStatus } from "../../types/hubhex";

const STATUS_LABELS: Record<StackItemStatus, string> = {
  planned: "A venir",
  learning: "En cours",
  using: "Maitrisee",
};

const STATUS_HINTS: Record<StackItemStatus, string> = {
  planned: "Techno prevue mais pas encore utilisee sur ce depot.",
  learning: "Techno en cours d'apprentissage ou d'integration.",
  using: "Techno deja utilisee concretement dans le projet.",
};

const STATUS_STYLES: Record<
  StackItemStatus,
  { badge: string; border: string; glow: string }
> = {
  planned: {
    badge: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    border: "border-amber-800/35",
    glow: "from-amber-500/5",
  },
  learning: {
    badge: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    border: "border-sky-800/35",
    glow: "from-sky-500/5",
  },
  using: {
    badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    border: "border-emerald-800/35",
    glow: "from-emerald-500/5",
  },
};

interface ProjectStackPanelProps {
  token: string;
  projectId: number;
  technologies: string[];
  onManageTechnologies?: () => void;
}

interface DraftState {
  status: StackItemStatus;
  url: string;
  snippet: string;
}

export function ProjectStackPanel({
  token,
  projectId,
  technologies,
  onManageTechnologies,
}: ProjectStackPanelProps) {
  const [items, setItems] = useState<StackItem[]>([]);
  const [drafts, setDrafts] = useState<Record<number, DraftState>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const baseUrl = `${API_BASE_URL}/projects/${projectId}/stack`;

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const syncResponse = await fetch(`${baseUrl}/sync`, {
        method: "POST",
        headers: createAuthHeaders(token),
        body: JSON.stringify({}),
      });
      const syncData = await syncResponse.json();
      if (!syncResponse.ok) {
        throw new Error(formatApiError(syncData) || "Synchronisation impossible.");
      }
      const synced = (syncData.items || []) as StackItem[];
      setItems(synced);
      setDrafts(
        Object.fromEntries(
          synced.map((item) => [
            item.id,
            { status: item.status, url: item.url || "", snippet: item.snippet || "" },
          ]),
        ),
      );
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    load();
  }, [load, technologies.join("|")]);

  const orderedItems = useMemo(() => {
    const byName = new Map(items.map((item) => [item.name.toLowerCase(), item]));
    const ordered: StackItem[] = [];
    for (const name of technologies) {
      const item = byName.get(name.toLowerCase());
      if (item) {
        ordered.push(item);
      }
    }
    for (const item of items) {
      if (!ordered.some((entry) => entry.id === item.id)) {
        ordered.push(item);
      }
    }
    return ordered;
  }, [items, technologies]);

  const onSave = async (item: StackItem) => {
    const draft = drafts[item.id];
    if (!draft) {
      return;
    }
    setSavingId(item.id);
    setMessage("");
    try {
      const response = await fetch(`${baseUrl}/${item.id}`, {
        method: "PUT",
        headers: createAuthHeaders(token),
        body: JSON.stringify({
          name: item.name,
          url: draft.url,
          status: draft.status,
          snippet: draft.snippet,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur a l'enregistrement.");
      }
      const saved = data.item as StackItem;
      setItems((prev) => prev.map((entry) => (entry.id === saved.id ? saved : entry)));
      setMessage(`« ${item.name} » enregistre.`);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Erreur.");
    } finally {
      setSavingId(null);
    }
  };

  const updateDraft = (id: number, patch: Partial<DraftState>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement des technologies...</p>;
  }

  if (technologies.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/30 px-4 py-8 text-center">
        <p className="text-sm text-slate-400">Aucune technologie sur ce depot.</p>
        <p className="mt-2 text-xs text-slate-500">
          Ajoutez d&apos;abord des badges (React, PostgreSQL…) dans les parametres du depot.
        </p>
        {onManageTechnologies ? (
          <button
            type="button"
            className="mt-4 rounded-lg border border-cyan-600/50 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-950/40"
            onClick={onManageTechnologies}
          >
            Modifier les technologies
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">
        <p className="font-medium text-slate-200">Niveau de maitrise par technologie</p>
        <p className="mt-1 leading-relaxed">
          Meme liste que les badges du depot : indiquez pour chaque techno si elle est a venir, en
          cours ou maitrisee. Lien doc et note optionnels — utile pour la soutenance et le graphe
          HubHex.
        </p>
        {onManageTechnologies ? (
          <button
            type="button"
            className="mt-3 text-xs text-cyan-400 transition hover:text-cyan-300"
            onClick={onManageTechnologies}
          >
            Ajouter ou retirer une technologie →
          </button>
        ) : null}
      </div>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

      <ul className="space-y-4">
        {orderedItems.map((item) => {
          const draft = drafts[item.id];
          if (!draft) {
            return null;
          }
          const style = STATUS_STYLES[draft.status] || STATUS_STYLES.learning;
          const dirty =
            draft.status !== item.status ||
            draft.url !== (item.url || "") ||
            draft.snippet !== (item.snippet || "");

          return (
            <li
              key={item.id}
              className={`rounded-xl border bg-gradient-to-br to-slate-950/80 p-4 ${style.border} ${style.glow}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-base font-semibold text-slate-100">{item.name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${style.badge}`}
                >
                  {STATUS_LABELS[draft.status]}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-slate-500">
                  Niveau sur ce projet
                  <select
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft(item.id, { status: event.target.value as StackItemStatus })
                    }
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-600">{STATUS_HINTS[draft.status]}</span>
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-500">
                  Lien documentation (optionnel)
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                    placeholder="https://..."
                    value={draft.url}
                    onChange={(event) => updateDraft(item.id, { url: event.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
                  Note ou extrait (optionnel)
                  <textarea
                    className="min-h-[72px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200"
                    placeholder="Ex. requete SQL, commande npm, rappel personnel..."
                    value={draft.snippet}
                    onChange={(event) => updateDraft(item.id, { snippet: event.target.value })}
                  />
                </label>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!dirty || savingId === item.id}
                  onClick={() => onSave(item)}
                >
                  {savingId === item.id ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
