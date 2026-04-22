import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyMiddleware,
  jsonResponse,
  resetRateLimitStore,
} from '../_middleware';

const VALID_DEVICE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('applyMiddleware', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('returns CORS preflight headers for allowed origins', async () => {
    const request = new Request('https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396', {
      method: 'OPTIONS',
      headers: {
        Origin: 'capacitor://localhost',
      },
    });

    const result = await applyMiddleware(request, {
      requireDeviceId: true,
      rateLimit: { key: 'tmdb', limit: 100, windowMs: 60 * 60 * 1000 },
    });

    expect(result.response).toBeInstanceOf(Response);
    expect(result.response?.status).toBe(204);
    expect(result.response?.headers.get('access-control-allow-origin')).toBe('capacitor://localhost');
    expect(result.response?.headers.get('access-control-allow-headers')).toContain('X-Device-Id');
  });

  it('rejects a missing device id for protected routes', async () => {
    const request = new Request('https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396');

    const result = await applyMiddleware(request, {
      requireDeviceId: true,
      rateLimit: { key: 'tmdb', limit: 100, windowMs: 60 * 60 * 1000 },
    });

    expect(result.response).toBeInstanceOf(Response);
    expect(result.response?.status).toBe(400);
    await expect(result.response?.json()).resolves.toEqual({
      error: 'Missing or invalid X-Device-Id header',
    });
  });

  it('rejects an invalid device id for protected routes', async () => {
    const request = new Request('https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396', {
      headers: {
        'X-Device-Id': 'not-a-uuid',
      },
    });

    const result = await applyMiddleware(request, {
      requireDeviceId: true,
      rateLimit: { key: 'tmdb', limit: 100, windowMs: 60 * 60 * 1000 },
    });

    expect(result.response).toBeInstanceOf(Response);
    expect(result.response?.status).toBe(400);
    await expect(result.response?.json()).resolves.toEqual({
      error: 'Missing or invalid X-Device-Id header',
    });
  });

  it('enforces the in-memory per-device rate limit', async () => {
    const request = new Request('https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396', {
      headers: {
        'X-Device-Id': VALID_DEVICE_ID,
      },
    });

    const first = await applyMiddleware(request, {
      requireDeviceId: true,
      rateLimit: { key: 'tmdb', limit: 1, windowMs: 60 * 60 * 1000 },
    });

    expect(first.response).toBeUndefined();

    const second = await applyMiddleware(request, {
      requireDeviceId: true,
      rateLimit: { key: 'tmdb', limit: 1, windowMs: 60 * 60 * 1000 },
    });

    expect(second.response).toBeInstanceOf(Response);
    expect(second.response?.status).toBe(429);
    await expect(second.response?.json()).resolves.toEqual({
      error: 'Rate limit exceeded',
    });
  });

  it('applies CORS headers to downstream JSON responses', async () => {
    const request = new Request('https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396', {
      headers: {
        Origin: 'http://localhost',
        'X-Device-Id': VALID_DEVICE_ID,
      },
    });

    const result = await applyMiddleware(request, {
      requireDeviceId: true,
      rateLimit: { key: 'tmdb', limit: 100, windowMs: 60 * 60 * 1000 },
    });

    const response = jsonResponse(
      { success: true },
      { request, status: 200, headers: result.headers },
    );

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost');
  });
});
