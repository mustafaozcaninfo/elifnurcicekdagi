CREATE TABLE IF NOT EXISTS travel_flights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flight_number TEXT NOT NULL,
  from_iata TEXT NOT NULL,
  to_iata TEXT NOT NULL,
  block_hrs REAL,
  ac_reg TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_travel_flights_from ON travel_flights (from_iata);
CREATE INDEX IF NOT EXISTS idx_travel_flights_to ON travel_flights (to_iata);
CREATE INDEX IF NOT EXISTS idx_travel_flights_number ON travel_flights (flight_number);
