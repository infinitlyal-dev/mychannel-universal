import { describe, expect, it } from 'vitest';

import healthHandler from '../health';

describe('GET /api/health', () => {
  it('returns health metadata without requiring a device id', async () => {
    const response = await healthHandler(
      new Request('https://mychannel-api.vercel.app/api/health'),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      version: '1.0.0',
    });
  });

  it('returns an ISO timestamp in the response body', async () => {
    const response = await healthHandler(
      new Request('https://mychannel-api.vercel.app/api/health'),
    );

    const body = await response.json();

    expect(typeof body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('rejects non-GET methods', async () => {
    const response = await healthHandler(
      new Request('https://mychannel-api.vercel.app/api/health', {
        method: 'POST',
      }),
    );

    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toEqual({
      error: 'Method not allowed',
    });
  });
});
