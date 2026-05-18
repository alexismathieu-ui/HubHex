"use client";

import { emptyRepositoryDraft } from "../lib/repositoryUtils";

export function ProjectRepositoriesField({ value, onChange, hint }) {
  const repos = value.length ? value : [emptyRepositoryDraft()];

  const updateAt = (index, patch) => {
    const next = repos.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const addRow = () => {
    if (repos.length >= 15) {
      return;
    }
    onChange([...repos, emptyRepositoryDraft()]);
  };

  const removeAt = (index) => {
    const next = repos.filter((_, i) => i !== index);
    onChange(next.length ? next : [emptyRepositoryDraft()]);
  };

  const filledCount = repos.filter((repo) => repo.url.trim()).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-300">Depots lies</p>
        <span className="text-xs text-slate-500">
          {filledCount} / 15 — GitHub, GitLab, Bitbucket ou URL HTTPS
        </span>
      </div>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      <ul className="flex flex-col gap-2">
        {repos.map((repo, index) => (
          <li
            key={`repo-field-${index}`}
            className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 sm:grid-cols-[1fr_1.4fr_auto]"
          >
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Libelle (ex. API, front)"
              value={repo.label}
              onChange={(event) => updateAt(index, { label: event.target.value })}
            />
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="https://github.com/user/repo"
              value={repo.url}
              onChange={(event) => updateAt(index, { url: event.target.value })}
            />
            <button
              className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:border-red-800 hover:text-red-300 disabled:opacity-40"
              type="button"
              onClick={() => removeAt(index)}
              disabled={repos.length === 1 && !repo.url.trim() && !repo.label.trim()}
              aria-label="Retirer ce depot"
            >
              Retirer
            </button>
          </li>
        ))}
      </ul>
      <button
        className="self-start rounded-lg border border-dashed border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-cyan-600 hover:text-cyan-200 disabled:opacity-40"
        type="button"
        onClick={addRow}
        disabled={repos.length >= 15}
      >
        + Ajouter un depot
      </button>
    </div>
  );
}
