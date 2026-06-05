-- HubHex — export schema
-- Genere le 2026-06-01T08:19:48.733Z
BEGIN;

-- users
--   id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass)
--   username character varying NOT NULL
--   email character varying NOT NULL
--   password_hash text NOT NULL
--   created_at timestamp with time zone NULL DEFAULT now()
--   password_changed_at timestamp with time zone NULL DEFAULT now()
--   display_name character varying NULL
--   status_message character varying NULL
--   status_emoji character varying NULL
--   avatar_mime character varying NULL
--   avatar_data text NULL
--   profile_updated_at timestamp with time zone NULL

-- projects
--   id integer NOT NULL DEFAULT nextval('projects_id_seq'::regclass)
--   user_id integer NOT NULL
--   title character varying NOT NULL
--   description text NOT NULL
--   technologies text NOT NULL DEFAULT ''::text
--   visibility character varying NOT NULL DEFAULT 'private'::character varying
--   created_at timestamp with time zone NULL DEFAULT now()
--   updated_at timestamp with time zone NULL DEFAULT now()
--   slug character varying NOT NULL DEFAULT ''::character varying

-- tasks
--   id integer NOT NULL DEFAULT nextval('tasks_id_seq'::regclass)
--   project_id integer NOT NULL
--   title character varying NOT NULL
--   description text NOT NULL DEFAULT ''::text
--   status character varying NOT NULL DEFAULT 'todo'::character varying
--   sort_order integer NOT NULL DEFAULT 0
--   created_at timestamp with time zone NULL DEFAULT now()
--   updated_at timestamp with time zone NULL DEFAULT now()

-- comments
--   id integer NOT NULL DEFAULT nextval('comments_id_seq'::regclass)
--   project_id integer NOT NULL
--   user_id integer NOT NULL
--   content text NOT NULL
--   created_at timestamp with time zone NULL DEFAULT now()
--   updated_at timestamp with time zone NULL DEFAULT now()

-- password_reset_tokens
--   id integer NOT NULL DEFAULT nextval('password_reset_tokens_id_seq'::regclass)
--   user_id integer NOT NULL
--   token_hash text NOT NULL
--   expires_at timestamp with time zone NOT NULL
--   created_at timestamp with time zone NULL DEFAULT now()

-- refresh_tokens
--   id integer NOT NULL DEFAULT nextval('refresh_tokens_id_seq'::regclass)
--   user_id integer NOT NULL
--   token_hash text NOT NULL
--   expires_at timestamp with time zone NOT NULL
--   revoked_at timestamp with time zone NULL
--   user_agent text NULL
--   ip_address character varying NULL
--   created_at timestamp with time zone NULL DEFAULT now()

-- project_repositories
--   id integer NOT NULL DEFAULT nextval('project_repositories_id_seq'::regclass)
--   project_id integer NOT NULL
--   label character varying NOT NULL DEFAULT ''::character varying
--   url text NOT NULL
--   provider character varying NOT NULL DEFAULT 'other'::character varying
--   sort_order integer NOT NULL DEFAULT 0
--   created_at timestamp with time zone NULL DEFAULT now()

-- project_files
--   id integer NOT NULL DEFAULT nextval('project_files_id_seq'::regclass)
--   project_id integer NOT NULL
--   parent_id integer NULL
--   name character varying NOT NULL
--   kind character varying NOT NULL
--   content text NOT NULL DEFAULT ''::text
--   sort_order integer NOT NULL DEFAULT 0
--   created_at timestamp with time zone NULL DEFAULT now()
--   updated_at timestamp with time zone NULL DEFAULT now()
--   encoding character varying NOT NULL DEFAULT 'text'::character varying
--   mime_type character varying NULL

-- project_technical_notes
--   id integer NOT NULL DEFAULT nextval('project_technical_notes_id_seq'::regclass)
--   project_id integer NOT NULL
--   title character varying NOT NULL
--   content text NOT NULL DEFAULT ''::text
--   sort_order integer NOT NULL DEFAULT 0
--   created_at timestamp with time zone NULL DEFAULT now()
--   updated_at timestamp with time zone NULL DEFAULT now()

-- project_stack_items
--   id integer NOT NULL DEFAULT nextval('project_stack_items_id_seq'::regclass)
--   project_id integer NOT NULL
--   name character varying NOT NULL
--   url text NOT NULL DEFAULT ''::text
--   status character varying NOT NULL DEFAULT 'using'::character varying
--   snippet text NOT NULL DEFAULT ''::text
--   sort_order integer NOT NULL DEFAULT 0
--   created_at timestamp with time zone NULL DEFAULT now()
--   updated_at timestamp with time zone NULL DEFAULT now()

-- project_journal_entries
--   id integer NOT NULL DEFAULT nextval('project_journal_entries_id_seq'::regclass)
--   project_id integer NOT NULL
--   user_id integer NOT NULL
--   title character varying NOT NULL
--   content text NOT NULL DEFAULT ''::text
--   created_at timestamp with time zone NULL DEFAULT now()

-- project_templates
--   id integer NOT NULL DEFAULT nextval('project_templates_id_seq'::regclass)
--   user_id integer NULL
--   name character varying NOT NULL
--   description text NOT NULL DEFAULT ''::text
--   default_technologies text NOT NULL DEFAULT ''::text
--   default_tasks jsonb NOT NULL DEFAULT '[]'::jsonb
--   is_system boolean NOT NULL DEFAULT false
--   created_at timestamp with time zone NULL DEFAULT now()

-- project_relations
--   id integer NOT NULL DEFAULT nextval('project_relations_id_seq'::regclass)
--   source_project_id integer NOT NULL
--   target_project_id integer NOT NULL
--   relation_type character varying NOT NULL DEFAULT 'related'::character varying
--   created_at timestamp with time zone NULL DEFAULT now()

COMMIT;
