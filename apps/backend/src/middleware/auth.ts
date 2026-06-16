import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from '../db.js';
import { sessions, users } from '@sheetflow/db';
import { eq } from 'drizzle-orm';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Session-based authentication middleware.
 *
 * Reads the `sid` (session ID) cookie and looks up the session in the database.
 * Sessions are automatically cleaned up when expired.
 *
 * On success, sets `c.set('user', { id, name, email })` for downstream handlers.
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const sid = getCookie(c, 'sid');

  if (!sid) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const [session] = await getDb()
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(eq(sessions.id, sid));

    if (!session) {
      return c.json({ error: 'Session not found' }, 401);
    }

    if (new Date() > session.expiresAt) {
      await getDb().delete(sessions).where(eq(sessions.id, sid));
      return c.json({ error: 'Session expired' }, 401);
    }

    const [user] = await getDb()
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.userId));

    if (!user) {
      await getDb().delete(sessions).where(eq(sessions.id, sid));
      return c.json({ error: 'User not found' }, 401);
    }

    c.set('user', user as SessionUser);
    await next();
  } catch {
    return c.json({ error: 'Invalid session' }, 401);
  }
};
