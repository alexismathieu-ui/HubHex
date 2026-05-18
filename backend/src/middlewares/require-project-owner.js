const { pool } = require("../config/db");

const requireProjectOwner = async (req, res, next) => {
  const projectId = Number(req.params.projectId);
  if (!Number.isInteger(projectId)) {
    return res.status(400).json({ error: { message: "Invalid project id." } });
  }

  try {
    const result = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, req.auth.userId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: { message: "Project not found." } });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { requireProjectOwner };
