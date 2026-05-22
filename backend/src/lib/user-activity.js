const { pool } = require("../config/db");

async function fetchUserRecentActivity(userId, limit = 15) {
  const result = await pool.query(
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
    [userId, limit],
  );
  return result.rows;
}

module.exports = { fetchUserRecentActivity };
