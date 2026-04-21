import type { Show, Streamer } from '../types';

function dataUrl(path: string): string {
  return new URL(path, document.baseURI).toString();
}

export async function loadStreamers(): Promise<Streamer[]> {
  const res = await fetch(dataUrl('data/streamers.json'));
  if (!res.ok) throw new Error('streamers load failed');
  return (await res.json()) as Streamer[];
}

export async function loadCatalogue(): Promise<Show[]> {
  const res = await fetch(dataUrl('data/catalogue.json'));
  if (!res.ok) throw new Error('catalogue load failed');
  return (await res.json()) as Show[];
}
