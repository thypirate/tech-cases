// Loads seeds/cases.json into the cases and case_sources tables.
// Safe to re-run: cases are matched by slug and updated, and their sources are replaced.
import '../env';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../db';

type SeedCase = {
  slug: string;
  company: string;
  title: string;
  authority: string;
  jurisdiction: string;
  year: number;
  category: string;
  outcome: string;
  amount: number | null;
  currency: string | null;
  amount_label: string;
  status: string | null;
  summary: string;
  sources: { label: string; url: string }[];
};

const seedFile = path.join(__dirname, '..', '..', 'seeds', 'cases.json');

function seed() {
  const cases = JSON.parse(fs.readFileSync(seedFile, 'utf8')) as SeedCase[];

  const upsertCase = db.prepare(`
    INSERT INTO cases (slug, company, title, authority, jurisdiction, year, category, outcome, amount, currency, amount_label, status, summary)
    VALUES (@slug, @company, @title, @authority, @jurisdiction, @year, @category, @outcome, @amount, @currency, @amount_label, @status, @summary)
    ON CONFLICT (slug) DO UPDATE SET
      company = excluded.company,
      title = excluded.title,
      authority = excluded.authority,
      jurisdiction = excluded.jurisdiction,
      year = excluded.year,
      category = excluded.category,
      outcome = excluded.outcome,
      amount = excluded.amount,
      currency = excluded.currency,
      amount_label = excluded.amount_label,
      status = excluded.status,
      summary = excluded.summary
    RETURNING id
  `);
  const deleteSources = db.prepare('DELETE FROM case_sources WHERE case_id = ?');
  const insertSource = db.prepare('INSERT INTO case_sources (case_id, label, url) VALUES (?, ?, ?)');

  db.transaction(() => {
    for (const { sources, ...row } of cases) {
      const { id } = upsertCase.get(row) as { id: number };
      deleteSources.run(id);
      for (const source of sources) insertSource.run(id, source.label, source.url);
    }
  })();

  console.log(`Seeded ${cases.length} case(s)`);
}

try {
  seed();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  db.close();
}
