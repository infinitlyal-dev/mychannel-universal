import { API_BASE, DEFAULT_LIBRARY_TYPE, DEFAULT_REGION } from '../../../shared/constants';
import type {
  LibraryFilters,
  LibraryProvidersResponse,
  LibraryResponse,
  Region,
  TitleProvidersResponse,
  TitleResponse,
  TmdbTitleType,
} from '../types';

/**
 * Typed client for the v2 live-library backend.
 *
 * Endpoints mirrored from shared/INTERFACES.md:
 *   GET /api/library                               -> LibraryResponse
 *   GET /api/library/providers                     -> LibraryProvidersResponse
 *   GET /api/title/:tmdbType/:tmdbId               -> TitleResponse
 *   GET /api/title/:tmdbType/:tmdbId/providers     -> TitleProvidersResponse
 *
 * This module intentionally does not cache. See `library-cache.ts` for the
 * session-scoped in-memory cache (shared/CACHE.md).
 */

export interface LibraryRequest extends LibraryFilters {
  page: number;
}

export class LibraryApiError extends Error {
  public readonly code: string;
  public readonly status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = 'LibraryApiError';
    this.code = code;
    this.status = status;
  }
}

function buildLibraryQuery(request: LibraryRequest): string {
  const params = new URLSearchParams();
  params.set('region', request.region);
  params.set('page', String(request.page));
  params.set('type', request.type ?? DEFAULT_LIBRARY_TYPE);

  if (request.providers && request.providers.length > 0) {
    params.set('providers', request.providers.join(','));
  }
  if (request.genre) {
    params.set('genre', request.genre);
  }

  const trimmedQuery = request.query?.trim();
  if (trimmedQuery) {
    params.set('query', trimmedQuery);
  }

  return params.toString();
}

interface ApiEnvelope {
  success: boolean;
  error?: { code: string; message: string };
}

async function getJson<T extends ApiEnvelope>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network error';
    throw new LibraryApiError('network_error', message);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new LibraryApiError('invalid_json', 'response was not valid JSON', response.status);
  }

  const data = body as T;
  if (!response.ok || !data?.success) {
    const code = data?.error?.code ?? `http_${response.status}`;
    const message = data?.error?.message ?? response.statusText ?? 'request failed';
    throw new LibraryApiError(code, message, response.status);
  }

  return data;
}

export function fetchLibrary(request: LibraryRequest): Promise<LibraryResponse> {
  const qs = buildLibraryQuery(request);
  return getJson<LibraryResponse>(`${API_BASE}/library?${qs}`);
}

export function fetchProviders(region?: Region): Promise<LibraryProvidersResponse> {
  const url = region
    ? `${API_BASE}/library/providers?region=${encodeURIComponent(region)}`
    : `${API_BASE}/library/providers`;
  return getJson<LibraryProvidersResponse>(url);
}

export function fetchTitle(
  tmdbType: TmdbTitleType,
  tmdbId: number,
): Promise<TitleResponse> {
  return getJson<TitleResponse>(`${API_BASE}/title/${tmdbType}/${tmdbId}`);
}

export function fetchTitleProviders(
  tmdbType: TmdbTitleType,
  tmdbId: number,
  region: Region = DEFAULT_REGION,
): Promise<TitleProvidersResponse> {
  const qs = `region=${encodeURIComponent(region)}`;
  return getJson<TitleProvidersResponse>(
    `${API_BASE}/title/${tmdbType}/${tmdbId}/providers?${qs}`,
  );
}
