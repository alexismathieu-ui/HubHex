const { pool } = require("../config/db");
const {
  MAX_FILE_CONTENT,
  MAX_FILES_PER_PROJECT,
  MAX_TREE_DEPTH,
  makeUniqueName,
  validateFileName,
} = require("./project-files");
const { parsePositiveInt } = require("./security");

const FILE_FIELDS = `id, project_id, parent_id, name, kind, encoding, mime_type, sort_order, created_at, updated_at,
  CASE
    WHEN kind = 'file' AND encoding = 'base64' THEN COALESCE('[binaire] ' || mime_type, '[binaire]')
    WHEN kind = 'file' THEN LEFT(content, 500)
    ELSE ''
  END AS content_preview`;

const countProjectFiles = async (projectId) => {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS total FROM project_files WHERE project_id = $1",
    [projectId],
  );
  return result.rows[0].total;
};

const fetchProjectFiles = async (projectId) => {
  const result = await pool.query(
    `SELECT ${FILE_FIELDS}
     FROM project_files
     WHERE project_id = $1
     ORDER BY parent_id NULLS FIRST, sort_order ASC, kind DESC, name ASC`,
    [projectId],
  );
  return result.rows;
};

const fetchNode = async (projectId, fileId) => {
  const result = await pool.query(
    `SELECT ${FILE_FIELDS}
     FROM project_files
     WHERE project_id = $1 AND id = $2`,
    [projectId, fileId],
  );
  return result.rows[0] ?? null;
};

const fetchNodeWithContent = async (projectId, fileId) => {
  const result = await pool.query(
    `SELECT id, project_id, parent_id, name, kind, content, encoding, mime_type, sort_order
     FROM project_files
     WHERE project_id = $1 AND id = $2`,
    [projectId, fileId],
  );
  return result.rows[0] ?? null;
};

const fetchSiblingNames = async (projectId, parentId, excludeId = null) => {
  const params = [projectId, parentId];
  let query = `
    SELECT name FROM project_files
    WHERE project_id = $1 AND parent_id IS NOT DISTINCT FROM $2
  `;
  if (excludeId) {
    query += " AND id != $3";
    params.push(excludeId);
  }
  const result = await pool.query(query, params);
  return new Set(result.rows.map((row) => row.name));
};

const resolveUniqueName = async (projectId, parentId, name, excludeId = null) => {
  const validName = validateFileName(name);
  const siblings = await fetchSiblingNames(projectId, parentId, excludeId);
  return makeUniqueName(siblings, validName);
};

const getDepth = async (projectId, fileId) => {
  let depth = 0;
  let currentId = fileId;
  while (currentId) {
    const result = await pool.query(
      "SELECT parent_id FROM project_files WHERE project_id = $1 AND id = $2",
      [projectId, currentId],
    );
    const row = result.rows[0];
    if (!row) {
      break;
    }
    depth += 1;
    currentId = row.parent_id;
    if (depth > MAX_TREE_DEPTH + 2) {
      break;
    }
  }
  return depth;
};

const getSubtreeMaxDepth = async (client, projectId, rootId) => {
  const result = await client.query(
    `WITH RECURSIVE subtree AS (
       SELECT id, 1 AS depth FROM project_files WHERE project_id = $1 AND id = $2
       UNION ALL
       SELECT pf.id, subtree.depth + 1
       FROM project_files pf
       INNER JOIN subtree ON pf.parent_id = subtree.id
       WHERE pf.project_id = $1
     )
     SELECT COALESCE(MAX(depth), 1)::int AS max_depth FROM subtree`,
    [projectId, rootId],
  );
  return result.rows[0].max_depth;
};

const isDescendant = async (projectId, ancestorId, nodeId) => {
  if (ancestorId === nodeId) {
    return true;
  }
  let currentId = nodeId;
  while (currentId) {
    const result = await pool.query(
      "SELECT parent_id FROM project_files WHERE project_id = $1 AND id = $2",
      [projectId, currentId],
    );
    const row = result.rows[0];
    if (!row) {
      return false;
    }
    if (row.parent_id === ancestorId) {
      return true;
    }
    currentId = row.parent_id;
  }
  return false;
};

