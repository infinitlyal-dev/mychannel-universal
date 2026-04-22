import { describe, expect, it } from 'vitest';

import { buildSearchQuery, buildStreamerSearchUrls } from '../src/lib/deep-link';
import { hydrateChannel, scheduleStats } from '../src/lib/scheduler';
import { defaultState, migrateState } from '../src/state/store';

describe('app foundation modules', () => {
  it('migrates a legacy state into the live-library shape', () => {
    const migrated = migrateState({
      version: 1,
      onboarded: true,
      region: 'US',
      subscription: { tier: 'free' },
      streamers: ['netflix', 'prime'],
      shows: ['tmdb-tv-1396'],
      schedule: [
        {
          showId: 'tmdb-tv-1396',
          dayOfWeek: 1,
          startTime: '20:00',
          endTime: '21:00',
          enabled: true,
        },
      ],
      lastOpenedAt: '2026-04-22T00:00:00.000Z',
    });

    expect(migrated.version).toBe(2);
    expect(migrated.streamers).toEqual(['netflix', 'prime']);
    expect(migrated.shows).toEqual(['tmdb-tv-1396']);
    expect(migrated.schedule[0]?.id).toBe('slot-1-20:00');
    expect(migrated.channel).toEqual([]);
  });

  it('builds pure search URLs from title and year', () => {
    expect(buildSearchQuery({ title: 'Severance', year: 2022 })).toBe('Severance 2022');
    expect(buildStreamerSearchUrls({ title: 'Severance', year: 2022 }, 'appletv')).toEqual({
      web: 'https://tv.apple.com/search?term=Severance%202022',
      ios: 'https://tv.apple.com/search?term=Severance%202022',
      android: 'https://tv.apple.com/search?term=Severance%202022',
    });
  });

  it('hydrates channel rows with generated search URLs and provider picks', () => {
    const channel = hydrateChannel(
      [
        {
          id: 'slot-1-20:00',
          dayOfWeek: 1,
          startTime: '20:00',
          endTime: '21:00',
          enabled: true,
        },
      ],
      [
        {
          id: 'tmdb-tv-95396',
          tmdbId: 95396,
          tmdbType: 'tv',
          title: 'Severance',
          year: 2022,
          providerIds: ['appletv'],
          posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        },
      ],
      ['appletv'],
    );

    expect(channel).toHaveLength(1);
    expect(channel[0]).toMatchObject({
      titleId: 'tmdb-tv-95396',
      providerId: 'appletv',
      title: 'Severance',
      year: 2022,
    });
    expect(channel[0]?.searchUrls.web).toBe('https://tv.apple.com/search?term=Severance%202022');
    expect(scheduleStats(channel)).toMatchObject({
      slots: 1,
      enabledSlots: 1,
      titlesScheduled: 1,
    });
  });

  it('creates the v2 default state', () => {
    const state = defaultState();

    expect(state.version).toBe(2);
    expect(state.selectedTitles).toEqual([]);
    expect(state.channel).toEqual([]);
    expect(state.schedule).toEqual([]);
  });
});
