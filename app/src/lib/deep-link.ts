import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import type { Show, StreamerId } from '../types';

export function pickPlatform(): 'android' | 'ios' | 'web' {
  const p = Capacitor.getPlatform();
  if (p === 'android' || p === 'ios') return p;
  return 'web';
}

export function buildDeepLink(show: Show, streamer: StreamerId, platform: 'android' | 'ios' | 'web'): string | undefined {
  return show.deepLinks?.[streamer]?.[platform] ?? show.deepLinks?.[streamer]?.web;
}

export async function fallbackToWeb(show: Show, streamer: StreamerId): Promise<void> {
  const web = show.deepLinks?.[streamer]?.web;
  if (web) await AppLauncher.openUrl({ url: web });
}

export async function launchShow(show: Show, streamer: StreamerId): Promise<void> {
  const platform = pickPlatform();
  const link = buildDeepLink(show, streamer, platform);
  if (!link) {
    await fallbackToWeb(show, streamer);
    return;
  }
  const { value: canOpen } = await AppLauncher.canOpenUrl({ url: link });
  if (canOpen) await AppLauncher.openUrl({ url: link });
  else await fallbackToWeb(show, streamer);
}
