const { z } = require("zod");
const {
  MAX_BASE64_CONTENT_LENGTH,
  MAX_FILES_PER_PROJECT,
  MAX_IMPORT_BATCH_ENTRIES,
  MAX_TEXT_CONTENT_LENGTH,
  MAX_TREE_DEPTH,
} = require("./file-limits");

const MAX_NAME_LENGTH = 255;

const encodingSchema = z.enum(["text", "base64"]);

const fileNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_NAME_LENGTH)
  .refine((name) => !/[\\/]/.test(name) && name !== "." && name !== "..", {
    message: "Invalid file or folder name.",
  });

const kindSchema = z.enum(["file", "folder"]);

const validateFileName = (name) => fileNameSchema.parse(name);

const normalizeParentId = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return "invalid";
  }
  return parsed;
};

const buildTree = (rows) => {
  const map = new Map();
  const roots = [];

  for (const row of rows) {
    map.set(row.id, { ...row, children: [] });
  }

  for (const row of rows) {
    const node = map.get(row.id);
    if (row.parent_id == null) {
      roots.push(node);
    } else {
      const parent = map.get(row.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === "folder" ? -1 : 1;
      }
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children.length) {
        sortNodes(node.children);
      }
    }
  };

  sortNodes(roots);
  return roots;
};

const makeUniqueName = (existingNames, baseName) => {
  if (!existingNames.has(baseName)) {
    return baseName;
  }
  const extMatch = baseName.match(/^(.+?)(\.[^.]+)?$/);
  const stem = extMatch?.[1] ?? baseName;
  const ext = extMatch?.[2] ?? "";
  let index = 1;
  while (index < 200) {
    const candidate = `${stem} (${index})${ext}`;
    if (!existingNames.has(candidate)) {
      return candidate;
    }
    index += 1;
  }
  return `${stem}-${Date.now()}${ext}`;
};

module.exports = {
  MAX_BASE64_CONTENT: MAX_BASE64_CONTENT_LENGTH,
  MAX_BINARY_CONTENT: MAX_BASE64_CONTENT_LENGTH,
  MAX_FILE_CONTENT: MAX_TEXT_CONTENT_LENGTH,
  MAX_FILES_PER_PROJECT,
  MAX_IMPORT_BATCH: MAX_IMPORT_BATCH_ENTRIES,
  MAX_TREE_DEPTH,
  buildTree,
  encodingSchema,
  fileNameSchema,
  kindSchema,
  makeUniqueName,
  normalizeParentId,
  validateFileName,
};
