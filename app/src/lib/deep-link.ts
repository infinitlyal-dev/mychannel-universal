import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

import streamers from '../../../data/streamers.json';
import type { Platform, Show, StreamerId, StreamerManifest, TitleRef } from '../types';

const REGISTRY = streamers as StreamerManifest[];
const REGISTRY_BY_ID = new Map(REGISTRY.map((streamer) => [streamer.id, streamer]));

export function buildSearchQuery(title: Pick<TitleRef, 'title' | 'year'>): string {
  return title.year ? `${title.title} ${title.year}` : title.title;
}

export function buildStreamerSearchUrls(
  title: Pick<TitleRef, 'title' | 'year'>,
  streamerId: StreamerId,
): Partial<Record<Platform, string>> {
  const streamer = REGISTRY_BY_ID.get(streamerId);
  if (!streamer) {
    return {};
  }

  const query = encodeURIComponent(buildSearchQuery(title));
  const platforms: Platform[] = ['web', 'ios', 'android'];

  return Object.fromEntries(
    platforms.flatMap((platform) => {
      const template = streamer.searchUrlTemplates[platform] ?? streamer.searchUrlTemplates.web;
      return template ? [[platform, template.replace('{query}', query)]] : [];
    }),
  ) as Partial<Record<Platform, string>>;
}

export function pickPlatform(): Platform {
  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    return platform;
  }
  return 'web';
}

export function buildDeepLink(show: Pick<Show, 'title' | 'year'>, streamer: StreamerId, platform: Platform): string | undefined {
  const urls = buildStreamerSearchUrls(show, streamer);
  return urls[platform] ?? urls.web;
}

export async function fallbackToWeb(show: Pick<Show, 'title' | 'year'>, streamer: StreamerId): Promise<void> {
  const web = buildStreamerSearchUrls(show, streamer).web;
  if (web) {
    await AppLauncher.openUrl({ url: web });
  }
}

export async function launchShow(show: Pick<Show, 'title' | 'year'>, streamer: StreamerId): Promise<void> {
  const platform = pickPlatform();
  const link = buildDeepLink(show, streamer, platform);

  if (!link) {
    await fallbackToWeb(show, streamer);
    return;
  }

  const { value: canOpen } = await AppLauncher.canOpenUrl({ url: link });
  if (canOpen) {
    await AppLauncher.openUrl({ url: link });
    return;
  }

  await fallbackToWeb(show, streamer);
}
