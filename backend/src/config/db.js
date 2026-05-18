const { Pool } = require("pg");
const { env } = require("./env");

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const ensureDatabaseSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(120) NOT NULL,
      description TEXT NOT NULL,
      technologies TEXT NOT NULL DEFAULT '',
      visibility VARCHAR(10) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'done')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
    ON password_reset_tokens(user_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_repositories (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      label VARCHAR(120) NOT NULL DEFAULT '',
      url TEXT NOT NULL,
      provider VARCHAR(20) NOT NULL DEFAULT 'other'
        CHECK (provider IN ('github', 'gitlab', 'bitbucket', 'other')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_project_repositories_project_id
    ON project_repositories(project_id);
  `);

  await pool.query(`
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug VARCHAR(80) NOT NULL DEFAULT '';
  `);

  const { backfillProjectSlugs } = require("../lib/project-slug");
  await backfillProjectSlugs();

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_slug ON projects(user_id, slug);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_files (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES project_files(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      kind VARCHAR(10) NOT NULL CHECK (kind IN ('file', 'folder')),
      content TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_project_files_parent_id ON project_files(parent_id);
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_project_files_unique_name
    ON project_files (project_id, COALESCE(parent_id, 0), name);
  `);

  await pool.query(`
    ALTER TABLE project_files ADD COLUMN IF NOT EXISTS encoding VARCHAR(10) NOT NULL DEFAULT 'text';
  `);
  await pool.query(`
    ALTER TABLE project_files ADD COLUMN IF NOT EXISTS mime_type VARCHAR(120);
  `);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE project_files ADD CONSTRAINT project_files_encoding_check
        CHECK (encoding IN ('text', 'base64'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
};

module.exports = { pool, ensureDatabaseSchema };
