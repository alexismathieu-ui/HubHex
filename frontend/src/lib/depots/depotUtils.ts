import type { Project } from "../../types/hubhex";

export const slugify = (text: string): string => {
  const base = String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "depot";
};

export const depotPath = (username: string, slug: string): string => {
  if (!username || !slug) {
    return "";
  }
  return `${username}/${slug}`;
};

export const technologiesFromProject = (project: Pick<Project, "technologies">): string[] =>
  (project.technologies || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
