import { applyMiddleware, jsonResponse } from './_middleware';
import type { ApiErrorShape, LibraryResponse, Region, TmdbTitleType } from '../shared/types';
import { DEFAULT_LIBRARY_PAGE_SIZE, DEFAULT_LIBRARY_TYPE } from '../shared/constants';
import { badgesForTitleProviders, fetchNormalizedTitleProviders } from './_lib/watch-providers';
import { normalizeLibraryTitle, tmdbJson, type TmdbSummary } from './_lib/tmdb';
import { parseProviderIds, tmdbProviderIdsForSelection } from './_lib/providers';

export const config = {
  runtime: 'edge',
};

interface TmdbPagedResult {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbSummary[];
}

function errorBody(code: string, message: string): ApiErrorShape {
  return { code, message };
}

function parseRegion(value: string | null): Region | null {
  if (!value || value === 'US' || value === 'ZA') {
    return (value ?? 'US') as Region;
  }

  return null;
}

function parseType(value: string | null): TmdbTitleType | 'all' {
  return value === 'movie' || value === 'tv' ? value : DEFAULT_LIBRARY_TYPE;
}

function parsePage(value: string | null): number {
  const page = Number(value ?? '1');
  if (!Number.isInteger(page) || page < 1 || page > 500) {
    return 1;
  }
  return page;
}

async function enrichItem(
  item: TmdbSummary,
  tmdbType: TmdbTitleType,
  region: Region,
  selectedProviders: string[],
) {
  const providers = await fetchNormalizedTitleProviders(tmdbType, item.id, region);
  const badges = badgesForTitleProviders(providers);

  if (selectedProviders.length > 0) {
    const badgeIds = new Set(badges.map((badge) => badge.id));
    const hasMatch = selectedProviders.some((providerId) => badgeIds.has(providerId as never));
    if (!hasMatch) {
      return null;
    }
  }

  return normalizeLibraryTitle(tmdbType, item, badges);
}

async function browseDiscover(
  region: Region,
  page: number,
  type: TmdbTitleType | 'all',
  providerIds: number[],
) {
  const discoverParams = {
    page,
    include_adult: 'false',
    watch_region: region,
    with_watch_monetization_types: 'flatrate|free|ads',
    with_watch_providers: providerIds.length > 0 ? providerIds.join('|') : undefined,
    sort_by: 'popularity.desc',
  };

  if (type === 'movie' || type === 'tv') {
    const single = await tmdbJson<TmdbPagedResult>(`/discover/${type}`, discoverParams);
    return {
      items: single.results.map((item) => ({ item, tmdbType: type as TmdbTitleType })),
      totalPages: single.total_pages,
      totalResults: single.total_results,
    };
  }

  const [movies, tv] = await Promise.all([
    tmdbJson<TmdbPagedResult>('/discover/movie', discoverParams),
    tmdbJson<TmdbPagedResult>('/discover/tv', discoverParams),
  ]);

  return {
    items: [
      ...movies.results.map((item) => ({ item, tmdbType: 'movie' as const })),
      ...tv.results.map((item) => ({ item, tmdbType: 'tv' as const })),
    ],
    totalPages: Math.max(movies.total_pages, tv.total_pages),
    totalResults: movies.total_results + tv.total_results,
  };
}

async function browseSearch(query: string, page: number) {
  const results = await tmdbJson<TmdbPagedResult>('/search/multi', {
    query,
    page,
    include_adult: 'false',
  });

  return {
    items: results.results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item) => ({
        item,
        tmdbType: item.media_type as TmdbTitleType,
      })),
    totalPages: results.total_pages,
    totalResults: results.total_results,
  };
}

export default async function libraryHandler(request: Request): Promise<Response> {
  const middleware = await applyMiddleware(request, { requireDeviceId: false });
  if (middleware.response) {
    return middleware.response;
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, { request, headers: middleware.headers, status: 405 });
  }

  const url = new URL(request.url);
  const region = parseRegion(url.searchParams.get('region'));

  if (!region) {
    const body: LibraryResponse = {
      success: false,
      region: 'US',
      page: 1,
      totalPages: 0,
      totalResults: 0,
      filters: { region: 'US', providers: [] },
      items: [],
      error: errorBody('invalid_region', 'region must be one of: US, ZA'),
    };
    return jsonResponse(body, { request, headers: middleware.headers, status: 400 });
  }

  const providers = parseProviderIds(url.searchParams.get('providers'));
  const tmdbProviderIds = tmdbProviderIdsForSelection(region, providers);
  const page = parsePage(url.searchParams.get('page'));
  const type = parseType(url.searchParams.get('type'));
  const query = url.searchParams.get('query')?.trim() || undefined;
  const genre = url.searchParams.get('genre') || undefined;

  try {
    const base = query
      ? await browseSearch(query, page)
      : await browseDiscover(region, page, type, tmdbProviderIds);

    const enriched = await Promise.all(
      base.items
        .slice(0, DEFAULT_LIBRARY_PAGE_SIZE)
        .map(({ item, tmdbType }) => enrichItem(item, tmdbType, region, providers)),
    );

    const body: LibraryResponse = {
      success: true,
      region,
      page,
      totalPages: base.totalPages,
      totalResults: base.totalResults,
      filters: {
        region,
        providers,
        genre: genre as never,
        query,
        type,
      },
      items: enriched
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((left, right) => right.popularity - left.popularity),
    };

    return jsonResponse(body, { request, headers: middleware.headers, status: 200 });
  } catch (error) {
    const body: LibraryResponse = {
      success: false,
      region,
      page,
      totalPages: 0,
      totalResults: 0,
      filters: { region, providers, genre: genre as never, query, type },
      items: [],
      error: errorBody('tmdb_error', error instanceof Error ? error.message : 'TMDB request failed'),
    };

    return jsonResponse(body, { request, headers: middleware.headers, status: 502 });
  }
}
