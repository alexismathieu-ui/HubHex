const express = require("express");
const { z } = require("zod");

const { pool } = require("../config/db");
const {
  buildTree,
  encodingSchema,
  kindSchema,
  MAX_BASE64_CONTENT,
  MAX_FILE_CONTENT,
  MAX_FILES_PER_PROJECT,
  MAX_IMPORT_BATCH,
} = require("../lib/project-files");
const { importBatch } = require("../lib/project-files-import");
const {
  countProjectFiles,
  fetchNode,
  fetchProjectFiles,
  getDepth,
  moveNodes,
  pasteNodes,
  resolveUniqueName,
} = require("../lib/project-files-db");
const { fileNameSchema } = require("../lib/project-files");
const { parsePositiveInt } = require("../lib/security");
const { filesLimiter } = require("../middlewares/rate-limiters");

const filesRouter = express.Router({ mergeParams: true });

const parentIdSchema = z.union([z.null(), z.coerce.number().int().positive()]);

const createFileSchema = z.object({
  parentId: parentIdSchema.optional().default(null),
  name: fileNameSchema,
  kind: kindSchema,
  content: z.string().max(MAX_BASE64_CONTENT).optional().default(""),
  encoding: encodingSchema.optional().default("text"),
  mimeType: z.string().trim().max(120).optional().nullable(),
});

const importEntrySchema = z.object({
  path: z.string().trim().min(1).max(2000),
  content: z.string().max(MAX_BASE64_CONTENT).default(""),
  encoding: encodingSchema.default("text"),
  mimeType: z.string().trim().max(120).optional().nullable(),
});

const importBatchSchema = z.object({
  parentId: parentIdSchema.optional().default(null),
  entries: z.array(importEntrySchema).min(1).max(MAX_IMPORT_BATCH),
});

const updateFileSchema = z
  .object({
    name: fileNameSchema.optional(),
    content: z.string().max(MAX_FILE_CONTENT).optional(),
  })
  .refine((data) => data.name !== undefined || data.content !== undefined, {
    message: "Nothing to update.",
  });

const moveSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(50),
  targetParentId: parentIdSchema,
});

const pasteSchema = z.object({
  sourceIds: z.array(z.coerce.number().int().positive()).min(1).max(50),
  targetParentId: parentIdSchema,
  mode: z.enum(["copy", "cut"]),
});

filesRouter.use(filesLimiter);

filesRouter.get("/", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const rows = await fetchProjectFiles(projectId);
    return res.status(200).json({
      tree: buildTree(rows),
      items: rows,
    });
  } catch (error) {
    return next(error);
  }
});

filesRouter.post("/", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const payload = createFileSchema.parse(req.body);

    if (payload.kind === "folder" && payload.content) {
      payload.content = "";
    }

    const total = await countProjectFiles(projectId);
    if (total >= MAX_FILES_PER_PROJECT) {
      return res.status(400).json({
        error: { message: "Maximum number of files reached for this depot." },
      });
    }

    if (payload.parentId) {
      const parent = await fetchNode(projectId, payload.parentId);
      if (!parent || parent.kind !== "folder") {
        return res.status(404).json({ error: { message: "Parent folder not found." } });
      }
      const depth = await getDepth(projectId, payload.parentId);
      if (depth >= 20) {
        return res.status(400).json({ error: { message: "Maximum folder depth reached." } });
      }
    }

    const name = await resolveUniqueName(projectId, payload.parentId, payload.name);
    const encoding = payload.kind === "file" ? payload.encoding : "text";
    const content = payload.kind === "file" ? payload.content : "";
    if (encoding === "text" && content.length > MAX_FILE_CONTENT) {
      return res.status(400).json({ error: { message: "Text file too large." } });
    }

    const result = await pool.query(
      `INSERT INTO project_files (project_id, parent_id, name, kind, content, encoding, mime_type, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
       RETURNING id, project_id, parent_id, name, kind, encoding, mime_type, sort_order, created_at, updated_at,
         CASE
           WHEN kind = 'file' AND encoding = 'base64' THEN COALESCE('[binaire] ' || mime_type, '[binaire]')
           WHEN kind = 'file' THEN LEFT(content, 500)
           ELSE ''
         END AS content_preview`,
      [
        projectId,
        payload.parentId,
        name,
        payload.kind,
        content,
        encoding,
        payload.mimeType ?? null,
      ],
    );

    return res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

filesRouter.patch("/:fileId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const fileId = parsePositiveInt(req.params.fileId);
    if (!fileId) {
      return res.status(400).json({ error: { message: "Invalid file id." } });
    }

    const existing = await fetchNode(projectId, fileId);
    if (!existing) {
      return res.status(404).json({ error: { message: "File not found." } });
    }

    const payload = updateFileSchema.parse(req.body);
    const fields = [];
    const values = [];
    let index = 1;

    if (payload.name !== undefined) {
      const name = await resolveUniqueName(projectId, existing.parent_id, payload.name, fileId);
      fields.push(`name = $${index++}`);
      values.push(name);
    }
    if (payload.content !== undefined && existing.kind === "file") {
      fields.push(`content = $${index++}`);
      values.push(payload.content);
    }

    fields.push("updated_at = NOW()");
    values.push(projectId, fileId);

    const result = await pool.query(
      `UPDATE project_files
       SET ${fields.join(", ")}
       WHERE project_id = $${index++} AND id = $${index}
       RETURNING id, project_id, parent_id, name, kind,
         CASE WHEN kind = 'file' THEN LEFT(content, 500) ELSE '' END AS content_preview,
         sort_order, created_at, updated_at`,
      values,
    );

    return res.status(200).json({ item: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

filesRouter.delete("/:fileId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const fileId = parsePositiveInt(req.params.fileId);
    if (!fileId) {
      return res.status(400).json({ error: { message: "Invalid file id." } });
    }

    const result = await pool.query(
      "DELETE FROM project_files WHERE project_id = $1 AND id = $2 RETURNING id",
      [projectId, fileId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "File not found." } });
    }

    return res.status(200).json({ message: "Deleted." });
  } catch (error) {
    return next(error);
  }
});

const handleFileOpError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: { message: error.message } });
  }
  return next(error);
};

filesRouter.post("/move", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const payload = moveSchema.parse(req.body);
    await moveNodes(projectId, payload.ids, payload.targetParentId);
    const rows = await fetchProjectFiles(projectId);
    return res.status(200).json({ tree: buildTree(rows), items: rows });
  } catch (error) {
    return handleFileOpError(error, res, next);
  }
});

filesRouter.post("/import-batch", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const payload = importBatchSchema.parse(req.body);

    if (payload.parentId) {
      const parent = await fetchNode(projectId, payload.parentId);
      if (!parent || parent.kind !== "folder") {
        return res.status(404).json({ error: { message: "Parent folder not found." } });
      }
    }

    await importBatch(projectId, payload.parentId, payload.entries);
    const rows = await fetchProjectFiles(projectId);
    return res.status(200).json({
      tree: buildTree(rows),
      items: rows,
      imported: payload.entries.length,
    });
  } catch (error) {
    return handleFileOpError(error, res, next);
  }
});

filesRouter.post("/paste", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const payload = pasteSchema.parse(req.body);
    await pasteNodes(projectId, payload.sourceIds, payload.targetParentId, payload.mode);
    const rows = await fetchProjectFiles(projectId);
    return res.status(200).json({ tree: buildTree(rows), items: rows });
  } catch (error) {
    return handleFileOpError(error, res, next);
  }
});

module.exports = { filesRouter };
