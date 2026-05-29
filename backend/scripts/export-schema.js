/**
 * Exporte le schema PostgreSQL HubHex (structure sans donnees utilisateur).
 * Usage: node scripts/export-schema.js > ../database/hubhex_schema.sql
 */
const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

const TABLES = [
  "users",
  "projects",
  "tasks",
  "comments",
  "password_reset_tokens",
  "refresh_tokens",
  "project_repositories",
  "project_files",
  "project_technical_notes",
  "project_stack_items",
  "project_journal_entries",
  "project_templates",
  "project_relations",
];

async function main() {
  const lines = [
    "-- HubHex — export schema",
    `-- Genere le ${new Date().toISOString()}`,
    "BEGIN;",
    "",
  ];

  for (const table of TABLES) {
    const exists = await pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    if (!exists.rows[0]) {
      lines.push(`-- Table ${table} absente (demarrer l'API une fois pour creer le schema).`);
      continue;
    }
    const cols = await pool.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table],
    );
    lines.push(`-- ${table}`);
    for (const col of cols.rows) {
      lines.push(
        `--   ${col.column_name} ${col.data_type} ${col.is_nullable === "NO" ? "NOT NULL" : "NULL"} ${col.column_default ? `DEFAULT ${col.column_default}` : ""}`.trim(),
      );
    }
    lines.push("");
  }

  lines.push("COMMIT;", "");
  const outPath = path.join(__dirname, "..", "..", "database", "hubhex_schema.sql");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`Schema exporte vers ${outPath}`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
