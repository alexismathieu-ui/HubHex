/**
 * Reinitialise le mot de passe d'un compte (developpement / recuperation).
 *
 * Usage (depuis backend/) :
 *   node scripts/reset-user-password.js email@exemple.com NouveauMot1
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const { passwordMeetsPolicy } = require("../src/lib/security");

const run = async () => {
  const email = process.argv[2]?.trim().toLowerCase();
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Usage: node scripts/reset-user-password.js <email> <nouveauMotDePasse>");
    console.error("Exemple: node scripts/reset-user-password.js user@test.com MonMotDePasse1");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL manquant dans backend/.env");
    process.exit(1);
  }

  if (!passwordMeetsPolicy(newPassword)) {
    console.error(
      "Le mot de passe doit faire au moins 8 caracteres et contenir une lettre et un chiffre.",
    );
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_SCRIPTS !== "true") {
    console.error(
      "Refuse en production. Definis ALLOW_ADMIN_SCRIPTS=true uniquement si tu maitrises l'environnement.",
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const found = await pool.query("SELECT id, email FROM users WHERE LOWER(email) = $1", [
      email,
    ]);
    const user = found.rows[0];
    if (!user) {
      console.error(`Aucun compte trouve pour: ${email}`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE users SET email = LOWER(email), password_hash = $1, password_changed_at = NOW() WHERE id = $2",
      [passwordHash, user.id],
    );

    console.log(`Mot de passe mis a jour pour ${user.email} (id ${user.id}).`);
    console.log("Tu peux te connecter avec le nouveau mot de passe.");
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
