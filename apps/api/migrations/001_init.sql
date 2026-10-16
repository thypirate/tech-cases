-- 001_init: example table. Replace it with the real schema (in a new migration once this one is applied).
-- Timestamps are ISO 8601 UTC text, e.g. 2026-10-01T18:00:00.000Z.

CREATE TABLE items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Example rows. created_at is filled in by the column default.
INSERT INTO items (name) VALUES
  ('First item'),
  ('Second item'),
  ('Third item');
