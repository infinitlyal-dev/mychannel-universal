// build-catalogue.ts — Nightly rebuild of /data/catalogue.json
// Run: node --import tsx data/scripts/build-catalogue.ts
// Env: TMDB_API_KEY (v3 API key, required)

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type {
  Show, Streamer, StreamerId, Region, GenreId,
} from '../../shared/types.js';
import { mapTmdbGenres } from '../tmdb-genre-mapping.js';

const TMDB_KEY = process.env.TMDB_API_KEY;
if (!TMDB_KEY) {
  console.error('FATAL: TMDB_API_KEY not set');
  process.exit(1);
}

const ROOT = resolve(process.cwd());
const DATA = (p: string) => resolve(ROOT, 'data', p);

// TMDB provider name → our StreamerId. Exact-match first, then contains.
const PROVIDER_MAP: Record<string, StreamerId> = {
  'Netflix': 'netflix',
  'Netflix Standard with Ads': 'netflix',
  'Disney Plus': 'disney',
  'Amazon Prime Video': 'prime',
  'Amazon Prime Video with Ads': 'prime',
  'Max': 'max',
  'Max Amazon Channel': 'max',
  'HBO Max': 'max',
  'Apple TV Plus': 'appletv',
  'Apple TV+': 'appletv',
  'Apple TV': 'appletv',
  'Apple TV Amazon Channel': 'appletv',
  'Hulu': 'hulu',
  'Paramount Plus': 'paramount',
  'Paramount+': 'paramount',
  'Paramount+ with Showtime': 'paramount',
  'Peacock': 'peacock',
  'Peacock Premium': 'peacock',
  'Peacock Premium Plus': 'peacock',
  'YouTube': 'youtube',
  'YouTube Premium': 'youtube',
};

const REGIONS: Region[] = ['ZA', 'US'];
const CONCURRENCY = 10;
const errors: string[] = [];

type SeedEntry = { tmdbType: 'tv' | 'movie'; tmdbId: number; hint: string };

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set('api_key', TMDB_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url);
      if (r.status === 429) {
        const retry = Number(r.headers.get('Retry-After') ?? '1');
        await new Promise(res => setTimeout(res, retry * 1000));
        continue;
      }
      if (!r.ok) throw new Error(`TMDB ${r.status} ${path}`);
      return await r.json() as T;
    } catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 500 * (attempt + 1))); }
  }
  throw lastErr;
}

async function resolveSeedId(entry: SeedEntry): Promise<number> {
  if (entry.tmdbId > 0) return entry.tmdbId;
  const endpoint = entry.tmdbType === 'tv' ? '/search/tv' : '/search/movie';
  const base = entry.hint.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  // Progressive queries: full, minus platform/tagger words, then title-core
  const NOISE = /\b(netflix|hulu|hbo|max|prime|apple|paramount|peacock|youtube|disney|plus|showtime|fx|prime|2019|2020|2021|2022|2023|2024|2025|fincher)\b/gi;
  const cleaner = base.replace(NOISE, ' ').replace(/\s+/g, ' ').trim();
  const candidates = [...new Set([base, cleaner, cleaner.split(/[-–—:]/)[0].trim()])].filter(Boolean);
  for (const q of candidates) {
    const res = await tmdbFetch<{ results: Array<{ id: number }> }>(endpoint, { query: q });
    const id = res.results[0]?.id;
    if (id) return id;
  }
  throw new Error(`No TMDB match: ${entry.hint}`);
}

async function fetchDetails(type: 'tv' | 'movie', id: number) {
  return tmdbFetch<any>(`/${type}/${id}`);
}

async function fetchProviders(type: 'tv' | 'movie', id: number) {
  return tmdbFetch<{ results: Record<string, { flatrate?: Array<{ provider_name: string }> }> }>(
    `/${type}/${id}/watch/providers`,
  );
}

const PROVIDER_ENTRIES_LC = Object.entries(PROVIDER_MAP)
  .map(([k, v]) => [k.toLowerCase(), v] as const)
  .sort((a, b) => b[0].length - a[0].length);  // Longest keys first — prevents "Max" swallowing "ShowMax".

function mapProviders(names: string[] | undefined): StreamerId[] {
  if (!names) return [];
  const out = new Set<StreamerId>();
  for (const name of names) {
    const lc = name.toLowerCase();
    const exact = PROVIDER_ENTRIES_LC.find(([k]) => k === lc);
    if (exact) { out.add(exact[1]); continue; }
    const partial = PROVIDER_ENTRIES_LC.find(([k]) => lc.includes(k));
    if (partial) out.add(partial[1]);
  }
  return [...out];
}

function buildDeepLinks(streamers: Streamer[], ids: StreamerId[], showTitle: string, tmdbId: number): Show['deepLinks'] {
  const out: Show['deepLinks'] = {};
  const slug = encodeURIComponent(showTitle);
  for (const sid of ids) {
    const s = streamers.find(x => x.id === sid);
    if (!s) continue;
    const token = ['youtube'].includes(sid) ? slug : String(tmdbId);
    out[sid] = {
      android: s.deepLinkSchemes.android + token,
      ios: s.deepLinkSchemes.ios + token,
      web: s.deepLinkSchemes.web + token,
    };
  }
  return out;
}

