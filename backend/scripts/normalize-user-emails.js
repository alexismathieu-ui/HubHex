/**
 * Met tous les emails en minuscules (comptes crees avant normalisation stricte).
 *
 * Usage (depuis backend/) :
 *   node scripts/normalize-user-emails.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { Pool } = require("pg");

const run = async () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL manquant dans backend/.env");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await pool.query(
      "UPDATE users SET email = LOWER(TRIM(email)) WHERE email <> LOWER(TRIM(email)) RETURNING id, email",
    );
    console.log(`${result.rowCount} email(s) normalise(s).`);
    for (const row of result.rows) {
      console.log(`  - id ${row.id}: ${row.email}`);
    }
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
