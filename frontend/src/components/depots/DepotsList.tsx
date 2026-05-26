"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { depotPath, slugify } from "../../lib/depots/depotUtils";
import { getErrorMessage } from "../../lib/errors";
import { formatApiError } from "../../lib/formatApiError";
import type { DepotFormFields } from "../../types/depot";
import type { Project, ProjectTemplate, ProjectVisibility } from "../../types/hubhex";
import { TechTagPicker } from "./TechTagPicker";

const emptyCreateForm = (): DepotFormFields => ({
  title: "",
  slug: "",
  slugTouched: false,
  description: "",
  selectedTechnologies: [],
  visibility: "private",
});

export function DepotsList() {
  const { token, currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createForm, setCreateForm] = useState<DepotFormFields>(emptyCreateForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const username = currentUser?.username ?? "";

  const loadProjects = useCallback(async () => {
    if (!token) {
      setProjects([]);
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
        throw new Error(formatApiError(data) || "Impossible de charger les depots.");
      }
      setProjects(data.projects || []);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!token) {
      return;
    }
    fetch(`${API_BASE_URL}/templates`, { headers: createAuthHeaders(token, false) })
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => setTemplates([]));
  }, [token]);

  const onCreateFromTemplate = async () => {
    if (!selectedTemplateId) {
      return;
    }
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/templates/apply`, {
        method: "POST",
        headers: createAuthHeaders(token),
        body: JSON.stringify({
          templateId: Number(selectedTemplateId),
          title: createForm.title.trim() || undefined,
          description: createForm.description.trim() || undefined,
          visibility: createForm.visibility,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur template.");
      }
      setMessage(`Depot cree depuis template : ${depotPath(username, data.project?.slug)}`);
      setSelectedTemplateId("");
      await loadProjects();
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  };

  const onTitleChange = (title: string) => {
    const next = { ...createForm, title };
    if (!createForm.slugTouched) {
      next.slug = slugify(title);
    }
    setCreateForm(next);
  };

  const onCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: createAuthHeaders(token),
        body: JSON.stringify({
          title: createForm.title.trim(),
          slug,
          description: createForm.description.trim(),
          technologies: createForm.selectedTechnologies,
          visibility: createForm.visibility,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur lors de la creation.");
      }
      setCreateForm(emptyCreateForm());
      setShowCreateForm(false);
      setMessage(`Depot cree : ${depotPath(username, data.project?.slug)}`);
      await loadProjects();
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mes depots</h1>
          <p className="mt-1 text-sm text-slate-400">
            Chaque depot est heberge sur HubHex. Ouvre un depot pour gerer fichiers et Kanban.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-cyan-800/50 bg-cyan-950/40 px-3 py-1.5 text-sm font-medium text-cyan-200 hover:border-cyan-600"
            onClick={() => setShowCreateForm((open) => !open)}
          >
            {showCreateForm ? "Fermer" : "+ Nouveau depot"}
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-400"
            onClick={loadProjects}
            disabled={loading}
          >
            {loading ? "Chargement..." : "Rafraichir"}
          </button>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-slate-300">{message}</p> : null}

      {showCreateForm ? (
        <form
          className="mt-6 flex flex-col gap-3 rounded-xl border border-cyan-900/40 bg-slate-900/60 p-4"
          onSubmit={onCreateSubmit}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Nouveau depot
          </h2>
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Nom du depot"
            value={createForm.title}
            onChange={(event) => onTitleChange(event.target.value)}
            required
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Identifiant — {username ? `${username}/` : ""}
              <span className="text-cyan-300">{createForm.slug || "mon-depot"}</span>
            </label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
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
            placeholder="Description"
            value={createForm.description}
            onChange={(event) =>
              setCreateForm({ ...createForm, description: event.target.value })
            }
            required
          />
          <TechTagPicker
            value={createForm.selectedTechnologies}
            onChange={(tags: string[]) =>
              setCreateForm({ ...createForm, selectedTechnologies: tags })
            }
          />
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            value={createForm.visibility}
            onChange={(event) =>
              setCreateForm({
                ...createForm,
                visibility: event.target.value as ProjectVisibility,
              })
            }
          >
            <option value="private">Prive</option>
            <option value="public">Public</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Creer le depot
          </button>
          {templates.length > 0 ? (
            <div className="mt-4 border-t border-slate-700 pt-4">
              <p className="text-xs font-semibold uppercase text-violet-300">Ou depuis un template</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">Choisir un template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.is_system ? " (systeme)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded-lg border border-violet-600 px-4 py-2 text-sm text-violet-200 hover:bg-violet-950"
                  onClick={onCreateFromTemplate}
                  disabled={!selectedTemplateId}
                >
                  Appliquer
                </button>
              </div>
            </div>
          ) : null}
        </form>
      ) : null}

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {projects.length === 0 ? (
          <li className="col-span-full rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-500">
            Aucun depot. Cree-en un pour commencer.
          </li>
        ) : (
          projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/depots/${project.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-cyan-800/60 hover:bg-slate-900"
              >
                <p className="font-mono text-xs text-cyan-400/90">
                  {depotPath(username, project.slug)}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{project.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{project.description}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {project.visibility === "public" ? "Public" : "Prive"}
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
