"use client";

import { useMemo, useState } from "react";

import { TECH_TAGS } from "../../data/techTags";

export function TechTagPicker({ value, onChange, hint }) {
  const [search, setSearch] = useState("");
  const [custom, setCustom] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return TECH_TAGS;
    }
    return TECH_TAGS.filter((tag) => tag.toLowerCase().includes(q));
  }, [search]);

  const toggle = (tag) => {
    if (value.includes(tag)) {
      onChange(value.filter((item) => item !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  const remove = (tag) => {
    onChange(value.filter((item) => item !== tag));
  };

  const addCustom = () => {
    const label = custom.trim();
    if (!label || value.includes(label)) {
      return;
    }
    onChange([...value, label]);
    setCustom("");
  };

  return (
    <div className="flex flex-col gap-3">
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Filtrer les tags..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          type="search"
          aria-label="Filtrer les technologies"
        />
        <div className="flex gap-2">
          <input
            className="min-w-[140px] flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Autre techno..."
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
            aria-label="Ajouter une techno personnalisee"
          />
          <button
            className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:border-slate-400"
            type="button"
            onClick={addCustom}
          >
            Ajouter
          </button>
        </div>
      </div>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-md border border-slate-800 bg-slate-950/60 p-3">
          <span className="w-full text-xs font-medium uppercase tracking-wide text-slate-500">
            Selection ({value.length})
          </span>
          {value.map((tag) => (
            <button
              key={tag}
              className="rounded-full border border-cyan-800/60 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-100 hover:border-cyan-500"
              type="button"
              onClick={() => remove(tag)}
              title="Retirer"
            >
              {tag} ×
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Aucune techno selectionnee.</p>
      )}

      <div
        className="max-h-56 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/40 p-2"
        role="listbox"
        aria-label="Liste des technologies"
      >
        <div className="flex flex-wrap gap-2">
          {filtered.map((tag) => {
            const active = value.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                role="option"
                aria-selected={active}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  active
                    ? "border-cyan-500 bg-cyan-500/20 text-cyan-100"
                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                }`}
                onClick={() => toggle(tag)}
              >
                {tag}
              </button>
            );
          })}
        </div>
        {filtered.length === 0 ? (
          <p className="p-2 text-center text-xs text-slate-500">Aucun tag ne correspond.</p>
        ) : null}
      </div>
    </div>
  );
}
