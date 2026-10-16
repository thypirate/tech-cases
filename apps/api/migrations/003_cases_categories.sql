-- 003_cases_categories: allow the 'fraud' and 'trade-secrets' categories and the 'conviction' outcome.
-- SQLite cannot change a CHECK constraint in place, so both tables are rebuilt. Their rows are not
-- copied: seeds/cases.json is the source of the data and the seed runs right after migrations.

DROP TABLE case_sources;
DROP TABLE cases;

CREATE TABLE cases (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT NOT NULL UNIQUE,
  company      TEXT NOT NULL,
  title        TEXT NOT NULL,
  -- Regulator or court that decided (or is hearing) the case.
  authority    TEXT NOT NULL,
  jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('EU', 'US', 'UK', 'AU', 'CN')),
  year         INTEGER NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('privacy', 'consumer', 'antitrust', 'copyright', 'securities', 'fraud', 'trade-secrets')),
  outcome      TEXT NOT NULL CHECK (outcome IN ('fine', 'settlement', 'verdict', 'ruling', 'conviction', 'pending', 'other')),
  -- Whole currency units. NULL when there is no single figure (pending, injunctions, prison sentences, ...).
  amount       INTEGER,
  currency     TEXT CHECK (currency IN ('EUR', 'USD', 'GBP', 'AUD')),
  -- What to show: "€1.2 billion", "Damages pending", "25 years in prison", ...
  amount_label TEXT NOT NULL,
  -- Appeal, annulment or other follow-up, when known.
  status       TEXT,
  summary      TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK ((amount IS NULL) = (currency IS NULL))
);

CREATE INDEX idx_cases_company ON cases (company);
CREATE INDEX idx_cases_year ON cases (year);

CREATE TABLE case_sources (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  label   TEXT NOT NULL,
  url     TEXT NOT NULL
);

CREATE INDEX idx_case_sources_case ON case_sources (case_id);
