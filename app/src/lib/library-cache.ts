import type {
  LibraryResponse,
  Region,
  StreamerManifest,
  TitleDetail,
  TmdbTitleType,
} from '../types';
import type { LibraryRequest } from './library-api';

/**
 * Session-scoped in-memory cache for the v2 live library.
 *
 * Lifetime: app-session only. No localStorage, no disk persistence. See
 * shared/CACHE.md: provider data has a 24h server-side TTL, title detail is
 * live per request. This client cache exists purely for UX snappiness when
 * users re-open the picker mid-session.
 *
 * Caps (per shared/cursor-picker-plan.md §2.6):
 *   - providersByRegion: never evicted within session.
 *   - libraryPages: LRU cap 32.
 *   - titleDetails: LRU cap 64.
 */

const LIBRARY_PAGE_CAP = 32;
const TITLE_DETAIL_CAP = 64;

const providersByRegion: Map<Region, StreamerManifest[]> = new Map();
let providersAny: StreamerManifest[] | null = null;
const libraryPages: Map<string, LibraryResponse> = new Map();
const titleDetails: Map<string, TitleDetail> = new Map();

export function hashLibraryFilters(request: LibraryRequest): string {
  const providers = [...(request.providers ?? [])].sort().join(',');
  const genre = request.genre ?? '';
  const query = (request.query ?? '').trim().toLowerCase();
  const type = request.type ?? 'all';
  return `${request.region}|${type}|${providers}|${genre}|${query}|${request.page}`;
}

export function hashTitleKey(tmdbType: TmdbTitleType, tmdbId: number): string {
  return `${tmdbType}:${tmdbId}`;
}

function touch<K, V>(map: Map<K, V>, key: K): V | undefined {
  if (!map.has(key)) return undefined;
  const value = map.get(key) as V;
  map.delete(key);
  map.set(key, value);
  return value;
}

function setWithCap<K, V>(map: Map<K, V>, key: K, value: V, cap: number): void {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  while (map.size > cap) {
    const oldest = map.keys().next().value as K | undefined;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

// ---- providers (never evicted within session) ----

export function getCachedProviders(region?: Region): StreamerManifest[] | undefined {
  if (region) {
    return providersByRegion.get(region);
  }
  return providersAny ?? undefined;
}

export function setCachedProviders(
  region: Region | undefined,
  providers: StreamerManifest[],
): void {
  if (region) {
    providersByRegion.set(region, providers);
  } else {
    providersAny = providers;
  }
}

// ---- library pages (LRU cap 32) ----

export function getCachedLibraryPage(request: LibraryRequest): LibraryResponse | undefined {
  return touch(libraryPages, hashLibraryFilters(request));
}

export function setCachedLibraryPage(
  request: LibraryRequest,
  response: LibraryResponse,
): void {
  setWithCap(libraryPages, hashLibraryFilters(request), response, LIBRARY_PAGE_CAP);
}

// ---- title details (LRU cap 64) ----

export function getCachedTitleDetail(
  tmdbType: TmdbTitleType,
  tmdbId: number,
): TitleDetail | undefined {
  return touch(titleDetails, hashTitleKey(tmdbType, tmdbId));
}

export function setCachedTitleDetail(
  tmdbType: TmdbTitleType,
  tmdbId: number,
  detail: TitleDetail,
): void {
  setWithCap(titleDetails, hashTitleKey(tmdbType, tmdbId), detail, TITLE_DETAIL_CAP);
}

// ---- diagnostic / reset helpers ----

export function clearLibraryCache(): void {
  providersByRegion.clear();
  providersAny = null;
  libraryPages.clear();
  titleDetails.clear();
}

export interface LibraryCacheStats {
  providersByRegion: number;
  providersAny: boolean;
  libraryPages: number;
  titleDetails: number;
}

export function getLibraryCacheStats(): LibraryCacheStats {
  return {
    providersByRegion: providersByRegion.size,
    providersAny: providersAny !== null,
    libraryPages: libraryPages.size,
    titleDetails: titleDetails.size,
  };
}
