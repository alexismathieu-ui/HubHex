/** Utilitaires projet (technologies affichees sur les depots). */

export const technologiesFromProject = (project: { technologies?: string } | null | undefined): string[] =>
  (project?.technologies || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
