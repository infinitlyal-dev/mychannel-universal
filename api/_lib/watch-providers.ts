import type {
  Region,
  TitleProviders,
  TmdbTitleType,
  WatchProviderOffer,
} from '../../shared/types';
import { badgesFromProviders, findStreamerForOffer } from './providers';
import { tmdbJson } from './tmdb';

interface TmdbWatchProvider {
  provider_id: number;
  provider_name: string;
  display_priority?: number;
  logo_path?: string | null;
}

interface TmdbRegionProviders {
  link?: string;
  flatrate?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
}

interface TmdbWatchProvidersPayload {
  results?: Partial<Record<Region, TmdbRegionProviders>>;
}

const PROVIDER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PROVIDER_CACHE_MAX_ENTRIES = 1000;

type ProviderCacheEntry = {
  expiresAt: number;
  value: TitleProviders;
};

const providerCache = new Map<string, ProviderCacheEntry>();

function cacheKey(tmdbType: TmdbTitleType, tmdbId: number, region: Region): string {
  return `${tmdbType}:${tmdbId}:${region}`;
}

function getCachedProviders(key: string): TitleProviders | undefined {
  const entry = providerCache.get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    providerCache.delete(key);
    return undefined;
  }

  providerCache.delete(key);
  providerCache.set(key, entry);
  return entry.value;
}

function setCachedProviders(key: string, value: TitleProviders): void {
  providerCache.set(key, {
    expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS,
    value,
  });

  while (providerCache.size > PROVIDER_CACHE_MAX_ENTRIES) {
    const oldestKey = providerCache.keys().next().value as string | undefined;
    if (!oldestKey) {
      break;
    }
    providerCache.delete(oldestKey);
  }
}

function normalizeOffer(region: Region, offer: TmdbWatchProvider): WatchProviderOffer {
  const streamer = findStreamerForOffer(region, offer.provider_id, offer.provider_name);

  return {
    providerId: offer.provider_id,
    providerName: offer.provider_name,
    displayPriority: offer.display_priority ?? Number.MAX_SAFE_INTEGER,
    logoPath: offer.logo_path ?? null,
    streamerId: streamer?.id,
  };
}

function normalizeGroup(region: Region, offers: TmdbWatchProvider[] | undefined): WatchProviderOffer[] {
  return (offers ?? [])
    .map((offer) => normalizeOffer(region, offer))
    .filter((offer) => offer.streamerId)
    .sort((a, b) => a.displayPriority - b.displayPriority);
}

export async function fetchNormalizedTitleProviders(
  tmdbType: TmdbTitleType,
  tmdbId: number,
  region: Region,
): Promise<TitleProviders> {
  const key = cacheKey(tmdbType, tmdbId, region);
  const cached = getCachedProviders(key);
  if (cached) {
    return cached;
  }

  const payload = await tmdbJson<TmdbWatchProvidersPayload>(
    `/${tmdbType}/${tmdbId}/watch/providers`,
    {},
  );
  const regionProviders = payload.results?.[region];

  const normalized = {
    link: regionProviders?.link ?? null,
    flatrate: normalizeGroup(region, regionProviders?.flatrate),
    free: normalizeGroup(region, regionProviders?.free),
    ads: normalizeGroup(region, regionProviders?.ads),
    buy: normalizeGroup(region, regionProviders?.buy),
    rent: normalizeGroup(region, regionProviders?.rent),
  };

  setCachedProviders(key, normalized);
  return normalized;
}

export function badgesForTitleProviders(providers: TitleProviders) {
  return badgesFromProviders(providers);
}

export function resetTitleProviderCache(): void {
  providerCache.clear();
}
