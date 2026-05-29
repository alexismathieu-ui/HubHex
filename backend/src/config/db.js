const { Pool } = require("pg");
const { env } = require("./env");

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
});

const ensureDatabaseSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(80);
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status_message VARCHAR(120);
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status_emoji VARCHAR(12);
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_mime VARCHAR(120);
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data TEXT;
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMP WITH TIME ZONE;
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
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      revoked_at TIMESTAMP WITH TIME ZONE,
      user_agent TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
    ON refresh_tokens(user_id);
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_technical_notes (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_project_technical_notes_project_id
    ON project_technical_notes(project_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_stack_items (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'using'
        CHECK (status IN ('planned', 'learning', 'using')),
      snippet TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_project_stack_items_project_id
    ON project_stack_items(project_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_journal_entries (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_project_journal_entries_project_id
    ON project_journal_entries(project_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_templates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      default_technologies TEXT NOT NULL DEFAULT '',
      default_tasks JSONB NOT NULL DEFAULT '[]',
      is_system BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_relations (
      id SERIAL PRIMARY KEY,
      source_project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      target_project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      relation_type VARCHAR(30) NOT NULL DEFAULT 'related'
        CHECK (relation_type IN ('related', 'same_tech', 'inspired_by', 'continues')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (source_project_id, target_project_id, relation_type)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_project_relations_source
    ON project_relations(source_project_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_project_relations_target
    ON project_relations(target_project_id);
  `);

  const { seedSystemTemplates } = require("../lib/seed-templates");
  await seedSystemTemplates();
};

module.exports = { pool, ensureDatabaseSchema };
