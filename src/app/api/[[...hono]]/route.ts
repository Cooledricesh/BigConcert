import { handle } from 'hono/vercel';
import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';

// Lazy load the Hono app to avoid initialization during build time
let app: Hono<AppEnv> | null = null;
let handler: ReturnType<typeof handle> | null = null;

const getHandler = () => {
  if (!handler) {
    const { createHonoApp } = require('@/backend/hono/app');
    app = createHonoApp();
    handler = handle(app);
  }
  return handler;
};

// Create lazy-loaded handlers for each HTTP method
export const GET = (req: Request) => getHandler()(req);
export const POST = (req: Request) => getHandler()(req);
export const PUT = (req: Request) => getHandler()(req);
export const PATCH = (req: Request) => getHandler()(req);
export const DELETE = (req: Request) => getHandler()(req);
export const OPTIONS = (req: Request) => getHandler()(req);

export const runtime = 'nodejs';
