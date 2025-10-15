// src/features/concerts/backend/route.ts
import type { Hono } from 'hono';
import {
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { getConcerts } from './service';
import {
  concertErrorCodes,
  type ConcertServiceError,
} from './error';

export const registerConcertsRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/concerts', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getConcerts(supabase);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ConcertServiceError, unknown>;

      if (errorResult.error.code === concertErrorCodes.fetchError) {
        logger.error('Failed to fetch concerts', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
