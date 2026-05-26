const express = require("express");
const { z } = require("zod");

const { pool } = require("../config/db");
const { parsePositiveInt } = require("../lib/security");

const notesRouter = express.Router({ mergeParams: true });

const noteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(50_000).default(""),
});

notesRouter.get("/", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const result = await pool.query(
      `SELECT id, project_id, title, content, sort_order, created_at, updated_at
       FROM project_technical_notes WHERE project_id = $1 ORDER BY sort_order, created_at`,
      [projectId],
    );
    return res.status(200).json({ notes: result.rows });
  } catch (error) {
    return next(error);
  }
});

notesRouter.post("/", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const payload = noteSchema.parse(req.body);
    const maxOrder = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1) AS m FROM project_technical_notes WHERE project_id = $1",
      [projectId],
    );
    const sortOrder = Number(maxOrder.rows[0].m) + 1;
    const result = await pool.query(
      `INSERT INTO project_technical_notes (project_id, title, content, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id, project_id, title, content, sort_order, created_at, updated_at`,
      [projectId, payload.title, payload.content, sortOrder],
    );
    return res.status(201).json({ note: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

notesRouter.put("/:noteId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const noteId = parsePositiveInt(req.params.noteId);
    const payload = noteSchema.parse(req.body);
    const result = await pool.query(
      `UPDATE project_technical_notes
       SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3 AND project_id = $4
       RETURNING id, project_id, title, content, sort_order, created_at, updated_at`,
      [payload.title, payload.content, noteId, projectId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "Note introuvable." } });
    }
    return res.status(200).json({ note: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

notesRouter.delete("/:noteId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const noteId = parsePositiveInt(req.params.noteId);
    const result = await pool.query(
      "DELETE FROM project_technical_notes WHERE id = $1 AND project_id = $2 RETURNING id",
      [noteId, projectId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "Note introuvable." } });
    }
    return res.status(200).json({ message: "Note supprimee." });
  } catch (error) {
    return next(error);
  }
});

module.exports = { notesRouter };
