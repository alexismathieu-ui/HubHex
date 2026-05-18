"use client";

import {
  parseRepositoryPath,
  providerMeta,
  repositoryDisplayName,
} from "../lib/repositoryUtils";

export function ProjectRepoList({ repositories, compact = false }) {
  if (!repositories?.length) {
    return (
      <p className="text-xs text-slate-500">
        Aucun depot lie. Ajoute des liens GitHub, GitLab ou Bitbucket.
      </p>
    );
  }

  return (
    <ul className={`flex flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
      {repositories.map((repo) => {
        const meta = providerMeta(repo.provider);
        const name = repositoryDisplayName(repo);
        const path = parseRepositoryPath(repo.url);
        return (
          <li key={repo.id ?? repo.url}>
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/80 transition hover:border-cyan-800/60 hover:bg-slate-900 ${
                compact ? "px-3 py-2" : "px-4 py-3"
              }`}
            >
              <span
                className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badgeClass}`}
              >
                {meta.label}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-100 group-hover:text-cyan-200">
                  {name}
                </span>
                {path !== name ? (
                  <span className="block truncate text-xs text-slate-500">{path}</span>
                ) : (
                  <span className="block truncate text-xs text-slate-500">{repo.url}</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-slate-500 group-hover:text-cyan-300">
                Ouvrir
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
