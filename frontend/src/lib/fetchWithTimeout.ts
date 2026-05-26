const DEFAULT_MS = 12_000;

/**
 * fetch avec delai max — evite le "Chargement..." infini si l'API est arretee.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "L'API HubHex ne repond pas. Lancez le backend : cd backend puis npm run dev.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
