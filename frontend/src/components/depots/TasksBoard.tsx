"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { getErrorMessage } from "../../lib/errors";
import { formatApiError } from "../../lib/formatApiError";
import { readApiJson } from "../../lib/readApiJson";
import type { ApiErrorBody, Task, TaskStatus } from "../../types/hubhex";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A faire",
  in_progress: "En cours",
  done: "Termine",
};

interface TasksBoardProps {
  token: string;
  projectId: number;
}

interface TasksListResponse {
  tasks?: Task[];
}

export function TasksBoard({ token, projectId }: TasksBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const tasksUrl = `${API_BASE_URL}/projects/${projectId}/tasks`;

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(tasksUrl, { headers: createAuthHeaders(token, false) });
      const { data, ok } = await readApiJson<TasksListResponse>(response, tasksUrl);
      if (!ok) {
        throw new Error(formatApiError(data as ApiErrorBody) || "Impossible de charger les taches.");
      }
      setTasks(data.tasks || []);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [tasksUrl, token]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const grouped = useMemo(() => {
    const buckets: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const task of tasks) {
      if (buckets[task.status]) {
        buckets[task.status].push(task);
      } else {
        buckets.todo.push(task);
      }
    }
    return buckets;
  }, [tasks]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      return;
    }
    setMessage("");
    try {
      const response = await fetch(tasksUrl, {
        method: "POST",
        headers: createAuthHeaders(token),
        body: JSON.stringify({ title, description: "", status: "todo" }),
      });
      const { data, ok } = await readApiJson<TasksListResponse>(response, tasksUrl);
      if (!ok) {
        throw new Error(formatApiError(data as ApiErrorBody) || "Erreur creation tache.");
      }
      setNewTitle("");
      await loadTasks();
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  };

  const moveTask = async (taskId: number, status: TaskStatus) => {
    setMessage("");
    try {
      const taskUrl = `${tasksUrl}/${taskId}`;
      const response = await fetch(taskUrl, {
        method: "PUT",
        headers: createAuthHeaders(token),
        body: JSON.stringify({ status }),
      });
      const { data, ok } = await readApiJson(response, taskUrl);
      if (!ok) {
        throw new Error(formatApiError(data) || "Erreur deplacement.");
      }
      await loadTasks();
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  };

  const deleteTask = async (taskId: number) => {
    setMessage("");
    try {
      const taskUrl = `${tasksUrl}/${taskId}`;
      const response = await fetch(taskUrl, {
        method: "DELETE",
        headers: createAuthHeaders(token, false),
      });
      const { data, ok } = await readApiJson(response, taskUrl);
      if (!ok) {
        throw new Error(formatApiError(data) || "Erreur suppression.");
      }
      await loadTasks();
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  };

  const onColumnDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onColumnDrop = (event: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    event.preventDefault();
    const taskId = Number(event.dataTransfer.getData("text/plain"));
    if (taskId) {
      moveTask(taskId, status);
    }
  };

  const renderColumn = (status: TaskStatus) => (
    <div
      className="flex min-h-[140px] flex-1 flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3"
      onDragOver={onColumnDragOver}
      onDrop={(event) => onColumnDrop(event, status)}
    >
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {STATUS_LABELS[status]}
      </p>
      {grouped[status].map((task) => (
        <div
          key={task.id}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("text/plain", String(task.id));
            event.dataTransfer.effectAllowed = "move";
          }}
          className="cursor-grab rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-sm active:cursor-grabbing"
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
              className="ml-auto rounded border border-red-900/50 px-1.5 py-0.5 text-[10px] text-red-300 hover:border-red-700 focus-visible:ring-2 focus-visible:ring-red-400"
              type="button"
              aria-label="Supprimer la tache"
              onClick={() => deleteTask(task.id)}
            >
              Supprimer
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
        <label className="flex flex-1 flex-col gap-1 text-sm text-slate-300">
          Nouvelle tache
          <input
            id="kanban-new-task"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-cyan-400"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
          />
        </label>
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
