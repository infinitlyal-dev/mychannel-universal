// TMDB Watch Providers wrapper.
// Wraps /3/movie/{id}/watch/providers and /3/tv/{id}/watch/providers.
// Powered by JustWatch under TMDB's partnership — attribution required
// when displaying results. See:
//   https://developer.themoviedb.org/reference/movie-watch-providers
//   https://developer.themoviedb.org/reference/tv-series-watch-providers
//
// API key must come from process.env.TMDB_API_KEY (inlined at esbuild
// time via --define). NEVER hardcode. NEVER commit.
//
// Returns normalized shape independent of TMDB quirks:
//   { streamers: [{ id, name, logoUrl }], tmdbWatchLink: string|null }
//
// "No providers in this country" returns { streamers: [], tmdbWatchLink: null }
// instead of throwing — downstream code decides how to degrade.

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

const cache = new Map();

function cacheKey(type, id, country) {
  return `${type}:${id}:${country.toUpperCase()}`;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  cache.set(key, { timestamp: Date.now(), value });
}

function resolveApiKey(explicitKey) {
  if (explicitKey) return explicitKey;
  const envKey = (typeof process !== 'undefined' && process.env)
    ? process.env.TMDB_API_KEY
    : null;
  if (!envKey) throw new Error('TMDB_API_KEY is required (set env var or pass opts.apiKey)');
  return envKey;
}

function normalizeCountryData(countryData) {
  if (!countryData) return { streamers: [], tmdbWatchLink: null };
  const streamers = [];
  const seen = new Set();
  // Prefer flatrate (subscription) > rent > buy. First occurrence wins.
  for (const bucket of ['flatrate', 'rent', 'buy']) {
    const list = countryData[bucket];
    if (!Array.isArray(list)) continue;
    for (const p of list) {
      if (seen.has(p.provider_id)) continue;
      seen.add(p.provider_id);
      streamers.push({
        id: p.provider_id,
        name: p.provider_name,
        logoUrl: p.logo_path ? `${TMDB_IMAGE_BASE}${p.logo_path}` : null,
      });
    }
  }
  return { streamers, tmdbWatchLink: countryData.link || null };
}

export async function getWatchProviders(type, id, country, opts = {}) {
  if (type !== 'movie' && type !== 'tv') {
    throw new Error(`type must be 'movie' or 'tv', got: ${type}`);
  }
  if (id === undefined || id === null || id === '') {
    throw new Error('id is required');
  }
  if (typeof country !== 'string' || country.length !== 2) {
    throw new Error('country must be ISO 3166-1 alpha-2 (2 letters)');
  }

  const key = cacheKey(type, id, country);
  const cached = getCached(key);
  if (cached) return cached;

  const apiKey = resolveApiKey(opts.apiKey);
  const fetchFn = opts.fetch || globalThis.fetch;
  if (!fetchFn) throw new Error('fetch is not available — pass opts.fetch in Node environments without global fetch');

  const url = `https://api.themoviedb.org/3/${type}/${encodeURIComponent(id)}/watch/providers?api_key=${encodeURIComponent(apiKey)}`;
  const response = await fetchFn(url);
  if (!response.ok) throw new Error(`TMDB returned ${response.status}`);

  const data = await response.json();
  const countryData = data && data.results && data.results[country.toUpperCase()];
  const result = normalizeCountryData(countryData);

  setCached(key, result);
  return result;
}

export function _clearCache() {
  cache.clear();
}

export function _cacheSize() {
  return cache.size;
}
