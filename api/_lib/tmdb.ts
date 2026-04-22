import {
  TMDB_BACKDROP_SIZE,
  TMDB_IMAGE_BASE,
  TMDB_POSTER_SIZE,
} from '../../shared/constants';
import type {
  LibraryTitle,
  ProviderBadge,
  TitleDetail,
  TitleRef,
  TmdbTitleType,
} from '../../shared/types';
import { mapTmdbGenres } from '../../data/tmdb-genre-mapping';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';

export interface TmdbSummary {
  id: number;
  media_type?: TmdbTitleType | 'person';
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  release_date?: string;
  first_air_date?: string;
}

interface TmdbGenreObject {
  id: number;
  name: string;
}

export interface TmdbDetail extends TmdbSummary {
  genres?: TmdbGenreObject[];
  runtime?: number | null;
  episode_run_time?: number[];
  status?: string | null;
  tagline?: string | null;
  homepage?: string | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
}

function getApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured');
  }
  return apiKey;
}

export async function tmdbJson<T>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const apiKey = getApiKey();
  const url = new URL(`${TMDB_API_BASE}${path}`);
  url.searchParams.set('api_key', apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function buildTitleId(tmdbType: TmdbTitleType, tmdbId: number): string {
  return `tmdb-${tmdbType}-${tmdbId}`;
}

export function createImageUrl(path: string | null | undefined, size: string): string | null {
  if (!path) {
    return null;
  }

  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function extractYear(date: string | undefined): number | null {
  if (!date) {
    return null;
  }

  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

export function normalizeTitleRef(tmdbType: TmdbTitleType, payload: TmdbSummary): TitleRef {
  const releaseDate = payload.release_date ?? payload.first_air_date;
  const title = payload.title ?? payload.name ?? 'Untitled';

  return {
    id: buildTitleId(tmdbType, payload.id),
    tmdbId: payload.id,
    tmdbType,
    title,
    year: extractYear(releaseDate),
  };
}

export function normalizeLibraryTitle(
  tmdbType: TmdbTitleType,
  payload: TmdbSummary,
  providerBadges: ProviderBadge[],
): LibraryTitle {
  const releaseDate = payload.release_date ?? payload.first_air_date ?? null;
  const title = payload.title ?? payload.name ?? 'Untitled';
  const originalTitle = payload.original_title ?? payload.original_name ?? title;
  const genreIds = payload.genre_ids ?? [];

  return {
    id: buildTitleId(tmdbType, payload.id),
    tmdbId: payload.id,
    tmdbType,
    title,
    originalTitle,
    year: extractYear(releaseDate ?? undefined),
    originalLanguage: payload.original_language ?? 'und',
    overview: payload.overview ?? '',
    posterPath: payload.poster_path ?? null,
    posterUrl: createImageUrl(payload.poster_path, TMDB_POSTER_SIZE),
    backdropPath: payload.backdrop_path ?? null,
    backdropUrl: createImageUrl(payload.backdrop_path, TMDB_BACKDROP_SIZE),
    releaseDate,
    genreIds,
    genres: mapTmdbGenres(genreIds),
    popularity: payload.popularity ?? 0,
    voteAverage: payload.vote_average ?? 0,
    voteCount: payload.vote_count ?? 0,
    providerBadges,
  };
}

export function normalizeTitleDetail(
  tmdbType: TmdbTitleType,
  payload: TmdbDetail,
  providerBadges: ProviderBadge[] = [],
): TitleDetail {
  const summary = normalizeLibraryTitle(
    tmdbType,
    {
      ...payload,
      genre_ids: payload.genres?.map((genre) => genre.id) ?? payload.genre_ids ?? [],
    },
    providerBadges,
  );

  const runtimeMinutes =
    payload.runtime ?? payload.episode_run_time?.find((runtime) => Number.isFinite(runtime)) ?? null;

  return {
    ...summary,
    runtimeMinutes,
    status: payload.status ?? null,
    tagline: payload.tagline ?? null,
    homepage: payload.homepage ?? null,
    numberOfSeasons: payload.number_of_seasons ?? null,
    numberOfEpisodes: payload.number_of_episodes ?? null,
  };
}
