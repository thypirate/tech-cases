// ?page=&limit= → LIMIT/OFFSET values. limit defaults to 12, capped at 100.
export function paging(query: Record<string, unknown>) {
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit ?? '12'), 10) || 12));
  return { page, limit, offset: (page - 1) * limit };
}

// Escapes % and _ so user input is matched literally inside LIKE '%…%' ESCAPE '\'.
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

// Route :id params → positive integer, or null (the route then answers 404).
export function parseId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
