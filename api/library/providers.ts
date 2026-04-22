import { applyMiddleware, jsonResponse } from '../_middleware';
import type { LibraryProvidersResponse, Region } from '../../shared/types';
import { listProviders } from '../_lib/providers';

export const config = {
  runtime: 'edge',
};

function parseRegion(value: string | null): Region | undefined {
  if (!value) {
    return undefined;
  }
  if (value === 'US' || value === 'ZA') {
    return value;
  }
  return undefined;
}

export default async function libraryProvidersHandler(request: Request): Promise<Response> {
  const middleware = await applyMiddleware(request, { requireDeviceId: false });
  if (middleware.response) {
    return middleware.response;
  }

  const url = new URL(request.url);
  const region = parseRegion(url.searchParams.get('region'));
  const body: LibraryProvidersResponse = {
    success: true,
    region,
    providers: listProviders(region),
  };

  return jsonResponse(body, { request, headers: middleware.headers, status: 200 });
}
