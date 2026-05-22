require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const email = process.argv[2] || "test@hubhex.dev";
const password = process.argv[3] || "MotDePasse1";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const result = await pool.query(
    "SELECT id, username, email, password_hash FROM users WHERE LOWER(email) = $1",
    [email.toLowerCase()],
  );
  const user = result.rows[0];
  if (!user) {
    console.log("Aucun utilisateur pour:", email);
    process.exit(1);
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  console.log({
    id: user.id,
    username: user.username,
    email: user.email,
    passwordMatches: ok,
  });
  await pool.end();
  process.exit(ok ? 0 : 1);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
