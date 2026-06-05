"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { depotPath, slugify } from "../../lib/depots/depotUtils";
import { getErrorMessage } from "../../lib/errors";
import { formatApiError } from "../../lib/formatApiError";
import { technologiesFromProject } from "../../lib/repositoryUtils";
import type { DepotFormFields } from "../../types/depot";
import type { Project, ProjectVisibility } from "../../types/hubhex";
import { DepotFileExplorer } from "./DepotFileExplorer";
import { ProjectJournalPanel } from "./ProjectJournalPanel";
import { ProjectNotesPanel } from "./ProjectNotesPanel";
import { ProjectStackPanel } from "./ProjectStackPanel";
import { TasksBoard } from "./TasksBoard";
import { AppButton } from "../ui/AppButton";
import { AppCard } from "../ui/AppCard";
import { TechTagPicker } from "./TechTagPicker";

const TABS = [
  { id: "fichiers", label: "Fichiers" },
  { id: "kanban", label: "Kanban" },
  { id: "stack", label: "Stack" },
  { id: "journal", label: "Journal" },
  { id: "notes", label: "Notes" },
  { id: "parametres", label: "Parametres" },
];

interface DepotDetailProps {
  depotId: string;
}

export function DepotDetail({ depotId }: DepotDetailProps) {
  const { token, currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("fichiers");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<DepotFormFields | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  const username = currentUser?.username ?? "";
  const projectId = Number(depotId);

  const loadProject = useCallback(async () => {
    if (!token || !Number.isInteger(projectId)) {
      setProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: createAuthHeaders(token, false),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Impossible de charger le depot.");
      }
      const found = ((data.projects || []) as Project[]).find((item) => item.id === projectId);
      if (!found) {
        throw new Error("Depot introuvable.");
      }
      setProject(found);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [token, projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const startEdit = () => {
    if (!project) {
      return;
    }
    setEditForm({
      title: project.title,
      slug: project.slug || "",
      slugTouched: true,
      description: project.description,
      selectedTechnologies: technologiesFromProject(project),
      visibility: project.visibility,
    });
    setEditing(true);
    setActiveTab("parametres");
  };

  const onEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm || !project) {
      return;
    }
    const slug = slugify(editForm.slug || editForm.title);
    if (!slug) {
      setMessage("Identifiant invalide.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
        method: "PUT",
        headers: createAuthHeaders(token),
        body: JSON.stringify({
          title: editForm.title.trim(),
          slug,
          description: editForm.description.trim(),
          technologies: editForm.selectedTechnologies,
          visibility: editForm.visibility,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur de mise a jour.");
      }
      setEditing(false);
      setEditForm(null);
      setMessage("Depot mis a jour.");
      await loadProject();
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!project) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
        method: "DELETE",
        headers: createAuthHeaders(token, false),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur de suppression.");
      }
      window.location.href = "/depots";
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
      setPendingDelete(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500">Chargement du depot...</p>;
  }

  if (!project) {
    return (
      <AppCard className="p-8 text-center">
        <p className="text-slate-400">{message || "Depot introuvable."}</p>
        <Link href="/depots" className="mt-4 inline-block text-sm text-accent hover:text-accent-soft">
          Retour aux depots
        </Link>
      </AppCard>
    );
  }

  const path = depotPath(username, project.slug);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/depots" className="text-sm text-slate-500 transition-colors hover:text-accent">
        ← Mes depots
      </Link>

      <AppCard highlight>
        <p className="font-mono text-sm text-accent">{path}</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-slate-50">{project.title}</h1>
        <p className="mt-2 text-sm text-slate-400">{project.description}</p>
        {technologiesFromProject(project).length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {technologiesFromProject(project).map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300"
              >
                {tech}
              </span>
            ))}
          </div>
        ) : null}
      </AppCard>

      {message ? <p className="text-sm text-slate-300">{message}</p> : null}

      <div className="flex flex-wrap gap-2 border-b border-slate-700/50 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-display transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-[color:var(--hubhex-accent-muted)] font-medium text-accent"
                : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <AppButton type="button" variant="ghost" onClick={startEdit} className="ml-auto px-3 py-1.5">
          Modifier
        </AppButton>
        <AppButton type="button" variant="danger" onClick={() => setPendingDelete(true)} className="px-3 py-1.5">
          Supprimer
        </AppButton>
      </div>

      <div>
        {activeTab === "fichiers" ? (
          <AppCard className="overflow-hidden p-2 sm:p-4">
            <p className="mb-2 px-2 font-mono text-xs text-slate-600">hubhex://{path}</p>
            <DepotFileExplorer token={token} projectId={project.id} />
          </AppCard>
        ) : null}

        {activeTab === "kanban" ? (
          <section>
            <TasksBoard token={token} projectId={project.id} />
          </section>
        ) : null}

        {activeTab === "stack" ? (
          <AppCard>
            <ProjectStackPanel token={token} projectId={project.id} />
          </AppCard>
        ) : null}

        {activeTab === "journal" ? (
          <AppCard>
            <ProjectJournalPanel token={token} projectId={project.id} />
          </AppCard>
        ) : null}

        {activeTab === "notes" ? (
          <AppCard>
            <ProjectNotesPanel token={token} projectId={project.id} />
          </AppCard>
        ) : null}

        {activeTab === "parametres" && editing && editForm ? (
          <AppCard highlight>
          <form
            className="flex max-w-xl flex-col gap-3"
            onSubmit={onEditSubmit}
          >
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-accent">
              Parametres du depot
            </h2>
            <input
              className="hubhex-input"
              value={editForm.title}
              onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
              required
            />
            <input
              className="hubhex-input font-mono text-sm"
              value={editForm.slug}
              onChange={(event) => setEditForm({ ...editForm, slug: event.target.value })}
            />
            <textarea
              className="hubhex-input min-h-[88px]"
              value={editForm.description}
              onChange={(event) =>
                setEditForm({ ...editForm, description: event.target.value })
              }
              required
            />
            <TechTagPicker
              value={editForm.selectedTechnologies}
              onChange={(tags: string[]) => setEditForm({ ...editForm, selectedTechnologies: tags })}
            />
            <select
              className="hubhex-input"
              value={editForm.visibility}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  visibility: event.target.value as ProjectVisibility,
                })
              }
            >
              <option value="private">Prive</option>
              <option value="public">Public</option>
            </select>
            <div className="flex gap-2">
              <AppButton type="submit" variant="primary">
                Enregistrer
              </AppButton>
              <AppButton
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setEditForm(null);
                }}
              >
                Annuler
              </AppButton>
            </div>
          </form>
          </AppCard>
        ) : activeTab === "parametres" ? (
          <p className="text-sm text-slate-500">
            Clique sur « Modifier » pour changer le titre, l&apos;identifiant ou la visibilite.
          </p>
        ) : null}
      </div>

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPendingDelete(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Supprimer le depot ?</h2>
            <p className="mt-2 text-sm text-slate-400">Action definitive pour « {project.title} ».</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm"
                onClick={() => setPendingDelete(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={confirmDelete}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
