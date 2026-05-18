"use client";

import { useState } from "react";

import { API_BASE_URL } from "../lib/apiBaseUrl";
import { formatApiError } from "../lib/formatApiError";

export function ForgotPasswordPanel() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [devTokenHint, setDevTokenHint] = useState("");

  const onRequestSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setDevTokenHint("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur lors de la demande.");
      }
      setMessage(data.message);
      setStep("reset");
      if (data.dev_reset?.token) {
        setResetToken(data.dev_reset.token);
        setDevTokenHint(data.dev_reset.hint);
      } else {
        setDevTokenHint(
          "Si le compte existe, utilise le code recu (en production : par email). Sinon verifie l'email ou reessaie.",
        );
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const onResetSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken.trim(), newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur lors de la reinitialisation.");
      }
      setMessage(data.message);
      setOpen(false);
      setStep("request");
      setEmail("");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setDevTokenHint("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (!open) {
    return (
      <button
        className="text-left text-sm text-cyan-300 underline-offset-2 hover:text-cyan-200 hover:underline"
        type="button"
        onClick={() => setOpen(true)}
      >
        Mot de passe oublie ?
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-200">Reinitialiser le mot de passe</p>
        <button
          className="text-xs text-slate-400 hover:text-slate-200"
          type="button"
          onClick={() => {
            setOpen(false);
            setStep("request");
            setMessage("");
            setDevTokenHint("");
          }}
        >
          Fermer
        </button>
      </div>

      {step === "request" ? (
        <form className="mt-3 flex flex-col gap-3" onSubmit={onRequestSubmit}>
          <p className="text-xs text-slate-400">
            Entre l&apos;email de ton compte. En developpement, le code s&apos;affiche ici (en
            production, il serait envoye par email).
          </p>
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            type="email"
            placeholder="Email du compte"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button
            className="rounded-lg border border-cyan-700 bg-cyan-950/40 px-4 py-2 text-sm font-semibold text-cyan-200 hover:border-cyan-500"
            type="submit"
          >
            Envoyer le code
          </button>
        </form>
      ) : (
        <form className="mt-3 flex flex-col gap-3" onSubmit={onResetSubmit}>
          {devTokenHint ? (
            <p className="rounded-md border border-amber-900/50 bg-amber-950/30 p-2 text-xs text-amber-100">
              {devTokenHint}
            </p>
          ) : null}
          {resetToken ? (
            <div className="rounded-md border border-cyan-800/60 bg-cyan-950/40 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
                Code (developpement)
              </p>
              <p className="mt-2 break-all font-mono text-xs text-cyan-100">{resetToken}</p>
            </div>
          ) : null}
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono"
            placeholder="Code de reinitialisation (64 caracteres)"
            value={resetToken}
            onChange={(event) => setResetToken(event.target.value)}
            required
          />
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            type="password"
            placeholder="Nouveau mot de passe (8+ car., lettre + chiffre)"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          <button
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-400"
            type="submit"
          >
            Reinitialiser et se connecter
          </button>
          <button
            className="text-xs text-slate-400 hover:text-slate-200"
            type="button"
            onClick={() => setStep("request")}
          >
            Renvoyer un code
          </button>
        </form>
      )}

      {message ? <p className="mt-3 text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}
