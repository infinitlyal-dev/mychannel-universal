export const SUPPORTED_REGIONS = ['US', 'ZA'] as const;
export type Region = (typeof SUPPORTED_REGIONS)[number];

export const TMDB_TITLE_TYPES = ['movie', 'tv'] as const;
export type TmdbTitleType = (typeof TMDB_TITLE_TYPES)[number];

export const SUPPORTED_PLATFORMS = ['web', 'ios', 'android'] as const;
export type Platform = (typeof SUPPORTED_PLATFORMS)[number];

export type StreamerId =
  | 'netflix'
  | 'prime'
  | 'disney'
  | 'appletv'
  | 'max'
  | 'hulu'
  | 'peacock'
  | 'paramount'
  | 'showtime'
  | 'starz'
  | 'youtube';

export type GenreId =
  | 'drama'
  | 'comedy'
  | 'crime'
  | 'scifi'
  | 'fantasy'
  | 'thriller'
  | 'action'
  | 'romance'
  | 'documentary'
  | 'animation'
  | 'horror'
  | 'reality';

export interface StreamerManifest {
  id: StreamerId;
  name: string;
  shortName: string;
  logo: string;
  regions: Region[];
  tmdbProviderIds: Partial<Record<Region, number[]>>;
  tmdbProviderNames?: Partial<Record<Region, string[]>>;
  searchUrlTemplates: Partial<Record<Platform, string>>;
  notes?: string;
}

export interface ProviderBadge {
  id: StreamerId;
  name: string;
  logo: string;
}

export interface TitleRef {
  id: string;
  tmdbId: number;
  tmdbType: TmdbTitleType;
  title: string;
  year: number | null;
}

export interface LibraryTitle extends TitleRef {
  originalTitle: string;
  originalLanguage: string;
  overview: string;
  posterPath: string | null;
  posterUrl: string | null;
  backdropPath: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  genreIds: number[];
  genres: GenreId[];
  popularity: number;
  voteAverage: number;
  voteCount: number;
  providerBadges: ProviderBadge[];
}

export interface TitleDetail extends LibraryTitle {
  runtimeMinutes: number | null;
  status: string | null;
  tagline: string | null;
  homepage: string | null;
  numberOfSeasons?: number | null;
  numberOfEpisodes?: number | null;
}

export interface WatchProviderOffer {
  providerId: number;
  providerName: string;
  displayPriority: number;
  logoPath: string | null;
  streamerId?: StreamerId;
}

export interface TitleProviders {
  link: string | null;
  flatrate: WatchProviderOffer[];
  free: WatchProviderOffer[];
  ads: WatchProviderOffer[];
  buy: WatchProviderOffer[];
  rent: WatchProviderOffer[];
}

export interface LibraryFilters {
  region: Region;
  providers: StreamerId[];
  genre?: GenreId;
  query?: string;
  type?: TmdbTitleType | 'all';
}

export interface ApiErrorShape {
  code: string;
  message: string;
}

export interface LibraryResponse {
  success: boolean;
  region: Region;
  page: number;
  totalPages: number;
  totalResults: number;
  filters: LibraryFilters;
  items: LibraryTitle[];
  error?: ApiErrorShape;
}

export interface LibraryProvidersResponse {
  success: boolean;
  region?: Region;
  providers: StreamerManifest[];
  error?: ApiErrorShape;
}

export interface TitleResponse {
  success: boolean;
  item?: TitleDetail;
  error?: ApiErrorShape;
}

export interface TitleProvidersResponse {
  success: boolean;
  region: Region;
  tmdbType: TmdbTitleType;
  tmdbId: number;
  title?: TitleRef;
  providers?: TitleProviders;
  error?: ApiErrorShape;
}

export interface PersistedTitle extends TitleRef {
  posterUrl?: string | null;
  backdropUrl?: string | null;
  providerIds?: StreamerId[];
}

export interface ScheduleSlot {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export interface ScheduledProgram extends ScheduleSlot {
  showId?: string;
  titleId: string;
  providerId: StreamerId | null;
  searchUrls: Partial<Record<Platform, string>>;
  title: string;
  year: number | null;
  tmdbId: number;
  tmdbType: TmdbTitleType;
  posterUrl?: string | null;
  backdropUrl?: string | null;
}

export interface UserState {
  version: 2;
  onboarded: boolean;
  region: Region;
  subscription?: {
    tier: 'free' | 'paid';
    expiresAt?: string;
  };
  streamers: StreamerId[];
  shows: string[];
  selectedTitles: PersistedTitle[];
  schedule: ScheduleEntry[];
  channel: ScheduledProgram[];
  lastOpenedAt: string;
  notificationsEnabled?: boolean;
}

export interface LegacyScheduleEntry {
  showId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export type ScheduleEntry = ScheduleSlot & {
  showId?: string;
  titleId?: string;
  providerId?: StreamerId | null;
  searchUrls?: Partial<Record<Platform, string>>;
};

export interface Streamer extends StreamerManifest {}

export interface Show extends LibraryTitle {
  runtimeMinutes: number | null;
  providers: Partial<Record<Region, StreamerId[]>>;
  deepLinks: Partial<Record<StreamerId, Partial<Record<Platform, string>>>>;
}

export interface TmdbProvidersResponse {
  success: boolean;
  region: Region;
  providers: StreamerId[];
  error?: string;
}

export interface ElevenLabsTtsRequest {
  text: string;
  voiceId: string;
  modelId: 'eleven_flash_v2_5';
}
