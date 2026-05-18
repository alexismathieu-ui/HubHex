"use client";

import { useCallback, useEffect, useState } from "react";

import { API_BASE_URL } from "../lib/apiBaseUrl";
import { formatApiError } from "../lib/formatApiError";

export function CommunityPanel({ token, currentUser }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [commentsByProject, setCommentsByProject] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [newComment, setNewComment] = useState({});

  const authHeaders = (json = true) => {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (json) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/community/projects`, {
        headers: authHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Impossible de charger les projets publics.");
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

  const loadComments = async (projectId) => {
    setCommentsLoading((prev) => ({ ...prev, [projectId]: true }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/community/projects/${projectId}/comments`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Impossible de charger les commentaires.");
      }
      setCommentsByProject((prev) => ({ ...prev, [projectId]: data.comments || [] }));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const toggleProject = async (projectId) => {
    if (expandedId === projectId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(projectId);
    if (!commentsByProject[projectId]) {
      await loadComments(projectId);
    }
  };

  const onCommentSubmit = async (event, projectId) => {
    event.preventDefault();
    if (!token) {
      setMessage("Connecte-toi pour commenter un projet public.");
      return;
    }
    const content = (newComment[projectId] || "").trim();
    if (!content) {
      return;
    }
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/community/projects/${projectId}/comments`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ content }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur lors de l'envoi du commentaire.");
      }
      setNewComment((prev) => ({ ...prev, [projectId]: "" }));
      await loadComments(projectId);
      setMessage("Commentaire publie.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteComment = async (projectId, commentId) => {
    if (!token) {
      return;
    }
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/community/projects/${projectId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: authHeaders(false),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur lors de la suppression.");
      }
      await loadComments(projectId);
      setMessage("Commentaire supprime.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const canDeleteComment = (project, comment) => {
    if (!currentUser) {
      return false;
    }
    return (
      comment.user_id === currentUser.id || project.author_id === currentUser.id
    );
  };

  return (
    <article className="rounded-xl border border-sky-800/60 bg-sky-950/25 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-sky-200">Communaute</h3>
          <p className="mt-1 text-sm text-sky-300/80">
            Decouvre les projets publics et echange via les commentaires.
          </p>
        </div>
        <button
          className="rounded-lg border border-sky-700 px-3 py-1.5 text-sm text-sky-100 hover:border-sky-500"
          type="button"
          onClick={() => loadProjects()}
          disabled={loading}
        >
          {loading ? "Chargement..." : "Rafraichir"}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-400">{message}</p>

      {!token ? (
        <p className="mt-3 text-sm text-amber-200/90">
          Tu peux parcourir les projets publics sans compte. Connecte-toi pour commenter.
        </p>
      ) : null}

      {projects.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Aucun projet public pour le moment. Passe un de tes projets en visibilite « Public ».
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded-lg border border-slate-800 bg-slate-950/80 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-100">{project.title}</p>
                  <p className="mt-1 text-xs text-sky-300">
                    Par {project.author_username}
                    {project.is_mine ? " (ton projet)" : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{project.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Techs: {project.technologies || "—"}
                  </p>
                </div>
                <button
                  className="rounded-md border border-sky-800/50 bg-sky-950/40 px-3 py-1.5 text-sm text-sky-200 hover:border-sky-600"
                  type="button"
                  onClick={() => toggleProject(project.id)}
                >
                  {expandedId === project.id ? "Masquer" : "Voir & commenter"}
                </button>
              </div>

              {expandedId === project.id ? (
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Commentaires
                  </h4>

                  {commentsLoading[project.id] ? (
                    <p className="mt-2 text-sm text-slate-500">Chargement des commentaires...</p>
                  ) : (commentsByProject[project.id] || []).length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">Aucun commentaire pour l&apos;instant.</p>
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {(commentsByProject[project.id] || []).map((comment) => (
                        <li
                          key={comment.id}
                          className="rounded-md border border-slate-800 bg-slate-900/80 px-3 py-2"
                        >
                          <p className="text-xs font-medium text-sky-300">
                            {comment.author_username}
                          </p>
                          <p className="mt-1 text-sm text-slate-200">{comment.content}</p>
                          {canDeleteComment(project, comment) ? (
                            <button
                              className="mt-2 text-xs text-red-300 hover:text-red-200"
                              type="button"
                              onClick={() => deleteComment(project.id, comment.id)}
                            >
                              Supprimer
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}

                  {token ? (
                    <form
                      className="mt-4 flex flex-col gap-2"
                      onSubmit={(event) => onCommentSubmit(event, project.id)}
                    >
                      <textarea
                        className="min-h-[72px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        placeholder="Ton commentaire..."
                        value={newComment[project.id] || ""}
                        onChange={(event) =>
                          setNewComment((prev) => ({
                            ...prev,
                            [project.id]: event.target.value,
                          }))
                        }
                        required
                      />
                      <button
                        className="self-start rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
                        type="submit"
                      >
                        Publier
                      </button>
                    </form>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      Connecte-toi pour laisser un commentaire.
                    </p>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
