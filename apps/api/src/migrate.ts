// Applies apps/api/migrations/*.sql in filename order and records each one in schema_migrations.
// Runs on container start, so it must be safe to run on every boot.
import './env';
import fs from 'node:fs';
import path from 'node:path';
import { db } from './db';

const migrationsDir = path.join(__dirname, '..', 'migrations');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT NOT NULL PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);

  const rows = db.prepare('SELECT name FROM schema_migrations').all() as { name: string }[];
  const applied = new Set(rows.map((row) => row.name));

  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
  const pending = files.filter((file) => !applied.has(file));

  for (const file of pending) {
    console.log(`Applying ${file}`);
    // SQLite DDL is transactional: a failed migration rolls back completely and is not recorded.
    db.transaction(() => {
      db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
      db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
    })();
  }

  console.log(pending.length ? `Applied ${pending.length} migration(s)` : 'No pending migrations');
}

try {
  migrate();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  db.close();
}
