import { html, type TemplateResult } from 'lit-html';
import type { RouteContext } from '../router';
import {
  fetchLibrary,
  fetchProviders,
  fetchTitle,
  type LibraryRequest,
} from '../lib/library-api';
import {
  getCachedLibraryPage,
  getCachedProviders,
  getCachedTitleDetail,
  setCachedLibraryPage,
  setCachedProviders,
  setCachedTitleDetail,
} from '../lib/library-cache';
import type {
  GenreId,
  LibraryTitle,
  PersistedTitleClient,
  Region,
  StreamerId,
  StreamerManifest,
  TmdbTitleType,
} from '../types';

const FILTER_STORAGE_KEY = 'mc.picker.filters';
const MAX_LIVE_ROWS = 40;
const DEFAULT_ROW_HEIGHT = 360;
const DEFAULT_COLS_PER_ROW = 2;

type PickerMode = 'wizard' | 'return';
type EmptyVariant = 'no-providers' | 'no-results' | 'no-filters' | 'api-error';

interface PickerFilters {
  providers: StreamerId[];
  type: TmdbTitleType | 'all';
  query: string;
  genre?: GenreId;
}

interface PickerState {
  region: Region | null;
  mode: PickerMode | null;
  filters: PickerFilters;
  providers: StreamerManifest[];
  items: LibraryTitle[];
  page: number;
  totalPages: number;
  totalResults: number;
  loadingProviders: boolean;
  loadingPage: boolean;
  error: string | null;
  retryCount: number;
  rowHeight: number;
  colsPerRow: number;
  firstRow: number;
}

const screenState: PickerState = {
  region: null,
  mode: null,
  filters: { providers: [], type: 'all', query: '', genre: undefined },
  providers: [],
  items: [],
  page: 0,
  totalPages: 1,
  totalResults: 0,
  loadingProviders: false,
  loadingPage: false,
  error: null,
  retryCount: 0,
  rowHeight: DEFAULT_ROW_HEIGHT,
  colsPerRow: DEFAULT_COLS_PER_ROW,
  firstRow: 0,
};

let sentinelObserver: IntersectionObserver | null = null;
let measuredRow: Element | null = null;
let resizeObserver: ResizeObserver | null = null;
let scrollBound = false;

function isStreamerId(value: string): value is StreamerId {
  return [
    'netflix',
    'prime',
    'disney',
    'appletv',
    'max',
    'hulu',
    'peacock',
    'paramount',
    'showtime',
    'starz',
    'youtube',
  ].includes(value);
}

function isGenreId(value: string): value is GenreId {
  return [
    'drama',
    'comedy',
    'crime',
    'scifi',
    'fantasy',
    'thriller',
    'action',
    'romance',
    'documentary',
    'animation',
    'horror',
    'reality',
  ].includes(value);
}

function readPersistedFilters(defaultProviders: StreamerId[]): PickerFilters {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) {
      return { providers: defaultProviders, type: 'all', query: '', genre: undefined };
    }

    const parsed = JSON.parse(raw) as Partial<{
      providers: unknown;
      type: unknown;
      query: unknown;
      genre: unknown;
    }>;
    const providers = Array.isArray(parsed.providers)
      ? parsed.providers.filter((provider): provider is StreamerId =>
          typeof provider === 'string' && isStreamerId(provider),
        )
      : defaultProviders;
    const type = parsed.type === 'movie' || parsed.type === 'tv' || parsed.type === 'all'
      ? parsed.type
      : 'all';
    const query = typeof parsed.query === 'string' ? parsed.query : '';
    const genre = typeof parsed.genre === 'string' && isGenreId(parsed.genre)
      ? parsed.genre
      : undefined;
    return { providers, type, query, genre };
  } catch {
    return { providers: defaultProviders, type: 'all', query: '', genre: undefined };
  }
}

function persistFilters(filters: PickerFilters): void {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Storage may be disabled. The picker still works for the current session.
  }
}

function normalizeFilters(filters: PickerFilters, region: Region): LibraryRequest {
  return {
    region,
    page: 1,
    providers: filters.providers,
    type: filters.type,
    query: filters.query,
    genre: filters.genre,
  };
}

function resetForFetch(): void {
  screenState.items = [];
  screenState.page = 0;
  screenState.totalPages = 1;
  screenState.totalResults = 0;
  screenState.error = null;
  screenState.retryCount = 0;
  screenState.firstRow = 0;
}

function initPicker(ctx: RouteContext, mode: PickerMode): void {
  if (screenState.region === ctx.state.region && screenState.mode === mode) return;

  screenState.region = ctx.state.region;
  screenState.mode = mode;
  screenState.filters = readPersistedFilters(ctx.state.streamers);
  screenState.providers = getCachedProviders(ctx.state.region) ?? [];
  resetForFetch();
  void ensureProviders(ctx);
  void loadPage(ctx, 1, false);
}

