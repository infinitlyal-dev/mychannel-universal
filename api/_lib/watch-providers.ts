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
  const payload = await tmdbJson<TmdbWatchProvidersPayload>(
    `/${tmdbType}/${tmdbId}/watch/providers`,
    {},
  );
  const regionProviders = payload.results?.[region];

  return {
    link: regionProviders?.link ?? null,
    flatrate: normalizeGroup(region, regionProviders?.flatrate),
    free: normalizeGroup(region, regionProviders?.free),
    ads: normalizeGroup(region, regionProviders?.ads),
    buy: normalizeGroup(region, regionProviders?.buy),
    rent: normalizeGroup(region, regionProviders?.rent),
  };
}

export function badgesForTitleProviders(providers: TitleProviders) {
  return badgesFromProviders(providers);
}
