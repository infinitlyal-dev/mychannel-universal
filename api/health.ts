import { applyMiddleware, jsonResponse } from './_middleware';

export const config = {
  runtime: 'edge',
};

export default async function healthHandler(request: Request): Promise<Response> {
  const middleware = await applyMiddleware(request, {
    requireDeviceId: false,
  });

  if (middleware.response) {
    return middleware.response;
  }

  if (request.method !== 'GET') {
    return jsonResponse(
      {
        error: 'Method not allowed',
      },
      {
        request,
        headers: middleware.headers,
        status: 405,
      },
    );
  }

  return jsonResponse(
    {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    {
      request,
      headers: middleware.headers,
      status: 200,
    },
  );
}
