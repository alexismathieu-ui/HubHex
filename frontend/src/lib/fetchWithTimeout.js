const DEFAULT_MS = 12_000;

/**
 * fetch avec delai max — evite le "Chargement..." infini si l'API est arretee.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "L'API HubHex ne repond pas. Lancez le backend : cd backend puis npm run dev.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
