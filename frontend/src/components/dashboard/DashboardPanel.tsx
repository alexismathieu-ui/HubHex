"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { getDisplayName } from "../../lib/auth/userDisplay";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { getErrorMessage } from "../../lib/errors";
import { formatApiError } from "../../lib/formatApiError";
import type { DashboardActivity, DashboardData } from "../../types/hubhex";
import { AppButton } from "../ui/AppButton";
import { AppCard } from "../ui/AppCard";
import { PageHeader } from "../ui/PageHeader";
import { StatCard } from "../ui/StatCard";

const ACTIVITY_LABELS: Record<string, string> = {
  project: "Projet",
  task: "Tache",
  comment: "Commentaire",
};

const ACTION_LABELS: Record<string, string> = {
  updated: "mis a jour",
  received: "recu",
};

function formatDate(iso: string | undefined): string {
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
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
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
        headers: createAuthHeaders(token, false),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Impossible de charger le tableau de bord.");
      }
      setDashboard(data.dashboard as DashboardData);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
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
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="// espace personnel"
        title="Tableau de bord"
        description={`Bonjour ${getDisplayName(currentUser)} — vue d'ensemble de tes depots, taches et activite.`}
        actions={
          <AppButton variant="secondary" onClick={() => loadDashboard()} disabled={loading}>
            {loading ? "Chargement..." : "Rafraichir"}
          </AppButton>
        }
      />

      {message ? <p className="text-sm text-rose-300">{message}</p> : null}

      {summary && dashboard ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Projets"
              value={summary.projects.total}
              hint={`${summary.projects.public} public · ${summary.projects.private} prive`}
            />
            <StatCard label="A faire" value={summary.tasks.todo} accent />
            <StatCard label="En cours" value={summary.tasks.in_progress} />
            <StatCard label="Terminees" value={summary.tasks.done} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AppCard>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">
                Projets recents
              </h2>
              {(dashboard.recent_projects || []).length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Aucun projet pour le moment.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {dashboard.recent_projects.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/depots/${project.id}`}
                        className="block rounded-lg border border-slate-700/50 bg-slate-950/70 px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--hubhex-accent-border)] hover:bg-slate-900/80"
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
            </AppCard>

            <AppCard>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">
                Activite recente
              </h2>
              {(dashboard.recent_activity || []).length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Aucune activite recente.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {dashboard.recent_activity.map((item: DashboardActivity) => (
                    <li
                      key={`${item.type}-${item.entity_id}-${item.occurred_at}`}
                      className="rounded-lg border border-slate-700/50 bg-slate-950/70 px-3 py-2"
                    >
                      <p className="text-xs font-medium text-accent">
                        {ACTIVITY_LABELS[item.type] || item.type} ·{" "}
                        {ACTION_LABELS[item.action] || item.action}
                      </p>
                      <p className="text-sm text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.occurred_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>
          </div>
        </>
      ) : loading ? (
        <AppCard>
          <p className="text-sm text-slate-500">Chargement du tableau de bord...</p>
        </AppCard>
      ) : null}
    </div>
  );
}
