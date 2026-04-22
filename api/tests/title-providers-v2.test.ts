import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import titleProvidersHandler from '../title/[tmdbType]/[tmdbId]/providers';

describe('GET /api/title/:tmdbType/:tmdbId/providers', () => {
  beforeEach(() => {
    process.env.TMDB_API_KEY = 'tmdb-test-key';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TMDB_API_KEY;
  });

  it('returns normalized offers for one title and region', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 93962,
            name: 'The Bear',
            first_air_date: '2022-06-23',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 93962,
            results: {
              US: {
                link: 'https://www.themoviedb.org/tv/93962/watch?locale=US',
                flatrate: [
                  { provider_id: 15, provider_name: 'Hulu', logo_path: '/hulu.png', display_priority: 1 },
                  { provider_id: 1770, provider_name: 'Paramount+ with Showtime', logo_path: '/showtime.png', display_priority: 2 },
                ],
                ads: [
                  { provider_id: 386, provider_name: 'Peacock', logo_path: '/peacock.png', display_priority: 3 },
                ],
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    const response = await titleProvidersHandler(
      new Request('https://example.com/api/title/tv/93962/providers?region=US'),
      { params: { tmdbType: 'tv', tmdbId: '93962' } },
    );
    const body = (await response.json()) as {
      success: boolean;
      title?: { title: string; year: number | null };
      providers?: {
        link: string | null;
        flatrate: Array<{ streamerId?: string; providerName: string }>;
        ads: Array<{ streamerId?: string }>;
      };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.title).toMatchObject({ title: 'The Bear', year: 2022 });
    expect(body.providers?.link).toBe('https://www.themoviedb.org/tv/93962/watch?locale=US');
    expect(body.providers?.flatrate).toMatchObject([
      { providerName: 'Hulu', streamerId: 'hulu' },
      { providerName: 'Paramount+ with Showtime', streamerId: 'showtime' },
    ]);
    expect(body.providers?.ads).toMatchObject([{ streamerId: 'peacock' }]);
  });
});
