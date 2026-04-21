const LIVE = 'https://mychannel-api.vercel.app';

export function getApiBase(): string {
  try {
    const w = window as unknown as { __MYCHANNEL_API_BASE__?: string };
    if (w.__MYCHANNEL_API_BASE__) return w.__MYCHANNEL_API_BASE__;
  } catch {
    /* non-browser */
  }
  return LIVE;
}

export function useBackendMock(): boolean {
  try {
    const w = window as unknown as { __MYCHANNEL_USE_BACKEND_MOCK__?: boolean };
    return Boolean(w.__MYCHANNEL_USE_BACKEND_MOCK__);
  } catch {
    return false;
  }
}
