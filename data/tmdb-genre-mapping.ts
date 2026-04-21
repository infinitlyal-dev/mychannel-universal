// Maps TMDB genre IDs (both /movie and /tv) to our 12 GenreId buckets.
// A single TMDB id may map to one or more of our buckets.
// Unmapped TMDB ids are dropped silently.

import type { GenreId } from '../shared/types';

export const TMDB_GENRE_MAP: Record<number, GenreId[]> = {
  // Movie genres
  28: ['action'],             // Action
  12: ['action'],             // Adventure
  16: ['animation'],          // Animation
  35: ['comedy'],             // Comedy
  80: ['crime'],              // Crime
  99: ['documentary'],        // Documentary
  18: ['drama'],              // Drama
  10751: ['drama'],           // Family
  14: ['fantasy'],            // Fantasy
  36: ['drama'],              // History
  27: ['horror'],             // Horror
  10402: ['drama'],           // Music
  9648: ['thriller'],         // Mystery
  10749: ['romance'],         // Romance
  878: ['scifi'],             // Science Fiction
  10770: ['drama'],           // TV Movie
  53: ['thriller'],           // Thriller
  10752: ['drama'],           // War
  37: ['action'],             // Western

  // TV-only genres
  10759: ['action'],          // Action & Adventure
  10762: ['animation'],       // Kids
  10763: ['documentary'],     // News
  10764: ['reality'],         // Reality
  10765: ['scifi', 'fantasy'],// Sci-Fi & Fantasy
  10766: ['drama'],           // Soap
  10767: ['reality'],         // Talk
  10768: ['drama'],           // War & Politics
};

export function mapTmdbGenres(tmdbGenreIds: number[]): GenreId[] {
  const out = new Set<GenreId>();
  for (const id of tmdbGenreIds) {
    const mapped = TMDB_GENRE_MAP[id];
    if (mapped) mapped.forEach(g => out.add(g));
  }
  return [...out];
}
