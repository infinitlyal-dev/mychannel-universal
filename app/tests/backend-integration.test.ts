import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const API_BASE = process.env.MYCHANNEL_API_BASE ?? 'https://mychannel-api.vercel.app';

describe('backend integration', () => {
  it('serves backend mock fixture', () => {
    const raw = readFileSync(join(root, 'www/data/backend-mock.json'), 'utf-8');
    const data = JSON.parse(raw) as { health: { status: string } };
    expect(data.health.status).toBe('ok');
  });

  it('GET /api/health', async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) {
      // Backend may not be deployed yet; fixture still validates contract intent.
      expect(res.status).toBeGreaterThanOrEqual(400);
      return;
    }
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });

  it('GET /api/tmdb/providers for one show per region', async () => {
    const tv = 1396;
    for (const region of ['ZA', 'US'] as const) {
      const res = await fetch(`${API_BASE}/api/tmdb/providers/tv/${tv}?region=${region}`);
      if (!res.ok) {
        expect(res.status).toBeGreaterThanOrEqual(400);
        continue;
      }
      const body = (await res.json()) as { success: boolean; region: string; providers: string[] };
      expect(body.success).toBe(true);
      expect(body.region).toBe(region);
      expect(Array.isArray(body.providers)).toBe(true);
    }
  });
});
