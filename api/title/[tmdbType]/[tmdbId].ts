import { applyMiddleware, jsonResponse } from '../../_middleware';
import type { TitleResponse, TmdbTitleType } from '../../../shared/types';
import { normalizeTitleDetail, tmdbJson, type TmdbDetail } from '../../_lib/tmdb';

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

export default async function titleDetailHandler(
  request: Request,
  context: HandlerContext = {},
): Promise<Response> {
  const middleware = await applyMiddleware(request, { requireDeviceId: false });
  if (middleware.response) {
    return middleware.response;
  }

  const tmdbType = parseType(context.params?.tmdbType);
  const tmdbId = parseTmdbId(context.params?.tmdbId);

  if (!tmdbType || !tmdbId) {
    const body: TitleResponse = {
      success: false,
      error: {
        code: 'invalid_route',
        message: 'tmdbType must be movie|tv and tmdbId must be numeric',
      },
    };
    return jsonResponse(body, { request, headers: middleware.headers, status: 400 });
  }

  try {
    const detail = await tmdbJson<TmdbDetail>(`/${tmdbType}/${tmdbId}`, {});
    const body: TitleResponse = {
      success: true,
      item: normalizeTitleDetail(tmdbType, detail),
    };
    return jsonResponse(body, { request, headers: middleware.headers, status: 200 });
  } catch (error) {
    const body: TitleResponse = {
      success: false,
      error: {
        code: 'tmdb_error',
        message: error instanceof Error ? error.message : 'TMDB request failed',
      },
    };
    return jsonResponse(body, { request, headers: middleware.headers, status: 502 });
  }
}
