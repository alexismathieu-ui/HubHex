function normalizeApiBaseUrl(raw: string | undefined): string | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Base de l'API (doit se terminer par `/api`, ex. http://localhost:4000/api).
 * Surcharge en dev / prod avec NEXT_PUBLIC_API_URL dans .env.local
 */
export const API_BASE_URL =
  normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL) ?? "http://localhost:4000/api";
