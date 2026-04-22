import { z } from 'zod';

import type { Region, StreamerId, TmdbProvidersResponse } from '../../../../shared/types';
import { applyMiddleware, jsonResponse } from '../../../_middleware';

export const config = {
  runtime: 'edge',
};

const tmdbTypeSchema = z.enum(['tv', 'movie']);
const regionSchema = z.enum(['ZA', 'US']);
const tmdbIdSchema = z.string().regex(/^\d+$/);

const PROVIDER_NAME_TO_ID: Record<string, StreamerId> = {
  'Amazon Prime Video': 'prime',
  'Apple TV Plus': 'appletv',
  'Apple TV+': 'appletv',
  'Disney Plus': 'disney',
  Hulu: 'hulu',
  Max: 'max',
  Netflix: 'netflix',
  'Paramount Plus': 'paramount',
  Showmax: 'showmax',
  YouTube: 'youtube',
};

interface TmdbWatchProvider {
  provider_name: string;
}

interface TmdbWatchProviderRegion {
  ads?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
  flatrate?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
}

interface TmdbWatchProvidersPayload {
  results?: Partial<Record<Region, TmdbWatchProviderRegion>>;
}

interface HandlerContext {
  params?: {
    tmdbId?: string;
    tmdbType?: string;
  };
}

function toProviders(regionPayload?: TmdbWatchProviderRegion): StreamerId[] {
  if (!regionPayload) {
    return [];
  }

  const orderedSources = [
    regionPayload.flatrate ?? [],
    regionPayload.free ?? [],
    regionPayload.ads ?? [],
    regionPayload.buy ?? [],
    regionPayload.rent ?? [],
  ];

  const providers = new Set<StreamerId>();

  for (const source of orderedSources) {
    for (const provider of source) {
      const mappedProvider = PROVIDER_NAME_TO_ID[provider.provider_name];

      if (mappedProvider) {
        providers.add(mappedProvider);
      }
    }
  }

  return [...providers];
}

function typedErrorResponse(
  request: Request,
  headers: Headers,
  status: number,
  region: Region,
  error: string,
): Response {
  const body: TmdbProvidersResponse = {
    success: false,
    region,
    providers: [],
    error,
  };

  return jsonResponse(body, {
    request,
    headers,
    status,
  });
}

export default async function tmdbProvidersHandler(
  request: Request,
  context: HandlerContext = {},
): Promise<Response> {
  const middleware = await applyMiddleware(request, {
    requireDeviceId: true,
    rateLimit: {
      key: 'tmdb-providers',
      limit: 100,
      windowMs: 60 * 60 * 1000,
    },
  });

  if (middleware.response) {
    return middleware.response;
  }

  if (request.method !== 'GET') {
    return jsonResponse(
      { error: 'Method not allowed' },
      {
        request,
        headers: middleware.headers,
        status: 405,
      },
    );
  }

  const url = new URL(request.url);
  const tmdbTypeParam = context.params?.tmdbType ?? url.searchParams.get('tmdbType');
  const tmdbIdParam = context.params?.tmdbId ?? url.searchParams.get('tmdbId');
  const tmdbType = tmdbTypeSchema.safeParse(tmdbTypeParam);
  const tmdbId = tmdbIdSchema.safeParse(tmdbIdParam);

  if (!tmdbType.success || !tmdbId.success) {
    return jsonResponse(
      { error: 'Invalid TMDB route parameters' },
      {
        request,
        headers: middleware.headers,
        status: 400,
      },
    );
  }

  const requestedRegion = url.searchParams.get('region') ?? 'ZA';
  const region = regionSchema.safeParse(requestedRegion);

  if (!region.success) {
    return typedErrorResponse(
      request,
      middleware.headers,
      400,
      'ZA',
      'Invalid region. Use ZA or US.',
    );
  }

  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return typedErrorResponse(
      request,
      middleware.headers,
      500,
      region.data,
      'TMDB_API_KEY is not configured',
    );
  }

  let tmdbResponse: Response;

  try {
    tmdbResponse = await fetch(
      `https://api.themoviedb.org/3/${tmdbType.data}/${tmdbId.data}/watch/providers?api_key=${encodeURIComponent(apiKey)}`,
    );
  } catch {
    return typedErrorResponse(
      request,
      middleware.headers,
      502,
      region.data,
      'TMDB request failed',
    );
  }

  if (!tmdbResponse.ok) {
    return typedErrorResponse(
      request,
      middleware.headers,
      tmdbResponse.status,
      region.data,
      `TMDB request failed with status ${tmdbResponse.status}`,
    );
  }

  const body = (await tmdbResponse.json()) as TmdbWatchProvidersPayload;
  const responseBody: TmdbProvidersResponse = {
    success: true,
    region: region.data,
    providers: toProviders(body.results?.[region.data]),
  };

  const headers = new Headers(middleware.headers);
  headers.set('cache-control', 'public, max-age=86400');

  return jsonResponse(responseBody, {
    request,
    headers,
    status: 200,
  });
}
