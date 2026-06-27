import { env } from "cloudflare:test";

/** Inline migrations — vitest worker isolate has no project FS access. */
const MIGRATIONS: string[] = [
	`CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
	`ALTER TABLE contact_submissions ADD COLUMN consent INTEGER NOT NULL DEFAULT 0`,
	`CREATE TABLE IF NOT EXISTS content_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
	`CREATE TABLE IF NOT EXISTS content_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
	`CREATE TABLE IF NOT EXISTS api_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
	`CREATE INDEX IF NOT EXISTS idx_content_pages_status ON content_pages (status)`,
	`CREATE INDEX IF NOT EXISTS idx_content_projects_status ON content_projects (status)`,
	`CREATE INDEX IF NOT EXISTS idx_content_projects_sort ON content_projects (sort_order)`,
	`CREATE INDEX IF NOT EXISTS idx_api_audit_created ON api_audit_log (created_at)`,
	`ALTER TABLE content_pages ADD COLUMN path TEXT`,
	`ALTER TABLE content_pages ADD COLUMN page_type TEXT NOT NULL DEFAULT 'page'`,
	`ALTER TABLE content_pages ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`,
	`ALTER TABLE content_pages ADD COLUMN meta_json TEXT NOT NULL DEFAULT '{}'`,
	`ALTER TABLE content_pages ADD COLUMN seo_title TEXT`,
	`ALTER TABLE content_pages ADD COLUMN seo_description TEXT`,
	`ALTER TABLE content_pages ADD COLUMN show_in_nav INTEGER NOT NULL DEFAULT 0`,
	`ALTER TABLE content_pages ADD COLUMN nav_label TEXT`,
	`UPDATE content_pages SET path = '/' || slug WHERE path IS NULL`,
	`CREATE UNIQUE INDEX IF NOT EXISTS idx_content_pages_path ON content_pages (path)`,
	`CREATE INDEX IF NOT EXISTS idx_content_pages_type ON content_pages (page_type)`,
	`ALTER TABLE content_projects ADD COLUMN meta_json TEXT NOT NULL DEFAULT '{}'`,
	`ALTER TABLE content_projects ADD COLUMN seo_title TEXT`,
	`ALTER TABLE content_projects ADD COLUMN seo_description TEXT`,
	`CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
];

export async function applyMigrations(): Promise<void> {
	for (const statement of MIGRATIONS) {
		try {
			await env.DB.prepare(statement).run();
		} catch {
			/* ALTER duplicate column on re-run */
		}
	}
}

await applyMigrations();
