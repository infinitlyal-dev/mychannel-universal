import { applyMiddleware, jsonResponse } from '../../../_middleware';
import type { Region, TitleProvidersResponse, TmdbTitleType } from '../../../../shared/types';
import { fetchNormalizedTitleProviders } from '../../../_lib/watch-providers';
import { normalizeTitleRef, tmdbJson, type TmdbDetail } from '../../../_lib/tmdb';

export const config = {
  runtime: 'edge',
};

interface HandlerContext {
  params?: {
    tmdbType?: string;
    tmdbId?: string;
  };
}

function parseType(value: string | null | undefined): TmdbTitleType | null {
  if (value === 'movie' || value === 'tv') {
    return value;
  }
  return null;
}

function parseTmdbId(value: string | null | undefined): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseRegion(value: string | null): Region {
  return value === 'ZA' ? 'ZA' : 'US';
}

export default async function titleProvidersHandler(
  request: Request,
  context: HandlerContext = {},
): Promise<Response> {
  const middleware = await applyMiddleware(request, { requireDeviceId: false });
  if (middleware.response) {
    return middleware.response;
  }

  const tmdbType = parseType(context.params?.tmdbType);
  const tmdbId = parseTmdbId(context.params?.tmdbId);
  const region = parseRegion(new URL(request.url).searchParams.get('region'));

  if (!tmdbType || !tmdbId) {
    const body: TitleProvidersResponse = {
      success: false,
      region,
      tmdbType: 'movie',
      tmdbId: 0,
      error: {
        code: 'invalid_route',
        message: 'tmdbType must be movie|tv and tmdbId must be numeric',
      },
    };
    return jsonResponse(body, { request, headers: middleware.headers, status: 400 });
  }

  try {
    const [detail, providers] = await Promise.all([
      tmdbJson<TmdbDetail>(`/${tmdbType}/${tmdbId}`, {}),
      fetchNormalizedTitleProviders(tmdbType, tmdbId, region),
    ]);

    const body: TitleProvidersResponse = {
      success: true,
      region,
      tmdbType,
      tmdbId,
      title: normalizeTitleRef(tmdbType, detail),
      providers,
    };

    return jsonResponse(body, { request, headers: middleware.headers, status: 200 });
  } catch (error) {
    const body: TitleProvidersResponse = {
      success: false,
      region,
      tmdbType,
      tmdbId,
      error: {
        code: 'tmdb_error',
        message: error instanceof Error ? error.message : 'TMDB request failed',
      },
    };
    return jsonResponse(body, { request, headers: middleware.headers, status: 502 });
  }
}
