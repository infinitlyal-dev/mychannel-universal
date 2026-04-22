import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import titleDetailHandler from '../title/[tmdbType]/[tmdbId]';

describe('GET /api/title/:tmdbType/:tmdbId', () => {
  beforeEach(() => {
    process.env.TMDB_API_KEY = 'tmdb-test-key';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TMDB_API_KEY;
  });

  it('returns normalized title detail', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 550,
          title: 'Fight Club',
          original_title: 'Fight Club',
          overview: 'Insomnia and fists.',
          poster_path: '/fight-club.jpg',
          backdrop_path: '/fight-club-bg.jpg',
          genres: [
            { id: 18, name: 'Drama' },
            { id: 53, name: 'Thriller' },
          ],
          runtime: 139,
          status: 'Released',
          tagline: 'Mischief. Mayhem. Soap.',
          homepage: 'https://example.com/fight-club',
          release_date: '1999-10-15',
          vote_average: 8.4,
          vote_count: 25000,
          popularity: 120,
          original_language: 'en',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const response = await titleDetailHandler(
      new Request('https://example.com/api/title/movie/550'),
      { params: { tmdbType: 'movie', tmdbId: '550' } },
    );
    const body = (await response.json()) as {
      success: boolean;
      item: { id: string; title: string; year: number | null; runtimeMinutes: number | null; genres: string[] };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.item).toMatchObject({
      id: 'tmdb-movie-550',
      title: 'Fight Club',
      year: 1999,
      runtimeMinutes: 139,
      genres: ['drama', 'thriller'],
    });
  });
});
