-- Dynamic CMS: paths, page types, SEO, site settings

ALTER TABLE content_pages ADD COLUMN path TEXT;
ALTER TABLE content_pages ADD COLUMN page_type TEXT NOT NULL DEFAULT 'page';
ALTER TABLE content_pages ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE content_pages ADD COLUMN meta_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE content_pages ADD COLUMN seo_title TEXT;
ALTER TABLE content_pages ADD COLUMN seo_description TEXT;
ALTER TABLE content_pages ADD COLUMN show_in_nav INTEGER NOT NULL DEFAULT 0;
ALTER TABLE content_pages ADD COLUMN nav_label TEXT;

UPDATE content_pages SET path = CASE WHEN slug = 'home' THEN '/' ELSE '/' || slug END
WHERE path IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_pages_path ON content_pages (path);
CREATE INDEX IF NOT EXISTS idx_content_pages_type ON content_pages (page_type);
CREATE INDEX IF NOT EXISTS idx_content_pages_sort ON content_pages (sort_order);

ALTER TABLE content_projects ADD COLUMN meta_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE content_projects ADD COLUMN seo_title TEXT;
ALTER TABLE content_projects ADD COLUMN seo_description TEXT;

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
