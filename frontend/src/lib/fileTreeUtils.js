export const findNodeById = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) {
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

export const buildPathLabel = (items, targetParentId) => {
  if (!targetParentId) {
    return "/";
  }
  const byId = new Map(items.map((item) => [item.id, item]));
  const parts = [];
  let current = byId.get(targetParentId);
  while (current) {
    parts.unshift(current.name);
    current = current.parent_id ? byId.get(current.parent_id) : null;
  }
  return `/${parts.join("/")}`;
};
