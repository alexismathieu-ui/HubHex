const { pool } = require("../config/db");
const { fetchUserRecentActivity } = require("./user-activity");

const PROFILE_COLUMNS = `
  id,
  username,
  email,
  display_name,
  status_message,
  status_emoji,
  avatar_mime,
  created_at,
  profile_updated_at,
  (avatar_data IS NOT NULL AND avatar_data <> '') AS has_avatar
`;

async function fetchUserProfileStats(userId) {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM projects WHERE user_id = $1) AS projects_total,
       (SELECT COUNT(*)::int FROM projects WHERE user_id = $1 AND visibility = 'public') AS projects_public,
       (SELECT COUNT(*)::int FROM projects WHERE user_id = $1 AND visibility = 'private') AS projects_private,
       (SELECT COUNT(*)::int
        FROM tasks t
        INNER JOIN projects p ON p.id = t.project_id
        WHERE p.user_id = $1) AS tasks_total,
       (SELECT COUNT(*)::int FROM comments WHERE user_id = $1) AS comments_total`,
    [userId],
  );
  const row = result.rows[0];
  return {
    projects: {
      total: row.projects_total,
      public: row.projects_public,
      private: row.projects_private,
    },
    tasks: { total: row.tasks_total },
    comments: { total: row.comments_total },
  };
}

function mapProfileRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    display_name: row.display_name,
    status_message: row.status_message,
    status_emoji: row.status_emoji,
    has_avatar: Boolean(row.has_avatar),
    created_at: row.created_at,
    profile_updated_at: row.profile_updated_at,
  };
}

async function fetchUserProfile(userId, { activityLimit = 15 } = {}) {
  const result = await pool.query(
    `SELECT ${PROFILE_COLUMNS} FROM users WHERE id = $1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  const [stats, recent_activity] = await Promise.all([
    fetchUserProfileStats(userId),
    fetchUserRecentActivity(userId, activityLimit),
  ]);
  return {
    ...mapProfileRow(row),
    stats,
    recent_activity,
  };
}

async function fetchPublicUserByUsername(username) {
  const result = await pool.query(
    `SELECT
       id,
       username,
       display_name,
       status_message,
       status_emoji,
       created_at,
       (avatar_data IS NOT NULL AND avatar_data <> '') AS has_avatar
     FROM users
     WHERE username = $1`,
    [username],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  const stats = await fetchUserProfileStats(row.id);
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    status_message: row.status_message,
    status_emoji: row.status_emoji,
    has_avatar: Boolean(row.has_avatar),
    created_at: row.created_at,
    stats: {
      projects: { total: stats.projects.total, public: stats.projects.public },
      comments: { total: stats.comments.total },
    },
  };
}

async function fetchUserAvatarByUsername(username) {
  const result = await pool.query(
    `SELECT avatar_mime, avatar_data
     FROM users
     WHERE username = $1
       AND avatar_data IS NOT NULL
       AND avatar_data <> ''`,
    [username],
  );
  const row = result.rows[0];
  if (!row?.avatar_data) {
    return null;
  }
  return {
    mime: row.avatar_mime,
    buffer: Buffer.from(row.avatar_data, "base64"),
  };
}

module.exports = {
  fetchPublicUserByUsername,
  fetchUserAvatarByUsername,
  fetchUserProfile,
  fetchUserProfileStats,
  mapProfileRow,
};
