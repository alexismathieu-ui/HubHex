/**
 * Jeu de donnees demo pour soutenance.
 * Usage: node scripts/seed-demo.js
 * Compte: demo@hubhex.dev / DemoHubHex1!
 */
const bcrypt = require("bcrypt");
const { pool } = require("../src/config/db");
const { ensureDatabaseSchema } = require("../src/config/db");
const { seedSystemTemplates } = require("../src/lib/seed-templates");

const DEMO_EMAIL = "demo@hubhex.dev";
const DEMO_PASSWORD = "DemoHubHex1!";
const DEMO_USERNAME = "demo";

async function main() {
  await ensureDatabaseSchema();
  await seedSystemTemplates();

  const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = $1", [
    DEMO_EMAIL.toLowerCase(),
  ]);

  let userId;
  if (existing.rows[0]) {
    userId = existing.rows[0].id;
    console.log("Utilisateur demo existant, mise a jour du mot de passe.");
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
  } else {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const inserted = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name, status_message, status_emoji)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [DEMO_USERNAME, DEMO_EMAIL, hash, "Demo HubHex", "Pret pour la soutenance", "🚀"],
    );
    userId = inserted.rows[0].id;
    console.log("Utilisateur demo cree.");
  }

  const projectCheck = await pool.query(
    "SELECT id FROM projects WHERE user_id = $1 AND slug = 'portfolio-demo'",
    [userId],
  );

  let projectId;
  if (!projectCheck.rows[0]) {
    const proj = await pool.query(
      `INSERT INTO projects (user_id, title, slug, description, technologies, visibility)
       VALUES ($1, $2, $3, $4, $5, 'public')
       RETURNING id`,
      [
        userId,
        "Portfolio Demo",
        "portfolio-demo",
        "Projet public de demonstration pour la communaute HubHex.",
        "Next.js,Node.js,PostgreSQL",
      ],
    );
    projectId = proj.rows[0].id;

    await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, sort_order) VALUES
       ($1, 'Maquettes UI', '', 'done', 0),
       ($1, 'API REST', '', 'in_progress', 1),
       ($1, 'Documentation', '', 'todo', 2)`,
      [projectId],
    );

    await pool.query(
      `INSERT INTO project_stack_items (project_id, name, url, status, snippet, sort_order) VALUES
       ($1, 'PostgreSQL', 'https://www.postgresql.org/', 'using', 'SELECT 1;', 0),
       ($1, 'Next.js', 'https://nextjs.org/', 'using', '', 1)`,
      [projectId],
    );

    await pool.query(
      `INSERT INTO project_journal_entries (project_id, user_id, title, content) VALUES
       ($1, $2, 'Choix monorepo', 'Frontend Next.js + backend Express pour un seul depot GitHub.')`,
      [projectId, userId],
    );

    await pool.query(
      `INSERT INTO project_technical_notes (project_id, title, content, sort_order) VALUES
       ($1, 'Endpoints principaux', '/api/auth, /api/projects, /api/community', 0)`,
      [projectId],
    );

    console.log("Projet demo portfolio-demo cree (public).");
  } else {
    projectId = projectCheck.rows[0].id;
    console.log("Projet demo deja present.");
  }

  console.log("\n--- Identifiants demo ---");
  console.log(`Email:    ${DEMO_EMAIL}`);
  console.log(`Mot de passe: ${DEMO_PASSWORD}`);
  console.log(`Chemin:   ${DEMO_USERNAME}/portfolio-demo`);
  console.log("\nTermine — le script s'arrete ici, c'est normal (pas un serveur).");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
