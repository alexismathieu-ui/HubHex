/** Message d'erreur depuis catch (unknown). */
export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue."): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}
