"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { formatApiError } from "../../lib/formatApiError";

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

export function DashboardPanel() {
  const { token, currentUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!token) {
      setDashboard(null);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard?activityLimit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Impossible de charger le tableau de bord.");
      }
      setDashboard(data.dashboard);
    } catch (error) {
      setMessage(error.message);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = dashboard?.summary;

  return (
    <article className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-amber-200">Tableau de bord</h1>
          <p className="mt-1 text-sm text-amber-300/80">
            Bonjour {currentUser.username} — vue d&apos;ensemble de ton espace.
          </p>
        </div>
        <button
          className="rounded-lg border border-amber-700 px-3 py-1.5 text-sm text-amber-100 hover:border-amber-500"
          type="button"
          onClick={() => loadDashboard()}
          disabled={loading}
        >
          {loading ? "Chargement..." : "Rafraichir"}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-400">{message}</p>

      {summary ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Projets</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                {summary.projects.total}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {summary.projects.public} public · {summary.projects.private} prive
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">A faire</p>
              <p className="mt-1 text-2xl font-bold text-cyan-200">{summary.tasks.todo}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">En cours</p>
              <p className="mt-1 text-2xl font-bold text-amber-200">
                {summary.tasks.in_progress}
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Terminees</p>
              <p className="mt-1 text-2xl font-bold text-emerald-200">{summary.tasks.done}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Projets recents
              </h4>
              {(dashboard.recent_projects || []).length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Aucun projet pour le moment.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {dashboard.recent_projects.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/depots/${project.id}`}
                        className="block rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 hover:border-cyan-800/50"
                      >
                      <p className="font-medium text-slate-100">{project.title}</p>
                      <p className="text-xs text-slate-500">
                        {project.visibility === "public" ? "Public" : "Prive"} · maj{" "}
                        {formatDate(project.updated_at)}
                      </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Activite recente
              </h4>
              {(dashboard.recent_activity || []).length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Aucune activite recente.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {dashboard.recent_activity.map((item) => (
                    <li
                      key={`${item.type}-${item.entity_id}-${item.occurred_at}`}
                      className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2"
                    >
                      <p className="text-xs font-medium text-amber-300/90">
                        {ACTIVITY_LABELS[item.type] || item.type} ·{" "}
                        {ACTION_LABELS[item.action] || item.action}
                      </p>
                      <p className="text-sm text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.occurred_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : loading ? (
        <p className="mt-4 text-sm text-slate-500">Chargement du tableau de bord...</p>
      ) : null}
    </article>
  );
}
