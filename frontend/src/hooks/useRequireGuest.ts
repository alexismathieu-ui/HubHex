"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "../context/AuthContext";

/** Redirige les utilisateurs deja connectes vers l'app */
export function useRequireGuest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  const redirectTo = searchParams.get("redirect") || "/tableau-de-bord";

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [loading, isAuthenticated, router, redirectTo]);

  return { loading, isAuthenticated, redirectTo };
}
