// Canonical shared types copied from ../shared/types.ts for standalone Vercel deployment.
// Keep this file in sync with the shared contract when backend-facing types change.

export type Region = 'ZA' | 'US';

export type StreamerId =
  | 'netflix' | 'disney' | 'prime' | 'max' | 'appletv'
  | 'hulu' | 'paramount' | 'peacock' | 'youtube';

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
