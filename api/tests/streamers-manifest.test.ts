import { describe, expect, it } from 'vitest';

import streamers from '../../data/streamers.json';
import type { Region } from '../../shared/types';

describe('data/streamers.json provider matching contract', () => {
  it('declares provider IDs and fallback provider names for every supported region', () => {
    expect(streamers).toHaveLength(11);

    for (const streamer of streamers) {
      for (const region of streamer.regions as Region[]) {
        expect(streamer.tmdbProviderIds[region]?.length, `${streamer.id} ${region} ids`).toBeGreaterThan(0);
        expect(streamer.tmdbProviderNames[region]?.length, `${streamer.id} ${region} names`).toBeGreaterThan(0);
      }
    }
  });
});
