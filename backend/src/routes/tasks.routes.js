const express = require("express");
const { z } = require("zod");

const { pool } = require("../config/db");
const { parsePositiveInt } = require("../lib/security");

const tasksRouter = express.Router({ mergeParams: true });

const statusEnum = z.enum(["todo", "in_progress", "done"]);

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().default(""),
  status: statusEnum.optional().default("todo"),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  status: statusEnum.optional(),
  sort_order: z.number().int().min(0).max(1_000_000).optional(),
});

tasksRouter.get("/", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: { message: "Invalid project id." } });
    }
    const result = await pool.query(
      `SELECT id, project_id, title, description, status, sort_order, created_at, updated_at
       FROM tasks
       WHERE project_id = $1
       ORDER BY
         CASE status
           WHEN 'todo' THEN 0
           WHEN 'in_progress' THEN 1
           WHEN 'done' THEN 2
           ELSE 3
         END,
         sort_order ASC,
         created_at ASC`,
      [projectId],
    );
    return res.status(200).json({ tasks: result.rows });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.post("/", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: { message: "Invalid project id." } });
    }
    const payload = createTaskSchema.parse(req.body);

    const maxOrder = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM tasks WHERE project_id = $1 AND status = $2",
      [projectId, payload.status],
    );
    const nextOrder = Number(maxOrder.rows[0].max_order) + 1;

    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, project_id, title, description, status, sort_order, created_at, updated_at`,
      [projectId, payload.title, payload.description, payload.status, nextOrder],
    );

    return res.status(201).json({ task: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.put("/:taskId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: { message: "Invalid project id." } });
    }
    const taskId = parsePositiveInt(req.params.taskId);
    if (!taskId) {
      return res.status(400).json({ error: { message: "Invalid task id." } });
    }

    const payload = updateTaskSchema.parse(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: { message: "No task data to update." } });
    }

    const existing = await pool.query(
      "SELECT id, status FROM tasks WHERE id = $1 AND project_id = $2",
      [taskId, projectId],
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ error: { message: "Task not found." } });
    }

    if (payload.status !== undefined && payload.sort_order === undefined) {
      const currentStatus = existing.rows[0].status;
      if (payload.status !== currentStatus) {
        const maxOrder = await pool.query(
          `SELECT COALESCE(MAX(sort_order), -1) AS max_order
           FROM tasks
           WHERE project_id = $1 AND status = $2 AND id <> $3`,
          [projectId, payload.status, taskId],
        );
        payload.sort_order = Number(maxOrder.rows[0].max_order) + 1;
      }
    }

    const fields = [];
    const values = [];
    let index = 1;

    if (payload.title !== undefined) {
      fields.push(`title = $${index++}`);
      values.push(payload.title);
    }
    if (payload.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(payload.description);
    }
    if (payload.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(payload.status);
    }
    if (payload.sort_order !== undefined) {
      fields.push(`sort_order = $${index++}`);
      values.push(payload.sort_order);
    }

    fields.push("updated_at = NOW()");
    values.push(taskId, projectId);

    const updateQuery = `
      UPDATE tasks
      SET ${fields.join(", ")}
      WHERE id = $${index++} AND project_id = $${index}
      RETURNING id, project_id, title, description, status, sort_order, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, values);
    return res.status(200).json({ task: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.delete("/:taskId", async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: { message: "Invalid project id." } });
    }
    const taskId = parsePositiveInt(req.params.taskId);
    if (!taskId) {
      return res.status(400).json({ error: { message: "Invalid task id." } });
    }

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND project_id = $2 RETURNING id",
      [taskId, projectId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "Task not found." } });
    }

    return res.status(200).json({ message: "Task deleted." });
  } catch (error) {
    return next(error);
  }
});

module.exports = { tasksRouter };
