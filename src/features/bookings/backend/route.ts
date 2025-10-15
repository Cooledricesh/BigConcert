import type { Hono } from 'hono';
import { respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { createBooking, getBookingDetail, searchBookings } from './service';
import { CreateBookingRequestSchema, SearchBookingsRequestSchema } from './schema';
import { bookingErrorCodes, bookingErrorMessages } from './error';
import type { BookingServiceError } from './error';
import { rateLimiter } from '@/backend/middleware/rate-limiter';

export const registerBookingsRoutes = (app: Hono<AppEnv>) => {
  // POST /api/bookings - 예약 생성
  app.post('/api/bookings', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      logger.warn('Invalid JSON in request body', { error });
      return c.json(
        {
          success: false,
          error: {
            code: bookingErrorCodes.validationError,
            message: '잘못된 요청 형식입니다',
          },
        },
        400,
      );
    }

    // 요청 본문 파싱 및 검증
    const parsed = CreateBookingRequestSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn('Invalid booking request', { errors: parsed.error.format() });
      return c.json(
        {
          success: false,
          error: {
            code: bookingErrorCodes.validationError,
            message: bookingErrorMessages[bookingErrorCodes.validationError],
            details: parsed.error.format(),
          },
        },
        400,
      );
    }

    logger.info('Creating booking', {
      concertId: parsed.data.concertId,
      seatCount: parsed.data.seatIds.length,
      userPhone: parsed.data.userPhone.substring(0, 7) + '****', // 개인정보 마스킹
    });

    const result = await createBooking(supabase, parsed.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<BookingServiceError, unknown>;

      if (errorResult.error.code === bookingErrorCodes.seatAlreadyReserved) {
        logger.warn('Seats already reserved', {
          concertId: parsed.data.concertId,
          seatIds: parsed.data.seatIds,
        });
      } else if (errorResult.error.code === bookingErrorCodes.duplicateBooking) {
        logger.warn('Duplicate booking attempt', {
          userPhone: parsed.data.userPhone.substring(0, 7) + '****',
          concertId: parsed.data.concertId,
        });
      } else {
        logger.error('Booking creation failed', {
          error: errorResult.error,
          concertId: parsed.data.concertId,
        });
      }

      return respond(c, result);
    }

    logger.info('Booking created successfully', {
      bookingId: result.data.bookingId,
      concertId: result.data.concertId,
      totalPrice: result.data.totalPrice,
    });

    return respond(c, result);
  });

  // GET /api/bookings/:id - 예약 조회 (예약 완료 페이지용)
  app.get('/api/bookings/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const bookingId = c.req.param('id');

    if (!bookingId) {
      return c.json(
        {
          success: false,
          error: {
            code: bookingErrorCodes.validationError,
            message: '예약 ID가 필요합니다',
          },
        },
        400,
      );
    }

    logger.info('Fetching booking detail', { bookingId });

    const result = await getBookingDetail(supabase, bookingId);

    if (!result.ok) {
      logger.warn('Booking not found', { bookingId });
      return respond(c, result);
    }

    logger.info('Booking detail fetched', { bookingId });

    return respond(c, result);
  });

  // POST /api/bookings/search - 예약 조회 (신규)
  app.post(
    '/api/bookings/search',
    rateLimiter({
      maxAttempts: 5,
      windowMs: 5 * 60 * 1000, // 5분
    }),
    async (c) => {
      const supabase = getSupabase(c);
      const logger = getLogger(c);

      let body;
      try {
        body = await c.req.json();
      } catch (error) {
        logger.warn('Invalid JSON in request body', { error });
        return c.json(
          {
            success: false,
            error: {
              code: bookingErrorCodes.validationError,
              message: '잘못된 요청 형식입니다',
            },
          },
          400,
        );
      }

      // 요청 본문 파싱 및 검증
      const parsed = SearchBookingsRequestSchema.safeParse(body);

      if (!parsed.success) {
        logger.warn('Invalid search request', { errors: parsed.error.format() });
        return c.json(
          {
            success: false,
            error: {
              code: bookingErrorCodes.validationError,
              message: bookingErrorMessages[bookingErrorCodes.validationError],
              details: parsed.error.format(),
            },
          },
          400,
        );
      }

      logger.info('Searching bookings', {
        userPhone: parsed.data.userPhone.substring(0, 7) + '****', // 개인정보 마스킹
      });

      const result = await searchBookings(supabase, parsed.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<BookingServiceError, unknown>;

        if (errorResult.error.code === bookingErrorCodes.invalidCredentials) {
          logger.warn('Invalid credentials', {
            userPhone: parsed.data.userPhone.substring(0, 7) + '****',
          });
        } else {
          logger.error('Booking search failed', {
            error: errorResult.error,
          });
        }

        return respond(c, result);
      }

      logger.info('Booking search successful', {
        userPhone: parsed.data.userPhone.substring(0, 7) + '****',
        bookingCount: result.data.bookings.length,
      });

      return respond(c, result);
    }
  );
};