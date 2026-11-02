// src/config.ts – validated environment variables
import 'dotenv/config';
import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string(),
  PORT: z.coerce.number().int().positive().default(3000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // Session
  SESSION_EXPIRES_IN_SEC: z.coerce.number().int().positive().default(604800), // 7 days

  // Email (Resend — optional; falls back to console logging)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@sheetflow.com'),

  // App URL (used for verification links in emails)
  APP_URL: z.string().default('http://localhost:5173'),

  // Google OAuth (optional — local auth works without these)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
