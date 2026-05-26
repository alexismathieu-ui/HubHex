"use client";

import { use } from "react";

import { PublicProfilePanel } from "../../../../components/profile/PublicProfilePanel";

export default function UtilisateurPublicPage({ params }) {
  const { username } = use(params);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-100">Profil public</h1>
      <PublicProfilePanel username={username} />
    </div>
  );
}
