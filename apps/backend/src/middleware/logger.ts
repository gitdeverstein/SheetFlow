import { pinoLogger } from 'hono-pino';
import pino from 'pino';

export const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
  },
});

export const requestLogger = pinoLogger({ pino: logger });
