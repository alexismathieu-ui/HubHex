/** Types partagés — réponses API HubHex (frontend). */

export type ProjectVisibility = "private" | "public";

export type TaskStatus = "todo" | "in_progress" | "done";

export type StackItemStatus = "planned" | "learning" | "using";

export type RelationType = "related" | "same_tech" | "inspired_by" | "continues";

export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string | null;
  status_message?: string | null;
  status_emoji?: string | null;
  has_avatar?: boolean;
  created_at?: string;
  profile_updated_at?: string | null;
}

export interface Project {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  description: string;
  technologies: string;
  visibility: ProjectVisibility;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RepositoryLink {
  id?: number;
  label: string;
  url: string;
  provider?: string;
}

export interface ProjectFileNode {
  id: number;
  project_id: number;
  parent_id: number | null;
  name: string;
  kind: "file" | "folder";
  content?: string;
  encoding?: "text" | "base64";
  mime_type?: string | null;
  sort_order: number;
  content_preview?: string;
  children?: ProjectFileNode[];
}

export interface ProjectWithRepositories extends Project {
  repositories?: RepositoryLink[];
}

export interface ProfileStats {
  projects: { total: number; public: number; private: number };
  tasks: { total: number };
  comments: { total: number };
}

export interface ProfileUser extends User {
  stats?: ProfileStats;
  recent_activity?: DashboardActivity[];
}

export interface PublicProfileUser extends User {
  stats?: ProfileStats;
}

export interface TechnicalNote {
  id: number;
  project_id: number;
  title: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StackItem {
  id: number;
  project_id: number;
  name: string;
  url: string;
  status: StackItemStatus;
  snippet: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: number;
  project_id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  username?: string;
  display_name?: string | null;
}

export interface Comment {
  id: number;
  project_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  author_username?: string;
  author_display_name?: string | null;
  author_has_avatar?: boolean;
}

export interface PublicProject extends Project {
  author_id: number;
  author_username: string;
  author_display_name?: string | null;
  author_status_message?: string | null;
  author_status_emoji?: string | null;
  author_has_avatar?: boolean;
  comment_count?: number;
  is_mine?: boolean;
}

export interface ProjectTemplate {
  id: number;
  user_id: number | null;
  name: string;
  description: string;
  default_technologies: string;
  default_tasks: unknown;
  is_system: boolean;
  created_at: string;
}

export interface ProjectRelation {
  id: number;
  source_project_id: number;
  target_project_id: number;
  relation_type: RelationType;
  created_at: string;
}

export interface DashboardSummary {
  projects: { total: number; public: number; private: number };
  tasks: { todo: number; in_progress: number; done: number; total: number };
}

export interface DashboardActivity {
  type: string;
  action: string;
  entity_id: number;
  label: string;
  occurred_at: string;
  project_id?: number;
}

export interface GraphNode {
  id: number;
  title: string;
  slug: string;
  technologies: string;
  visibility: ProjectVisibility;
}

export interface DashboardData {
  summary: DashboardSummary;
  recent_projects: Project[];
  recent_activity: DashboardActivity[];
}

export interface ApiErrorBody {
  error?: { message?: string; details?: unknown };
  message?: string;
}

export interface AuthLoginResponse {
  token: string;
  expiresIn?: number;
  refreshToken?: string;
  refreshExpiresAt?: string;
  user: User;
}

export interface AuthMeResponse {
  user: User;
}
