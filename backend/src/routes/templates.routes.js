const express = require("express");
const { z } = require("zod");

const { pool } = require("../config/db");
const { applyTemplateToProject } = require("../lib/apply-template");
const { authenticate } = require("../middlewares/authenticate");

const templatesRouter = express.Router();

templatesRouter.use(authenticate);

templatesRouter.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, name, description, default_technologies, default_tasks, is_system, created_at
       FROM project_templates
       WHERE is_system = true OR user_id = $1
       ORDER BY is_system DESC, name ASC`,
      [req.auth.userId],
    );
    return res.status(200).json({ templates: result.rows });
  } catch (error) {
    return next(error);
  }
});

const applySchema = z.object({
  templateId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(20_000).optional(),
  visibility: z.enum(["private", "public"]).optional(),
});

templatesRouter.post("/apply", async (req, res, next) => {
  try {
    const payload = applySchema.parse(req.body);
    const project = await applyTemplateToProject(req.auth.userId, payload.templateId, {
      title: payload.title,
      slug: payload.slug,
      description: payload.description,
      visibility: payload.visibility,
    });
    return res.status(201).json({ project });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: { message: error.message } });
    }
    return next(error);
  }
});

module.exports = { templatesRouter };
