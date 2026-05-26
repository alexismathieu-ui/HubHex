"use client";

import { use } from "react";

import { PublicProfilePanel } from "../../../../components/profile/PublicProfilePanel";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default function UtilisateurPublicPage({ params }: PageProps) {
  const { username } = use(params);
  return <PublicProfilePanel username={username} />;
}
