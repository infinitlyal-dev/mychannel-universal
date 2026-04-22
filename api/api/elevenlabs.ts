import elevenlabsHandler from '../elevenlabs';

export const config = {
  runtime: 'edge',
};

export default function handler(request: Request): Promise<Response> {
  return elevenlabsHandler(request);
}
