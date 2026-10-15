import { timingSafeEqual } from 'crypto';

export function adminOk(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET || '';
  if (secret.length < 24) return false;
  const got = Buffer.from(req.headers.get('x-admin-secret') || '');
  const want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function mintFetch(path: string, method: 'GET' | 'POST', body?: unknown, timeoutMs = 50_000) {
  const base = process.env.MINT_SERVICE_URL;
  const secret = process.env.MINT_SERVICE_SECRET;
  if (!base || !secret) throw new Error('mint service not configured');
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