function titleMatches(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s*\([^)]*\)\s*/g, '').trim();
  const aTok = new Set(norm(a).split(/\s+/).filter(w => w.length > 2));
  const bTok = norm(b).split(/\s+/).filter(w => w.length > 2);
  if (bTok.length === 0) return true;
  const hits = bTok.filter(w => aTok.has(w)).length;
  return hits / bTok.length >= 0.5;
}

async function buildShow(entry: SeedEntry, streamers: Streamer[]): Promise<Show | null> {
  try {
    let tmdbId = await resolveSeedId(entry);
    let details: any = await fetchDetails(entry.tmdbType, tmdbId);
    const fetchedTitle: string = details.name || details.title || '';
    if (entry.tmdbId > 0 && !titleMatches(fetchedTitle, entry.hint)) {
      const rescued = await resolveSeedId({ ...entry, tmdbId: 0 });
      if (rescued !== tmdbId) { tmdbId = rescued; details = await fetchDetails(entry.tmdbType, tmdbId); }
    }
    const providers = await fetchProviders(entry.tmdbType, tmdbId);

    const title: string = details.name || details.title || entry.hint;
    const dateStr: string = details.first_air_date || details.release_date || '';
    const year = dateStr ? Number(dateStr.slice(0, 4)) : 0;
    if (!year) throw new Error('no year');

    const posterPath: string | null = details.poster_path;
    const backdropPath: string | null = details.backdrop_path;
    if (!posterPath || !backdropPath) throw new Error('missing artwork');

    const genreIds: number[] = (details.genres ?? []).map((g: any) => g.id);
    const genres = mapTmdbGenres(genreIds);
    if (genres.length === 0) throw new Error('no mappable genres');

    const runtime = entry.tmdbType === 'tv'
      ? (details.episode_run_time?.[0] ?? 45)
      : (details.runtime ?? 100);

    const providersByRegion: Show['providers'] = {};
    for (const r of REGIONS) {
      const names = providers.results?.[r]?.flatrate?.map(p => p.provider_name);
      const ids = mapProviders(names).filter(sid => {
        const s = streamers.find(x => x.id === sid);
        return s?.regions.includes(r);
      });
      if (ids.length > 0) providersByRegion[r] = ids;
    }
    if (!providersByRegion.ZA && !providersByRegion.US) throw new Error('no providers in any region');

    const allStreamerIds = [...new Set(Object.values(providersByRegion).flat())] as StreamerId[];
    const deepLinks = buildDeepLinks(streamers, allStreamerIds, title, tmdbId);

    return {
      id: `tmdb-${entry.tmdbType}-${tmdbId}`,
      tmdbId,
      tmdbType: entry.tmdbType,
      title,
      year,
      posterUrl: `https://image.tmdb.org/t/p/w500${posterPath}`,
      backdropUrl: `https://image.tmdb.org/t/p/w1280${backdropPath}`,
      genres,
      runtimeMinutes: Math.max(1, Math.min(600, runtime)),
      providers: providersByRegion,
      deepLinks,
    };
  } catch (e) {
    errors.push(`${entry.hint} [${entry.tmdbType}/${entry.tmdbId || '0'}]: ${(e as Error).message}`);
    return null;
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  const [seedsRaw, streamersRaw, schemaRaw] = await Promise.all([
    readFile(DATA('seed-shows.json'), 'utf8'),
    readFile(DATA('streamers.json'), 'utf8'),
    readFile(DATA('schema/catalogue.schema.json'), 'utf8'),
  ]);
  const seeds: SeedEntry[] = JSON.parse(seedsRaw);
  const streamers: Streamer[] = JSON.parse(streamersRaw);
  const schema = JSON.parse(schemaRaw);

  console.log(`Building catalogue: ${seeds.length} seed entries, concurrency ${CONCURRENCY}`);
  const results = await mapLimit(seeds, CONCURRENCY, e => buildShow(e, streamers));
  const catalogue = results.filter((s): s is Show => s !== null);

  const ajv = new (Ajv2020 as any)({ strict: true, allErrors: true });
  (addFormats as any)(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(catalogue);
  if (!ok) {
    console.error('SCHEMA FAIL:', JSON.stringify(validate.errors?.slice(0, 10), null, 2));
    process.exit(2);
  }

  await writeFile(DATA('catalogue.json'), JSON.stringify(catalogue, null, 0) + '\n');
  await writeFile(DATA('build-errors.log'), errors.join('\n') + '\n');

  const pretty = JSON.stringify(catalogue);
  console.log(`OK: ${catalogue.length}/${seeds.length} shows built, ${errors.length} dropped, size ${(pretty.length/1024).toFixed(1)} KB`);
}

main().catch(e => { console.error(e); process.exit(1); });
