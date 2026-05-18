const { pool } = require("../config/db");
const { MAX_FILES_PER_PROJECT, MAX_TREE_DEPTH, validateFileName } = require("./project-files");
const { makeUniqueName } = require("./project-files");
const { normalizeImportPath, validateImportBatch } = require("./file-import-security");

const findChildFolder = async (client, projectId, parentId, name) => {
  const result = await client.query(
    `SELECT id FROM project_files
     WHERE project_id = $1 AND parent_id IS NOT DISTINCT FROM $2 AND kind = 'folder' AND name = $3`,
    [projectId, parentId, name],
  );
  return result.rows[0]?.id ?? null;
};

const resolveUniqueNameTx = async (client, projectId, parentId, name) => {
  const result = await client.query(
    `SELECT name FROM project_files
     WHERE project_id = $1 AND parent_id IS NOT DISTINCT FROM $2`,
    [projectId, parentId],
  );
  const siblings = new Set(result.rows.map((row) => row.name));
  return makeUniqueName(siblings, validateFileName(name));
};

const insertFolder = async (client, projectId, parentId, name) => {
  const uniqueName = await resolveUniqueNameTx(client, projectId, parentId, name);
  const result = await client.query(
    `INSERT INTO project_files (project_id, parent_id, name, kind, content, encoding, mime_type, sort_order)
     VALUES ($1, $2, $3, 'folder', '', 'text', NULL, 0)
     RETURNING id`,
    [projectId, parentId, uniqueName],
  );
  return result.rows[0].id;
};

const insertFile = async (client, projectId, parentId, name, content, encoding, mimeType) => {
  const uniqueName = await resolveUniqueNameTx(client, projectId, parentId, name);
  await client.query(
    `INSERT INTO project_files (project_id, parent_id, name, kind, content, encoding, mime_type, sort_order)
     VALUES ($1, $2, $3, 'file', $4, $5, $6, 0)`,
    [projectId, parentId, uniqueName, content, encoding, mimeType || null],
  );
};

const importBatch = async (projectId, baseParentId, entries) => {
  validateImportBatch(entries);
  const client = await pool.connect();
  const folderCache = new Map();

  const folderKey = (parentId, segments) =>
    `${parentId ?? "root"}/${segments.join("/")}`;

  try {
    await client.query("BEGIN");

    let total = (
      await client.query("SELECT COUNT(*)::int AS total FROM project_files WHERE project_id = $1", [
        projectId,
      ])
    ).rows[0].total;

    const sorted = [...entries].sort((a, b) => {
      const pa = normalizeImportPath(a.path);
      const pb = normalizeImportPath(b.path);
      return pa.join("/").localeCompare(pb.join("/"));
    });

    for (const entry of sorted) {
      const parts = normalizeImportPath(entry.path);
      if (!parts.length) {
        continue;
      }

      if (parts.length > MAX_TREE_DEPTH) {
        const error = new Error(`Path too deep: ${entry.path}`);
        error.statusCode = 400;
        throw error;
      }

      if (total >= MAX_FILES_PER_PROJECT) {
        const error = new Error("Maximum number of files reached for this depot.");
        error.statusCode = 400;
        throw error;
      }

      let currentParentId = baseParentId;

      for (let index = 0; index < parts.length - 1; index += 1) {
        const folderName = validateFileName(parts[index]);
        const key = folderKey(currentParentId, parts.slice(0, index + 1));

        if (!folderCache.has(key)) {
          let folderId = await findChildFolder(client, projectId, currentParentId, folderName);
          if (!folderId) {
            folderId = await insertFolder(client, projectId, currentParentId, folderName);
            total += 1;
          }
          folderCache.set(key, folderId);
        }

        currentParentId = folderCache.get(key);
      }

      const fileName = validateFileName(parts[parts.length - 1]);
      const encoding = entry.encoding === "base64" ? "base64" : "text";
      const content = String(entry.content ?? "");

      await insertFile(
        client,
        projectId,
        currentParentId,
        fileName,
        content,
        encoding,
        entry.mimeType ?? null,
      );
      total += 1;
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
  importBatch,
};
