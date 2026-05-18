const getPool = () => require("../config/db").pool;

const slugify = (text) => {
  const base = String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "depot";
};

const ensureUniqueSlug = async (userId, baseSlug, excludeProjectId = null) => {
  let candidate = slugify(baseSlug);
  let suffix = 0;

  while (suffix < 200) {
    const slug = suffix === 0 ? candidate : `${candidate}-${suffix}`;
    const params = [userId, slug];
    let query = "SELECT id FROM projects WHERE user_id = $1 AND slug = $2";
    if (excludeProjectId) {
      query += " AND id != $3";
      params.push(excludeProjectId);
    }
    const result = await getPool().query(query, params);
    if (result.rows.length === 0) {
      return slug;
    }
    suffix += 1;
  }

  return `${candidate}-${Date.now()}`;
};

const backfillProjectSlugs = async () => {
  const result = await getPool().query(
    `SELECT id, title, user_id, slug
     FROM projects
     ORDER BY id ASC`,
  );

  const usedByUser = new Map();

  for (const row of result.rows) {
    const used = usedByUser.get(row.user_id) ?? new Set();
    let slug = row.slug?.trim();

    if (!slug || slug === "depot" || used.has(slug)) {
      const base = slugify(row.title);
      slug = base;
      let suffix = 0;
      while (used.has(slug)) {
        suffix += 1;
        slug = `${base}-${suffix}`;
      }
      await getPool().query("UPDATE projects SET slug = $1 WHERE id = $2", [slug, row.id]);
    }

    used.add(slug);
    usedByUser.set(row.user_id, used);
  }
};

module.exports = {
  slugify,
  ensureUniqueSlug,
  backfillProjectSlugs,
};
