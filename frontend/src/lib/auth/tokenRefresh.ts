/** Callback enregistre par AuthContext pour renouveler le JWT d'acces. */
let refreshHandler: (() => Promise<string | null>) | null = null;

export function registerAccessTokenRefresh(handler: () => Promise<string | null>) {
  refreshHandler = handler;
}

export async function tryRefreshAccessToken(): Promise<string | null> {
  if (!refreshHandler) {
    return null;
  }
  return refreshHandler();
}
