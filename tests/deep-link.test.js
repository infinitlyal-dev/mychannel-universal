import { describe, it, expect } from 'vitest';
import { buildDeepLink, SUPPORTED_STREAMERS } from '../www/lib/deep-link.js';

describe('deep link builder', () => {
  it('builds netflix URL', () => {
    expect(buildDeepLink('netflix', '80192098'))
      .toBe('https://www.netflix.com/title/80192098');
  });

  it('builds apple_tv_plus URL', () => {
    expect(buildDeepLink('apple_tv_plus', 'umc.cmc.abc'))
      .toBe('https://tv.apple.com/show/umc.cmc.abc');
  });

  it('builds max URL', () => {
    expect(buildDeepLink('max', 'abc123'))
      .toBe('https://play.max.com/show/abc123');
  });

  it('builds disney_plus URL', () => {
    expect(buildDeepLink('disney_plus', 'xyz'))
      .toBe('https://www.disneyplus.com/series/xyz');
  });

  it('builds prime_video URL', () => {
    expect(buildDeepLink('prime_video', 'B01'))
      .toBe('https://www.amazon.com/gp/video/detail/B01');
  });

  it('builds hulu URL', () => {
    expect(buildDeepLink('hulu', 'foo'))
      .toBe('https://www.hulu.com/series/foo');
  });

  it('builds paramount_plus URL', () => {
    expect(buildDeepLink('paramount_plus', 'bar'))
      .toBe('https://www.paramountplus.com/shows/bar');
  });

  it('builds youtube URL', () => {
    expect(buildDeepLink('youtube', 'dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('builds spotify URL', () => {
    expect(buildDeepLink('spotify', 'abc123'))
      .toBe('https://open.spotify.com/show/abc123');
  });

  it('throws on unknown streamer', () => {
    expect(() => buildDeepLink('mxplayer', 'id')).toThrow(/unsupported streamer/i);
  });

  it('throws on empty string id', () => {
    expect(() => buildDeepLink('netflix', '')).toThrow(/id required/i);
  });

  it('throws on null id', () => {
    expect(() => buildDeepLink('netflix', null)).toThrow(/id required/i);
  });

  it('throws on non-string id', () => {
    expect(() => buildDeepLink('netflix', 12345)).toThrow(/id required/i);
  });

  it('url-encodes ids to prevent injection', () => {
    expect(buildDeepLink('youtube', 'a b&c=1'))
      .toBe('https://www.youtube.com/watch?v=a%20b%26c%3D1');
  });

  it('SUPPORTED_STREAMERS list has all 9 spec entries', () => {
    expect(SUPPORTED_STREAMERS).toHaveLength(9);
    expect([...SUPPORTED_STREAMERS].sort()).toEqual([
      'apple_tv_plus', 'disney_plus', 'hulu', 'max', 'netflix',
      'paramount_plus', 'prime_video', 'spotify', 'youtube',
    ]);
  });

  it('SUPPORTED_STREAMERS is frozen', () => {
    expect(Object.isFrozen(SUPPORTED_STREAMERS)).toBe(true);
  });
});
