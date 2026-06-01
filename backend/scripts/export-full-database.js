/**
 * Export complet PostgreSQL HubHex (structure + donnees).
 *
 * Usage (depuis backend/) :
 *   npm run db:dump
 *   node scripts/export-full-database.js [--out ../database/hubhex_full_dump.sql]
 *
 * 1. Tente pg_dump (PATH ou installation PostgreSQL Windows courante)
 * 2. Sinon genere un fichier SQL restaurable via Node (DDL live + INSERT)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { Pool } = require("pg");

const TABLES_IN_FK_ORDER = [
  "users",
  "refresh_tokens",
  "project_templates",
  "projects",
  "password_reset_tokens",
  "project_repositories",
  "project_files",
  "tasks",
  "comments",
  "project_technical_notes",
  "project_stack_items",
  "project_journal_entries",
  "project_relations",
];

const PG_DUMP_CANDIDATES = [
  process.env.PG_DUMP_PATH,
  "pg_dump",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe",
  "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe",
  "C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe",
].filter(Boolean);

function resolveOutputPath() {
  const outArg = process.argv.find((arg) => arg.startsWith("--out="));
  if (outArg) return path.resolve(outArg.slice("--out=".length));
  const outIdx = process.argv.indexOf("--out");
  if (outIdx !== -1 && process.argv[outIdx + 1]) {
    return path.resolve(process.argv[outIdx + 1]);
  }
  return path.join(__dirname, "..", "..", "database", "hubhex_full_dump.sql");
}

function findPgDump() {
  for (const candidate of PG_DUMP_CANDIDATES) {
    if (candidate === "pg_dump" || candidate.endsWith("pg_dump.exe")) {
      const probe = spawnSync(candidate, ["--version"], { encoding: "utf8", windowsHide: true });
      if (probe.status === 0) return candidate;
      continue;
    }
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function runPgDump(databaseUrl, outPath) {
  const pgDump = findPgDump();
  if (!pgDump) return false;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const args = [
    "--no-owner",
    "--no-acl",
    "--clean",
    "--if-exists",
    "--encoding=UTF8",
    "--file",
    outPath,
    databaseUrl,
  ];

  const result = spawnSync(pgDump, args, { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) {
    console.warn("pg_dump a echoue, bascule sur export Node :", result.stderr || result.stdout);
    return false;
  }
  return true;
}

function escapeSqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "NULL";
    return String(value);
  }
  if (value instanceof Date) return `'${value.toISOString().replace(/'/g, "''")}'`;
  if (Buffer.isBuffer(value)) return `'\\x${value.toString("hex")}'`;
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

async function tableExists(client, tableName) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName],
  );
  return Boolean(rows[0]);
}

async function buildCreateTableDDL(client, tableName) {
  const columns = await client.query(
    `
    SELECT
      a.attname AS column_name,
      pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
      a.attnotnull AS not_null,
      pg_get_expr(ad.adbin, ad.adrelid) AS column_default
    FROM pg_catalog.pg_attribute a
    LEFT JOIN pg_catalog.pg_attrdef ad
      ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
    WHERE a.attrelid = $1::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped
    ORDER BY a.attnum
    `,
    [`public.${tableName}`],
  );

  if (!columns.rows.length) return null;

  const colDefs = columns.rows.map((col) => {
    let def = `  ${col.column_name} ${col.data_type}`;
    if (col.column_default) def += ` DEFAULT ${col.column_default}`;
    if (col.not_null) def += " NOT NULL";
    return def;
  });

  const constraints = await client.query(
    `
    SELECT pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = $1
      AND c.contype IN ('p', 'f', 'c', 'u')
    ORDER BY c.contype, c.conname
    `,
    [tableName],
  );

  for (const row of constraints.rows) {
    colDefs.push(`  ${row.def}`);
  }

  return `CREATE TABLE ${tableName} (\n${colDefs.join(",\n")}\n);`;
}

async function exportWithNode(databaseUrl, outPath) {
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  const lines = [
    "-- HubHex — export complet (structure + donnees)",
    `-- Genere le ${new Date().toISOString()}`,
    "-- Restauration : psql \"$DATABASE_URL\" -f hubhex_full_dump.sql",
    "-- Attention : contient mots de passe hashes et donnees utilisateur — ne pas commiter.",
    "",
    "BEGIN;",
    "SET session_replication_role = replica;",
    "",
  ];

  try {
    for (const table of [...TABLES_IN_FK_ORDER].reverse()) {
      if (await tableExists(client, table)) {
        lines.push(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      }
    }
    lines.push("");

    for (const table of TABLES_IN_FK_ORDER) {
      if (!(await tableExists(client, table))) {
        lines.push(`-- Table ${table} absente (demarrer l'API une fois pour creer le schema).`);
        lines.push("");
        continue;
      }

      const ddl = await buildCreateTableDDL(client, table);
      if (ddl) {
        lines.push(ddl);
        lines.push("");
      }

      const { rows } = await client.query(`SELECT * FROM ${table} ORDER BY id`);
      if (!rows.length) {
        lines.push(`-- ${table} : 0 ligne`);
        lines.push("");
        continue;
      }

      const columns = Object.keys(rows[0]);
      const colList = columns.join(", ");
      lines.push(`-- ${table} : ${rows.length} ligne(s)`);

      for (const row of rows) {
        const values = columns.map((col) => escapeSqlLiteral(row[col])).join(", ");
        lines.push(`INSERT INTO ${table} (${colList}) VALUES (${values});`);
      }
      lines.push("");
    }

    for (const table of TABLES_IN_FK_ORDER) {
      if (!(await tableExists(client, table))) continue;
      const hasId = await client.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'id'`,
        [table],
      );
      if (!hasId.rows[0]) continue;

      lines.push(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true);`,
      );
    }

    lines.push("");
    lines.push("SET session_replication_role = DEFAULT;");
    lines.push("COMMIT;");
    lines.push("");

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL manquant dans backend/.env");
    process.exit(1);
  }

  const outPath = resolveOutputPath();
  console.log(`Export vers ${outPath} ...`);

  if (runPgDump(databaseUrl, outPath)) {
    const stats = fs.statSync(outPath);
    console.log(`Export pg_dump reussi (${Math.round(stats.size / 1024)} Ko).`);
    console.log("Ne commitez pas ce fichier s'il contient des donnees reelles.");
    return;
  }

  console.log("pg_dump indisponible — export SQL via Node ...");
  await exportWithNode(databaseUrl, outPath);
  const stats = fs.statSync(outPath);
  console.log(`Export Node reussi (${Math.round(stats.size / 1024)} Ko).`);
  console.log("Ne commitez pas ce fichier s'il contient des donnees reelles.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
