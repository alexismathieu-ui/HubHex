import type { ProjectFileListItem } from "../../types/depot";

/** Compare deux identifiants (number / string depuis l'API). */
export const idsMatch = (a: number | string | null | undefined, b: number | string | null | undefined): boolean => {
  if (a == null || b == null) {
    return false;
  }
  return Number(a) === Number(b);
};

const normalizeId = (id: number | string | null | undefined): number | null =>
  id == null ? null : Number(id);

const parentIdOf = (item: ProjectFileListItem): number | null => {
  if (!item) {
    return null;
  }
  const parentId = item.parent_id;
  return parentId == null ? null : normalizeId(parentId);
};

export const findNodeById = (
  nodes: ProjectFileListItem[],
  id: number | string,
): ProjectFileListItem | null => {
  for (const node of nodes) {
    if (idsMatch(node.id, id)) {
      return node;
    }
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

export const collectFolderIds = (nodes: ProjectFileListItem[], acc: number[] = []): number[] => {
  for (const node of nodes) {
    if (node.kind === "folder") {
      acc.push(node.id);
      if (node.children?.length) {
        collectFolderIds(node.children, acc);
      }
    }
  }
  return acc;
};

/** Chemin des ancetres + noeud cible dans l'arbre (repli si la liste plate echoue). */
export const findPathToNodeInTree = (
  nodes: ProjectFileListItem[],
  targetId: number | string,
  ancestors: string[] = [],
): string[] | null => {
  for (const node of nodes) {
    if (idsMatch(node.id, targetId)) {
      return [...ancestors, node.name];
    }
    if (node.kind === "folder" && node.children?.length) {
      const nested = findPathToNodeInTree(node.children, targetId, [...ancestors, node.name]);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
};

/**
 * Libelle du dossier destination (ex. /src/components).
 */
export const buildPathLabel = (
  items: ProjectFileListItem[],
  targetParentId: number | string | null | undefined,
  tree: ProjectFileListItem[] = [],
): string => {
  if (targetParentId == null || targetParentId === "") {
    return "/";
  }

  const targetKey = normalizeId(targetParentId);
  const byId = new Map<number | null, ProjectFileListItem>();
  for (const item of items) {
    byId.set(normalizeId(item.id), item);
  }

  const parts: string[] = [];
  let current = targetKey != null ? byId.get(targetKey) : undefined;
  const seen = new Set<number | null>();

  while (current && !seen.has(normalizeId(current.id))) {
    seen.add(normalizeId(current.id));
    parts.unshift(current.name);
    const parentKey = parentIdOf(current);
    current = parentKey != null ? byId.get(parentKey) : undefined;
  }

  if (parts.length) {
    return `/${parts.join("/")}`;
  }

  const fromTree = findPathToNodeInTree(tree, targetParentId);
  if (fromTree?.length) {
    return `/${fromTree.join("/")}`;
  }

  const node = findNodeById(tree, targetParentId);
  if (node?.name) {
    return `/${node.name}`;
  }

  return "/";
};
