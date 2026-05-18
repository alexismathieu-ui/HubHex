const { pool } = require("../config/db");

const REPOSITORY_FIELDS = "id, project_id, label, url, provider, sort_order, created_at";

const fetchRepositoriesByProjectIds = async (projectIds) => {
  const map = new Map();
  if (!projectIds.length) {
    return map;
  }
  const result = await pool.query(
    `SELECT ${REPOSITORY_FIELDS}
     FROM project_repositories
     WHERE project_id = ANY($1::int[])
     ORDER BY project_id, sort_order ASC, id ASC`,
    [projectIds],
  );
  for (const row of result.rows) {
    if (!map.has(row.project_id)) {
      map.set(row.project_id, []);
    }
    map.get(row.project_id).push(row);
  }
  return map;
};

const attachRepositories = async (projects) => {
  if (!projects.length) {
    return projects;
  }
  const ids = projects.map((project) => project.id);
  const repoMap = await fetchRepositoriesByProjectIds(ids);
  return projects.map((project) => ({
    ...project,
    repositories: repoMap.get(project.id) ?? [],
  }));
};

const syncProjectRepositories = async (projectId, repositories) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM project_repositories WHERE project_id = $1", [projectId]);
    for (let index = 0; index < repositories.length; index += 1) {
      const repo = repositories[index];
      await client.query(
        `INSERT INTO project_repositories (project_id, label, url, provider, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [projectId, repo.label || "", repo.url, repo.provider, index],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const fetchRepositoriesForProject = async (projectId) => {
  const result = await pool.query(
    `SELECT ${REPOSITORY_FIELDS}
     FROM project_repositories
     WHERE project_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [projectId],
  );
  return result.rows;
};

module.exports = {
  attachRepositories,
  fetchRepositoriesForProject,
  syncProjectRepositories,
};
