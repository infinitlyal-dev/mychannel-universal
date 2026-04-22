import tmdbProvidersHandler from '../../../../tmdb/providers/[tmdbType]/[tmdbId]';

export const config = {
  runtime: 'edge',
};

export default function handler(request: Request): Promise<Response> {
  return tmdbProvidersHandler(request);
}