async function ensureProviders(ctx: RouteContext): Promise<void> {
  const cached = getCachedProviders(ctx.state.region);
  if (cached) {
    screenState.providers = cached;
    ctx.redraw();
    return;
  }

  if (screenState.loadingProviders) return;
  screenState.loadingProviders = true;
  try {
    const response = await fetchProviders(ctx.state.region);
    screenState.providers = response.providers;
    setCachedProviders(ctx.state.region, response.providers);
  } catch (err) {
    screenState.error = err instanceof Error ? err.message : 'Provider request failed';
  } finally {
    screenState.loadingProviders = false;
    ctx.redraw();
  }
}

async function loadPage(ctx: RouteContext, page: number, append: boolean): Promise<void> {
  if (screenState.loadingPage) return;
  if (page > screenState.totalPages && screenState.page > 0) return;

  screenState.loadingPage = true;
  screenState.error = null;
  ctx.redraw();

  const request: LibraryRequest = {
    ...normalizeFilters(screenState.filters, ctx.state.region),
    page,
  };

  try {
    const cached = getCachedLibraryPage(request);
    const response = cached ?? await fetchLibrary(request);
    if (!cached) setCachedLibraryPage(request, response);
    if (!response.success) {
      throw new Error(response.error?.message ?? 'Library request failed');
    }

    screenState.items = append ? dedupeItems([...screenState.items, ...response.items]) : response.items;
    screenState.page = response.page;
    screenState.totalPages = response.totalPages;
    screenState.totalResults = response.totalResults;
  } catch (err) {
    screenState.error = err instanceof Error ? err.message : 'Library request failed';
    if (!append) {
      screenState.items = [];
      screenState.page = 0;
    }
  } finally {
    screenState.loadingPage = false;
    ctx.redraw();
  }
}

function dedupeItems(items: LibraryTitle[]): LibraryTitle[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function providerBadgesFor(item: LibraryTitle, providers: StreamerManifest[]): StreamerManifest[] {
  const ids = new Set(item.providerBadges.map((badge) => badge.id));
  return providers.filter((provider) => ids.has(provider.id));
}

async function onPickTitle(ctx: RouteContext, item: LibraryTitle): Promise<void> {
  const selected = ctx.state.selectedTitles as PersistedTitleClient[];
  const alreadySelected = selected.some((title) => title.id === item.id);
  if (alreadySelected) {
    await ctx.patch({
      shows: ctx.state.shows.filter((id) => id !== item.id),
      selectedTitles: selected.filter((title) => title.id !== item.id),
    });
    return;
  }

  const cached = getCachedTitleDetail(item.tmdbType, item.tmdbId);
  let detail = cached;
  if (!detail) {
    try {
      detail = (await fetchTitle(item.tmdbType, item.tmdbId)).item;
      if (detail) {
        setCachedTitleDetail(item.tmdbType, item.tmdbId, detail);
      }
    } catch (err) {
      screenState.error = err instanceof Error ? err.message : 'Title detail request failed';
      ctx.redraw();
      return;
    }
  }

  const persisted: PersistedTitleClient = {
    id: item.id,
    tmdbId: item.tmdbId,
    tmdbType: item.tmdbType,
    title: item.title,
    year: item.year,
    posterUrl: item.posterUrl,
    backdropUrl: item.backdropUrl,
    providerIds: item.providerBadges.map((badge) => badge.id),
    runtimeMinutes: detail?.runtimeMinutes ?? null,
  };

  await ctx.patch({
    shows: [...new Set([...ctx.state.shows, item.id])],
    selectedTitles: [...selected, persisted],
  });

  // TODO(c5): consume slot-edit return intent after c5 owns the picker-return protocol.
}

function visibleRows(totalRows: number): { start: number; end: number } {
  const maxStart = Math.max(0, totalRows - MAX_LIVE_ROWS);
  const start = Math.min(Math.max(0, screenState.firstRow - 4), maxStart);
  const end = Math.min(totalRows, start + MAX_LIVE_ROWS);
  return { start, end };
}

function updateScrollWindow(ctx: RouteContext): void {
  const next = Math.max(0, Math.floor(window.scrollY / screenState.rowHeight));
  if (next === screenState.firstRow) return;
  screenState.firstRow = next;
  ctx.redraw();
}

function ensureScrollListener(ctx: RouteContext): void {
  if (scrollBound) return;
  scrollBound = true;
  window.addEventListener('scroll', () => updateScrollWindow(ctx), { passive: true });
  window.addEventListener('resize', () => {
    measuredRow = null;
    updateScrollWindow(ctx);
    ctx.redraw();
  });
}

function bindSentinel(ctx: RouteContext): void {
  queueMicrotask(() => {
    const sentinel = document.querySelector('[data-sentinel]');
    if (!sentinel) return;

    sentinelObserver?.disconnect();
    sentinelObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || screenState.loadingPage) return;
        if (screenState.page >= screenState.totalPages) return;
        sentinelObserver?.unobserve(sentinel);
        void loadPage(ctx, screenState.page + 1, true);
      },
      { rootMargin: '0px 0px 600px 0px' },
    );

    if (!screenState.loadingPage && screenState.page < screenState.totalPages) {
      sentinelObserver.observe(sentinel);
    }
  });
}

