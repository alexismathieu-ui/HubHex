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
import { AppButton } from "../ui/AppButton";
import { AppCard } from "../ui/AppCard";
import { PageHeader } from "../ui/PageHeader";
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
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="// mes projets"
        title="Mes depots"
        description="Chaque depot est heberge sur HubHex. Ouvre un depot pour gerer fichiers, Kanban et stack."
        actions={
          <>
            <AppButton variant="primary" onClick={() => setShowCreateForm((open) => !open)}>
              {showCreateForm ? "Fermer" : "+ Nouveau depot"}
            </AppButton>
            <AppButton variant="secondary" onClick={loadProjects} disabled={loading}>
              {loading ? "Chargement..." : "Rafraichir"}
            </AppButton>
          </>
        }
      />

      {message ? <p className="text-sm text-slate-300">{message}</p> : null}

      {showCreateForm ? (
        <AppCard highlight>
        <form
          className="flex flex-col gap-3"
          onSubmit={onCreateSubmit}
        >
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-accent">
            Nouveau depot
          </h2>
          <input
            className="hubhex-input"
            placeholder="Nom du depot"
            value={createForm.title}
            onChange={(event) => onTitleChange(event.target.value)}
            required
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Identifiant — {username ? `${username}/` : ""}
              <span className="text-accent">{createForm.slug || "mon-depot"}</span>
            </label>
            <input
              className="hubhex-input w-full"
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
            className="hubhex-input min-h-[88px]"
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
            hint="Ces badges apparaissent sur le depot et dans l'onglet Maitrise (niveau par techno)."
          />
          <select
            className="hubhex-input"
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
          <AppButton type="submit" variant="primary">
            Creer le depot
          </AppButton>
          {templates.length > 0 ? (
            <div className="mt-4 border-t border-slate-700/50 pt-4">
              <p className="text-xs font-semibold uppercase text-accent">Ou depuis un template</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  className="hubhex-input flex-1 text-sm"
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
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={onCreateFromTemplate}
                  disabled={!selectedTemplateId}
                >
                  Appliquer
                </AppButton>
              </div>
            </div>
          ) : null}
        </form>
        </AppCard>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {projects.length === 0 ? (
          <li className="col-span-full">
            <AppCard className="p-8 text-center text-sm text-slate-500">
              Aucun depot. Cree-en un pour commencer.
            </AppCard>
          </li>
        ) : (
          projects.map((project) => (
            <li key={project.id}>
              <Link href={`/depots/${project.id}`} className="block">
                <AppCard hover className="h-full">
                <p className="font-mono text-xs text-accent">
                  {depotPath(username, project.slug)}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-slate-100">{project.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{project.description}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {project.visibility === "public" ? "Public" : "Prive"}
                </p>
                </AppCard>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
