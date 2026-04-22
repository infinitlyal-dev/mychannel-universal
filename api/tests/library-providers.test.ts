import { describe, expect, it } from 'vitest';

import libraryProvidersHandler from '../library/providers';

describe('GET /api/library/providers', () => {
  it('returns the provider registry for one region', async () => {
    const response = await libraryProvidersHandler(
      new Request('https://example.com/api/library/providers?region=ZA'),
    );
    const body = (await response.json()) as {
      success: boolean;
      region?: string;
      providers: Array<{ id: string; regions: string[] }>;
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.region).toBe('ZA');
    expect(body.providers.some((provider) => provider.id === 'netflix')).toBe(true);
    expect(body.providers.some((provider) => provider.id === 'hulu')).toBe(false);
    expect(body.providers.every((provider) => provider.regions.includes('ZA'))).toBe(true);
  });
});
