import type { StreamerId } from './types';

export const API_BASE = '/api';
export const APP_STATE_VERSION = 2;
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const TMDB_POSTER_SIZE = 'w500';
export const TMDB_BACKDROP_SIZE = 'w1280';
export const SUPPORTED_REGIONS = ['US', 'ZA'] as const;
export const DEFAULT_REGION = 'US' as const;
export const DEFAULT_LIBRARY_PAGE_SIZE = 40;
export const DEFAULT_LIBRARY_TYPE = 'all' as const;
export const SUPPORTED_STREAMERS: StreamerId[] = [
  'netflix',
  'prime',
  'disney',
  'appletv',
  'max',
  'hulu',
  'peacock',
  'paramount',
  'showtime',
  'starz',
  'youtube',
];
