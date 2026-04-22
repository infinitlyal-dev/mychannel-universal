import { describe, expect, it } from 'vitest';

import alHandler from '../al';
import transcribeHandler from '../transcribe';

const VALID_DEVICE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('v2 stubs', () => {
  it('returns 501 for POST /api/al', async () => {
    const response = await alHandler(
      new Request('https://mychannel-api.vercel.app/api/al', {
        method: 'POST',
        headers: {
          'X-Device-Id': VALID_DEVICE_ID,
        },
      }),
    );

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      error: 'Not available in v1',
      version: '1.0.0',
    });
  });

  it('returns 501 for POST /api/transcribe', async () => {
    const response = await transcribeHandler(
      new Request('https://mychannel-api.vercel.app/api/transcribe', {
        method: 'POST',
        headers: {
          'X-Device-Id': VALID_DEVICE_ID,
        },
      }),
    );

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      error: 'Not available in v1',
      version: '1.0.0',
    });
  });

  it('rejects missing device ids for /api/al', async () => {
    const response = await alHandler(
      new Request('https://mychannel-api.vercel.app/api/al', {
        method: 'POST',
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Missing or invalid X-Device-Id header',
    });
  });

  it('rejects missing device ids for /api/transcribe', async () => {
    const response = await transcribeHandler(
      new Request('https://mychannel-api.vercel.app/api/transcribe', {
        method: 'POST',
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Missing or invalid X-Device-Id header',
    });
  });
});
