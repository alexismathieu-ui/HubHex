const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { slugify } = require("../src/lib/project-slug");

describe("project slug", () => {
  it("slugify normalise titre", () => {
    assert.equal(slugify("Mon Super Projet!"), "mon-super-projet");
  });

  it("slugify gere chaines vides", () => {
    assert.equal(slugify(""), "depot");
  });
});
