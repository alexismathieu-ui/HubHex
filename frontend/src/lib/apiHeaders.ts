/** En-tetes Authorization (+ JSON optionnel) pour l'API HubHex. */
export function createAuthHeaders(token: string, json = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}
