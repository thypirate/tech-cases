-- 002_cases: legal cases against tech companies (fines, settlements, verdicts, rulings, pending suits)
-- and the sources that report them. Rows come from seeds/cases.json (see src/scripts/seed.ts).

CREATE TABLE cases (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT NOT NULL UNIQUE,
  company      TEXT NOT NULL,
  title        TEXT NOT NULL,
  -- Regulator or court that decided (or is hearing) the case.
  authority    TEXT NOT NULL,
  jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('EU', 'US', 'UK', 'AU', 'CN')),
  year         INTEGER NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('privacy', 'consumer', 'antitrust', 'copyright', 'securities')),
  outcome      TEXT NOT NULL CHECK (outcome IN ('fine', 'settlement', 'verdict', 'ruling', 'pending', 'other')),
  -- Whole currency units. NULL when there is no single figure (pending, injunctions, ...).
  amount       INTEGER,
  currency     TEXT CHECK (currency IN ('EUR', 'USD', 'GBP', 'AUD')),
  -- What to show: "€1.2 billion", "Damages pending", ...
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
