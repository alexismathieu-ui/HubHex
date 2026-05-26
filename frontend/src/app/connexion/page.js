"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ForgotPasswordPanel } from "../../components/auth/ForgotPasswordPanel";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import { formatApiError } from "../../lib/formatApiError";

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading, login } = useAuth();

  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerMessage, setRegisterMessage] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const redirectTo = searchParams.get("redirect") || "/tableau-de-bord";

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [loading, isAuthenticated, router, redirectTo]);

  const onRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegisterMessage("");
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
      setRegisterMessage(`Compte cree : ${data.user.email}. Tu peux te connecter.`);
      setRegisterForm({ username: "", email: "", password: "" });
    } catch (error) {
      setRegisterMessage(error.message);
    }
  };

  const onLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginMessage("");
    try {
      await login(loginForm.email, loginForm.password);
      router.replace(redirectTo);
    } catch (error) {
      setLoginMessage(error.message);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Redirection...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-400">
        <p>Verification de la session...</p>
        <p className="max-w-md text-center text-xs text-slate-500">
          Si cet ecran reste bloque, verifiez que le backend tourne (npm run dev dans backend/)
          puis rafraichissez. Vous pouvez aussi ouvrir les outils developpeur → Application →
          Local Storage → supprimer <code className="text-cyan-400">hubhex_token</code>.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-14">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold uppercase tracking-widest text-cyan-300">
          HubHex
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Connexion</h1>
        <p className="mt-2 text-slate-400">Accede a tes depots, au Kanban et a la communaute.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={onRegisterSubmit}
          >
            <h2 className="text-lg font-semibold">Inscription</h2>
            <div className="mt-4 flex flex-col gap-3">
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Nom d'utilisateur"
                value={registerForm.username}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, username: event.target.value })
                }
                required
              />
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, email: event.target.value })
                }
                required
              />
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                type="password"
                placeholder="Mot de passe"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, password: event.target.value })
                }
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950"
              >
                Creer un compte
              </button>
              <p className="text-sm text-slate-300">{registerMessage}</p>
            </div>
          </form>

          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-semibold">Connexion</h2>
            <form className="mt-4 flex flex-col gap-3" onSubmit={onLoginSubmit}>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, email: event.target.value })
                }
                required
              />
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                type="password"
                placeholder="Mot de passe"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, password: event.target.value })
                }
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-900"
              >
                Se connecter
              </button>
            </form>
            <ForgotPasswordPanel initialResetToken={searchParams.get("reset") || ""} />
            <p className="mt-3 text-sm text-slate-300">{loginMessage}</p>
          </article>
        </div>
      </div>
    </main>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-400">
          Chargement...
        </div>
      }
    >
      <ConnexionContent />
    </Suspense>
  );
}
