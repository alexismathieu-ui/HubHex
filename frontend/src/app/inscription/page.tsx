"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthPageChrome } from "../../components/auth/AuthPageChrome";
import { PasswordRequirements } from "../../components/auth/PasswordRequirements";
import { useRequireGuest } from "../../hooks/useRequireGuest";
import { isPasswordStrong } from "../../lib/auth/passwordPolicy";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { authCardClass, authInputClass } from "../../lib/auth/authFormStyles";
import { getErrorMessage } from "../../lib/errors";
import { formatApiError } from "../../lib/formatApiError";

function InscriptionContent() {
  const searchParams = useSearchParams();
  const { loading, isAuthenticated } = useRequireGuest();

  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" });
  const [registerMessage, setRegisterMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/tableau-de-bord";
  const loginHref =
    redirectTo !== "/tableau-de-bord"
      ? `/connexion?redirect=${encodeURIComponent(redirectTo)}`
      : "/connexion";

  const passwordValid = isPasswordStrong(registerForm.password);

  const onRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterMessage("");
    setSuccess(false);
    if (!passwordValid) {
      setRegisterMessage("Le mot de passe doit respecter tous les criteres de securite.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur inscription.");
      }
      setSuccess(true);
      setRegisterMessage(`Compte cree pour ${data.user.email}. Connectez-vous pour continuer.`);
      setRegisterForm({ username: "", email: "", password: "" });
    } catch (error: unknown) {
      setRegisterMessage(getErrorMessage(error));
    }
  };

  if (loading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 font-display text-slate-400">
        {loading ? "Verification de la session..." : "Redirection..."}
      </div>
    );
  }

  return (
    <AuthPageChrome
      title="Inscription"
      footer={
        <>
          Deja inscrit ?{" "}
          <Link href={loginHref} className="font-medium text-cyan-400 hover:text-cyan-300">
            Se connecter
          </Link>
        </>
      }
    >
      <form className={authCardClass} onSubmit={onRegisterSubmit}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-slate-300">
            Nom d&apos;utilisateur
            <input
              id="register-username"
              className={authInputClass}
              autoComplete="username"
              value={registerForm.username}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, username: event.target.value })
              }
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-300">
            Email
            <input
              id="register-email"
              className={authInputClass}
              type="email"
              autoComplete="email"
              value={registerForm.email}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, email: event.target.value })
              }
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-300">
            Mot de passe
            <input
              id="register-password"
              className={authInputClass}
              type="password"
              autoComplete="new-password"
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, password: event.target.value })
              }
              required
            />
            <PasswordRequirements password={registerForm.password} />
          </label>
          <button
            type="submit"
            disabled={!passwordValid}
            className="mt-1 rounded-lg bg-cyan-500 px-4 py-2.5 font-display font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Creer mon compte
          </button>
        </div>

        {registerMessage ? (
          <p
            className={`mt-4 text-sm ${success ? "text-emerald-300" : "text-red-300"}`}
            role="alert"
          >
            {registerMessage}
            {success ? (
              <>
                {" "}
                <Link href={loginHref} className="underline hover:text-emerald-200">
                  Aller a la connexion
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
      </form>
    </AuthPageChrome>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
          Chargement...
        </div>
      }
    >
      <InscriptionContent />
    </Suspense>
  );
}
