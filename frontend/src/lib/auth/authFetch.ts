import { fetchWithTimeout } from "../fetchWithTimeout";
import { tryRefreshAccessToken } from "./tokenRefresh";

/**
 * fetch avec renouvellement automatique du JWT si 401 ACCESS_TOKEN_EXPIRED.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs?: number,
): Promise<Response> {
  const hadAuth = Boolean(
    options.headers &&
      (options.headers instanceof Headers
        ? options.headers.has("Authorization")
        : Object.entries(options.headers as Record<string, string>).some(
            ([k]) => k.toLowerCase() === "authorization",
          )),
  );

  let response = await fetchWithTimeout(url, options, timeoutMs);

  if (!hadAuth || response.status !== 401) {
    return response;
  }

  let body: { error?: { code?: string; message?: string } } = {};
  try {
    body = await response.clone().json();
  } catch {
    return response;
  }

  const shouldRefresh =
    body.error?.code === "ACCESS_TOKEN_EXPIRED" ||
    /expired/i.test(body.error?.message || "");

  if (!shouldRefresh) {
    return response;
  }

  const newToken = await tryRefreshAccessToken();
  if (!newToken) {
    return response;
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${newToken}`);

  return fetchWithTimeout(url, { ...options, headers }, timeoutMs);
}
