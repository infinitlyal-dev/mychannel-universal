// Canonical shared types for MyChannel Universal v1.
// Extracted verbatim from /shared/INTERFACES.md Section 2.
// Authoritative: when INTERFACES contradicts a workstream's local type, INTERFACES wins.

// ─── CATALOGUE TYPES ───

export type Region = 'ZA' | 'US';

export type StreamerId =
  | 'netflix' | 'disney' | 'prime' | 'max' | 'appletv'
  | 'hulu' | 'paramount' | 'showmax' | 'youtube';

export interface Streamer {
  id: StreamerId;
  name: string;              // "Netflix"
  logo: string;              // Path relative to /assets/streamers/
  regions: Region[];         // Where this streamer operates
  deepLinkSchemes: {
    android: string;         // "nflx://"
    ios: string;             // "nflx://"
    web: string;             // "https://www.netflix.com/title/"
  };
}

export interface Show {
  id: string;                // "tmdb-tv-1396" — stable, used as key
  tmdbId: number;
  tmdbType: 'tv' | 'movie';
  title: string;
  year: number;
  posterUrl: string;         // TMDB CDN, absolute
  backdropUrl: string;
  genres: GenreId[];
  runtimeMinutes: number;    // Average episode, or movie length
  providers: {               // Which streamers, per region
    [R in Region]?: StreamerId[];
  };
  deepLinks: {               // Pre-built deep links per streamer
    [S in StreamerId]?: {
      android?: string;
      ios?: string;
      web?: string;
    };
  };
}

export type GenreId =
  | 'drama' | 'comedy' | 'crime' | 'scifi' | 'fantasy'
  | 'thriller' | 'action' | 'romance' | 'documentary'
  | 'animation' | 'horror' | 'reality';

// ─── USER STATE TYPES (stored on device) ───

export interface UserState {
  version: 1;                // Schema version — bump on breaking change
  onboarded: boolean;
  region: Region;
  subscription: {
    tier: 'free' | 'paid';
    expiresAt?: string;      // ISO date, paid only
  };
  streamers: StreamerId[];   // Which streamers user has
  shows: string[];           // Show IDs user picked (NOT full Show objects)
  schedule: ScheduleEntry[];
  lastOpenedAt: string;      // ISO date
}

export interface ScheduleEntry {
  showId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;   // 0=Sunday
  startTime: string;         // "HH:mm" 24h local
  endTime: string;           // Computed, for UI convenience
  enabled: boolean;          // User can toggle slots on/off
}

// ─── BACKEND RESPONSE TYPES ───

export interface TmdbProvidersResponse {
  success: boolean;
  region: Region;
  providers: StreamerId[];   // Filtered to our known set
  error?: string;
}

export interface ElevenLabsTtsRequest {
  text: string;              // Max 500 chars
  voiceId: string;           // Whitelisted on server
  modelId: 'eleven_flash_v2_5';
}
