import { Hono } from "hono";
import { db } from "../db";
import { paging } from "../util";

const router = new Hono();

const COLUMNS =
  "id, slug, company, title, authority, jurisdiction, year, category, outcome, amount, currency, amount_label, status, summary";

router.get("/", (c) => {
  const query = c.req.query();
  const { page, limit, offset } = paging(query);

  const cases = db
    .prepare(
      `SELECT ${COLUMNS} FROM cases ORDER BY year DESC, id LIMIT ? OFFSET ?`,
    )
    .all(limit, offset);
  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM cases `)
    .get() as { total: number };
  return c.json({ cases, page, limit, total });
});

router.get("/sources", (c) => {
  const sources = db
    .prepare(`SELECT case_id, label, url FROM case_sources ORDER BY id DESC`)
    .all();
  return c.json({ sources });
});

export default router;
