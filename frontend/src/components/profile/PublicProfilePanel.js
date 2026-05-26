"use client";

import { useCallback, useEffect, useState } from "react";

import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { getDisplayName } from "../../lib/auth/userDisplay";
import { formatApiError } from "../../lib/formatApiError";
import { UserAvatar } from "./UserAvatar";

export function PublicProfilePanel({ username }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(username)}/public`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Profil introuvable.");
      }
      setProfile(data.user);
    } catch (error) {
      setMessage(error.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-slate-500">Chargement...</p>;
  }

  if (!profile) {
    return <p className="text-red-300">{message || "Utilisateur introuvable."}</p>;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6">
      <div className="flex items-center gap-4">
        <UserAvatar user={profile} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{getDisplayName(profile)}</h1>
          <p className="font-mono text-sm text-cyan-400">@{profile.username}</p>
          {profile.status_message ? (
            <p className="mt-2 text-sm text-slate-400">
              {profile.status_emoji ? `${profile.status_emoji} ` : ""}
              {profile.status_message}
            </p>
          ) : null}
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <dt className="text-xs text-slate-500">Depots publics</dt>
          <dd className="text-xl font-semibold text-slate-100">
            {profile.stats?.projects?.public ?? 0}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Commentaires</dt>
          <dd className="text-xl font-semibold text-slate-100">
            {profile.stats?.comments?.total ?? 0}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Membre depuis</dt>
          <dd className="text-sm text-slate-300">
            {profile.created_at
              ? new Date(profile.created_at).toLocaleDateString("fr-FR")
              : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
