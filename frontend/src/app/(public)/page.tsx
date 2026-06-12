"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LandingPage } from "../../components/landing/LandingPage";
import { useAuth } from "../../context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/tableau-de-bord");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        Chargement...
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        Redirection vers votre espace...
      </div>
    );
  }

  return <LandingPage />;
}
