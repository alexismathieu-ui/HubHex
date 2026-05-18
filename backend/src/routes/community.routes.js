const express = require("express");
const { z } = require("zod");

const { pool } = require("../config/db");
const { escapeIlikePattern, parsePositiveInt } = require("../lib/security");
const { authenticate } = require("../middlewares/authenticate");
const { optionalAuthenticate } = require("../middlewares/optional-authenticate");
const {
  commentLimiter,
  communityReadLimiter,
} = require("../middlewares/rate-limiters");

const communityRouter = express.Router();

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

const listProjectsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  technology: z.string().trim().max(80).optional(),
  sort: z.enum(["recent", "popular"]).default("recent"),
});

const publicProjectFields = `
  p.id,
  p.title,
  p.slug,
  p.description,
  p.technologies,
  p.visibility,
  p.created_at,
  p.updated_at,
  u.id AS author_id,
  u.username AS author_username
`;

const publicProjectListFields = `
  ${publicProjectFields},
  COALESCE(cc.comment_count, 0)::int AS comment_count
`;

const buildPublicProjectsQuery = (filters) => {
  const conditions = ["p.visibility = 'public'"];
  const values = [];
  let index = 1;

  if (filters.q) {
    const pattern = `%${escapeIlikePattern(filters.q)}%`;
    conditions.push(`(
      p.title ILIKE $${index}
      OR p.description ILIKE $${index}
      OR p.technologies ILIKE $${index}
      OR u.username ILIKE $${index}
    )`);
    values.push(pattern);
    index += 1;
  }

  if (filters.technology) {
    conditions.push(`CONCAT(',', p.technologies, ',') ILIKE $${index}`);
    values.push(`%,${filters.technology},%`);
    index += 1;
  }

  const orderBy =
    filters.sort === "popular"
      ? "comment_count DESC, p.created_at DESC"
      : "p.created_at DESC";

  const query = `
    SELECT ${publicProjectListFields}
    FROM projects p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN (
      SELECT project_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY project_id
    ) cc ON cc.project_id = p.id
    WHERE ${conditions.join(" AND ")}
    ORDER BY ${orderBy}
    LIMIT 100
  `;

  return { query, values };
};

const fetchPublicProject = async (projectId) => {
  const result = await pool.query(
    `SELECT ${publicProjectFields}
     FROM projects p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = $1 AND p.visibility = 'public'`,
    [projectId],
  );
  return result.rows[0] ?? null;
};

communityRouter.get("/projects", communityReadLimiter, optionalAuthenticate, async (req, res, next) => {
  try {
    const filters = listProjectsQuerySchema.parse(req.query);
    const { query, values } = buildPublicProjectsQuery(filters);
    const result = await pool.query(query, values);

    const projects = result.rows.map((row) => ({
      ...row,
      is_mine: req.auth?.userId === row.author_id,
    }));

    return res.status(200).json({
      projects,
      filters: {
        q: filters.q ?? "",
        technology: filters.technology ?? "",
        sort: filters.sort,
      },
    });
  } catch (error) {
    return next(error);
  }
});

communityRouter.get(
  "/projects/:projectId",
  communityReadLimiter,
  optionalAuthenticate,
  async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: { message: "Invalid project id." } });
    }

    const project = await fetchPublicProject(projectId);
    if (!project) {
      return res.status(404).json({ error: { message: "Public project not found." } });
    }

    return res.status(200).json({
      project: {
        ...project,
        is_mine: req.auth?.userId === project.author_id,
      },
    });
  } catch (error) {
    return next(error);
  }
  },
);

communityRouter.get("/projects/:projectId/comments", communityReadLimiter, async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: { message: "Invalid project id." } });
    }

    const project = await fetchPublicProject(projectId);
    if (!project) {
      return res.status(404).json({ error: { message: "Public project not found." } });
    }

    const result = await pool.query(
      `SELECT c.id, c.project_id, c.user_id, c.content, c.created_at, c.updated_at,
              u.username AS author_username
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.project_id = $1
       ORDER BY c.created_at ASC`,
      [projectId],
    );

    return res.status(200).json({ comments: result.rows });
  } catch (error) {
    return next(error);
  }
});

communityRouter.post(
  "/projects/:projectId/comments",
  authenticate,
  commentLimiter,
  async (req, res, next) => {
  try {
    const projectId = parsePositiveInt(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ error: { message: "Invalid project id." } });
    }

    const project = await fetchPublicProject(projectId);
    if (!project) {
      return res.status(404).json({ error: { message: "Public project not found." } });
    }

    const payload = createCommentSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO comments (project_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, user_id, content, created_at, updated_at`,
      [projectId, req.auth.userId, payload.content],
    );

    const comment = {
      ...result.rows[0],
      author_username: req.auth.username,
    };

    return res.status(201).json({ comment });
  } catch (error) {
    return next(error);
  }
  },
);

communityRouter.delete(
  "/projects/:projectId/comments/:commentId",
  authenticate,
  async (req, res, next) => {
    try {
      const projectId = parsePositiveInt(req.params.projectId);
      const commentId = parsePositiveInt(req.params.commentId);
      if (!projectId || !commentId) {
        return res.status(400).json({ error: { message: "Invalid id." } });
      }

      const project = await fetchPublicProject(projectId);
      if (!project) {
        return res.status(404).json({ error: { message: "Public project not found." } });
      }

      const commentResult = await pool.query(
        "SELECT id, user_id FROM comments WHERE id = $1 AND project_id = $2",
        [commentId, projectId],
      );
      const comment = commentResult.rows[0];
      if (!comment) {
        return res.status(404).json({ error: { message: "Comment not found." } });
      }

      const isAuthor = comment.user_id === req.auth.userId;
      const isProjectOwner = project.author_id === req.auth.userId;
      if (!isAuthor && !isProjectOwner) {
        return res.status(403).json({
          error: { message: "You can only delete your own comments or moderate your project." },
        });
      }

      await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
      return res.status(200).json({ message: "Comment deleted." });
    } catch (error) {
      return next(error);
    }
  },
);

module.exports = { communityRouter };
