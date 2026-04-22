import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import elevenlabsHandler from '../elevenlabs';

const VALID_DEVICE_ID = '550e8400-e29b-41d4-a716-446655440000';
const MARK_VOICE_ID = 'UgBBYS2sOqTuMpoF3BR0';

describe('POST /api/elevenlabs', () => {
  beforeEach(() => {
    process.env.ELEVENLABS_API_KEY = 'elevenlabs-test-key';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ELEVENLABS_API_KEY;
  });

  it('returns audio/mpeg for a valid request', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3, 4]), {
        status: 200,
        headers: {
          'content-type': 'audio/mpeg',
        },
      }),
    );

    const response = await elevenlabsHandler(
      new Request('https://mychannel-api.vercel.app/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': VALID_DEVICE_ID,
        },
        body: JSON.stringify({
          text: 'Hello world',
          voiceId: MARK_VOICE_ID,
          modelId: 'eleven_flash_v2_5',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('audio/mpeg');
    expect(fetch).toHaveBeenCalledWith(
      `https://api.elevenlabs.io/v1/text-to-speech/${MARK_VOICE_ID}`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          accept: 'audio/mpeg',
          'content-type': 'application/json',
          'xi-api-key': 'elevenlabs-test-key',
        }),
      }),
    );
    await expect(response.arrayBuffer()).resolves.toEqual(new Uint8Array([1, 2, 3, 4]).buffer);
  });

  it('rejects a missing device id', async () => {
    const response = await elevenlabsHandler(
      new Request('https://mychannel-api.vercel.app/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Hello world',
          voiceId: MARK_VOICE_ID,
          modelId: 'eleven_flash_v2_5',
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Missing or invalid X-Device-Id header',
    });
  });

  it('rejects voices outside the whitelist', async () => {
    const response = await elevenlabsHandler(
      new Request('https://mychannel-api.vercel.app/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': VALID_DEVICE_ID,
        },
        body: JSON.stringify({
          text: 'Hello world',
          voiceId: 'not-whitelisted',
          modelId: 'eleven_flash_v2_5',
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid request body',
    });
  });

  it('rejects unsupported models', async () => {
    const response = await elevenlabsHandler(
      new Request('https://mychannel-api.vercel.app/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': VALID_DEVICE_ID,
        },
        body: JSON.stringify({
          text: 'Hello world',
          voiceId: MARK_VOICE_ID,
          modelId: 'eleven_turbo_v2',
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid request body',
    });
  });

  it('rejects text longer than 500 characters', async () => {
    const response = await elevenlabsHandler(
      new Request('https://mychannel-api.vercel.app/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': VALID_DEVICE_ID,
        },
        body: JSON.stringify({
          text: 'a'.repeat(501),
          voiceId: MARK_VOICE_ID,
          modelId: 'eleven_flash_v2_5',
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid request body',
    });
  });
});
