import healthHandler from '../health';

export const config = {
  runtime: 'edge',
};

export default function handler(request: Request): Promise<Response> {
  return healthHandler(request);
}
