const express = require("express");
const { z } = require("zod");

const { pool } = require("../config/db");
const { ensureUniqueSlug, slugify } = require("../lib/project-slug");
const { parsePositiveInt } = require("../lib/security");
const { authenticate } = require("../middlewares/authenticate");
const { requireProjectOwner } = require("../middlewares/require-project-owner");
const { filesRouter } = require("./files.routes");
const { tasksRouter } = require("./tasks.routes");

const projectsRouter = express.Router();

const PROJECT_FIELDS =
  "id, user_id, title, slug, description, technologies, visibility, created_at, updated_at";

const visibilityEnum = z.enum(["private", "public"]);

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: minuscules, chiffres et tirets uniquement.");

const normalizeTechnologies = (body) => {
  if (!body || typeof body !== "object" || !Object.prototype.hasOwnProperty.call(body, "technologies")) {
    return;
  }
  const raw = body.technologies;
  if (raw == null) {
    body.technologies = [];
    return;
  }
  if (Array.isArray(raw)) {
    body.technologies = raw.map((item) => String(item).trim()).filter((item) => item.length > 0);
    return;
  }
  if (typeof raw === "string") {
    body.technologies = raw.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
    return;
  }
  body.technologies = [];
};

const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().min(1).max(20_000),
  technologies: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  visibility: visibilityEnum.default("private"),
});

const updateProjectSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  slug: slugSchema.optional(),
  description: z.string().trim().min(1).max(20_000).optional(),
  technologies: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  visibility: visibilityEnum.optional(),
});

projectsRouter.use(authenticate);

projectsRouter.use("/:projectId/files", requireProjectOwner, filesRouter);
projectsRouter.use("/:projectId/tasks", requireProjectOwner, tasksRouter);

projectsRouter.post("/", async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (!Object.prototype.hasOwnProperty.call(body, "technologies")) {
      body.technologies = [];
    }
    normalizeTechnologies(body);
    const payload = createProjectSchema.parse(body);
    const technologies = payload.technologies.join(", ");
    const baseSlug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
    const slug = await ensureUniqueSlug(req.auth.userId, baseSlug);

    const result = await pool.query(
      `INSERT INTO projects (user_id, title, slug, description, technologies, visibility)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${PROJECT_FIELDS}`,
      [req.auth.userId, payload.title, slug, payload.description, technologies, payload.visibility],
    );

    return res.status(201).json({ project: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

projectsRouter.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${PROJECT_FIELDS}
       FROM projects
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.auth.userId],
    );
    return res.status(200).json({ projects: result.rows });
  } catch (error) {
    return next(error);
  }
});

projectsRouter.get("/:projectId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: { message: "Invalid project id." } });
    }

    const result = await pool.query(
      `SELECT ${PROJECT_FIELDS}
       FROM projects
       WHERE id = $1 AND user_id = $2`,
      [projectId, req.auth.userId],
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "Project not found." } });
    }
    return res.status(200).json({ project: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

projectsRouter.put("/:projectId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: { message: "Invalid project id." } });
    }

    const body = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(body, "technologies")) {
      normalizeTechnologies(body);
    }
    const payload = updateProjectSchema.parse(body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: { message: "No project data to update." } });
    }

    const existing = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, req.auth.userId],
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ error: { message: "Project not found." } });
    }

    const fields = [];
    const values = [];
    let index = 1;

    if (payload.title !== undefined) {
      fields.push(`title = $${index++}`);
      values.push(payload.title);
    }
    if (payload.slug !== undefined) {
      const slug = await ensureUniqueSlug(req.auth.userId, slugify(payload.slug), projectId);
      fields.push(`slug = $${index++}`);
      values.push(slug);
    }
    if (payload.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(payload.description);
    }
    if (payload.technologies !== undefined) {
      fields.push(`technologies = $${index++}`);
      values.push(payload.technologies.join(", "));
    }
    if (payload.visibility !== undefined) {
      fields.push(`visibility = $${index++}`);
      values.push(payload.visibility);
    }

    fields.push("updated_at = NOW()");
    values.push(projectId, req.auth.userId);

    const updateQuery = `
      UPDATE projects
      SET ${fields.join(", ")}
      WHERE id = $${index++} AND user_id = $${index}
      RETURNING ${PROJECT_FIELDS}
    `;

    const result = await pool.query(updateQuery, values);
    return res.status(200).json({ project: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

projectsRouter.delete("/:projectId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: { message: "Invalid project id." } });
    }

    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id",
      [projectId, req.auth.userId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "Project not found." } });
    }

    return res.status(200).json({ message: "Project deleted." });
  } catch (error) {
    return next(error);
  }
});

module.exports = { projectsRouter };
