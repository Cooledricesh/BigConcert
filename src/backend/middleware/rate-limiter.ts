import type { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (밀리초)
}

// 메모리 기반 Rate Limit 저장소
const rateLimitStore = new Map<string, RateLimitEntry>();

// 주기적으로 만료된 항목 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  maxAttempts: number; // 최대 시도 횟수
  windowMs: number; // 제한 시간 (밀리초)
  keyGenerator?: (c: Context) => string; // 키 생성 함수 (기본: IP)
}

/**
 * Rate Limiter 미들웨어
 * - IP별 요청 횟수 제한
 * - 5회 연속 실패 시 5분간 요청 제한
 */
export const rateLimiter = (options: RateLimitOptions) => {
  const { maxAttempts, windowMs, keyGenerator } = options;

  return async (c: Context, next: Next) => {
    const key = keyGenerator ? keyGenerator(c) : getClientIp(c);
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (entry) {
      // 제한 시간이 지나지 않은 경우
      if (now < entry.resetAt) {
        if (entry.count >= maxAttempts) {
          const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
          return c.json(
            {
              success: false,
              error: {
                code: 'TOO_MANY_ATTEMPTS',
                message: '잠시 후 다시 시도해주세요',
                retryAfter,
              },
            },
            429,
          );
        }
      } else {
        // 제한 시간이 지난 경우 초기화
        rateLimitStore.delete(key);
      }
    }

    // 요청 통과, next() 후 응답 상태 확인
    await next();

    // 응답이 401 Unauthorized인 경우 실패 횟수 증가
    if (c.res.status === 401) {
      const currentEntry = rateLimitStore.get(key);
      if (currentEntry && now < currentEntry.resetAt) {
        currentEntry.count += 1;
      } else {
        rateLimitStore.set(key, {
          count: 1,
          resetAt: now + windowMs,
        });
      }
    }

    // 응답이 200 OK인 경우 성공으로 간주하여 초기화
    if (c.res.status === 200) {
      rateLimitStore.delete(key);
    }
  };
};

/**
 * 클라이언트 IP 주소 추출
 * - X-Forwarded-For 헤더 우선
 * - X-Real-IP 헤더 차선
 * - 직접 연결 IP 최종
 */
const getClientIp = (c: Context): string => {
  const forwardedFor = c.req.header('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = c.req.header('X-Real-IP');
  if (realIp) {
    return realIp.trim();
  }

  // Hono에서 직접 IP를 가져오는 방법 (환경에 따라 다를 수 있음)
  return c.env?.REMOTE_ADDR || 'unknown';
};

/**
 * Rate Limit 상태 초기화 (성공 시 호출)
 */
export const resetRateLimit = (key: string) => {
  rateLimitStore.delete(key);
};

/**
 * Rate Limit 상태 증가 (실패 시 호출)
 */
export const incrementRateLimit = (key: string, windowMs: number) => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (entry && now < entry.resetAt) {
    entry.count += 1;
  } else {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
  }
};