function bindRowMeasurement(ctx: RouteContext): void {
  queueMicrotask(() => {
    const row = document.querySelector('[data-grid-row]');
    if (!row || row === measuredRow) return;

    measuredRow = row;
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const height = Math.ceil(entry.contentRect.height);
      const width = Math.max(1, Math.floor(entry.contentRect.width));
      const cols = Math.max(1, Math.floor((width + 12) / (160 + 12)));
      if (height > 0) screenState.rowHeight = height + 12;
      screenState.colsPerRow = cols;
      ctx.redraw();
    });
    resizeObserver.observe(row);
  });
}

function focusInitial(mode: PickerMode): void {
  queueMicrotask(() => {
    const root = document.querySelector('[data-picker-root]');
    if (!root) return;
    const active = document.activeElement;
    if (active && active !== document.body && root.contains(active)) return;

    if (mode === 'return') {
      root.querySelector<HTMLInputElement>('mc-filter-bar input[type="search"]')?.focus();
      return;
    }

    root.querySelector<HTMLElement>('mc-library-card button')?.focus();
  });
}

function moveGridFocus(current: HTMLElement, delta: number): void {
  const buttons = [...document.querySelectorAll<HTMLElement>('[data-picker-grid] mc-library-card button')];
  const index = buttons.indexOf(current);
  if (index === -1 || !buttons.length) return;
  const next = (index + delta + buttons.length) % buttons.length;
  buttons[next]?.focus();
}

function handleKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const inFilter = Boolean(target.closest('mc-filter-bar'));
  const inGrid = Boolean(target.closest('[data-picker-grid]'));

  if (inFilter && event.key === 'ArrowDown') {
    event.preventDefault();
    document.querySelector<HTMLElement>('[data-picker-grid] mc-library-card button')?.focus();
    return;
  }

  if (inGrid && event.key === 'ArrowUp') {
    const firstTile = document.querySelector<HTMLElement>('[data-picker-grid] mc-library-card button');
    if (target === firstTile || target.getBoundingClientRect().top <= (firstTile?.getBoundingClientRect().top ?? 0) + 8) {
      event.preventDefault();
      document.querySelector<HTMLInputElement>('mc-filter-bar input[type="search"]')?.focus();
    }
    return;
  }

  if (!inGrid) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveGridFocus(target, -1);
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveGridFocus(target, 1);
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveGridFocus(target, screenState.colsPerRow);
  }
}

function renderRows(ctx: RouteContext, selectedIds: Set<string>): TemplateResult[] {
  const cols = Math.max(1, screenState.colsPerRow);
  const totalRows = Math.ceil(screenState.items.length / cols);
  const { start, end } = visibleRows(totalRows);
  const before = start * screenState.rowHeight;
  const after = Math.max(0, totalRows - end) * screenState.rowHeight;
  const rows: TemplateResult[] = [];

  if (before > 0) {
    rows.push(html`<div style="height:${before}px;grid-column:1 / -1;" aria-hidden="true"></div>`);
  }

  for (let rowIndex = start; rowIndex < end; rowIndex += 1) {
    const rowItems = screenState.items.slice(rowIndex * cols, rowIndex * cols + cols);
    rows.push(html`
      <div
        data-grid-row
        class="picker-grid-row"
        style="display:grid;gap:12px;content-visibility:auto;contain-intrinsic-size:auto 360px;grid-column:1 / -1;"
      >
        ${rowItems.map(
          (item) => html`
            <mc-library-card
              .libraryTitle=${item}
              .providers=${providerBadgesFor(item, screenState.providers)}
              ?selected=${selectedIds.has(item.id)}
              @mc-card-click=${() => void onPickTitle(ctx, item)}
            ></mc-library-card>
          `,
        )}
      </div>
    `);
  }

  if (after > 0) {
    rows.push(html`<div style="height:${after}px;grid-column:1 / -1;" aria-hidden="true"></div>`);
  }

  return rows;
}

