/** Compare deux identifiants (number / string depuis l'API). */
export const idsMatch = (a, b) => {
  if (a == null || b == null) {
    return false;
  }
  return Number(a) === Number(b);
};

const normalizeId = (id) => (id == null ? null : Number(id));

const parentIdOf = (item) => {
  if (!item) {
    return null;
  }
  const parentId = item.parent_id ?? item.parentId;
  return parentId == null ? null : normalizeId(parentId);
};

export const findNodeById = (nodes, id) => {
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

export const collectFolderIds = (nodes, acc = []) => {
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
export const findPathToNodeInTree = (nodes, targetId, ancestors = []) => {
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
 * @param {Array} items - liste plate renvoyee par l'API
 * @param {number|string|null} targetParentId
 * @param {Array} [tree] - arbre pour repli
 */
export const buildPathLabel = (items, targetParentId, tree = []) => {
  if (targetParentId == null || targetParentId === "") {
    return "/";
  }

  const targetKey = normalizeId(targetParentId);
  const byId = new Map();
  for (const item of items) {
    byId.set(normalizeId(item.id), item);
  }

  const parts = [];
  let current = byId.get(targetKey);
  const seen = new Set();

  while (current && !seen.has(normalizeId(current.id))) {
    seen.add(normalizeId(current.id));
    parts.unshift(current.name);
    const parentKey = parentIdOf(current);
    current = parentKey != null ? byId.get(parentKey) : null;
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
