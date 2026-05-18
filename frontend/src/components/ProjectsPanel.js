"use client";

import { useCallback, useEffect, useState } from "react";

import { DepotFileExplorer } from "./DepotFileExplorer";
import { TechTagPicker } from "./TechTagPicker";
import { TasksBoard } from "./TasksBoard";
import { API_BASE_URL } from "../lib/apiBaseUrl";
import { depotPath, slugify, technologiesFromProject } from "../lib/depotUtils";
import { formatApiError } from "../lib/formatApiError";

const emptyCreateForm = () => ({
  title: "",
  slug: "",
  slugTouched: false,
  description: "",
  selectedTechnologies: [],
  visibility: "private",
});

export function ProjectsPanel({ token, currentUser }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [kanbanOpen, setKanbanOpen] = useState(false);

  const username = currentUser?.username ?? "";

  const authHeaders = (json = true) => {
    const headers = { Authorization: `Bearer ${token}` };
    if (json) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  const loadProjects = useCallback(async () => {
    if (!token) {
      setProjects([]);
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
        throw new Error(formatApiError(data) || "Impossible de charger les depots.");
      }
      const list = data.projects || [];
      setProjects(list);
      setSelectedId((current) => {
        if (list.length === 0) {
          return null;
        }
        if (current && list.some((project) => project.id === current)) {
          return current;
        }
        return list[0].id;
      });
    } catch (error) {
      setMessage(error.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!pendingDelete) {
      return undefined;
    }
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setPendingDelete(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingDelete]);

  const selectedProject = projects.find((project) => project.id === selectedId) ?? null;

  const selectProject = (projectId) => {
    setSelectedId(projectId);
    setEditing(null);
    setShowCreateForm(false);
    setKanbanOpen(false);
    setMessage("");
  };

  const onTitleChange = (formSetter, form, title) => {
    const next = { ...form, title };
    if (!form.slugTouched) {
      next.slug = slugify(title);
    }
    formSetter(next);
  };

  const onCreateSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (!createForm.title.trim() || !createForm.description.trim()) {
      setMessage("Remplis le titre et la description.");
      return;
    }
    const slug = slugify(createForm.slug || createForm.title);
    if (!slug) {
      setMessage("Identifiant du depot invalide.");
      return;
    }
    try {
      const body = {
        title: createForm.title.trim(),
        slug,
        description: createForm.description.trim(),
        technologies: createForm.selectedTechnologies,
        visibility: createForm.visibility,
      };
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur lors de la creation.");
      }
      setCreateForm(emptyCreateForm());
      setShowCreateForm(false);
      setMessage(`Depot cree : ${depotPath(username, data.project?.slug)}`);
      await loadProjects();
      if (data.project?.id) {
        setSelectedId(data.project.id);
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const openDeleteModal = (project) => {
    setPendingDelete({ id: project.id, title: project.title });
  };

  const closeDeleteModal = () => {
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    const projectId = pendingDelete.id;
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "DELETE",
        headers: authHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur lors de la suppression.");
      }
      if (editing?.id === projectId) {
        setEditing(null);
      }
      setPendingDelete(null);
      setMessage("Depot supprime.");
      await loadProjects();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const startEdit = (project) => {
    setEditing({
      id: project.id,
      title: project.title,
      slug: project.slug || "",
      slugTouched: true,
      description: project.description,
      selectedTechnologies: technologiesFromProject(project),
      visibility: project.visibility,
    });
    setShowCreateForm(false);
    setKanbanOpen(false);
    setMessage("");
  };

  const onEditSubmit = async (event) => {
    event.preventDefault();
    if (!editing) {
      return;
    }
    if (!editing.title.trim() || !editing.description.trim()) {
      setMessage("Titre et description ne peuvent pas etre vides.");
      return;
    }
    const slug = slugify(editing.slug || editing.title);
    if (!slug) {
      setMessage("Identifiant du depot invalide.");
      return;
    }
    setMessage("");
    try {
      const body = {
        title: editing.title.trim(),
        slug,
        description: editing.description.trim(),
        technologies: editing.selectedTechnologies,
        visibility: editing.visibility,
      };
      const response = await fetch(`${API_BASE_URL}/projects/${editing.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur lors de la mise a jour.");
      }
      setEditing(null);
      setMessage("Depot mis a jour.");
      await loadProjects();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (!token) {
    return (
      <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-xl font-semibold text-slate-200">Mes depots</h3>
        <p className="mt-2 text-sm text-slate-400">
          Connecte-toi pour creer des depots heberges sur HubHex.
        </p>
      </article>
    );
  }

  return (
    <article className="relative rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-100">Mes depots</h3>
          <p className="mt-1 text-sm text-slate-400">
            Chaque depot est heberge sur HubHex (comme un repo GitHub), avec Kanban, technos et
            visibilite. Base pour l&apos;outil de dev a venir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-cyan-800/50 bg-cyan-950/40 px-3 py-1.5 text-sm font-medium text-cyan-200 hover:border-cyan-600"
            type="button"
            onClick={() => {
              setShowCreateForm((open) => !open);
              setEditing(null);
            }}
          >
            {showCreateForm ? "Fermer" : "+ Nouveau depot"}
          </button>
          <button
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-400"
            type="button"
            onClick={() => loadProjects()}
            disabled={loading}
          >
            {loading ? "Chargement..." : "Rafraichir"}
          </button>
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-slate-300">{message}</p> : null}

      {showCreateForm ? (
        <form
          className="mt-6 flex flex-col gap-3 rounded-xl border border-cyan-900/40 bg-slate-950/50 p-4"
          onSubmit={onCreateSubmit}
        >
          <h4 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Nouveau depot sur HubHex
          </h4>
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Nom du depot (ex. Mon API REST)"
            value={createForm.title}
            onChange={(event) => onTitleChange(setCreateForm, createForm, event.target.value)}
            required
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Identifiant — {username ? `${username}/` : ""}
              <span className="text-cyan-300">{createForm.slug || "mon-depot"}</span>
            </label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
              placeholder="mon-depot"
              value={createForm.slug}
              onChange={(event) =>
                setCreateForm({
                  ...createForm,
                  slug: event.target.value,
                  slugTouched: true,
                })
              }
            />
          </div>
          <textarea
            className="min-h-[88px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Description du depot"
            value={createForm.description}
            onChange={(event) =>
              setCreateForm({ ...createForm, description: event.target.value })
            }
            required
          />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Technologies</p>
            <TechTagPicker
              value={createForm.selectedTechnologies}
              onChange={(tags) => setCreateForm({ ...createForm, selectedTechnologies: tags })}
            />
          </div>
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            value={createForm.visibility}
            onChange={(event) => setCreateForm({ ...createForm, visibility: event.target.value })}
          >
            <option value="private">Prive</option>
            <option value="public">Public</option>
          </select>
          <button
            className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
            type="submit"
          >
            Creer le depot
          </button>
        </form>
      ) : null}

      {editing ? (
        <form
          className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-900/40 bg-slate-950/50 p-4"
          onSubmit={onEditSubmit}
        >
          <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-300">
            Modifier {depotPath(username, editing.slug)}
          </h4>
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            value={editing.title}
            onChange={(event) => onTitleChange(setEditing, editing, event.target.value)}
            required
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Identifiant</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
              value={editing.slug}
              onChange={(event) =>
                setEditing({ ...editing, slug: event.target.value, slugTouched: true })
              }
            />
          </div>
          <textarea
            className="min-h-[88px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            value={editing.description}
            onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            required
          />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Technologies</p>
            <TechTagPicker
              value={editing.selectedTechnologies}
              onChange={(tags) => setEditing({ ...editing, selectedTechnologies: tags })}
            />
          </div>
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            value={editing.visibility}
            onChange={(event) => setEditing({ ...editing, visibility: event.target.value })}
          >
            <option value="private">Prive</option>
            <option value="public">Public</option>
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-300"
              type="submit"
            >
              Enregistrer
            </button>
            <button
              className="rounded-lg border border-slate-600 px-4 py-2 text-slate-200 hover:border-slate-400"
              type="button"
              onClick={() => setEditing(null)}
            >
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,260px)_1fr]">
        <aside className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/60">
          <p className="border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tes depots HubHex
          </p>
          {projects.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">Aucun depot. Cree-en un pour commencer.</p>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto p-2">
              {projects.map((project) => {
                const path = depotPath(username, project.slug);
                const isActive = project.id === selectedId;
                return (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => selectProject(project.id)}
                      className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left transition ${
                        isActive
                          ? "border border-cyan-800/60 bg-cyan-950/40"
                          : "border border-transparent hover:bg-slate-900"
                      }`}
                    >
                      <span className="block truncate font-mono text-xs text-cyan-400/90">
                        {path || project.title}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-medium text-slate-100">
                        {project.title}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">
                        {project.visibility === "public" ? "Public" : "Prive"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          {!selectedProject ? (
            <p className="text-sm text-slate-500">
              Selectionne un depot ou cree-en un nouveau sur HubHex.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-cyan-300">
                    {depotPath(username, selectedProject.slug)}
                  </p>
                  <h4 className="mt-1 text-2xl font-semibold text-slate-100">
                    {selectedProject.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Heberge sur HubHex ·{" "}
                    {selectedProject.visibility === "public" ? "Public" : "Prive"}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {selectedProject.description}
                  </p>
                  {technologiesFromProject(selectedProject).length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {technologiesFromProject(selectedProject).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    className="rounded-md border border-cyan-900/50 bg-cyan-950/30 px-3 py-1.5 text-sm text-cyan-200 hover:border-cyan-600"
                    type="button"
                    onClick={() => setKanbanOpen((open) => !open)}
                  >
                    {kanbanOpen ? "Masquer le Kanban" : "Kanban"}
                  </button>
                  <button
                    className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-400"
                    type="button"
                    onClick={() => startEdit(selectedProject)}
                  >
                    Modifier
                  </button>
                  <button
                    className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-sm text-red-200 hover:border-red-700"
                    type="button"
                    onClick={() => openDeleteModal(selectedProject)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/50 p-4">
                <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Espace de travail — fichiers
                </h5>
                <p className="mt-1 font-mono text-xs text-slate-600">
                  hubhex://{depotPath(username, selectedProject.slug)}
                </p>
                <DepotFileExplorer token={token} projectId={selectedProject.id} />
              </div>

              {kanbanOpen ? (
                <div className="mt-6 border-t border-slate-800 pt-6">
                  <TasksBoard token={token} projectId={selectedProject.id} />
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-project-title"
          onClick={closeDeleteModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-project-title" className="text-lg font-semibold text-slate-100">
              Supprimer le depot ?
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Supprimer{" "}
              <span className="font-semibold text-slate-200">{pendingDelete.title}</span> ? Action
              definitive.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-400"
                type="button"
                onClick={closeDeleteModal}
              >
                Annuler
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                type="button"
                onClick={confirmDelete}
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
