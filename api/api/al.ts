import alHandler from '../al';

export const config = {
  runtime: 'edge',
};

export default function handler(request: Request): Promise<Response> {
  return alHandler(request);
}
