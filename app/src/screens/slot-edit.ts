import { html, type TemplateResult } from 'lit-html';
import type { RouteContext } from '../router';
import { rebuildChannel } from '../lib/channel-adapter';
import { setReturnIntent } from '../lib/picker-return';
import type {
  LibraryTitle,
  PersistedTitle,
  ScheduleEntry,
  StreamerManifest,
} from '../types';

type SlotEditTab = 'swap' | 'off' | 'remove' | 'pick';
type FocusRegion = 'tabs' | 'content';
type PersistedTitleClient = PersistedTitle & { runtimeMinutes?: number | null };

const TABS: Array<{ id: SlotEditTab; label: string }> = [
  { id: 'swap', label: 'Swap' },
  { id: 'off', label: 'Off' },
  { id: 'remove', label: 'Remove' },
  { id: 'pick', label: 'Pick new title' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let activeTab: SlotEditTab = 'swap';
let focusRegion: FocusRegion = 'tabs';
let activeSlotId: string | null = null;

function clampEndToWindow(start: string, windowEnd: string, runtimeMinutes: number): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = windowEnd.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const windowEndMin = eh * 60 + em;
  const naturalEnd = startMin + runtimeMinutes;
  const clamped = Math.min(naturalEnd, windowEndMin);
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function computeEndTime(slot: ScheduleEntry, title: PersistedTitleClient): string {
  const runtime = title.runtimeMinutes ?? null;
  if (runtime == null) return slot.endTime;
  return clampEndToWindow(slot.startTime, slot.endTime, runtime);
}

function toLibraryTitle(title: PersistedTitleClient): LibraryTitle {
  return {
    id: title.id,
    tmdbId: title.tmdbId,
    tmdbType: title.tmdbType,
    title: title.title,
    originalTitle: title.title,
    originalLanguage: 'en',
    overview: '',
    posterPath: null,
    posterUrl: title.posterUrl ?? null,
    backdropPath: null,
    backdropUrl: title.backdropUrl ?? null,
    releaseDate: null,
    year: title.year,
    genreIds: [],
    genres: [],
    popularity: 0,
    voteAverage: 0,
    voteCount: 0,
    providerBadges: [],
  };
}

function providersForTitle(
  title: PersistedTitleClient | null,
  streamers: StreamerManifest[],
): StreamerManifest[] {
  const providerIds = new Set(title?.providerIds ?? []);
  if (!providerIds.size) return [];
  return streamers.filter((streamer) => providerIds.has(streamer.id));
}

function scheduleFocus(): void {
  queueMicrotask(() => {
    const root = document.querySelector<HTMLElement>('[data-slot-edit-root]');
    if (!root) return;

    if (focusRegion === 'tabs') {
      root.querySelector<HTMLButtonElement>(`[data-slot-edit-tab="${activeTab}"]`)?.focus();
      return;
    }

    const target = root.querySelector<HTMLElement>(
      '[data-slot-edit-content] mc-library-card button, [data-slot-edit-content] mc-button button, [data-slot-edit-content] button',
    );
    target?.focus();
  });
}

function cycleTab(direction: 1 | -1): void {
  const current = TABS.findIndex((tab) => tab.id === activeTab);
  activeTab = TABS[(current + direction + TABS.length) % TABS.length]!.id;
}

function renderPreview(
  currentTitle: PersistedTitleClient | null,
  providers: StreamerManifest[],
): TemplateResult {
  return html`
    <section class="slot-edit__preview" aria-label="Current title">
      ${currentTitle
        ? html`
            <mc-library-card
              .libraryTitle=${toLibraryTitle(currentTitle)}
              .providers=${providers}
              disabled
            ></mc-library-card>
          `
        : html`<p class="muted">No title is bound to this slot.</p>`}
    </section>
  `;
}

function renderTabBar(ctx: RouteContext): TemplateResult {
  const selectTab = (tab: SlotEditTab): void => {
    activeTab = tab;
    focusRegion = 'tabs';
    ctx.redraw();
  };

  return html`
    <div class="slot-edit__tabs" role="tablist" aria-label="Slot edit actions">
      ${TABS.map(
        (tab) => html`
          <button
            type="button"
            role="tab"
            data-slot-edit-tab=${tab.id}
            aria-selected=${activeTab === tab.id ? 'true' : 'false'}
            tabindex=${activeTab === tab.id ? '0' : '-1'}
            class="slot-edit__tab"
            @click=${() => selectTab(tab.id)}
          >
            ${tab.label}
          </button>
        `,
      )}
    </div>
  `;
}

function renderSwapContent(
  ctx: RouteContext,
  slot: ScheduleEntry,
  titles: PersistedTitleClient[],
): TemplateResult {
  const swapTitle = async (title: PersistedTitleClient): Promise<void> => {
    const nextSchedule = ctx.state.schedule.map((s) =>
      s.id === slot.id
        ? { ...s, titleId: title.id, showId: title.id, endTime: computeEndTime(s, title) }
        : s,
    );
    const nextChannel = rebuildChannel(nextSchedule, ctx.state.selectedTitles, ctx.state.streamers);
    await ctx.patch({ schedule: nextSchedule, channel: nextChannel });
    ctx.navigate('week');
  };

  return html`
    <div class="slot-edit__grid">
      ${titles.map(
        (title) => html`
          <mc-library-card
            .libraryTitle=${toLibraryTitle(title)}
            .providers=${providersForTitle(title, ctx.streamers)}
            ?selected=${slot.titleId === title.id}
            @mc-card-click=${() => void swapTitle(title)}
          ></mc-library-card>
        `,
      )}
    </div>
  `;
}

function renderTabContent(
  ctx: RouteContext,
  slot: ScheduleEntry,
  titles: PersistedTitleClient[],
): TemplateResult {
  const disableSlot = async (): Promise<void> => {
    const nextSchedule = ctx.state.schedule.map((s) =>
      s.id === slot.id ? { ...s, enabled: false } : s,
    );
    const nextChannel = rebuildChannel(nextSchedule, ctx.state.selectedTitles, ctx.state.streamers);
    await ctx.patch({ schedule: nextSchedule, channel: nextChannel });
    ctx.navigate('week');
  };

  const removeSlot = async (): Promise<void> => {
    const nextSchedule = ctx.state.schedule.filter((s) => s.id !== slot.id);
    const nextChannel = rebuildChannel(nextSchedule, ctx.state.selectedTitles, ctx.state.streamers);
    await ctx.patch({ schedule: nextSchedule, channel: nextChannel });
    ctx.navigate('week');
  };

  const pickNewTitle = (): void => {
    setReturnIntent({ type: 'slot-edit', slotId: slot.id });
    ctx.navigate('shows-picker');
  };

  if (activeTab === 'swap') return renderSwapContent(ctx, slot, titles);
  if (activeTab === 'off') {
    return html`
      <mc-button
        variant="danger"
        label="Disable this slot"
        @click=${() => void disableSlot()}
      ></mc-button>
    `;
  }
  if (activeTab === 'remove') {
    return html`
      <mc-button
        variant="danger"
        label="Remove this slot from the week"
        @click=${() => void removeSlot()}
      ></mc-button>
    `;
  }

  return html`
    <mc-button
      label="Pick new title"
      @click=${pickNewTitle}
    ></mc-button>
  `;
}

export function renderSlotEdit(ctx: RouteContext, slotId: string): TemplateResult {
  if (activeSlotId !== slotId) {
    activeSlotId = slotId;
    activeTab = 'swap';
    focusRegion = 'tabs';
  }

  const slot = ctx.state.schedule.find((s) => s.id === slotId);
  if (!slot) {
    scheduleFocus();
    return html`
      <div class="screen layout" data-slot-edit-root @keydown=${(event: KeyboardEvent) => {
        if (event.key === 'Escape' || event.key === 'BrowserBack') ctx.navigate('week');
      }}>
        <mc-top-bar title="Edit slot" show-back @mc-back=${() => ctx.navigate('week')}></mc-top-bar>
        <div class="layout__body" style="padding:16px;">
          <mc-empty-state
            heading="Slot not found"
            message="It may have been removed."
            .action=${{ label: 'Back to week', event: 'mc-back' }}
            @mc-empty-action=${() => ctx.navigate('week')}
          ></mc-empty-state>
        </div>
      </div>
    `;
  }

  const titles = ctx.state.selectedTitles as PersistedTitleClient[];
  const titleById = new Map(titles.map((title) => [title.id, title]));
  const currentTitle = titleById.get(slot.titleId ?? slot.showId ?? '') ?? null;
  const currentProviders = providersForTitle(currentTitle, ctx.streamers);
  const title = `Edit ${DAY_NAMES[slot.dayOfWeek]} ${slot.startTime}`;

  const handleKeydown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    const inContent = Boolean(target?.closest('[data-slot-edit-content]'));

    if (event.key === 'Escape' || event.key === 'BrowserBack') {
      event.preventDefault();
      ctx.navigate('week');
      return;
    }

    if (!inContent && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      cycleTab(event.key === 'ArrowRight' ? 1 : -1);
      focusRegion = 'tabs';
      ctx.redraw();
      return;
    }

    if (!inContent && event.key === 'ArrowDown') {
      event.preventDefault();
      focusRegion = 'content';
      ctx.redraw();
      return;
    }

    if (inContent && event.key === 'ArrowUp') {
      event.preventDefault();
      focusRegion = 'tabs';
      ctx.redraw();
    }
  };

  scheduleFocus();

  return html`
    <div
      class="screen layout slot-edit"
      data-slot-edit-root
      @keydown=${handleKeydown}
    >
      <mc-top-bar title=${title} show-back @mc-back=${() => ctx.navigate('week')}></mc-top-bar>
      <div class="layout__body slot-edit__body" style="padding:16px;">
        ${renderPreview(currentTitle, currentProviders)}
        ${renderTabBar(ctx)}
        <section
          class="slot-edit__content"
          data-slot-edit-content
          tabindex="-1"
          aria-live="polite"
        >
          ${renderTabContent(ctx, slot, titles)}
        </section>
      </div>
    </div>
  `;
}
