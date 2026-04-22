import { applyMiddleware, jsonResponse, notAvailableResponse } from './_middleware';

export const config = {
  runtime: 'edge',
};

export default async function alHandler(request: Request): Promise<Response> {
  const middleware = await applyMiddleware(request, {
    requireDeviceId: true,
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

  return notAvailableResponse(request, middleware.headers);
}
