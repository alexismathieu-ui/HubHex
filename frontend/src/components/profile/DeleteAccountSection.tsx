"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { createAuthHeaders } from "../../lib/apiHeaders";
import { translateProfileApiMessage } from "../../lib/auth/profileErrorMessages";
import { getErrorMessage } from "../../lib/errors";
import { formatApiError } from "../../lib/formatApiError";

const CONFIRMATION_TEXT = "SUPPRIMER";

export function DeleteAccountSection() {
  const router = useRouter();
  const { token, currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!token || !currentUser) {
    return null;
  }

  const onDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (confirmation !== CONFIRMATION_TEXT) {
      setMessage(`Tape ${CONFIRMATION_TEXT} pour confirmer la suppression.`);
      return;
    }
    if (!password.trim()) {
      setMessage("Indique ton mot de passe pour supprimer le compte.");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "DELETE",
        headers: createAuthHeaders(token),
        body: JSON.stringify({
          password,
          confirmation: CONFIRMATION_TEXT,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const raw = formatApiError(data) || "Impossible de supprimer le compte.";
        throw new Error(translateProfileApiMessage(raw));
      }

      logout();
      router.replace("/connexion");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-5">
      <h2 className="text-lg font-semibold text-rose-200">Zone de danger</h2>
      <p className="mt-1 text-sm text-rose-300/80">
        La suppression efface definitivement ton compte, tous tes depots, fichiers, taches et
        commentaires.
      </p>

      {!open ? (
        <button
          type="button"
          className="mt-4 rounded-lg border border-rose-800 px-4 py-2 text-sm text-rose-200 hover:border-rose-600"
          onClick={() => setOpen(true)}
        >
          Supprimer mon compte
        </button>
      ) : (
        <form className="mt-4 flex flex-col gap-3" onSubmit={onDelete}>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Mot de passe
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Confirmation (tape {CONFIRMATION_TEXT})
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono"
              placeholder={CONFIRMATION_TEXT}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
              disabled={deleting}
            >
              {deleting ? "Suppression..." : "Confirmer la suppression"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
              onClick={() => {
                setOpen(false);
                setPassword("");
                setConfirmation("");
                setMessage("");
              }}
              disabled={deleting}
            >
              Annuler
            </button>
          </div>
          <p className="text-sm text-rose-200/90">{message}</p>
        </form>
      )}
    </section>
  );
}
