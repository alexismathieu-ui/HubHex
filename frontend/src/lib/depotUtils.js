export const slugify = (text) => {
  const base = String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "depot";
};

export const depotPath = (username, slug) => {
  if (!username || !slug) {
    return "";
  }
  return `${username}/${slug}`;
};

export const technologiesFromProject = (project) =>
  (project.technologies || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
