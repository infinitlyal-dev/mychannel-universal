import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TitleDetail, UserState } from '../src/types';
import { clearLibraryCache, setCachedTitleDetail } from '../src/lib/library-cache';
import { resolveLiveTitles } from '../src/lib/live-title-details';

const detail: TitleDetail = {
  id: 'tmdb-tv-1',
  tmdbId: 1,
  tmdbType: 'tv',
  title: 'Cached Title',
  originalTitle: 'Cached Title',
  year: 2026,
  originalLanguage: 'en',
  overview: '',
  posterPath: null,
  posterUrl: '/cached.jpg',
  backdropPath: null,
  backdropUrl: null,
  releaseDate: '2026-01-01',
  genreIds: [],
  genres: [],
  popularity: 1,
  voteAverage: 1,
  voteCount: 1,
  providerBadges: [],
  runtimeMinutes: 42,
  status: null,
  tagline: null,
  homepage: null,
};

function state(partial: Partial<UserState>): UserState {
  return {
    version: 2,
    onboarded: false,
    region: 'US',
    streamers: [],
    shows: [],
    selectedTitles: [],
    schedule: [],
    channel: [],
    lastOpenedAt: '2026-04-23T00:00:00.000Z',
    ...partial,
  };
}

describe('resolveLiveTitles', () => {
  afterEach(() => {
    clearLibraryCache();
    vi.unstubAllGlobals();
  });

  it('returns cached title details without rendering an empty grid', () => {
    setCachedTitleDetail('tv', 1, detail);

    const result = resolveLiveTitles(
      state({ shows: ['tmdb-tv-1'] }),
      () => undefined,
    );

    expect(result.loading).toBe(false);
    expect(result.titles.map((title) => title.title)).toEqual(['Cached Title']);
  });

  it('uses persisted title metadata while fetching fresh title detail', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, item: detail }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const result = resolveLiveTitles(
      state({
        shows: ['tmdb-tv-1'],
        selectedTitles: [
          {
            id: 'tmdb-tv-1',
            tmdbId: 1,
            tmdbType: 'tv',
            title: 'Persisted Title',
            year: 2026,
            posterUrl: '/persisted.jpg',
          },
        ],
      }),
      () => undefined,
    );

    expect(result.loading).toBe(true);
    expect(result.titles.map((title) => title.title)).toEqual(['Persisted Title']);
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('/api/title/tv/1');
  });
});
