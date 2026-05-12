/**
 * Formate une erreur API (surtout les erreurs Zod avec details).
 */
export function formatApiError(data) {
  const base = data?.error?.message || "Erreur";
  const details = data?.error?.details;
  if (!Array.isArray(details) || details.length === 0) {
    return base;
  }
  if (typeof base === "string" && base.startsWith("Validation")) {
    return base;
  }
  const first = details[0];
  const path = Array.isArray(first.path) && first.path.length ? first.path.join(".") : "champ";
  const detailMessage = first.message || "";
  return `${base} (${path}: ${detailMessage})`.trim();
}
