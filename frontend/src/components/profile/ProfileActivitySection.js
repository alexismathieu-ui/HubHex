"use client";

import Link from "next/link";

const ACTIVITY_LABELS = {
  project: "Projet",
  task: "Tache",
  comment: "Commentaire",
};

const ACTION_LABELS = {
  updated: "mis a jour",
  received: "recu",
};

function formatDate(iso) {
  if (!iso) {
    return "";
  }
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ProfileActivitySection({ activity }) {
  const items = activity || [];

  return (
    <section className="rounded-xl border border-violet-800/60 bg-violet-950/30 p-5">
      <h2 className="text-lg font-semibold text-violet-200">Activite recente</h2>
      <p className="mt-1 text-sm text-slate-400">
        Dernieres actions sur tes depots, taches et commentaires recus.
      </p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Aucune activite pour le moment.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={`${item.type}-${item.entity_id}-${item.occurred_at}`}
              className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2"
            >
              <p className="text-xs font-medium text-violet-300/90">
                {ACTIVITY_LABELS[item.type] || item.type} ·{" "}
                {ACTION_LABELS[item.action] || item.action}
              </p>
              <p className="text-sm text-slate-200">{item.label}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{formatDate(item.occurred_at)}</span>
                {item.project_id ? (
                  <Link
                    href={`/depots/${item.project_id}`}
                    className="text-violet-400 hover:text-violet-300"
                  >
                    Voir le depot
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
