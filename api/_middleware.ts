import { z } from 'zod';

const VERSION = '1.0.0';
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'http://localhost',
  'https://mychannel-api.vercel.app',
]);

const deviceIdSchema = z.string().regex(UUID_V4_REGEX);

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface MiddlewareOptions {
  requireDeviceId?: boolean;
  rateLimit?: RateLimitOptions;
}

export interface MiddlewareResult {
  deviceId?: string;
  headers: Headers;
  response?: Response;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function createCorsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get('origin');

  headers.set('access-control-allow-headers', 'Content-Type, X-Device-Id');
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
  headers.set('access-control-max-age', '86400');
  headers.set('vary', 'Origin');

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('access-control-allow-origin', origin);
  }

  return headers;
}

function checkRateLimit(deviceId: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const key = `${options.key}:${deviceId}`;
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return true;
  }

  if (existing.count >= options.limit) {
    return false;
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return true;
}

export function jsonResponse(
  body: unknown,
  init: {
    request: Request;
    headers?: Headers;
    status?: number;
  },
): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

export function notAvailableResponse(request: Request, headers?: Headers): Response {
  return jsonResponse(
    {
      error: 'Not available in v1',
      version: VERSION,
    },
    {
      request,
      status: 501,
      headers,
    },
  );
}

export async function applyMiddleware(
  request: Request,
  options: MiddlewareOptions,
): Promise<MiddlewareResult> {
  const headers = createCorsHeaders(request);

  if (request.method === 'OPTIONS') {
    return {
      headers,
      response: new Response(null, {
        status: 204,
        headers,
      }),
    };
  }

  if (options.requireDeviceId === false) {
    return { headers };
  }

  const deviceId = request.headers.get('x-device-id');
  const parsedDeviceId = deviceIdSchema.safeParse(deviceId);

  if (!parsedDeviceId.success) {
    return {
      headers,
      response: jsonResponse(
        { error: 'Missing or invalid X-Device-Id header' },
        { request, status: 400, headers },
      ),
    };
  }

  if (options.rateLimit) {
    // TODO v1.2: swap for Upstash sliding-window
    const allowed = checkRateLimit(parsedDeviceId.data, options.rateLimit);

    if (!allowed) {
      return {
        headers,
        response: jsonResponse(
          { error: 'Rate limit exceeded' },
          { request, status: 429, headers },
        ),
      };
    }
  }

  return {
    deviceId: parsedDeviceId.data,
    headers,
  };
}

export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
