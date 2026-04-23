import type {
  PersistedTitle,
  Show,
  TitleDetail,
  TmdbTitleType,
  UserState,
} from '../types';
import { fetchTitle } from './library-api';
import { getCachedTitleDetail, setCachedTitleDetail } from './library-cache';

type ParsedTitleId = {
  tmdbType: TmdbTitleType;
  tmdbId: number;
};

type TitleSource = TitleDetail | PersistedTitle;

export type LiveTitleResolution = {
  titles: Show[];
  loading: boolean;
};

const pendingTitleLoads = new Set<string>();

export function parseTitleId(id: string): ParsedTitleId | null {
  const match = /^tmdb-(movie|tv)-(\d+)$/.exec(id);
  if (!match) return null;
  return {
    tmdbType: match[1] as TmdbTitleType,
    tmdbId: Number(match[2]),
  };
}

function toShow(source: TitleSource): Show {
  return {
    id: source.id,
    tmdbId: source.tmdbId,
    tmdbType: source.tmdbType,
    title: source.title,
    originalTitle: 'originalTitle' in source ? source.originalTitle : source.title,
    year: source.year,
    originalLanguage: 'originalLanguage' in source ? source.originalLanguage : 'en',
    overview: 'overview' in source ? source.overview : '',
    posterPath: 'posterPath' in source ? source.posterPath : null,
    posterUrl: source.posterUrl ?? null,
    backdropPath: 'backdropPath' in source ? source.backdropPath : null,
    backdropUrl: source.backdropUrl ?? null,
    releaseDate: 'releaseDate' in source ? source.releaseDate : null,
    genreIds: 'genreIds' in source ? source.genreIds : [],
    genres: 'genres' in source ? source.genres : [],
    popularity: 'popularity' in source ? source.popularity : 0,
    voteAverage: 'voteAverage' in source ? source.voteAverage : 0,
    voteCount: 'voteCount' in source ? source.voteCount : 0,
    providerBadges: 'providerBadges' in source ? source.providerBadges : [],
    runtimeMinutes: 'runtimeMinutes' in source ? source.runtimeMinutes : null,
    providers: {},
    deepLinks: {},
  };
}

function titleIdsForState(state: UserState): string[] {
  const ids = state.shows.length > 0
    ? state.shows
    : state.selectedTitles.map((title) => title.id);
  return [...new Set(ids)];
}

function fetchMissingTitle(id: string, parsed: ParsedTitleId, redraw: () => void): void {
  const key = `${parsed.tmdbType}:${parsed.tmdbId}`;
  if (pendingTitleLoads.has(key)) return;

  pendingTitleLoads.add(key);
  void fetchTitle(parsed.tmdbType, parsed.tmdbId)
    .then((response) => {
      if (response.item) {
        setCachedTitleDetail(parsed.tmdbType, parsed.tmdbId, response.item);
      }
    })
    .catch(() => {
      /* keep persisted fallback or loading state */
    })
    .finally(() => {
      pendingTitleLoads.delete(key);
      redraw();
    });
}

export function resolveLiveTitles(
  state: UserState,
  redraw: () => void,
): LiveTitleResolution {
  const persisted = new Map(state.selectedTitles.map((title) => [title.id, title]));
  const titles: Show[] = [];
  let loading = false;

  for (const id of titleIdsForState(state)) {
    const parsed = parseTitleId(id);
    if (!parsed) continue;

    const cached = getCachedTitleDetail(parsed.tmdbType, parsed.tmdbId);
    if (cached) {
      titles.push(toShow(cached));
      continue;
    }

    const fallback = persisted.get(id);
    if (fallback) {
      titles.push(toShow(fallback));
    }

    loading = true;
    fetchMissingTitle(id, parsed, redraw);
  }

  return { titles, loading };
}
