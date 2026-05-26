import { formatApiError } from "./formatApiError";

/**
 * Parse une reponse API en JSON ; message clair si 429/HTML/plain text.
 */
export async function readApiJson(response, requestUrl = "") {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return { data: {}, ok: response.ok };
  }
  if (trimmed.startsWith("<")) {
    throw new Error(
      `Reponse HTML (HTTP ${response.status}) — verifiez que l'API HubHex tourne. ${requestUrl}`,
    );
  }
  try {
    const data = JSON.parse(trimmed);
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

export async function readApiJsonOrThrow(response, requestUrl = "") {
  const { data, ok } = await readApiJson(response, requestUrl);
  if (!ok) {
    throw new Error(formatApiError(data) || `Erreur HTTP ${response.status}.`);
  }
  return data;
}
