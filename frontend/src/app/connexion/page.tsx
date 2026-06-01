"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthPageChrome } from "../../components/auth/AuthPageChrome";
import { ForgotPasswordPanel } from "../../components/auth/ForgotPasswordPanel";
import { useAuth } from "../../context/AuthContext";
import { useRequireGuest } from "../../hooks/useRequireGuest";
import { authCardClass, authInputClass } from "../../lib/auth/authFormStyles";
import { getErrorMessage } from "../../lib/errors";

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { loading, isAuthenticated } = useRequireGuest();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginMessage, setLoginMessage] = useState("");

  const redirectTo = searchParams.get("redirect") || "/tableau-de-bord";

  const onLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginMessage("");
    try {
      await login(loginForm.email, loginForm.password);
      router.replace(redirectTo);
    } catch (error: unknown) {
      setLoginMessage(getErrorMessage(error));
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
      title="Connexion"
      subtitle="Accedez a vos depots, au Kanban et a la communaute."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link
            href={`/inscription${redirectTo !== "/tableau-de-bord" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-medium text-cyan-400 hover:text-cyan-300"
          >
            Creer un compte
          </Link>
        </>
      }
    >
      <article className={authCardClass}>
        <form className="flex flex-col gap-4" onSubmit={onLoginSubmit}>
          <label className="flex flex-col gap-1.5 text-sm text-slate-300">
            Email
            <input
              id="login-email"
              className={authInputClass}
              type="email"
              autoComplete="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-300">
            Mot de passe
            <input
              id="login-password"
              className={authInputClass}
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              required
            />
          </label>
          <button
            type="submit"
            className="mt-1 rounded-lg bg-cyan-500 px-4 py-2.5 font-display font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Se connecter
          </button>
        </form>

        <ForgotPasswordPanel initialResetToken={searchParams.get("reset") || ""} />

        {loginMessage ? (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {loginMessage}
          </p>
        ) : null}
      </article>
    </AuthPageChrome>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
          Chargement...
        </div>
      }
    >
      <ConnexionContent />
    </Suspense>
  );
}
