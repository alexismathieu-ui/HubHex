"use client";

import { useCallback, useEffect, useState } from "react";

import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { depotPath } from "../../lib/depots/depotUtils";
import { formatApiError } from "../../lib/formatApiError";
import type { GraphNode, ProjectRelation, RelationType } from "../../types/hubhex";

const RELATION_LABELS: Record<RelationType, string> = {
  related: "Lie",
  same_tech: "Meme techno",
  inspired_by: "Inspire de",
  continues: "Suite de",
};

interface HubHexGraphPanelProps {
  token: string;
  username: string;
}

export function HubHexGraphPanel({ token, username }: HubHexGraphPanelProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<ProjectRelation[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relationType, setRelationType] = useState<RelationType>("related");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/graph`, {
      headers: createAuthHeaders(token, false),
    });
    const data = await response.json();
    if (response.ok) {
      setNodes((data.nodes || []) as GraphNode[]);
      setEdges((data.edges || []) as ProjectRelation[]);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const onAddRelation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`${API_BASE_URL}/graph/relations`, {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        sourceProjectId: Number(sourceId),
        targetProjectId: Number(targetId),
        relationType,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(formatApiError(data) || "Erreur.");
      return;
    }
    setMessage("Relation ajoutee.");
    await load();
  };

  const onDeleteRelation = async (id: number) => {
    await fetch(`${API_BASE_URL}/graph/relations/${id}`, {
      method: "DELETE",
      headers: createAuthHeaders(token, false),
    });
    await load();
  };

  const nodeById = (id: number) => nodes.find((n) => n.id === id);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Graphe HubHex : visualisez les liens entre vos depots (capitalisation technique).
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="rounded-lg border border-cyan-900/50 bg-slate-950/60 p-4"
          >
            <p className="font-mono text-xs text-cyan-400">{depotPath(username, node.slug)}</p>
            <p className="mt-1 font-semibold text-slate-100">{node.title}</p>
            <p className="mt-1 text-xs text-slate-500">{node.technologies}</p>
            <span
              className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] ${
                node.visibility === "public"
                  ? "bg-emerald-950 text-emerald-300"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {node.visibility}
            </span>
          </div>
        ))}
      </div>
      {nodes.length === 0 ? <p className="text-slate-500">Creez des depots pour alimenter le graphe.</p> : null}

      <form
        className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-800 p-4"
        onSubmit={onAddRelation}
      >
        <label className="text-xs text-slate-500">
          Source
          <select
            className="mt-1 block rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            required
          >
            <option value="">—</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Cible
          <select
            className="mt-1 block rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            required
          >
            <option value="">—</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Type
          <select
            className="mt-1 block rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
            value={relationType}
            onChange={(e) => setRelationType(e.target.value as RelationType)}
          >
            {Object.entries(RELATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded bg-cyan-700 px-4 py-2 text-sm text-white">
          Lier
        </button>
      </form>
      {message ? <p className="text-sm text-slate-300">{message}</p> : null}

      <ul className="space-y-2">
        {edges.map((edge) => {
          const source = nodeById(edge.source_project_id);
          const target = nodeById(edge.target_project_id);
          return (
            <li
              key={edge.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 px-3 py-2 text-sm"
            >
              <span className="text-slate-300">
                <strong>{source?.title}</strong> → {RELATION_LABELS[edge.relation_type]} →{" "}
                <strong>{target?.title}</strong>
              </span>
              <button
                type="button"
                className="text-xs text-red-400"
                onClick={() => onDeleteRelation(edge.id)}
              >
                Supprimer
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
