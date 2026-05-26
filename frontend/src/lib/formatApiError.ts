import type { ApiErrorBody } from "../types/hubhex";

interface ZodDetail {
  path?: (string | number)[];
  message?: string;
}

/**
 * Formate une erreur API (surtout les erreurs Zod avec details).
 */
export function formatApiError(data: ApiErrorBody | null | undefined): string {
  const base = data?.error?.message || "Erreur";
  const details = data?.error?.details;
  if (!Array.isArray(details) || details.length === 0) {
    return base;
  }
  if (typeof base === "string" && base.startsWith("Validation")) {
    return base;
  }
  const first = details[0] as ZodDetail;
  const path = Array.isArray(first.path) && first.path.length ? first.path.join(".") : "champ";
  const detailMessage = first.message || "";
  return `${base} (${path}: ${detailMessage})`.trim();
}
