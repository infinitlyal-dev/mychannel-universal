import { z } from 'zod';

import type { ElevenLabsTtsRequest } from './shared-types';
import { applyMiddleware, jsonResponse } from './_middleware';

export const config = {
  runtime: 'edge',
};

const requestSchema = z.object({
  text: z.string().max(500),
  voiceId: z.enum(['UgBBYS2sOqTuMpoF3BR0', '21m00Tcm4TlvDq8ikWAM']),
  modelId: z.literal('eleven_flash_v2_5'),
});

export default async function elevenlabsHandler(request: Request): Promise<Response> {
  const middleware = await applyMiddleware(request, {
    requireDeviceId: true,
    rateLimit: {
      key: 'elevenlabs',
      limit: 10,
      windowMs: 60 * 60 * 1000,
    },
  });

  if (middleware.response) {
    return middleware.response;
  }

  if (request.method !== 'POST') {
    return jsonResponse(
      { error: 'Method not allowed' },
      {
        request,
        headers: middleware.headers,
        status: 405,
      },
    );
  }

  let parsedBody: z.infer<typeof requestSchema>;

  try {
    const body = (await request.json()) as ElevenLabsTtsRequest;
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return jsonResponse(
        { error: 'Invalid request body' },
        {
          request,
          headers: middleware.headers,
          status: 400,
        },
      );
    }

    parsedBody = result.data;
  } catch {
    return jsonResponse(
      { error: 'Invalid request body' },
      {
        request,
        headers: middleware.headers,
        status: 400,
      },
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();

  if (!apiKey) {
    return jsonResponse(
      { error: 'ELEVENLABS_API_KEY is not configured' },
      {
        request,
        headers: middleware.headers,
        status: 500,
      },
    );
  }

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${parsedBody.voiceId}`,
      {
        method: 'POST',
        headers: {
          accept: 'audio/mpeg',
          'content-type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: parsedBody.text,
          model_id: parsedBody.modelId,
        }),
      },
    );
  } catch {
    return jsonResponse(
      { error: 'ElevenLabs request failed' },
      {
        request,
        headers: middleware.headers,
        status: 502,
      },
    );
  }

  if (!upstreamResponse.ok) {
    return jsonResponse(
      { error: `ElevenLabs request failed with status ${upstreamResponse.status}` },
      {
        request,
        headers: middleware.headers,
        status: upstreamResponse.status,
      },
    );
  }

  const audioBuffer = await upstreamResponse.arrayBuffer();
  const headers = new Headers(middleware.headers);
  headers.set('content-type', 'audio/mpeg');

  return new Response(audioBuffer, {
    status: 200,
    headers,
  });
}
