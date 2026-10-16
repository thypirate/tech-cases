import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const file = path.resolve(process.env.DATABASE_PATH ?? 'data/app.db');
fs.mkdirSync(path.dirname(file), { recursive: true });

// One synchronous connection for the whole process (better-sqlite3 has no pool).
export const db = new Database(file);

// WAL lets reads continue while a write is in progress.
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
