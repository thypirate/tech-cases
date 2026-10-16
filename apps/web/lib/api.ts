import 'server-only';
import { notFound } from 'next/navigation';

// Server-side only. On Railway this is the private-network URL
// (e.g. http://api.railway.internal:4000), so SSR never goes over the public internet.
const API_URL = process.env.API_INTERNAL_URL;

// Lets the API tell SSR calls apart from browser traffic, which is rate limited per IP.
function internalHeaders(): Record<string, string> {
  return process.env.INTERNAL_API_TOKEN ? { 'x-internal-token': process.env.INTERNAL_API_TOKEN } : {};
}

// Every cached API response carries this tag; a write through the proxy expires it (see app/api/[...path]/route.ts).
export const PUBLIC_TAG = 'public';

// Logs why the API couldn't be reached (the error page itself stays generic).
function describeFetchError(path: string, err: unknown): never {
  const cause = (err as { cause?: { code?: string; message?: string } }).cause;
  console.error(`[apiGet] cannot reach the API for ${path} (${cause?.code ?? 'UNKNOWN'}): ${cause?.message ?? (err as Error).message}. Check API_INTERNAL_URL and that the API service is running.`);
  throw err;
}

type ApiGetOptions = {
  // Cache and revalidate every N seconds (ISR). 0 = fetch on every request.
  revalidate?: number | false;
};

// The one function Server Components use to load page data from the API.
export async function apiGet<T>(path: string, { revalidate = 60 }: ApiGetOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: internalHeaders(),
    next: { revalidate, tags: [PUBLIC_TAG, path.split('?')[0]] },
  }).catch((err) => describeFetchError(path, err));

  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`API ${res.status} on GET ${path}`);
  return res.json() as Promise<T>;
}
