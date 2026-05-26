import type { ApiErrorBody } from "../types/hubhex";
import { formatApiError } from "./formatApiError";

/**
 * Parse une reponse API en JSON ; message clair si 429/HTML/plain text.
 */
export async function readApiJson<T = Record<string, unknown>>(
  response: Response,
  requestUrl = "",
): Promise<{ data: T; ok: boolean }> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return { data: {} as T, ok: response.ok };
  }
  if (trimmed.startsWith("<")) {
    throw new Error(
      `Reponse HTML (HTTP ${response.status}) — verifiez que l'API HubHex tourne. ${requestUrl}`,
    );
  }
  try {
    const data = JSON.parse(trimmed) as T;
    return { data, ok: response.ok };
  } catch {
    if (response.status === 429) {
      throw new Error(
        "Trop de requetes vers l'API. Attendez quelques secondes puis reessayez.",
      );
    }
    const preview = trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
    throw new Error(
      response.ok
        ? `Reponse invalide.`
        : `Erreur HTTP ${response.status} : ${preview}`,
    );
  }
}

export async function readApiJsonOrThrow<T = Record<string, unknown>>(
  response: Response,
  requestUrl = "",
): Promise<T> {
  const { data, ok } = await readApiJson<T>(response, requestUrl);
  if (!ok) {
    throw new Error(formatApiError(data as ApiErrorBody) || `Erreur HTTP ${response.status}.`);
  }
  return data;
}
