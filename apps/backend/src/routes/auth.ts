import { Hono, type Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config.js';
import { getDb } from '../db.js';
import { users, sessions } from '@sheetflow/db';
import { eq } from 'drizzle-orm';

const router = new Hono();

// ── Validation Schemas ───────────────────────────────────────────────────────
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const SESSION_COOKIE = 'sid';

function createSessionId(): string {
  return crypto.randomUUID();
}

function sessionExpiresAt(): Date {
  return new Date(Date.now() + env.SESSION_EXPIRES_IN_SEC * 1000);
}

function setSessionCookie(c: Context, sid: string) {
  const isProd = process.env.NODE_ENV === 'production';
  setCookie(c, SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAge: env.SESSION_EXPIRES_IN_SEC,
  });
}

function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

async function createSession(c: Context, userId: string) {
  const sid = createSessionId();
  const expiresAt = sessionExpiresAt();
  await getDb().insert(sessions).values({ id: sid, userId, expiresAt });
  setSessionCookie(c, sid);
  return sid;
}

async function destroySession(c: Context) {
  const sid = getCookie(c, SESSION_COOKIE);
  if (sid) {
    await getDb().delete(sessions).where(eq(sessions.id, sid));
  }
  clearSessionCookie(c);
}

// ── POST /register ───────────────────────────────────────────────────────────
router.post('/register', zValidator('json', RegisterSchema), async (c) => {
  const { name, email, password } = c.req.valid('json');

  const [existing] = await getDb().select().from(users).where(eq(users.email, email));
  if (existing) {
    return c.json({ error: 'An account with this email already exists' }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [created] = await getDb()
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({ id: users.id, name: users.name, email: users.email });

  await createSession(c, created.id);

  return c.json(
    {
      user: { id: created.id, name: created.name, email: created.email },
    },
    201,
  );
});

// ── POST /login ──────────────────────────────────────────────────────────────
router.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const [user] = await getDb().select().from(users).where(eq(users.email, email));
  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  if (!user.passwordHash) {
    return c.json({ error: 'This account uses Google sign-in. Please sign in with Google.' }, 400);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  await createSession(c, user.id);

  return c.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// ── GET /google ──────────────────────────────────────────────────────────────
router.get('/google', async (c) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
    return c.json({ error: 'Google sign-in is not configured' }, 501);
  }

  const state = createSessionId();
  const nonce = createSessionId();

  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 600,
  });
  setCookie(c, 'oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
  });

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// ── GET /google/callback ─────────────────────────────────────────────────────
router.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const returnedState = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');

  if (!code || !returnedState || returnedState !== storedState) {
    return c.redirect(
      `${env.GOOGLE_CALLBACK_URL?.replace('/api/auth/google/callback', '') || 'http://localhost:5173'}?error=oauth_failed`,
    );
  }

  deleteCookie(c, 'oauth_state', { path: '/' });
  deleteCookie(c, 'oauth_nonce', { path: '/' });

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    return c.json({ error: 'Google OAuth not configured' }, 501);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Google token exchange failed:', errBody);
      return c.redirect('http://localhost:5173?error=oauth_failed');
    }

    const tokens = (await tokenRes.json()) as { access_token: string };
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return c.redirect('http://localhost:5173?error=oauth_failed');
    }

    const googleUser = (await userInfoRes.json()) as {
      id: string;
      email: string;
      name: string;
    };

    if (!googleUser.email) {
      return c.redirect('http://localhost:5173?error=no_email');
    }

    const frontendUrl = 'http://localhost:5173';

    const [existingUser] = await getDb().select().from(users).where(eq(users.googleId, googleUser.id));

    if (existingUser) {
      await createSession(c, existingUser.id);
      return c.redirect(frontendUrl);
    }

    const [userByEmail] = await getDb().select().from(users).where(eq(users.email, googleUser.email));

    if (userByEmail) {
      await getDb().update(users).set({ googleId: googleUser.id }).where(eq(users.id, userByEmail.id));
      await createSession(c, userByEmail.id);
      return c.redirect(frontendUrl);
    }

    const [created] = await getDb()
      .insert(users)
      .values({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
      })
      .returning({ id: users.id });

    await createSession(c, created.id);
    return c.redirect(frontendUrl);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return c.redirect('http://localhost:5173?error=oauth_failed');
  }
});

// ── POST /logout ─────────────────────────────────────────────────────────────
router.post('/logout', async (c) => {
  await destroySession(c);
  return c.json({ message: 'Logged out successfully' });
});

// ── GET /me ──────────────────────────────────────────────────────────────────
router.get('/me', async (c) => {
  const sid = getCookie(c, SESSION_COOKIE);
  if (!sid) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  try {
    const [session] = await getDb().select().from(sessions).where(eq(sessions.id, sid));

    if (!session || new Date() > session.expiresAt) {
      if (session) {
        await getDb().delete(sessions).where(eq(sessions.id, sid));
      }
      clearSessionCookie(c);
      return c.json({ error: 'Session expired' }, 401);
    }

    const [user] = await getDb()
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.userId));

    if (!user) {
      await getDb().delete(sessions).where(eq(sessions.id, sid));
      clearSessionCookie(c);
      return c.json({ error: 'User not found' }, 401);
    }

    return c.json({ user });
  } catch {
    clearSessionCookie(c);
    return c.json({ error: 'Invalid session' }, 401);
  }
});

export default router;
