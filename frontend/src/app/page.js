"use client";

import { useEffect, useState } from "react";

import { API_BASE_URL } from "../lib/apiBaseUrl";
import { formatApiError } from "../lib/formatApiError";

import { ProfilePanel } from "../components/ProfilePanel";
import { ProjectsPanel } from "../components/ProjectsPanel";

const TOKEN_KEY = "hubhex_token";

export default function Home() {
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [registerMessage, setRegisterMessage] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [meMessage, setMeMessage] = useState("");

  const fetchMe = async (authToken) => {
    if (!authToken) {
      setCurrentUser(null);
      setMeMessage("Aucune session active.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Impossible de recuperer le profil.");
      }
      setCurrentUser(data.user);
      setMeMessage("Session valide. Utilisateur memorise en base.");
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setCurrentUser(null);
      setMeMessage(error.message);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || "";
    setToken(savedToken);
    fetchMe(savedToken);
  }, []);

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
      setRegisterMessage(`Utilisateur cree: ${data.user.email}`);
      setRegisterForm({ username: "", email: "", password: "" });
    } catch (error) {
      setRegisterMessage(error.message);
    }
  };

  const onLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur connexion.");
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setLoginMessage(`Connexion reussie: ${data.user.email}`);
      setLoginForm({ email: "", password: "" });
      fetchMe(data.token);
    } catch (error) {
      setLoginMessage(error.message);
    }
  };

  const onLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setCurrentUser(null);
    setLoginMessage("Session fermee.");
    setMeMessage("Aucune session active.");
  };

  const onProfileUpdated = (user, newToken) => {
    if (newToken) {
      setToken(newToken);
    }
    setCurrentUser(user);
    setMeMessage("Profil a jour.");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 md:px-10">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            HubHex Auth Prototype
          </p>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
            Inscription, connexion et session utilisateur.
          </h1>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <form className="rounded-xl border border-slate-800 bg-slate-900 p-5" onSubmit={onRegisterSubmit}>
            <h3 className="text-xl font-semibold">Inscription</h3>
            <div className="mt-4 flex flex-col gap-3">
              <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Nom d'utilisateur" value={registerForm.username} onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })} required />
              <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2" type="email" placeholder="Email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} required />
              <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2" type="password" placeholder="Mot de passe (min 8)" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} required />
              <button className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300" type="submit">Creer un compte</button>
              <p className="text-sm text-slate-300">{registerMessage}</p>
            </div>
          </form>

          <form className="rounded-xl border border-slate-800 bg-slate-900 p-5" onSubmit={onLoginSubmit}>
            <h3 className="text-xl font-semibold">Connexion</h3>
            <div className="mt-4 flex flex-col gap-3">
              <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2" type="email" placeholder="Email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} required />
              <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2" type="password" placeholder="Mot de passe" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} required />
              <button className="rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-900 hover:bg-white" type="submit">Se connecter</button>
              <button className="rounded-lg border border-slate-700 px-4 py-2 text-slate-200 hover:border-slate-500" type="button" onClick={onLogout}>Se deconnecter</button>
              <p className="text-sm text-slate-300">{loginMessage}</p>
            </div>
          </form>
        </div>

        <article className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-5">
          <h3 className="text-xl font-semibold text-emerald-300">Etat de session</h3>
          <p className="mt-2 text-sm text-emerald-100">{meMessage}</p>
          <p className="mt-2 text-sm text-emerald-100">
            Utilisateur courant: {currentUser ? `${currentUser.username} (${currentUser.email})` : "non connecte"}
          </p>
        </article>

        <ProfilePanel
          token={token}
          currentUser={currentUser}
          onProfileUpdated={onProfileUpdated}
        />

        <ProjectsPanel token={token} />
      </section>
    </main>
  );
}
