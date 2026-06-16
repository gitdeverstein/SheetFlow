import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export * from './schema.js';
export { schema };

export function createDb(connectionString: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const client = postgres(connectionString, {
    ssl: isProd ? { rejectUnauthorized: true } : false,
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  return { db: drizzle(client, { schema }), client };
}
