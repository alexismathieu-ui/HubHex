"use client";

import { useEffect, useState } from "react";

import { API_BASE_URL } from "../lib/apiBaseUrl";
import { formatApiError } from "../lib/formatApiError";

const TOKEN_KEY = "hubhex_token";

export function ProfilePanel({ token, currentUser, onProfileUpdated }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setForm({
        username: "",
        email: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      return;
    }
    setForm({
      username: currentUser.username,
      email: currentUser.email,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [currentUser]);

  if (!token || !currentUser) {
    return null;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const wantsPasswordChange =
      form.currentPassword.trim() ||
      form.newPassword.trim() ||
      form.confirmPassword.trim();

    if (wantsPasswordChange) {
      if (!form.currentPassword.trim()) {
        setMessage("Indique ton mot de passe actuel pour le changer.");
        return;
      }
      if (!form.newPassword.trim()) {
        setMessage("Indique un nouveau mot de passe (min. 8 caracteres).");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setMessage("La confirmation du nouveau mot de passe ne correspond pas.");
        return;
      }
    }

    const body = {};
    if (form.username.trim() !== currentUser.username) {
      body.username = form.username.trim();
    }
    const emailChanging = form.email.trim().toLowerCase() !== currentUser.email;
    if (emailChanging) {
      if (!form.currentPassword.trim()) {
        setMessage("Indique ton mot de passe actuel pour changer d'email.");
        return;
      }
      body.email = form.email.trim();
      body.currentPassword = form.currentPassword;
    }
    if (wantsPasswordChange) {
      body.currentPassword = form.currentPassword;
      body.newPassword = form.newPassword;
    }

    if (Object.keys(body).length === 0) {
      setMessage("Aucune modification detectee.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur lors de la mise a jour du profil.");
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }

      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setMessage("Profil mis a jour avec succes.");
      onProfileUpdated?.(data.user, data.token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-xl border border-violet-800/60 bg-violet-950/30 p-5">
      <h3 className="text-xl font-semibold text-violet-200">Mon profil</h3>
      <p className="mt-1 text-sm text-violet-300/80">
        Modifie ton nom d&apos;utilisateur, ton email ou ton mot de passe.
      </p>

      <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
        <input
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          placeholder="Nom d'utilisateur"
          value={form.username}
          onChange={(event) => setForm({ ...form, username: event.target.value })}
          required
          autoComplete="username"
        />
        <input
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
          autoComplete="email"
        />

        <div className="mt-2 border-t border-violet-900/50 pt-4">
          <p className="text-sm font-medium text-slate-300">
            Mot de passe actuel (obligatoire pour changer l&apos;email ou le mot de passe)
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              type="password"
              placeholder="Mot de passe actuel"
              value={form.currentPassword}
              onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
              autoComplete="current-password"
            />
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              type="password"
              placeholder="Nouveau mot de passe (8+ car., lettre + chiffre)"
              value={form.newPassword}
              onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
              autoComplete="new-password"
            />
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={form.confirmPassword}
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          className="rounded-lg bg-violet-500 px-4 py-2 font-semibold text-white hover:bg-violet-400 disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          {saving ? "Enregistrement..." : "Enregistrer le profil"}
        </button>
        <p className="text-sm text-slate-300">{message}</p>
      </form>
    </article>
  );
}
