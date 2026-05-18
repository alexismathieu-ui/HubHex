const PROVIDER_META = {
  github: { label: "GitHub", badgeClass: "border-slate-600 bg-slate-800 text-slate-100" },
  gitlab: { label: "GitLab", badgeClass: "border-orange-800/60 bg-orange-950/50 text-orange-200" },
  bitbucket: { label: "Bitbucket", badgeClass: "border-blue-800/60 bg-blue-950/50 text-blue-200" },
  other: { label: "Git", badgeClass: "border-slate-700 bg-slate-900 text-slate-300" },
};

export const emptyRepositoryDraft = () => ({ label: "", url: "" });

export const repositoriesFromProject = (project) => {
  if (!project?.repositories?.length) {
    return [];
  }
  return project.repositories.map((repo) => ({
    label: repo.label || "",
    url: repo.url,
    provider: repo.provider,
  }));
};

export const detectProviderFromUrl = (url) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "github.com") {
      return "github";
    }
    if (host === "gitlab.com") {
      return "gitlab";
    }
    if (host === "bitbucket.org") {
      return "bitbucket";
    }
    return "other";
  } catch {
    return "other";
  }
};

export const parseRepositoryPath = (url) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1].replace(/\.git$/, "")}`;
    }
    return parsed.hostname;
  } catch {
    return url;
  }
};

export const repositoryDisplayName = (repo) => {
  if (repo.label?.trim()) {
    return repo.label.trim();
  }
  return parseRepositoryPath(repo.url);
};

export const providerMeta = (provider) => PROVIDER_META[provider] || PROVIDER_META.other;

export const repositoriesForApi = (drafts) =>
  drafts
    .filter((repo) => repo.url.trim())
    .map((repo) => ({
      label: repo.label.trim(),
      url: repo.url.trim(),
    }));

export const technologiesFromProject = (project) =>
  (project.technologies || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
