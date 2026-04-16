import { describe, it, expect, beforeEach } from 'vitest';
import { getWatchProviders, _clearCache, _cacheSize } from '../www/lib/tmdb-watch-providers.js';

function makeFakeFetch(responseBody, { status = 200, fetchLog } = {}) {
  return async (url) => {
    if (fetchLog) fetchLog.push(url);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => responseBody,
    };
  };
}

describe('tmdb-watch-providers', () => {
  beforeEach(() => {
    _clearCache();
  });

  it('returns normalized streamers for a country with providers', async () => {
    const fake = makeFakeFetch({
      id: 1396,
      results: {
        US: {
          link: 'https://www.themoviedb.org/tv/1396/watch?locale=US',
          flatrate: [
            { provider_id: 8,  provider_name: 'Netflix',  logo_path: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg' },
            { provider_id: 337, provider_name: 'Disney Plus', logo_path: '/97yvRBw1GzX7fXprcF80er19ot.jpg' },
          ],
        },
      },
    });
    const result = await getWatchProviders('tv', 1396, 'US', { apiKey: 'test-key', fetch: fake });
    expect(result.streamers).toHaveLength(2);
    expect(result.streamers[0]).toEqual({
      id: 8,
      name: 'Netflix',
      logoUrl: 'https://image.tmdb.org/t/p/original/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg',
    });
    expect(result.tmdbWatchLink).toBe('https://www.themoviedb.org/tv/1396/watch?locale=US');
  });

  it('returns empty streamers when country has no providers', async () => {
    const fake = makeFakeFetch({ id: 1, results: { US: { flatrate: [] } } });
    const result = await getWatchProviders('movie', 1, 'ZA', { apiKey: 'k', fetch: fake });
    expect(result.streamers).toEqual([]);
    expect(result.tmdbWatchLink).toBe(null);
  });

  it('handles entirely missing results object', async () => {
    const fake = makeFakeFetch({ id: 1 });
    const result = await getWatchProviders('movie', 1, 'US', { apiKey: 'k', fetch: fake });
    expect(result.streamers).toEqual([]);
    expect(result.tmdbWatchLink).toBe(null);
  });

  it('merges flatrate, rent, buy with flatrate first and dedupes by provider_id', async () => {
    const fake = makeFakeFetch({
      results: {
        US: {
          flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/a.jpg' }],
          rent:     [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/a.jpg' },
                     { provider_id: 2, provider_name: 'Apple TV', logo_path: '/b.jpg' }],
          buy:      [{ provider_id: 3, provider_name: 'Amazon Video', logo_path: '/c.jpg' }],
        },
      },
    });
    const result = await getWatchProviders('movie', 100, 'US', { apiKey: 'k', fetch: fake });
    expect(result.streamers.map(s => s.id)).toEqual([8, 2, 3]);
  });

  it('caches results for repeated calls', async () => {
    const calls = [];
    const fake = makeFakeFetch(
      { results: { US: { flatrate: [{ provider_id: 1, provider_name: 'A', logo_path: '/a.jpg' }] } } },
      { fetchLog: calls },
    );
    await getWatchProviders('movie', 99, 'US', { apiKey: 'k', fetch: fake });
    await getWatchProviders('movie', 99, 'US', { apiKey: 'k', fetch: fake });
    expect(calls).toHaveLength(1);
    expect(_cacheSize()).toBe(1);
  });

  it('separates cache by type, id, and country', async () => {
    const calls = [];
    const fake = makeFakeFetch(
      { results: { US: { flatrate: [{ provider_id: 1, provider_name: 'A', logo_path: '/a.jpg' }] } } },
      { fetchLog: calls },
    );
    await getWatchProviders('movie', 1, 'US', { apiKey: 'k', fetch: fake });
    await getWatchProviders('tv',    1, 'US', { apiKey: 'k', fetch: fake });
    await getWatchProviders('movie', 1, 'GB', { apiKey: 'k', fetch: fake });
    await getWatchProviders('movie', 2, 'US', { apiKey: 'k', fetch: fake });
    expect(calls).toHaveLength(4);
  });

  it('throws on invalid type', async () => {
    await expect(getWatchProviders('podcast', 1, 'US', { apiKey: 'k' }))
      .rejects.toThrow(/type must be/);
  });

  it('throws on missing id', async () => {
    await expect(getWatchProviders('movie', '', 'US', { apiKey: 'k' }))
      .rejects.toThrow(/id is required/);
  });

  it('throws on non-two-letter country', async () => {
    await expect(getWatchProviders('movie', 1, 'USA', { apiKey: 'k' }))
      .rejects.toThrow(/ISO 3166-1 alpha-2/);
  });

  it('throws on non-OK HTTP response', async () => {
    const fake = makeFakeFetch({}, { status: 401 });
    await expect(getWatchProviders('movie', 1, 'US', { apiKey: 'k', fetch: fake }))
      .rejects.toThrow(/TMDB returned 401/);
  });

  it('throws when no API key is available', async () => {
    const fake = makeFakeFetch({ results: {} });
    const originalKey = process.env.TMDB_API_KEY;
    delete process.env.TMDB_API_KEY;
    try {
      await expect(getWatchProviders('movie', 1, 'US', { fetch: fake }))
        .rejects.toThrow(/TMDB_API_KEY is required/);
    } finally {
      if (originalKey !== undefined) process.env.TMDB_API_KEY = originalKey;
    }
  });

  it('uploads null logoUrl when logo_path is missing', async () => {
    const fake = makeFakeFetch({
      results: {
        US: { flatrate: [{ provider_id: 9, provider_name: 'Mystery', logo_path: null }] },
      },
    });
    const result = await getWatchProviders('movie', 5, 'US', { apiKey: 'k', fetch: fake });
    expect(result.streamers[0].logoUrl).toBe(null);
  });
});