const assertParentValid = async (projectId, parentId, movingRootId = null) => {
  if (parentId == null) {
    return null;
  }
  const parent = await fetchNode(projectId, parentId);
  if (!parent || parent.kind !== "folder") {
    const error = new Error("Target folder not found.");
    error.statusCode = 404;
    throw error;
  }
  if (movingRootId && (parentId === movingRootId || (await isDescendant(projectId, movingRootId, parentId)))) {
    const error = new Error("Cannot move a folder into itself or its descendants.");
    error.statusCode = 400;
    throw error;
  }
  const parentDepth = await getDepth(projectId, parentId);
  if (parentDepth >= MAX_TREE_DEPTH) {
    const error = new Error("Maximum folder depth reached.");
    error.statusCode = 400;
    throw error;
  }
  return parent;
};

const copySubtree = async (client, projectId, sourceId, targetParentId) => {
  const source = await fetchNodeWithContent(projectId, sourceId);
  if (!source) {
    return null;
  }

  const uniqueName = await resolveUniqueName(projectId, targetParentId, source.name);
  const insert = await client.query(
    `INSERT INTO project_files (project_id, parent_id, name, kind, content, encoding, mime_type, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      projectId,
      targetParentId,
      uniqueName,
      source.kind,
      source.kind === "file" ? source.content : "",
      source.kind === "file" ? source.encoding || "text" : "text",
      source.mime_type ?? null,
      source.sort_order,
    ],
  );
  const created = insert.rows[0];

  if (source.kind === "folder") {
    const children = await client.query(
      `SELECT id FROM project_files WHERE project_id = $1 AND parent_id = $2 ORDER BY sort_order, id`,
      [projectId, sourceId],
    );
    for (const child of children.rows) {
      await copySubtree(client, projectId, child.id, created.id);
    }
  }

  return created;
};

const moveNodes = async (projectId, sourceIds, targetParentId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const rawId of sourceIds) {
      const fileId = parsePositiveInt(rawId);
      if (!fileId) {
        continue;
      }
      const node = await fetchNode(projectId, fileId);
      if (!node) {
        continue;
      }

      if (node.parent_id === targetParentId) {
        continue;
      }

      await assertParentValid(projectId, targetParentId, node.kind === "folder" ? fileId : null);

      const subtreeDepth = node.kind === "folder" ? await getSubtreeMaxDepth(client, projectId, fileId) : 1;
      const targetDepth = targetParentId ? (await getDepth(projectId, targetParentId)) + 1 : 1;
      if (targetDepth + subtreeDepth - 1 > MAX_TREE_DEPTH) {
        const error = new Error("Move would exceed maximum folder depth.");
        error.statusCode = 400;
        throw error;
      }

      const uniqueName = await resolveUniqueName(projectId, targetParentId, node.name, fileId);
      await client.query(
        `UPDATE project_files
         SET parent_id = $1, name = $2, updated_at = NOW()
         WHERE project_id = $3 AND id = $4`,
        [targetParentId, uniqueName, projectId, fileId],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const pasteNodes = async (projectId, sourceIds, targetParentId, mode) => {
  if (mode === "cut") {
    await moveNodes(projectId, sourceIds, targetParentId);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const total = await countProjectFiles(projectId);
    let added = 0;

    for (const rawId of sourceIds) {
      const fileId = parsePositiveInt(rawId);
      if (!fileId) {
        continue;
      }
      const source = await fetchNode(projectId, fileId);
      if (
        source?.kind === "folder" &&
        targetParentId &&
        (await isDescendant(projectId, fileId, targetParentId))
      ) {
        const error = new Error("Cannot copy a folder into itself or its descendants.");
        error.statusCode = 400;
        throw error;
      }
      if (total + added >= MAX_FILES_PER_PROJECT) {
        const error = new Error("Maximum number of files reached for this depot.");
        error.statusCode = 400;
        throw error;
      }
      await assertParentValid(projectId, targetParentId);
      await copySubtree(client, projectId, fileId, targetParentId);
      added += 1;
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  MAX_FILE_CONTENT,
  assertParentValid,
  countProjectFiles,
  fetchNode,
  fetchProjectFiles,
  getDepth,
  isDescendant,
  moveNodes,
  pasteNodes,
  resolveUniqueName,
};