function emptyVariant(): EmptyVariant | null {
  if (screenState.error) return 'api-error';
  if (!screenState.providers.length && !screenState.loadingProviders) return 'no-providers';
  if (screenState.loadingPage || screenState.items.length > 0) return null;
  const hasFilters = Boolean(
    screenState.filters.query.trim()
      || screenState.filters.genre
      || screenState.filters.type !== 'all'
      || screenState.filters.providers.length,
  );
  return hasFilters ? 'no-results' : 'no-filters';
}

function emptyCopy(variant: EmptyVariant): { heading: string; message: string; action?: string } {
  if (variant === 'api-error') {
    return {
      heading: 'Library unavailable',
      message: screenState.error ?? 'TMDB could not answer this request.',
      action: 'Retry',
    };
  }
  if (variant === 'no-providers') {
    return {
      heading: 'No providers for this region',
      message: 'Pick streamers first, then come back to add titles.',
    };
  }
  if (variant === 'no-results') {
    return {
      heading: 'No titles match',
      message: 'Clear a filter or search for something broader.',
    };
  }
  return {
    heading: 'No filters selected',
    message: 'Choose a provider or search to start building the channel.',
  };
}

function renderEmpty(ctx: RouteContext, variant: EmptyVariant): TemplateResult {
  const copy = emptyCopy(variant);
  const retry = (): void => {
    if (variant !== 'api-error' || screenState.retryCount >= 1) return;
    screenState.retryCount += 1;
    void loadPage(ctx, Math.max(1, screenState.page || 1), false);
  };

  return html`
    <mc-empty-state
      variant=${variant}
      heading=${copy.heading}
      message=${copy.message}
      .action=${copy.action ? { label: copy.action, event: 'retry' } : null}
      @mc-empty-action=${retry}
    ></mc-empty-state>
  `;
}

function renderSkeletons(): TemplateResult {
  return html`
    <div
      class="picker-grid-row"
      style="display:grid;gap:12px;grid-column:1 / -1;"
      aria-label="Loading titles"
    >
      ${Array.from(
        { length: Math.max(1, screenState.colsPerRow) },
        () => html`<mc-skeleton-tile></mc-skeleton-tile>`,
      )}
    </div>
  `;
}

export function renderShows(ctx: RouteContext, fromTab: boolean): TemplateResult {
  const mode: PickerMode = fromTab ? 'return' : 'wizard';
  initPicker(ctx, mode);
  ensureScrollListener(ctx);
  bindSentinel(ctx);
  bindRowMeasurement(ctx);
  focusInitial(mode);

  const selectedIds = new Set(ctx.state.selectedTitles.map((title) => title.id));
  const selectedCount = ctx.state.selectedTitles.length;
  const canContinue = selectedCount >= 6;
  const variant = emptyVariant();

  const onFilterChange = (event: CustomEvent<PickerFilters>): void => {
    screenState.filters = event.detail;
    persistFilters(screenState.filters);
    resetForFetch();
    window.scrollTo({ top: 0 });
    void loadPage(ctx, 1, false);
  };

  const continueToNext = (): void => {
    if (!canContinue) return;
    ctx.navigate(fromTab ? 'now' : 'wizard/times');
  };

  return html`
    <div
      class="screen layout"
      data-picker-root
      @keydown=${handleKeydown}
      style="padding:0;"
    >
      <style>
        .picker-grid-row {
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        }
        @media (min-width: 1600px) {
          .picker-grid-row {
            grid-template-columns: repeat(auto-fill, minmax(160px, 240px));
          }
        }
      </style>
      <mc-top-bar
        title=${fromTab ? 'Add titles' : 'Wizard 2/4 — Shows'}
        show-back
        @mc-back=${() => ctx.navigate(fromTab ? 'shows-picks' : 'wizard/streamers')}
      ></mc-top-bar>
      <div class="layout__body" style="padding:16px;">
        <mc-filter-bar
          .providers=${screenState.providers}
          .selectedProviders=${screenState.filters.providers}
          .type=${screenState.filters.type}
          .query=${screenState.filters.query}
          .genre=${screenState.filters.genre}
          @mc-filter-change=${onFilterChange}
        ></mc-filter-bar>

        <div
          style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0;"
        >
          <p class="muted" style="margin:0;">${selectedCount} selected · min 6</p>
          <mc-button
            label=${fromTab ? 'Done' : 'Continue'}
            ?disabled=${!canContinue}
            @click=${continueToNext}
          ></mc-button>
        </div>

        ${variant ? renderEmpty(ctx, variant) : null}
        <div
          data-picker-grid
          style="display:grid;gap:12px;align-items:start;"
        >
          ${renderRows(ctx, selectedIds)}
          ${screenState.loadingPage ? renderSkeletons() : null}
          <div data-sentinel style="height:1px;grid-column:1 / -1;"></div>
        </div>
      </div>
    </div>
  `;
}
