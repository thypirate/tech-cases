import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

// Same-origin proxy: the browser calls /api/*, this forwards to the API over the private network.
// Cookies the API sets therefore land on the web domain.
const API_URL = process.env.API_INTERNAL_URL;

// Only these headers pass through. In particular the browser can't send X-Internal-Token.
const REQUEST_HEADERS = ['cookie', 'content-type', 'accept', 'user-agent', 'x-forwarded-for'];
const RESPONSE_HEADERS = ['content-type', 'ratelimit', 'ratelimit-policy', 'retry-after'];

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!API_URL) {
    return Response.json({ error: 'API_INTERNAL_URL is not set' }, { status: 500 });
  }
  const { path } = await params;
  const url = `${API_URL}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Tell the API whether the visitor is on HTTPS (it only sees plain HTTP from this proxy).
  headers.set('x-forwarded-proto', req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', ''));

  let res: Response;
  try {
    res = await fetch(url, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch (err) {
    // The API can't be reached (wrong API_INTERNAL_URL, API not running, ...). Say why, without
    // exposing the internal address: the code is enough to tell the cases apart.
    const cause = (err as { cause?: { code?: string; message?: string } }).cause;
    const code = cause?.code ?? (err instanceof TypeError ? 'INVALID_URL_OR_NETWORK' : 'UNKNOWN');
    console.error(`[api proxy] cannot reach the API (${code}): ${cause?.message ?? (err as Error).message}`);
    return Response.json({ error: 'The API is unreachable', code }, { status: 502 });
  }

  const out = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = res.headers.get(name);
    if (value) out.set(name, value);
  }
  for (const cookie of res.headers.getSetCookie()) out.append('set-cookie', cookie);

  // A successful write (create/edit/delete) expires the cached pages right away,
  // instead of waiting for the 60s cache to run out.
  if (req.method !== 'GET' && req.method !== 'HEAD' && res.ok) {
    revalidateTag('public', { expire: 0 });
  }

  return new Response(res.status === 204 ? null : res.body, { status: res.status, headers: out });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
