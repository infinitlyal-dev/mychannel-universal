// Smoke test: al.js and rachel.js import cleanly as ES modules and expose
// the documented exports. These modules drive browser audio and a live
// proxy — full integration is a browser task, not a vitest task.

import { describe, it, expect } from 'vitest';

describe('al + rachel module imports', () => {
  it('al.js imports with expected exports', async () => {
    const al = await import('../www/lib/al.js');
    expect(typeof al.init).toBe('function');
    expect(typeof al.speak).toBe('function');
    expect(typeof al.speakStep).toBe('function');
    expect(typeof al.processCommand).toBe('function');
    expect(Array.isArray(al.VOICE_LINES)).toBe(true);
    expect(al.VOICE_LINES.length).toBeGreaterThan(0);
  });

  it('al.init validates config.proxyBase + config.voiceId', async () => {
    const al = await import('../www/lib/al.js');
    expect(() => al.init()).toThrow(/proxyBase/);
    expect(() => al.init({ proxyBase: 'https://x' })).toThrow(/voiceId/);
    expect(() => al.init({ proxyBase: 'https://x', voiceId: 'v' })).not.toThrow();
  });

  it('rachel.js imports with expected exports', async () => {
    const rachel = await import('../www/lib/rachel.js');
    expect(typeof rachel.init).toBe('function');
    expect(typeof rachel.preload).toBe('function');
    expect(typeof rachel.playClip).toBe('function');
    expect(typeof rachel.narrateScene).toBe('function');
    expect(typeof rachel.RACHEL_SCRIPT).toBe('string');
    expect(rachel.RACHEL_SCRIPT.length).toBeGreaterThan(50);
    expect(typeof rachel.SCRIPTS).toBe('object');
    expect(rachel.SCRIPTS.intro).toBe(rachel.RACHEL_SCRIPT);
    expect(typeof rachel.CUE_POINTS).toBe('object');
    expect(rachel.CUE_POINTS.S2).toBe(0.29);
    expect(rachel.CUE_POINTS.S3).toBe(0.52);
    expect(rachel.CUE_POINTS.S4).toBe(0.82);
  });

  it('rachel.init validates config', async () => {
    const rachel = await import('../www/lib/rachel.js');
    expect(() => rachel.init()).toThrow(/proxyBase/);
    expect(() => rachel.init({ proxyBase: 'https://x' })).toThrow(/voiceId/);
  });
});
