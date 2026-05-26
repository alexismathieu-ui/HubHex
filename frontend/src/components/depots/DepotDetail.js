"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { depotPath, slugify, technologiesFromProject } from "../../lib/depots/depotUtils";
import { formatApiError } from "../../lib/formatApiError";
import { DepotFileExplorer } from "./DepotFileExplorer";
import { ProjectJournalPanel } from "./ProjectJournalPanel";
import { ProjectNotesPanel } from "./ProjectNotesPanel";
import { ProjectStackPanel } from "./ProjectStackPanel";
import { TasksBoard } from "./TasksBoard";
import { TechTagPicker } from "./TechTagPicker";

const TABS = [
  { id: "fichiers", label: "Fichiers" },
  { id: "kanban", label: "Kanban" },
  { id: "stack", label: "Stack" },
  { id: "journal", label: "Journal" },
  { id: "notes", label: "Notes" },
  { id: "parametres", label: "Parametres" },
];

export function DepotDetail({ depotId }) {
  const { token, currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("fichiers");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  const username = currentUser?.username ?? "";
  const projectId = Number(depotId);

  const authHeaders = (json = true) => {
    const headers = { Authorization: `Bearer ${token}` };
    if (json) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

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
        headers: authHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Impossible de charger le depot.");
      }
      const found = (data.projects || []).find((item) => item.id === projectId);
      if (!found) {
        throw new Error("Depot introuvable.");
      }
      setProject(found);
    } catch (error) {
      setMessage(error.message);
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

  const onEditSubmit = async (event) => {
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
        headers: authHeaders(),
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
    } catch (error) {
      setMessage(error.message);
    }
  };

  const confirmDelete = async () => {
    if (!project) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
        method: "DELETE",
        headers: authHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur de suppression.");
      }
      window.location.href = "/depots";
    } catch (error) {
      setMessage(error.message);
      setPendingDelete(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500">Chargement du depot...</p>;
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p className="text-slate-400">{message || "Depot introuvable."}</p>
        <Link href="/depots" className="mt-4 inline-block text-sm text-cyan-400 hover:text-cyan-300">
          Retour aux depots
        </Link>
      </div>
    );
  }

  const path = depotPath(username, project.slug);

  return (
    <div>
      <Link href="/depots" className="text-sm text-slate-500 hover:text-cyan-400">
        ← Mes depots
      </Link>

      <header className="mt-4 border-b border-slate-800 pb-4">
        <p className="font-mono text-sm text-cyan-300">{path}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-100">{project.title}</h1>
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
      </header>

      {message ? <p className="mt-3 text-sm text-slate-300">{message}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              activeTab === tab.id
                ? "bg-cyan-600 font-medium text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={startEdit}
          className="ml-auto rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-400"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={() => setPendingDelete(true)}
          className="rounded-md border border-red-900/60 px-3 py-1.5 text-sm text-red-300 hover:border-red-700"
        >
          Supprimer
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "fichiers" ? (
          <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 p-2 sm:p-4">
            <p className="mb-2 px-2 font-mono text-xs text-slate-600">hubhex://{path}</p>
            <DepotFileExplorer token={token} projectId={project.id} />
          </section>
        ) : null}

        {activeTab === "kanban" ? (
          <section>
            <TasksBoard token={token} projectId={project.id} />
          </section>
        ) : null}

        {activeTab === "stack" ? (
          <section className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <ProjectStackPanel token={token} projectId={project.id} />
          </section>
        ) : null}

        {activeTab === "journal" ? (
          <section className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <ProjectJournalPanel token={token} projectId={project.id} />
          </section>
        ) : null}

        {activeTab === "notes" ? (
          <section className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <ProjectNotesPanel token={token} projectId={project.id} />
          </section>
        ) : null}

        {activeTab === "parametres" && editing && editForm ? (
          <form
            className="flex max-w-xl flex-col gap-3 rounded-xl border border-amber-900/40 bg-slate-900/60 p-4"
            onSubmit={onEditSubmit}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-300">
              Parametres du depot
            </h2>
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              value={editForm.title}
              onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
              required
            />
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
              value={editForm.slug}
              onChange={(event) => setEditForm({ ...editForm, slug: event.target.value })}
            />
            <textarea
              className="min-h-[88px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              value={editForm.description}
              onChange={(event) =>
                setEditForm({ ...editForm, description: event.target.value })
              }
              required
            />
            <TechTagPicker
              value={editForm.selectedTechnologies}
              onChange={(tags) => setEditForm({ ...editForm, selectedTechnologies: tags })}
            />
            <select
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              value={editForm.visibility}
              onChange={(event) =>
                setEditForm({ ...editForm, visibility: event.target.value })
              }
            >
              <option value="private">Prive</option>
              <option value="public">Public</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950"
              >
                Enregistrer
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-600 px-4 py-2 text-slate-200"
                onClick={() => {
                  setEditing(false);
                  setEditForm(null);
                }}
              >
                Annuler
              </button>
            </div>
          </form>
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
