-- Relational travel map store (replaces blob-only site_settings for map data)

CREATE TABLE IF NOT EXISTS travel_map_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT 'Explorer',
  subtitle TEXT NOT NULL DEFAULT '',
  home_hub_json TEXT NOT NULL DEFAULT '{}',
  opening_json TEXT NOT NULL DEFAULT '{}',
  globe_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS travel_countries (
  iso2 TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  visited INTEGER NOT NULL DEFAULT 1 CHECK (visited IN (0, 1)),
  favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
  color TEXT,
  narrative_json TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS travel_cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country_iso2 TEXT NOT NULL REFERENCES travel_countries(iso2),
  country_name TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  role TEXT,
  visited_with TEXT,
  visits INTEGER,
  note TEXT,
  airport_code TEXT,
  story_json TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS travel_routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_city_id TEXT NOT NULL REFERENCES travel_cities(id),
  to_city_id TEXT NOT NULL REFERENCES travel_cities(id),
  route_type TEXT NOT NULL DEFAULT 'flight',
  label TEXT,
  UNIQUE(from_city_id, to_city_id)
);

CREATE INDEX IF NOT EXISTS idx_travel_cities_country ON travel_cities (country_iso2);
CREATE INDEX IF NOT EXISTS idx_travel_routes_from ON travel_routes (from_city_id);
CREATE INDEX IF NOT EXISTS idx_travel_routes_to ON travel_routes (to_city_id);
