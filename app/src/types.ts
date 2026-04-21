// Mirrors shared/types.ts — contract from INTERFACES.md §2.

export type Region = 'ZA' | 'US';

export type StreamerId =
  | 'netflix' | 'disney' | 'prime' | 'max' | 'appletv'
  | 'hulu' | 'paramount' | 'showmax' | 'youtube';

export interface Streamer {
  id: StreamerId;
  name: string;
  logo: string;
  regions: Region[];
  deepLinkSchemes: {
    android: string;
    ios: string;
    web: string;
  };
}

export interface Show {
  id: string;
  tmdbId: number;
  tmdbType: 'tv' | 'movie';
  title: string;
  year: number;
  posterUrl: string;
  backdropUrl: string;
  genres: GenreId[];
  runtimeMinutes: number;
  providers: Partial<Record<Region, StreamerId[]>>;
  deepLinks: Partial<Record<StreamerId, Partial<Record<'android' | 'ios' | 'web', string>>>>;
}

export type GenreId =
  | 'drama' | 'comedy' | 'crime' | 'scifi' | 'fantasy'
  | 'thriller' | 'action' | 'romance' | 'documentary'
  | 'animation' | 'horror' | 'reality';

export interface UserState {
  version: 1;
  onboarded: boolean;
  region: Region;
  subscription: {
    tier: 'free' | 'paid';
    expiresAt?: string;
  };
  streamers: StreamerId[];
  shows: string[];
  schedule: ScheduleEntry[];
  lastOpenedAt: string;
  notificationsEnabled?: boolean;
}

export interface ScheduleEntry {
  showId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export interface TmdbProvidersResponse {
  success: boolean;
  region: Region;
  providers: StreamerId[];
  error?: string;
}
