import crypto from 'node:crypto';
import type { Context } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import { rateLimiter } from 'hono-rate-limiter';

// Rate limits are per IP. In-memory store: fine for one replica, which is all a SQLite file supports anyway.

// The API is only reached through one trusted proxy (Railway's, or the web app's /api proxy), which
// appends the real client IP to X-Forwarded-For. Only that last entry is trusted: earlier ones are
// whatever the client sent. Direct calls (local development) fall back to the socket address.
function clientIp(c: Context) {
  const forwarded = c.req.header('x-forwarded-for')?.split(',').pop()?.trim();
  return forwarded || getConnInfo(c).remote.address || 'unknown';
}

// Server-side rendering calls from the web app carry X-Internal-Token. They all come from the web
// server's IP, so without this every visitor's page loads would share one rate-limit bucket.
function isInternalRequest(c: Context) {
  const expected = process.env.INTERNAL_API_TOKEN;
  const given = c.req.header('x-internal-token');
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Everything except /health and internal SSR calls.
export const globalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  keyGenerator: clientIp,
  skip: isInternalRequest,
  standardHeaders: 'draft-7',
  message: { error: 'Too many requests, try again later' },
});
