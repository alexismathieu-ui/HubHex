const express = require("express");
const { z } = require("zod");

const { pool } = require("../config/db");
const { parsePositiveInt } = require("../lib/security");
const { authenticate } = require("../middlewares/authenticate");

const graphRouter = express.Router();

graphRouter.use(authenticate);

graphRouter.get("/", async (req, res, next) => {
  try {
    const projectsResult = await pool.query(
      `SELECT id, title, slug, technologies, visibility
       FROM projects WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.auth.userId],
    );
    const projectIds = projectsResult.rows.map((row) => row.id);
    let edges = [];
    if (projectIds.length > 0) {
      const relationsResult = await pool.query(
        `SELECT id, source_project_id, target_project_id, relation_type, created_at
         FROM project_relations
         WHERE source_project_id = ANY($1::int[]) AND target_project_id = ANY($1::int[])`,
        [projectIds],
      );
      edges = relationsResult.rows;
    }
    return res.status(200).json({
      nodes: projectsResult.rows,
      edges,
    });
  } catch (error) {
    return next(error);
  }
});

const relationSchema = z.object({
  targetProjectId: z.coerce.number().int().positive(),
  relationType: z
    .enum(["related", "same_tech", "inspired_by", "continues"])
    .default("related"),
});

graphRouter.post("/relations", async (req, res, next) => {
  try {
    const sourceProjectId = parsePositiveInt(req.body.sourceProjectId);
    if (!sourceProjectId) {
      return res.status(400).json({ error: { message: "sourceProjectId invalide." } });
    }
    const payload = relationSchema.parse(req.body);

    const ownerCheck = await pool.query(
      "SELECT id FROM projects WHERE id = ANY($1::int[]) AND user_id = $2",
      [[sourceProjectId, payload.targetProjectId], req.auth.userId],
    );
    if (ownerCheck.rows.length < 2) {
      return res.status(404).json({ error: { message: "Projet introuvable." } });
    }
    if (sourceProjectId === payload.targetProjectId) {
      return res.status(400).json({ error: { message: "Impossible de lier un projet a lui-meme." } });
    }

    const result = await pool.query(
      `INSERT INTO project_relations (source_project_id, target_project_id, relation_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (source_project_id, target_project_id, relation_type) DO NOTHING
       RETURNING id, source_project_id, target_project_id, relation_type, created_at`,
      [sourceProjectId, payload.targetProjectId, payload.relationType],
    );
    if (!result.rows[0]) {
      return res.status(409).json({ error: { message: "Relation deja existante." } });
    }
    return res.status(201).json({ relation: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

graphRouter.delete("/relations/:relationId", async (req, res, next) => {
  try {
    const relationId = parsePositiveInt(req.params.relationId);
    const result = await pool.query(
      `DELETE FROM project_relations r
       USING projects p
       WHERE r.id = $1 AND r.source_project_id = p.id AND p.user_id = $2
       RETURNING r.id`,
      [relationId, req.auth.userId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "Relation introuvable." } });
    }
    return res.status(200).json({ message: "Relation supprimee." });
  } catch (error) {
    return next(error);
  }
});

module.exports = { graphRouter };
