import './env';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { ZodError } from 'zod';
import { db } from './db';
import { globalLimiter } from './middleware';
import caseRoutes from './routes/cases';
import itemRoutes from './routes/items';

const app = new Hono();
const port = Number(process.env.PORT ?? 4000);

app.use(secureHeaders());
app.use(cors({ origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true }));

// Before rate limits: Railway's health checks shouldn't touch them.
app.get('/health', (c) => {
  let dbStatus: 'up' | 'down' = 'up';
  try {
    db.prepare('SELECT 1').get();
  } catch {
    dbStatus = 'down';
  }
  return c.json({ ok: true, db: dbStatus });
});

app.use(globalLimiter);
app.use(bodyLimit({ maxSize: 1024 * 1024 }));

app.route('/items', itemRoutes);
app.route('/cases', caseRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Invalid request',
        issues: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
      400,
    );
  }
  // c.req.json() on a body that isn't JSON.
  if (err instanceof SyntaxError) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  // Unique and foreign keys enforced by SQLite.
  const code = (err as { code?: string }).code;
  if (code === 'SQLITE_CONSTRAINT_UNIQUE' || code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
    return c.json({ error: 'That value is already taken' }, 409);
  }
  if (code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return c.json({ error: 'A referenced record does not exist' }, 400);
  }

  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
