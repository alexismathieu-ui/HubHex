const { pool } = require("../config/db");

const SYSTEM_TEMPLATES = [
  {
    name: "Application web full-stack",
    description: "Projet type React/Node avec auth, API et deploiement.",
    default_technologies: "React,Node.js,PostgreSQL",
    default_tasks: [
      { title: "Configurer le monorepo", status: "todo" },
      { title: "Auth JWT + profil", status: "todo" },
      { title: "CRUD principal", status: "in_progress" },
      { title: "Tests et documentation", status: "todo" },
    ],
  },
  {
    name: "API REST securisee",
    description: "Backend Express avec validation, rate limits et logs.",
    default_technologies: "Node.js,Express,PostgreSQL",
    default_tasks: [
      { title: "Schema BDD", status: "todo" },
      { title: "Routes CRUD", status: "todo" },
      { title: "Securite (helmet, CORS, Zod)", status: "in_progress" },
    ],
  },
  {
    name: "Portfolio open source",
    description: "Mettre en avant des depots publics et la stack technique.",
    default_technologies: "Next.js,TypeScript,Tailwind CSS",
    default_tasks: [
      { title: "Page d'accueil", status: "todo" },
      { title: "Liste projets publics", status: "todo" },
      { title: "Stack vivante documentee", status: "todo" },
    ],
  },
];

const seedSystemTemplates = async () => {
  for (const template of SYSTEM_TEMPLATES) {
    const existing = await pool.query(
      "SELECT id FROM project_templates WHERE is_system = true AND name = $1",
      [template.name],
    );
    if (existing.rows[0]) {
      continue;
    }
    await pool.query(
      `INSERT INTO project_templates (user_id, name, description, default_technologies, default_tasks, is_system)
       VALUES (NULL, $1, $2, $3, $4::jsonb, true)`,
      [
        template.name,
        template.description,
        template.default_technologies,
        JSON.stringify(template.default_tasks),
      ],
    );
  }
};

module.exports = { seedSystemTemplates, SYSTEM_TEMPLATES };
