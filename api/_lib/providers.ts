import providerManifest from '../../data/streamers.json';

import type {
  Platform,
  ProviderBadge,
  Region,
  StreamerId,
  StreamerManifest,
  TitleProviders,
  WatchProviderOffer,
} from '../../shared/types';

const REGISTRY = providerManifest as StreamerManifest[];
const REGISTRY_BY_ID = new Map(REGISTRY.map((provider) => [provider.id, provider]));
const VALID_STREAMER_IDS = new Set<StreamerId>(REGISTRY.map((provider) => provider.id));

export function listProviders(region?: Region): StreamerManifest[] {
  if (!region) {
    return REGISTRY;
  }

  return REGISTRY.filter((provider) => provider.regions.includes(region));
}

export function getProviderById(id: StreamerId): StreamerManifest | undefined {
  return REGISTRY_BY_ID.get(id);
}

export function parseProviderIds(raw: string | null): StreamerId[] {
  if (!raw) {
    return [];
  }

  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is StreamerId => VALID_STREAMER_IDS.has(value as StreamerId));

  return [...new Set(values)];
}

export function tmdbProviderIdsForSelection(region: Region, streamerIds: StreamerId[]): number[] {
  const ids = new Set<number>();

  for (const streamerId of streamerIds) {
    const provider = getProviderById(streamerId);
    for (const providerId of provider?.tmdbProviderIds[region] ?? []) {
      ids.add(providerId);
    }
  }

  return [...ids];
}

export function findStreamerForOffer(
  region: Region,
  providerId: number,
  providerName: string,
): StreamerManifest | undefined {
  return REGISTRY.find((provider) => {
    const ids = provider.tmdbProviderIds[region] ?? [];
    const names = provider.tmdbProviderNames?.[region] ?? [];

    return ids.includes(providerId) || names.includes(providerName);
  });
}

export function badgeFromOffer(offer: WatchProviderOffer): ProviderBadge | null {
  if (!offer.streamerId) {
    return null;
  }

  const streamer = getProviderById(offer.streamerId);
  if (!streamer) {
    return null;
  }

  return {
    id: streamer.id,
    name: streamer.name,
    logo: streamer.logo,
  };
}

export function badgesFromProviders(providers: TitleProviders): ProviderBadge[] {
  const badgeMap = new Map<StreamerId, ProviderBadge>();
  const groups = [providers.flatrate, providers.free, providers.ads, providers.buy, providers.rent];

  for (const group of groups) {
    for (const offer of group) {
      const badge = badgeFromOffer(offer);
      if (badge) {
        badgeMap.set(badge.id, badge);
      }
    }
  }

  return [...badgeMap.values()];
}

export function buildSearchQuery(title: string, year: number | null): string {
  return year ? `${title} ${year}` : title;
}

export function buildStreamerSearchUrl(
  streamerId: StreamerId,
  platform: Platform,
  title: string,
  year: number | null,
): string | undefined {
  const provider = getProviderById(streamerId);
  const template = provider?.searchUrlTemplates[platform] ?? provider?.searchUrlTemplates.web;

  if (!template) {
    return undefined;
  }

  return template.replace('{query}', encodeURIComponent(buildSearchQuery(title, year)));
}
