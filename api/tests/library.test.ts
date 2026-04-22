import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import libraryHandler from '../library';

describe('GET /api/library', () => {
  beforeEach(() => {
    process.env.TMDB_API_KEY = 'tmdb-test-key';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TMDB_API_KEY;
  });

  it('returns a live-library page hydrated with provider badges', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            page: 2,
            total_pages: 30,
            total_results: 600,
            results: [
              {
                id: 11,
                media_type: 'movie',
                title: 'Heat',
                original_title: 'Heat',
                overview: 'Crime epic.',
                poster_path: '/heat.jpg',
                backdrop_path: '/heat-backdrop.jpg',
                genre_ids: [80, 18],
                popularity: 77,
                vote_average: 8.3,
                vote_count: 12000,
                original_language: 'en',
                release_date: '1995-12-15',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            page: 2,
            total_pages: 22,
            total_results: 440,
            results: [
              {
                id: 22,
                media_type: 'tv',
                name: 'Mr. Robot',
                original_name: 'Mr. Robot',
                overview: 'Paranoia and code.',
                poster_path: '/robot.jpg',
                backdrop_path: '/robot-backdrop.jpg',
                genre_ids: [80, 18],
                popularity: 88,
                vote_average: 8.5,
                vote_count: 9000,
                original_language: 'en',
                first_air_date: '2015-06-24',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 11,
            results: {
              US: {
                flatrate: [
                  { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png', display_priority: 1 },
                  { provider_id: 350, provider_name: 'Apple TV Plus', logo_path: '/appletv.png', display_priority: 2 },
                ],
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 22,
            results: {
              US: {
                flatrate: [
                  { provider_id: 9, provider_name: 'Amazon Prime Video', logo_path: '/prime.png', display_priority: 1 },
                  { provider_id: 15, provider_name: 'Hulu', logo_path: '/hulu.png', display_priority: 2 },
                ],
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    const response = await libraryHandler(
      new Request('https://example.com/api/library?region=US&providers=netflix,prime&page=2&type=all'),
    );
    const body = (await response.json()) as {
      success: boolean;
      page: number;
      totalPages: number;
      items: Array<{ id: string; providerBadges: Array<{ id: string }> }>;
      filters: { providers: string[] };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.page).toBe(2);
    expect(body.totalPages).toBe(30);
    expect(body.filters.providers).toEqual(['netflix', 'prime']);
    expect(body.items.map((item) => item.id)).toEqual(['tmdb-tv-22', 'tmdb-movie-11']);
    expect(body.items[0]?.providerBadges.map((badge) => badge.id)).toEqual(['prime', 'hulu']);
    expect(body.items[1]?.providerBadges.map((badge) => badge.id)).toEqual(['netflix', 'appletv']);

    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain('/discover/movie?');
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain('watch_region=US');
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain('with_watch_providers=8%7C9');
    expect(vi.mocked(fetch).mock.calls[1]?.[0]).toContain('/discover/tv?');
  });

  it('uses search when query is present and drops titles without requested providers', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            page: 1,
            total_pages: 4,
            total_results: 70,
            results: [
              {
                id: 100,
                media_type: 'movie',
                title: 'Severance',
                original_title: 'Severance',
                overview: 'Office horror.',
                poster_path: '/sev.jpg',
                backdrop_path: '/sev-bg.jpg',
                genre_ids: [53],
                popularity: 50,
                vote_average: 7.1,
                vote_count: 500,
                original_language: 'en',
                release_date: '2006-08-13',
              },
              {
                id: 101,
                media_type: 'tv',
                name: 'Severance',
                original_name: 'Severance',
                overview: 'Work/life split.',
                poster_path: '/sev-tv.jpg',
                backdrop_path: '/sev-tv-bg.jpg',
                genre_ids: [18, 9648],
                popularity: 95,
                vote_average: 8.4,
                vote_count: 8000,
                original_language: 'en',
                first_air_date: '2022-02-18',
              },
              {
                id: 400,
                media_type: 'person',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 100,
            results: {
              US: {
                flatrate: [{ provider_id: 15, provider_name: 'Hulu', logo_path: '/hulu.png', display_priority: 1 }],
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 101,
            results: {
              US: {
                flatrate: [{ provider_id: 350, provider_name: 'Apple TV Plus', logo_path: '/appletv.png', display_priority: 1 }],
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    const response = await libraryHandler(
      new Request('https://example.com/api/library?region=US&providers=appletv&query=severance'),
    );
    const body = (await response.json()) as {
      success: boolean;
      items: Array<{ id: string }>;
      filters: { query?: string };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.filters.query).toBe('severance');
    expect(body.items.map((item) => item.id)).toEqual(['tmdb-tv-101']);
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain('/search/multi?');
  });

  it('rejects unsupported regions with a typed error', async () => {
    const response = await libraryHandler(
      new Request('https://example.com/api/library?region=GB'),
    );
    const body = (await response.json()) as {
      success: boolean;
      error: { code: string; message: string };
    };

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toEqual({
      code: 'invalid_region',
      message: 'region must be one of: US, ZA',
    });
  });
});
