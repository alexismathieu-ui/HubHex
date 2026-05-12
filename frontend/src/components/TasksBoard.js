"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { API_BASE_URL } from "../lib/apiBaseUrl";
import { formatApiError } from "../lib/formatApiError";

const STATUS_LABELS = {
  todo: "A faire",
  in_progress: "En cours",
  done: "Termine",
};

async function readApiJson(response, requestUrl) {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }
  if (trimmed.startsWith("<")) {
    const cible = requestUrl || response.url || "URL inconnue";
    throw new Error(
      `L'API a renvoye du HTML (HTTP ${response.status}) au lieu de JSON — la reponse ne vient probablement pas de l'API HubHex sur cette URL. URL : ${cible}. Verifie NEXT_PUBLIC_API_URL, que le backend ecoute bien (PORT dans backend/.env), puis relance node sur src/server.js (pas un vieux build).`,
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Reponse invalide (HTTP ${response.status}).`);
  }
}

export function TasksBoard({ token, projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const tasksUrl = `${API_BASE_URL}/projects/${projectId}/tasks`;

  const authHeaders = (json = true) => {
    const headers = { Authorization: `Bearer ${token}` };
    if (json) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(tasksUrl, { headers: authHeaders(false) });
      const data = await readApiJson(response, tasksUrl);
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Impossible de charger les taches.");
      }
      setTasks(data.tasks || []);
    } catch (error) {
      setMessage(error.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [tasksUrl, token]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const grouped = useMemo(() => {
    const buckets = { todo: [], in_progress: [], done: [] };
    for (const task of tasks) {
      if (buckets[task.status]) {
        buckets[task.status].push(task);
      } else {
        buckets.todo.push(task);
      }
    }
    return buckets;
  }, [tasks]);

  const onCreate = async (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      return;
    }
    setMessage("");
    try {
      const response = await fetch(tasksUrl, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title, description: "", status: "todo" }),
      });
      const data = await readApiJson(response, tasksUrl);
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur creation tache.");
      }
      setNewTitle("");
      await loadTasks();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const moveTask = async (taskId, status) => {
    setMessage("");
    try {
      const taskUrl = `${tasksUrl}/${taskId}`;
      const response = await fetch(taskUrl, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await readApiJson(response, taskUrl);
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur deplacement.");
      }
      await loadTasks();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteTask = async (taskId) => {
    setMessage("");
    try {
      const taskUrl = `${tasksUrl}/${taskId}`;
      const response = await fetch(taskUrl, {
        method: "DELETE",
        headers: authHeaders(false),
      });
      const data = await readApiJson(response, taskUrl);
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur suppression.");
      }
      await loadTasks();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const renderColumn = (status) => (
    <div className="flex min-h-[140px] flex-1 flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {STATUS_LABELS[status]}
      </p>
      {grouped[status].map((task) => (
        <div
          key={task.id}
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-sm"
        >
          <p className="font-medium text-slate-100">{task.title}</p>
          {task.description ? (
            <p className="mt-1 text-xs text-slate-500">{task.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1">
            {status !== "todo" ? (
              <button
                className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-slate-400"
                type="button"
                onClick={() => moveTask(task.id, "todo")}
              >
                A faire
              </button>
            ) : null}
            {status !== "in_progress" ? (
              <button
                className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-slate-400"
                type="button"
                onClick={() => moveTask(task.id, "in_progress")}
              >
                En cours
              </button>
            ) : null}
            {status !== "done" ? (
              <button
                className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-slate-400"
                type="button"
                onClick={() => moveTask(task.id, "done")}
              >
                Termine
              </button>
            ) : null}
            <button
              className="ml-auto rounded border border-red-900/50 px-1.5 py-0.5 text-[10px] text-red-300 hover:border-red-700"
              type="button"
              onClick={() => deleteTask(task.id)}
            >
              X
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-200">Kanban (taches)</p>
        <button
          className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-slate-400"
          type="button"
          onClick={() => loadTasks()}
          disabled={loading}
        >
          {loading ? "..." : "Rafraichir taches"}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">{message}</p>

      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={onCreate}>
        <input
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Nouvelle tache (titre)"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
        />
        <button
          className="rounded-md bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/30"
          type="submit"
        >
          Ajouter
        </button>
      </form>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {renderColumn("todo")}
        {renderColumn("in_progress")}
        {renderColumn("done")}
      </div>
    </div>
  );
}
