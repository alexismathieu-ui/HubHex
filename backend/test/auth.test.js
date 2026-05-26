const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");

const { pool } = require("../src/config/db");
const { passwordSchema } = require("../src/lib/security");
const { hashResetToken, generateResetToken } = require("../src/lib/password-reset");

describe("auth helpers", () => {
  it("passwordSchema accepte un mot de passe fort", () => {
    const result = passwordSchema.safeParse("MotDePasse1!");
    assert.equal(result.success, true);
  });

  it("passwordSchema rejette un mot de passe faible", () => {
    const result = passwordSchema.safeParse("abc");
    assert.equal(result.success, false);
  });

  it("hashResetToken est deterministe", () => {
    const token = "abc123";
    assert.equal(hashResetToken(token), hashResetToken(token));
  });

  it("generateResetToken produit 64 caracteres hex", () => {
    const token = generateResetToken();
    assert.match(token, /^[a-f0-9]{64}$/);
  });
});

describe("database connectivity", () => {
  before(async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }
  });

  it("pool repond a SELECT 1", async (t) => {
    if (!process.env.DATABASE_URL) {
      t.skip("DATABASE_URL non defini");
      return;
    }
    const result = await pool.query("SELECT 1 AS ok");
    assert.equal(result.rows[0].ok, 1);
  });
});

describe("bcrypt", () => {
  it("hash et compare", async () => {
    const hash = await bcrypt.hash("TestPassword1!", 4);
    const match = await bcrypt.compare("TestPassword1!", hash);
    assert.equal(match, true);
  });
});
