const express = require("express");
const { z } = require("zod");

const { pool } = require("../config/db");
const { parsePositiveInt } = require("../lib/security");

const journalRouter = express.Router({ mergeParams: true });

const entrySchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20_000),
});

journalRouter.get("/", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const result = await pool.query(
      `SELECT j.id, j.project_id, j.user_id, j.title, j.content, j.created_at,
              u.username, u.display_name
       FROM project_journal_entries j
       JOIN users u ON u.id = j.user_id
       WHERE j.project_id = $1
       ORDER BY j.created_at DESC`,
      [projectId],
    );
    return res.status(200).json({ entries: result.rows });
  } catch (error) {
    return next(error);
  }
});

journalRouter.post("/", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const payload = entrySchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO project_journal_entries (project_id, user_id, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, project_id, user_id, title, content, created_at`,
      [projectId, req.auth.userId, payload.title, payload.content],
    );
    return res.status(201).json({ entry: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

journalRouter.delete("/:entryId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const entryId = parsePositiveInt(req.params.entryId);
    const result = await pool.query(
      `DELETE FROM project_journal_entries
       WHERE id = $1 AND project_id = $2 AND user_id = $3
       RETURNING id`,
      [entryId, projectId, req.auth.userId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "Entree introuvable." } });
    }
    return res.status(200).json({ message: "Entree supprimee." });
  } catch (error) {
    return next(error);
  }
});

module.exports = { journalRouter };
