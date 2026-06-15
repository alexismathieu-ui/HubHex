const express = require("express");
const { z } = require("zod");

const { pool } = require("../config/db");
const { parsePositiveInt } = require("../lib/security");

const stackRouter = express.Router({ mergeParams: true });

const stackItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().max(2000).default(""),
  status: z.enum(["planned", "learning", "using"]).default("using"),
  snippet: z.string().trim().max(10_000).default(""),
});

stackRouter.get("/", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const result = await pool.query(
      `SELECT id, project_id, name, url, status, snippet, sort_order, created_at, updated_at
       FROM project_stack_items WHERE project_id = $1 ORDER BY sort_order, created_at`,
      [projectId],
    );
    return res.status(200).json({ items: result.rows });
  } catch (error) {
    return next(error);
  }
});

/** Aligne les fiches stack sur les badges technologies du depot (source unique). */
stackRouter.post("/sync", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const projectResult = await pool.query("SELECT technologies FROM projects WHERE id = $1", [
      projectId,
    ]);
    if (!projectResult.rows[0]) {
      return res.status(404).json({ error: { message: "Projet introuvable." } });
    }

    const techNames = (projectResult.rows[0].technologies || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const uniqueTechs = [...new Map(techNames.map((name) => [name.toLowerCase(), name])).values()];

    const existing = await pool.query(
      "SELECT id, name FROM project_stack_items WHERE project_id = $1",
      [projectId],
    );
    const existingByLower = new Map(existing.rows.map((row) => [row.name.toLowerCase(), row]));
    const techLowerSet = new Set(uniqueTechs.map((name) => name.toLowerCase()));

    const maxOrder = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1) AS m FROM project_stack_items WHERE project_id = $1",
      [projectId],
    );
    let sortOrder = Number(maxOrder.rows[0].m) + 1;

    for (const name of uniqueTechs) {
      if (!existingByLower.has(name.toLowerCase())) {
        await pool.query(
          `INSERT INTO project_stack_items (project_id, name, url, status, snippet, sort_order)
           VALUES ($1, $2, '', 'learning', '', $3)`,
          [projectId, name, sortOrder],
        );
        sortOrder += 1;
      }
    }

    for (const row of existing.rows) {
      if (!techLowerSet.has(row.name.toLowerCase())) {
        await pool.query("DELETE FROM project_stack_items WHERE id = $1", [row.id]);
      }
    }

    const result = await pool.query(
      `SELECT id, project_id, name, url, status, snippet, sort_order, created_at, updated_at
       FROM project_stack_items WHERE project_id = $1 ORDER BY sort_order, created_at`,
      [projectId],
    );
    return res.status(200).json({ items: result.rows });
  } catch (error) {
    return next(error);
  }
});

stackRouter.post("/", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const payload = stackItemSchema.parse(req.body);
    const maxOrder = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1) AS m FROM project_stack_items WHERE project_id = $1",
      [projectId],
    );
    const sortOrder = Number(maxOrder.rows[0].m) + 1;
    const result = await pool.query(
      `INSERT INTO project_stack_items (project_id, name, url, status, snippet, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, project_id, name, url, status, snippet, sort_order, created_at, updated_at`,
      [projectId, payload.name, payload.url, payload.status, payload.snippet, sortOrder],
    );
    return res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

stackRouter.put("/:itemId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const itemId = parsePositiveInt(req.params.itemId);
    const payload = stackItemSchema.parse(req.body);
    const result = await pool.query(
      `UPDATE project_stack_items
       SET name = $1, url = $2, status = $3, snippet = $4, updated_at = NOW()
       WHERE id = $5 AND project_id = $6
       RETURNING id, project_id, name, url, status, snippet, sort_order, created_at, updated_at`,
      [payload.name, payload.url, payload.status, payload.snippet, itemId, projectId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "Element stack introuvable." } });
    }
    return res.status(200).json({ item: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

stackRouter.delete("/:itemId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    const itemId = parsePositiveInt(req.params.itemId);
    const result = await pool.query(
      "DELETE FROM project_stack_items WHERE id = $1 AND project_id = $2 RETURNING id",
      [itemId, projectId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "Element stack introuvable." } });
    }
    return res.status(200).json({ message: "Element supprime." });
  } catch (error) {
    return next(error);
  }
});

module.exports = { stackRouter };
