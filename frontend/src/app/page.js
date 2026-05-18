"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }
    router.replace(isAuthenticated ? "/tableau-de-bord" : "/connexion");
  }, [loading, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">
      Chargement...
    </div>
  );
}
