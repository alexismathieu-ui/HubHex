const express = require("express");
const { z } = require("zod");

const { pool } = require("../config/db");
const { authenticate } = require("../middlewares/authenticate");
const { dashboardLimiter } = require("../middlewares/rate-limiters");

const dashboardRouter = express.Router();

const dashboardQuerySchema = z.object({
  activityLimit: z.coerce.number().int().min(1).max(50).default(20),
});

dashboardRouter.use(authenticate);
dashboardRouter.use(dashboardLimiter);

dashboardRouter.get("/", async (req, res, next) => {
  try {
    const { activityLimit } = dashboardQuerySchema.parse(req.query);
    const userId = req.auth.userId;

    const [summaryResult, tasksByStatusResult, recentProjectsResult, recentActivityResult] =
      await Promise.all([
        pool.query(
          `SELECT
             COUNT(*)::int AS total_projects,
             COUNT(*) FILTER (WHERE visibility = 'public')::int AS public_projects,
             COUNT(*) FILTER (WHERE visibility = 'private')::int AS private_projects
           FROM projects
           WHERE user_id = $1`,
          [userId],
        ),
        pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE t.status = 'todo')::int AS todo,
             COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
             COUNT(*) FILTER (WHERE t.status = 'done')::int AS done,
             COUNT(*)::int AS total
           FROM tasks t
           INNER JOIN projects p ON p.id = t.project_id
           WHERE p.user_id = $1`,
          [userId],
        ),
        pool.query(
          `SELECT id, title, visibility, technologies, created_at, updated_at
           FROM projects
           WHERE user_id = $1
           ORDER BY updated_at DESC
           LIMIT 5`,
          [userId],
        ),
        pool.query(
          `SELECT type, entity_id, project_id, label, action, occurred_at
           FROM (
             SELECT
               'project'::text AS type,
               p.id AS entity_id,
               p.id AS project_id,
               p.title AS label,
               'updated'::text AS action,
               p.updated_at AS occurred_at
             FROM projects p
             WHERE p.user_id = $1

             UNION ALL

             SELECT
               'task'::text,
               t.id,
               t.project_id,
               t.title,
               'updated'::text,
               t.updated_at
             FROM tasks t
             INNER JOIN projects p ON p.id = t.project_id
             WHERE p.user_id = $1

             UNION ALL

             SELECT
               'comment'::text,
               c.id,
               c.project_id,
               LEFT(c.content, 120),
               'received'::text,
               c.created_at
             FROM comments c
             INNER JOIN projects p ON p.id = c.project_id
             WHERE p.user_id = $1
           ) activity
           ORDER BY occurred_at DESC
           LIMIT $2`,
          [userId, activityLimit],
        ),
      ]);

    const summaryRow = summaryResult.rows[0];
    const tasksRow = tasksByStatusResult.rows[0];

    return res.status(200).json({
      dashboard: {
        summary: {
          projects: {
            total: summaryRow.total_projects,
            public: summaryRow.public_projects,
            private: summaryRow.private_projects,
          },
          tasks: {
            total: tasksRow.total,
            todo: tasksRow.todo,
            in_progress: tasksRow.in_progress,
            done: tasksRow.done,
          },
        },
        recent_projects: recentProjectsResult.rows,
        recent_activity: recentActivityResult.rows,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = { dashboardRouter };
