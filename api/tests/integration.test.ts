import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

const BASE_URL = process.env.INTEGRATION_BASE_URL ?? 'https://mychannel-api.vercel.app';
const DEVICE_ID = process.env.INTEGRATION_DEVICE_ID ?? randomUUID();
const MARK_VOICE_ID = 'UgBBYS2sOqTuMpoF3BR0';
const itIfLiveElevenLabs = process.env.RUN_LIVE_ELEVENLABS === '1' ? it : it.skip;

function urlFor(pathname: string): string {
  return new URL(pathname, BASE_URL).toString();
}

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

describe('deployed integration', () => {
  it('serves GET /api/health', async () => {
    const response = await fetch(urlFor('/api/health'));
    const body = (await readJson(response)) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.version).toBe('1.0.0');
    expect(typeof body.timestamp).toBe('string');
  });

  it('serves GET /api/tmdb/providers/tv/1396?region=US', async () => {
    const response = await fetch(urlFor('/api/tmdb/providers/tv/1396?region=US'), {
      headers: {
        'X-Device-Id': DEVICE_ID,
      },
    });
    const body = (await readJson(response)) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.region).toBe('US');
    expect(Array.isArray(body.providers)).toBe(true);
  });

  itIfLiveElevenLabs('serves POST /api/elevenlabs with audio/mpeg output', async () => {
    const response = await fetch(urlFor('/api/elevenlabs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': DEVICE_ID,
      },
      body: JSON.stringify({
        text: 'MyChannel integration check.',
        voiceId: MARK_VOICE_ID,
        modelId: 'eleven_flash_v2_5',
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('audio/mpeg');
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it('serves POST /api/al as a 501 stub', async () => {
    const response = await fetch(urlFor('/api/al'), {
      method: 'POST',
      headers: {
        'X-Device-Id': DEVICE_ID,
      },
    });
    const body = (await readJson(response)) as Record<string, unknown>;

    expect(response.status).toBe(501);
    expect(body).toEqual({
      error: 'Not available in v1',
      version: '1.0.0',
    });
  });

  it('serves POST /api/transcribe as a 501 stub', async () => {
    const response = await fetch(urlFor('/api/transcribe'), {
      method: 'POST',
      headers: {
        'X-Device-Id': DEVICE_ID,
      },
    });
    const body = (await readJson(response)) as Record<string, unknown>;

    expect(response.status).toBe(501);
    expect(body).toEqual({
      error: 'Not available in v1',
      version: '1.0.0',
    });
  });
});
