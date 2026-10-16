// Example resource: copy this file for each new one and mount it in index.ts.
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { paging, parseId } from '../util';

const router = new Hono();

const itemBody = z.object({
  name: z.string().trim().min(1).max(200),
});

router.get('/', (c) => {
  const { page, limit, offset } = paging(c.req.query());
  const items = db.prepare('SELECT id, name, created_at FROM items ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset);
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM items').get() as { total: number };
  return c.json({ items, page, limit, total });
});

router.get('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const item = id && db.prepare('SELECT id, name, created_at FROM items WHERE id = ?').get(id);
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json({ item });
});

router.post('/', async (c) => {
  const body = itemBody.parse(await c.req.json());
  const item = db.prepare('INSERT INTO items (name) VALUES (@name) RETURNING id, name, created_at').get(body);
  return c.json({ item }, 201);
});

router.delete('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  if (!id || db.prepare('DELETE FROM items WHERE id = ?').run(id).changes === 0) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.body(null, 204);
});

export default router;
