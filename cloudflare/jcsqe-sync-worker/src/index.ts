import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface Env {
  DB: D1Database;
  /** 旧クライアント用（Bearer が共有シークレットのとき）。新フロントは Firebase ID トークンのみ */
  SYNC_API_SECRET?: string;
  /** Firebase コンソールの project ID（公開情報）。ID トークンの aud / iss 検証に使用 */
  FIREBASE_PROJECT_ID?: string;
  ALLOWED_ORIGIN?: string;
}

const app = new Hono<{ Bindings: Env }>();

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs')
);

const DEFAULT_PAGES_ORIGINS = [
  'https://jcsqe-study-app.pages.dev',
  'https://jcsqe-study-app-staging.pages.dev',
];

function allowedOrigins(env: Env): string[] {
  const raw = env.ALLOWED_ORIGIN?.trim();
  if (raw) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_PAGES_ORIGINS;
}

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const list = allowedOrigins(c.env);
      const fallback = list[0] ?? DEFAULT_PAGES_ORIGINS[0];
      if (!origin) return fallback;
      if (list.includes(origin)) return origin;
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return origin;
      }
      return fallback;
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

async function verifyFirebaseUid(
  token: string,
  projectId: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    const sub = payload.sub;
    return typeof sub === 'string' && sub ? sub : null;
  } catch {
    return null;
  }
}

async function resolveUserId(c: {
  req: { header: (n: string) => string | undefined };
  env: Env;
}): Promise<string | null> {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  const projectId = c.env.FIREBASE_PROJECT_ID?.trim();
  if (projectId) {
    const uid = await verifyFirebaseUid(token, projectId);
    if (uid) return uid;
  }

  const legacySecret = c.env.SYNC_API_SECRET;
  const userId = c.req.header('X-User-Id');
  if (
    legacySecret &&
    token === legacySecret &&
    userId &&
    userId.length > 0 &&
    userId.length <= 128
  ) {
    return userId.trim();
  }
  return null;
}

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'jcsqe-study-sync' })
);

app.get('/api/study', async (c) => {
  const userId = await resolveUserId(c);
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
  const userId = await resolveUserId(c);
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    return c.json(
      { error: 'expected_shape', detail: '{ "data": <study object> }' },
      400
    );
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
