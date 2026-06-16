import { createDb } from '@sheetflow/db';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@sheetflow/db';
import type { Sql } from 'postgres';
import { env } from './config.js';

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;
let dbClient: Sql | null = null;

/**
 * Initialise and return a singleton DB instance.
 * Throws if DATABASE_URL is missing (validated in config).
 */
export const getDb = (): PostgresJsDatabase<typeof schema> => {
  if (!dbInstance) {
    const created = createDb(env.DATABASE_URL);
    dbInstance = created.db as unknown as PostgresJsDatabase<typeof schema>;
    dbClient = created.client;
  }
  return dbInstance;
};

/**
 * Gracefully close the database connection pool.
 */
export const closeDb = async (): Promise<void> => {
  if (dbClient) {
    await dbClient.end();
    dbClient = null;
    dbInstance = null;
  }
};
