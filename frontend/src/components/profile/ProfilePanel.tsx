"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { readAvatarFile } from "../../lib/auth/avatarUpload";
import { getDisplayName, getStatusLabel } from "../../lib/auth/userDisplay";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "../../lib/auth/constants";
import { translateProfileApiMessage } from "../../lib/auth/profileErrorMessages";
import { EMOJI_PRESETS, normalizeStatusEmoji } from "../../lib/auth/statusEmoji";
import { buildProfilePatchBody } from "../../lib/auth/profileValidation";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { getErrorMessage } from "../../lib/errors";
import { formatApiError } from "../../lib/formatApiError";
import type {
  FieldLabelProps,
  PendingAvatar,
  ProfileFormState,
  ProfileMessageTone,
} from "../../types/profile";
import type { ProfileUser } from "../../types/hubhex";
import { ThemeCustomizerTrigger } from "../theme/ThemeCustomizer";
import { AppButton } from "../ui/AppButton";
import { AppCard } from "../ui/AppCard";
import { StatCard } from "../ui/StatCard";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { ProfileActivitySection } from "./ProfileActivitySection";
import { UserAvatar } from "./UserAvatar";

function formatDate(iso: string | undefined): string {
  if (!iso) {
    return "";
  }
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function FieldLabel({ children, hint }: FieldLabelProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-300">
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

const inputClassName = "hubhex-input";

const emptyForm = (): ProfileFormState => ({
  username: "",
  email: "",
  display_name: "",
  status_message: "",
  status_emoji: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  clearAvatar: false,
  pendingAvatar: null,
});

export function ProfilePanel() {
  const { token, setSession, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<ProfileMessageTone>("neutral");
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const user = await refreshUser();
      setProfile(user as ProfileUser | null);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
      setMessageTone("error");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [refreshUser, token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setForm({
      username: profile.username,
      email: profile.email,
      display_name: profile.display_name || "",
      status_message: profile.status_message || "",
      status_emoji: profile.status_emoji || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      clearAvatar: false,
      pendingAvatar: null,
    });
    setAvatarPreview(null);
  }, [profile]);

  if (!token) {
    return null;
  }

  if (loading && !profile) {
    return <p className="text-sm text-slate-500">Chargement du profil...</p>;
  }

  if (!profile) {
    return <p className="text-sm text-rose-300">{message || "Profil indisponible."}</p>;
  }

  const stats = profile.stats;
  const usernameChanging = form.username.trim() !== profile.username;
  const previewUser = {
    ...profile,
    display_name: form.display_name,
    status_message: form.status_message,
    status_emoji: form.status_emoji,
    has_avatar: form.clearAvatar ? false : profile.has_avatar || Boolean(form.pendingAvatar),
    profile_updated_at: profile.profile_updated_at,
  };
  const statusPreview = getStatusLabel(previewUser);

  const onAvatarPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    try {
      const avatar = await readAvatarFile(file);
      const pending: PendingAvatar = {
        mime: avatar.mime,
        base64: avatar.base64,
        previewUrl: avatar.previewUrl,
      };
      setForm((prev) => ({ ...prev, pendingAvatar: pending, clearAvatar: false }));
      setAvatarPreview(avatar.previewUrl);
      setMessage("");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
      setMessageTone("error");
    }
  };

  const onRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, pendingAvatar: null, clearAvatar: true }));
    setAvatarPreview(null);
  };

  const applyStatusEmoji = (emoji: string) => {
    setForm((prev) => ({
      ...prev,
      status_emoji: emoji,
      status_message: "",
    }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setMessageTone("neutral");

    const { errors, body } = buildProfilePatchBody(form, profile);
    if (errors.length > 0) {
      setMessage(errors[0]);
      setMessageTone("error");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PATCH",
        headers: createAuthHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        const raw = formatApiError(data) || "Erreur lors de la mise a jour du profil.";
        throw new Error(translateProfileApiMessage(raw));
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      }

      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        clearAvatar: false,
        pendingAvatar: null,
      }));
      setAvatarPreview(null);
      setMessage(data.message || "Profil mis a jour avec succes.");
      setMessageTone("success");
      setProfile(data.user);
      setSession(data.token, data.user, data.refreshToken);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
      setMessageTone("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AppCard highlight>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <UserAvatar user={previewUser} size="xl" previewSrc={avatarPreview} />
            <div>
              <p className="font-mono text-sm font-medium uppercase tracking-wider text-accent">
                // mon profil
              </p>
              <h1 className="font-display text-3xl font-bold text-slate-50">
                {getDisplayName(previewUser)}
              </h1>
              <p className="mt-0.5 font-mono text-sm text-accent-soft">@{profile.username}</p>
              {statusPreview ? (
                <p className="mt-2 text-2xl leading-none" aria-label="Emoji de statut">
                  {statusPreview}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Aucun emoji de statut</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Membre depuis le {formatDate(profile.created_at)}
                {profile.profile_updated_at
                  ? ` · profil mis a jour le ${formatDate(profile.profile_updated_at)}`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Chemin depots :{" "}
                <span className="font-mono text-accent">{profile.username}/slug</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <ThemeCustomizerTrigger />
            <AppButton
              type="button"
              variant="ghost"
              onClick={() => loadProfile()}
              disabled={loading}
            >
              {loading ? "Actualisation..." : "Actualiser"}
            </AppButton>
          </div>
        </div>

        {stats ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Depots"
              value={stats.projects.total}
              hint={`${stats.projects.public} public · ${stats.projects.private} prive`}
            />
            <StatCard label="Taches" value={stats.tasks.total} accent />
            <StatCard label="Commentaires" value={stats.comments.total} />
            <StatCard
              label="Raccourcis"
              value={
                <div className="mt-1 flex flex-col gap-1 text-sm font-normal">
                  <Link href="/depots" className="text-accent hover:text-accent-soft">
                    Mes depots
                  </Link>
                  <Link href="/tableau-de-bord" className="text-accent hover:text-accent-soft">
                    Tableau de bord
                  </Link>
                </div>
              }
            />
          </div>
        ) : null}
      </AppCard>

      <form className="flex flex-col gap-6" onSubmit={onSubmit}>
        <AppCard>
          <h2 className="font-display text-lg font-semibold text-slate-100">Personnalisation</h2>
          <p className="mt-1 text-sm text-slate-400">
            Pseudo affiche, photo de profil et statut visible dans la navigation et la communaute.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onAvatarPick}
            />
            <AppButton type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Changer la photo
            </AppButton>
            {(profile.has_avatar || avatarPreview) && !form.clearAvatar ? (
              <AppButton type="button" variant="ghost" onClick={onRemoveAvatar}>
                Supprimer la photo
              </AppButton>
            ) : null}
            <span className="text-xs text-slate-500">JPEG, PNG, WebP ou GIF — max 2 Mo</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <FieldLabel hint="Affiche a la place du nom d'utilisateur si renseigne">
              Pseudo
              <input
                className={inputClassName}
                placeholder="Ex. Jean Dev"
                value={form.display_name}
                onChange={(event) => setForm({ ...form, display_name: event.target.value })}
                maxLength={80}
              />
            </FieldLabel>
            <FieldLabel hint="Un seul emoji affiche sur ton profil et dans la communaute">
              Emoji de statut
              <input
                className={`${inputClassName} text-center text-2xl`}
                placeholder="🚀"
                value={form.status_emoji}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status_emoji: normalizeStatusEmoji(event.target.value),
                    status_message: "",
                  })
                }
                maxLength={8}
                inputMode="text"
              />
            </FieldLabel>
          </div>

          <div className="mt-3">
            <p className="text-xs text-slate-500">Suggestions rapides</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Emoji ${emoji}`}
                  className={`rounded-full border px-3 py-1.5 text-lg transition-colors ${
                    form.status_emoji === emoji
                      ? "border-[color:var(--hubhex-accent-border)] bg-[color:var(--hubhex-accent-muted)]"
                      : "border-slate-700 bg-slate-950/80 hover:border-[color:var(--hubhex-accent-border)]"
                  }`}
                  onClick={() => applyStatusEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
              {form.status_emoji ? (
                <button
                  type="button"
                  className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500"
                  onClick={() => applyStatusEmoji("")}
                >
                  Retirer
                </button>
              ) : null}
            </div>
          </div>
        </AppCard>

        <AppCard>
          <h2 className="font-display text-lg font-semibold text-slate-100">Identite du compte</h2>
          <p className="mt-1 text-sm text-slate-400">
            Le nom d&apos;utilisateur (@) sert aux URLs des depots. L&apos;email sert a la connexion.
          </p>

          {usernameChanging ? (
            <p className="mt-3 rounded-md border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
              Changer le nom d&apos;utilisateur modifie le chemin public (ex.{" "}
              <span className="font-mono">
                {profile.username}/slug → {form.username.trim() || "…"}/slug
              </span>
              ).
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <FieldLabel hint="2–50 caracteres, lettres, chiffres, _ et -">
              Nom d&apos;utilisateur (@)
              <input
                className={inputClassName}
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                required
                autoComplete="username"
              />
            </FieldLabel>
            <FieldLabel hint="Mot de passe actuel requis pour modifier l'email">
              Email
              <input
                className={inputClassName}
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
                autoComplete="email"
              />
            </FieldLabel>
          </div>
        </AppCard>

        <AppCard>
          <h2 className="font-display text-lg font-semibold text-slate-100">Securite</h2>
          <p className="mt-1 text-sm text-slate-400">
            Mot de passe : 8 caracteres minimum, au moins une lettre et un chiffre.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <FieldLabel>
              Mot de passe actuel
              <input
                className={inputClassName}
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
                autoComplete="current-password"
              />
            </FieldLabel>
            <FieldLabel>
              Nouveau mot de passe
              <input
                className={inputClassName}
                type="password"
                value={form.newPassword}
                onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
                autoComplete="new-password"
              />
            </FieldLabel>
            <FieldLabel>
              Confirmer le nouveau mot de passe
              <input
                className={inputClassName}
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                autoComplete="new-password"
              />
            </FieldLabel>
          </div>
        </AppCard>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AppButton type="submit" variant="primary" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </AppButton>
          <p
            className={`text-sm ${
              messageTone === "success"
                ? "text-emerald-300"
                : messageTone === "error"
                  ? "text-rose-300"
                  : "text-slate-400"
            }`}
          >
            {message}
          </p>
        </div>
      </form>

      <ProfileActivitySection activity={profile.recent_activity} />
      <DeleteAccountSection />
    </div>
  );
}
