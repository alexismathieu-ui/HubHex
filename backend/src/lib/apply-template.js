const { pool } = require("../config/db");
const { ensureUniqueSlug, slugify } = require("./project-slug");

const applyTemplateToProject = async (userId, templateId, overrides = {}) => {
  const templateResult = await pool.query(
    `SELECT id, user_id, name, description, default_technologies, default_tasks, is_system
     FROM project_templates
     WHERE id = $1 AND (is_system = true OR user_id = $2)`,
    [templateId, userId],
  );
  const template = templateResult.rows[0];
  if (!template) {
    const error = new Error("Template introuvable.");
    error.statusCode = 404;
    throw error;
  }

  const title = (overrides.title || template.name).trim();
  const description = (overrides.description || template.description).trim();
  const baseSlug = slugify(overrides.slug || title);
  const slug = await ensureUniqueSlug(userId, baseSlug);
  const technologies = overrides.technologies || template.default_technologies;
  const visibility = overrides.visibility || "private";

  const projectResult = await pool.query(
    `INSERT INTO projects (user_id, title, slug, description, technologies, visibility)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, title, slug, description, technologies, visibility, created_at, updated_at`,
    [userId, title, slug, description, technologies, visibility],
  );
  const project = projectResult.rows[0];

  const tasks = Array.isArray(template.default_tasks) ? template.default_tasks : [];
  let order = 0;
  for (const task of tasks) {
    if (!task?.title) {
      continue;
    }
    const status = ["todo", "in_progress", "done"].includes(task.status) ? task.status : "todo";
    await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [project.id, String(task.title).slice(0, 200), String(task.description || ""), status, order++],
    );
  }

  return project;
};

module.exports = { applyTemplateToProject };
