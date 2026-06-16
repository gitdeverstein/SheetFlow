import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { rateLimiter } from 'hono-rate-limiter';
import { sql } from 'drizzle-orm';
import { env } from './config.js';
import { getDb, closeDb } from './db.js';

import { logger, requestLogger } from './middleware/logger.js';
import { authMiddleware } from './middleware/auth.js';

import authRouter from './routes/auth.js';
import customersRouter from './routes/customers.js';
import inventoryRouter from './routes/inventory.js';
import quotesRouter from './routes/quotes.js';

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

if (!env.ALLOWED_ORIGINS) {
  throw new Error('ALLOWED_ORIGINS is required');
}

const app = new Hono();

// Global Middleware
app.use('*', rateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  message: { error: 'Too many requests' },
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
}));

// Security Headers
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('X-DNS-Prefetch-Control', 'off');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.res.headers.set('Cache-Control', 'no-store');

  // Content-Security-Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  c.res.headers.set('Content-Security-Policy', csp);

  // Strict-Transport-Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
});

app.use('*', bodyLimit({ maxSize: 100 * 1024 }));

app.use('*', requestLogger);
app.use('*', cors({
  origin: env.ALLOWED_ORIGINS?.split(','),
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Total-Count'],
  maxAge: 600,
  credentials: true,
}));

// Auth routes (public — no authMiddleware)
app.route('/api/auth', authRouter);

// All /api/* routes require authentication
app.use('/api/*', authMiddleware);

// API Routes
app.route('/api/customers', customersRouter);
app.route('/api/inventory', inventoryRouter);
app.route('/api/quotes', quotesRouter);

app.get('/health', async (c) => {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 3000);

    await Promise.race([
      getDb().execute(sql`SELECT 1`),
      new Promise<void>((_, reject) => {
        ac.signal.addEventListener('abort', () => reject(new Error('Health check timeout')));
      }),
    ]);
    clearTimeout(timer);
    return c.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    return c.json({ status: 'error', error: (e as Error).message }, 500);
  }
});

// Centralized Error Handler
app.onError((err, c) => {
  logger.error(err, err.message);

  if (err instanceof HTTPException) {
    if (err.status === 413) {
      return c.json({ error: 'Request too large (max 100 KB)' }, 413);
    }
    return c.json({ error: err.message }, err.status);
  }

  const pgCode = (err as { code?: string }).code;
  if (pgCode === '23505') return c.json({ error: 'Resource already exists' }, 409);
  if (pgCode === '23503') return c.json({ error: 'Resource is in use elsewhere' }, 409);
  if (pgCode === '23514') return c.json({ error: 'Data constraint violated' }, 400);

  // Zod validation errors (from zValidator)
  if (err instanceof Error && 'errors' in err) {
    const issues = (err as { errors?: Array<{ path: (string | number)[]; message: string }> }).errors;
    if (Array.isArray(issues)) {
      const fields = issues.map(i => `${i.path.join('.') || 'value'}: ${i.message}`).join('; ');
      return c.json({ error: `Validation failed — ${fields}` }, 400);
    }
    return c.json({ error: 'Invalid data' }, 400);
  }

  if (err instanceof SyntaxError) return c.json({ error: 'Invalid JSON' }, 400);

  return c.json({ error: 'Internal server error' }, 500);
});

// 404 for unknown routes
app.notFound((c) => c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404));

const port = Number(env.PORT) || 3000;
serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  try {
    await closeDb();
    console.log('Database connections closed.');
  } catch (err) {
    console.error('Error closing database:', err);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  try {
    await closeDb();
    console.log('Database connections closed.');
  } catch (err) {
    console.error('Error closing database:', err);
  }
  process.exit(0);
});

// Global error handlers
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  closeDb().catch(() => {}).finally(() => process.exit(1));
});
