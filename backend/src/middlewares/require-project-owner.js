const { pool } = require("../config/db");
const { parsePositiveInt } = require("../lib/security");

const requireProjectOwner = async (req, res, next) => {
  const projectId = parsePositiveInt(req.params.projectId);
  if (!projectId) {
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
