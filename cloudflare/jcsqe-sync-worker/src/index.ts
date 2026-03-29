import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  DB: D1Database;
  SYNC_API_SECRET: string;
  ALLOWED_ORIGIN?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowed =
        c.env.ALLOWED_ORIGIN || 'https://junichi-muraoka.github.io';
      if (!origin) return allowed;
      if (origin === allowed) return origin;
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return origin;
      }
      return allowed;
    },
    allowHeaders: ['Authorization', 'X-User-Id', 'Content-Type'],
    allowMethods: ['GET', 'PUT', 'OPTIONS'],
  })
);

function unauthorized() {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requireAuth(c: { req: { header: (n: string) => string | undefined }; env: Env }) {
  const auth = c.req.header('Authorization');
  const userId = c.req.header('X-User-Id');
  if (!auth?.startsWith('Bearer ') || !userId || userId.length > 128) {
    return null;
  }
  const token = auth.slice(7).trim();
  if (!token || token !== c.env.SYNC_API_SECRET) {
    return null;
  }
  return userId.trim();
}

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'jcsqe-study-sync' })
);

app.get('/api/study', async (c) => {
  const userId = requireAuth(c);
  if (!userId) return unauthorized();

  const row = await c.env.DB.prepare(
    'SELECT payload, updated_at_ms FROM study_snapshots WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ payload: string; updated_at_ms: number }>();

  if (!row) {
    return c.json({ data: null, updatedAtMs: null });
  }

  let data: unknown;
  try {
    data = JSON.parse(row.payload);
  } catch {
    return c.json({ error: 'invalid_payload' }, 500);
  }

  return c.json({ data, updatedAtMs: row.updated_at_ms });
});

app.put('/api/study', async (c) => {
  const userId = requireAuth(c);
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    return c.json({ error: 'expected_shape', detail: '{ "data": <study object> }' }, 400);
  }

  const payload = JSON.stringify((body as { data: unknown }).data);
  if (payload.length > 1_500_000) {
    return c.json({ error: 'payload_too_large' }, 413);
  }

  const now = Date.now();
  await c.env.DB.prepare(
    `INSERT INTO study_snapshots (user_id, payload, updated_at_ms)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       payload = excluded.payload,
       updated_at_ms = excluded.updated_at_ms`
  )
    .bind(userId, payload, now)
    .run();

  return c.json({ ok: true, updatedAtMs: now });
});

export default app;
