// src/features/seats/backend/route.ts
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
import {
  getSeatsByConcertId,
  checkSeatAvailability,
} from './service';
import {
  CheckAvailabilityRequestSchema,
} from './schema';
import {
  seatErrorCodes,
  type SeatServiceError,
} from './error';

export const registerSeatsRoutes = (app: Hono<AppEnv>) => {
  // GET /api/concerts/:id/seats - 좌석 목록 조회
  app.get('/api/concerts/:id/seats', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const concertId = c.req.param('id');

    logger.info('Fetching seats for concert', { concertId });

    const result = await getSeatsByConcertId(supabase, concertId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SeatServiceError, unknown>;

      if (errorResult.error.code === seatErrorCodes.notFound) {
        logger.warn('Seats not found', { concertId });
      } else if (errorResult.error.code === seatErrorCodes.fetchError) {
        logger.error('Failed to fetch seats', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Successfully fetched seats', { count: result.data.length });
    return respond(c, result);
  });

  // POST /api/seats/check-availability - 좌석 가용성 확인
  app.post('/api/seats/check-availability', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // 요청 본문 파싱 및 검증
    const body = await c.req.json();
    const parsed = CheckAvailabilityRequestSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn('Invalid request body', { errors: parsed.error.format() });
      return c.json(
        {
          success: false,
          error: {
            code: seatErrorCodes.validationError,
            message: '잘못된 요청 형식입니다',
            details: parsed.error.format(),
          },
        },
        400,
      );
    }

    logger.info('Checking seat availability', {
      concertId: parsed.data.concertId,
      seatIds: parsed.data.seatIds,
    });

    const result = await checkSeatAvailability(supabase, parsed.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SeatServiceError, unknown>;

      if (errorResult.error.code === seatErrorCodes.alreadyReserved) {
        logger.warn('Seats already reserved', {
          seatIds: parsed.data.seatIds,
        });
      } else if (errorResult.error.code === seatErrorCodes.fetchError) {
        logger.error('Failed to check availability', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Availability check completed', {
      available: result.data.available,
    });
    return respond(c, result);
  });
};
