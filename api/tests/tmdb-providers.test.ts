import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import tmdbProvidersHandler from '../tmdb/providers/[tmdbType]/[tmdbId]';

const VALID_DEVICE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('GET /api/tmdb/providers/:tmdbType/:tmdbId', () => {
  beforeEach(() => {
    process.env.TMDB_API_KEY = 'tmdb-test-key';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TMDB_API_KEY;
  });

  it('returns whitelisted providers for the requested region', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          results: {
            US: {
              flatrate: [
                { provider_name: 'Netflix' },
                { provider_name: 'Disney Plus' },
              ],
              ads: [{ provider_name: 'YouTube' }],
              buy: [
                { provider_name: 'Amazon Prime Video' },
                { provider_name: 'Apple TV+' },
              ],
              rent: [{ provider_name: 'Unknown Provider' }],
            },
          },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    const response = await tmdbProvidersHandler(
      new Request(
        'https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396?region=US',
        {
          headers: {
            'X-Device-Id': VALID_DEVICE_ID,
          },
        },
      ),
      {
        params: {
          tmdbId: '1396',
          tmdbType: 'tv',
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400');
    await expect(response.json()).resolves.toEqual({
      success: true,
      region: 'US',
      providers: ['netflix', 'disney', 'youtube', 'prime', 'appletv'],
    });
  });

  it('accepts route params from the rewrite query when context params are absent', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          results: {
            US: {
              flatrate: [{ provider_name: 'Netflix' }],
            },
          },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    const response = await tmdbProvidersHandler(
      new Request(
        'https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396?region=US&tmdbType=tv&tmdbId=1396',
        {
          headers: {
            'X-Device-Id': VALID_DEVICE_ID,
          },
        },
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      region: 'US',
      providers: ['netflix'],
    });
  });

  it('rejects a missing device id', async () => {
    const response = await tmdbProvidersHandler(
      new Request('https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396'),
      {
        params: {
          tmdbId: '1396',
          tmdbType: 'tv',
        },
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Missing or invalid X-Device-Id header',
    });
  });

  it('rejects unsupported regions', async () => {
    const response = await tmdbProvidersHandler(
      new Request(
        'https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396?region=GB',
        {
          headers: {
            'X-Device-Id': VALID_DEVICE_ID,
          },
        },
      ),
      {
        params: {
          tmdbId: '1396',
          tmdbType: 'tv',
        },
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      region: 'ZA',
      providers: [],
      error: 'Invalid region. Use ZA or US.',
    });
  });

  it('passes through TMDB 404 responses as a typed error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status_message: 'Not found' }), {
        status: 404,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    const response = await tmdbProvidersHandler(
      new Request(
        'https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396?region=US',
        {
          headers: {
            'X-Device-Id': VALID_DEVICE_ID,
          },
        },
      ),
      {
        params: {
          tmdbId: '1396',
          tmdbType: 'tv',
        },
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      region: 'US',
      providers: [],
      error: 'TMDB request failed with status 404',
    });
  });

  it('passes through TMDB 429 responses as a typed error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status_message: 'Rate limited' }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    const response = await tmdbProvidersHandler(
      new Request(
        'https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396?region=US',
        {
          headers: {
            'X-Device-Id': VALID_DEVICE_ID,
          },
        },
      ),
      {
        params: {
          tmdbId: '1396',
          tmdbType: 'tv',
        },
      },
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      success: false,
      region: 'US',
      providers: [],
      error: 'TMDB request failed with status 429',
    });
  });

  it('returns a typed error when the TMDB request throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('socket hang up'));

    const response = await tmdbProvidersHandler(
      new Request(
        'https://mychannel-api.vercel.app/api/tmdb/providers/tv/1396?region=US',
        {
          headers: {
            'X-Device-Id': VALID_DEVICE_ID,
          },
        },
      ),
      {
        params: {
          tmdbId: '1396',
          tmdbType: 'tv',
        },
      },
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      success: false,
      region: 'US',
      providers: [],
      error: 'TMDB request failed',
    });
  });
});
