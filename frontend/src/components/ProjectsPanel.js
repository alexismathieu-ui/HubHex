"use client";

import { useCallback, useEffect, useState } from "react";

import { TechTagPicker } from "./TechTagPicker";
import { TasksBoard } from "./TasksBoard";
import { API_BASE_URL } from "../lib/apiBaseUrl";
import { formatApiError } from "../lib/formatApiError";

const technologiesFromProject = (project) =>
  (project.technologies || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function ProjectsPanel({ token }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    selectedTechnologies: [],
    visibility: "private",
  });
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [tasksOpenForProjectId, setTasksOpenForProjectId] = useState(null);

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
        throw new Error(formatApiError(data) || "Impossible de charger les projets.");
      }
      setProjects(data.projects || []);
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

  const onCreateSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (!createForm.title.trim() || !createForm.description.trim()) {
      setMessage("Remplis le titre et la description (au moins un caractere chacun).");
      return;
    }
    try {
      const body = {
        title: createForm.title.trim(),
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
      setCreateForm({
        title: "",
        description: "",
        selectedTechnologies: [],
        visibility: "private",
      });
      setMessage("Projet cree avec succes.");
      await loadProjects();
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
      setTasksOpenForProjectId((openId) => (openId === projectId ? null : openId));
      setPendingDelete(null);
      setMessage("Projet supprime.");
      await loadProjects();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const startEdit = (project) => {
    setEditing({
      id: project.id,
      title: project.title,
      description: project.description,
      selectedTechnologies: technologiesFromProject(project),
      visibility: project.visibility,
    });
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
    setMessage("");
    try {
      const body = {
        title: editing.title.trim(),
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
      setMessage("Projet mis a jour.");
      await loadProjects();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (!token) {
    return (
      <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-xl font-semibold text-slate-200">Mes projets</h3>
        <p className="mt-2 text-sm text-slate-400">
          Connecte-toi pour creer et gerer tes projets (API securisee par token).
        </p>
      </article>
    );
  }

  return (
    <article className="relative rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-semibold text-slate-100">Mes projets</h3>
        <button
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-400"
          type="button"
          onClick={() => loadProjects()}
          disabled={loading}
        >
          {loading ? "Chargement..." : "Rafraichir"}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-400">{message}</p>

      <p className="mt-1 text-xs text-slate-500">
        <strong>Taches Kanban :</strong> apres avoir cree un projet, va dans la liste ci-dessous et clique{" "}
        <strong>Voir le Kanban</strong> sur la ligne du projet — les taches s&apos;affichent en dessous.
      </p>

      <form className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-6" onSubmit={onCreateSubmit}>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Nouveau projet</h4>
        <input
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          placeholder="Titre"
          value={createForm.title}
          onChange={(event) => setCreateForm({ ...createForm, title: event.target.value })}
          required
        />
        <textarea
          className="min-h-[88px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          placeholder="Description"
          value={createForm.description}
          onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })}
          required
        />
        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">Technologies</p>
          <TechTagPicker
            value={createForm.selectedTechnologies}
            onChange={(tags) => setCreateForm({ ...createForm, selectedTechnologies: tags })}
            hint="Choisis des tags dans la liste, filtre avec la recherche, ou ajoute une techno personnalisee."
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
          Creer le projet
        </button>
      </form>

      {editing ? (
        <form className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-6" onSubmit={onEditSubmit}>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-300">
            Modifier le projet #{editing.id}
          </h4>
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            value={editing.title}
            onChange={(event) => setEditing({ ...editing, title: event.target.value })}
            required
          />
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
              hint="Meme principe qu’a la creation : tags + recherche + ajout libre."
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

      <div className="mt-6 border-t border-slate-800 pt-6">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Liste</h4>
        {projects.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucun projet pour le moment.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="rounded-lg border border-slate-800 bg-slate-950/80 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-100">{project.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{project.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Techs: {project.technologies || "—"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-cyan-300">
                      {project.visibility === "public" ? "Public" : "Prive"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-md border border-cyan-900/50 bg-cyan-950/30 px-3 py-1.5 text-sm text-cyan-200 hover:border-cyan-600"
                      type="button"
                      onClick={() =>
                        setTasksOpenForProjectId((id) =>
                          id === project.id ? null : project.id,
                        )
                      }
                    >
                      {tasksOpenForProjectId === project.id
                        ? "Masquer le Kanban"
                        : "Voir le Kanban"}
                    </button>
                    <button
                      className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-400"
                      type="button"
                      onClick={() => startEdit(project)}
                    >
                      Modifier
                    </button>
                    <button
                      className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-sm text-red-200 hover:border-red-700"
                      type="button"
                      onClick={() => openDeleteModal(project)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                {tasksOpenForProjectId === project.id ? (
                  <TasksBoard token={token} projectId={project.id} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
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
              Supprimer le projet ?
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Es-tu sur de vouloir supprimer{" "}
              <span className="font-semibold text-slate-200">{pendingDelete.title}</span> ? Cette
              action est definitive.
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
