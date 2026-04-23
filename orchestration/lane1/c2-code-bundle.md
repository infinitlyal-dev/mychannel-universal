# c2 code bundle — UI primitives

**Status:** Cursor instance is stuck in Plan mode; three `Write` calls on `.ts` files returned hard tool-layer rejection ("Plan mode can only edit markdown files"). Two `SwitchMode(target=agent)` calls were rejected and the tool then instructed "Do not attempt to switch modes again." No per-write approval prompt is surfacing — rejections are unconditional.

**Al action needed:** toggle agent mode in the Cursor chat UI chrome yourself (the mode selector at the bottom of the chat, not via my tool call). Then reply "execute" and I'll land c2 in one pass using the code below verbatim.

**Alternative:** copy the six files out of this bundle, run `cd app && npx tsc --noEmit`, commit with `feat(picker): add UI primitives — card, badges, skeleton, empty, filter-bar`, push. I verified the code against the brief in [CURSOR-c2-prompt.md](CURSOR-c2-prompt.md) and against plan amendments (commit `7cb89ba`): localStorage key `mc.picker.filters`, `content-visibility: auto` + `contain-intrinsic-size: 160px 240px` on card host, 250 ms query debounce, no shared/* edits, no screen wiring.

---

## File 1 — `app/src/components/mc-provider-badges.ts`

```ts
import { html, render } from 'lit-html';
import type { StreamerManifest } from '../types';

const DEFAULT_MAX = 4;

export class MCProviderBadges extends HTMLElement {
  private _providers: StreamerManifest[] = [];
  private _max = DEFAULT_MAX;

  static get observedAttributes(): string[] {
    return ['max'];
  }

  set providers(value: StreamerManifest[]) {
    this._providers = Array.isArray(value) ? value : [];
    this.invalidate();
  }

  get providers(): StreamerManifest[] {
    return this._providers;
  }

  set max(value: number) {
    this._max = Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_MAX;
    this.invalidate();
  }

  get max(): number {
    return this._max;
  }

  connectedCallback(): void {
    this.invalidate();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === 'max') {
      const parsed = value === null ? DEFAULT_MAX : Number(value);
      this._max = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_MAX;
      this.invalidate();
    }
  }

  private invalidate(): void {
    if (!this.isConnected) return;
    const visible = this._providers.slice(0, this._max);
    const overflow = Math.max(0, this._providers.length - visible.length);

    render(
      html`
        <ul class="mc-badges" role="list">
          ${visible.map(
            (provider) => html`
              <li class="mc-badges__item" title=${provider.name}>
                ${provider.logo
                  ? html`<img
                      class="mc-badges__logo"
                      src=${provider.logo}
                      alt=${provider.shortName || provider.name}
                      loading="lazy"
                      decoding="async"
                      referrerpolicy="no-referrer"
                    />`
                  : html`<span class="mc-badges__abbr" aria-hidden="true"
                      >${(provider.shortName || provider.name).slice(0, 2)}</span
                    >`}
                <span class="mc-badges__sr">${provider.name}</span>
              </li>
            `,
          )}
          ${overflow > 0
            ? html`<li class="mc-badges__more" aria-label=${`${overflow} more`}>+${overflow}</li>`
            : null}
        </ul>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-provider-badges')) {
  customElements.define('mc-provider-badges', MCProviderBadges);
}
```

---

## File 2 — `app/src/components/mc-library-card.ts`

```ts
import { html, render } from 'lit-html';
import type { LibraryTitle, StreamerManifest } from '../types';
import './mc-provider-badges';

const MAX_BADGES = 4;

export class MCLibraryCard extends HTMLElement {
  private _title: LibraryTitle | null = null;
  private _providers: StreamerManifest[] = [];
  private _selected = false;
  private _disabled = false;

  static get observedAttributes(): string[] {
    return ['selected', 'disabled'];
  }

  set title(value: LibraryTitle | null) {
    this._title = value;
    this.invalidate();
  }

  get title(): LibraryTitle | null {
    return this._title;
  }

  set providers(value: StreamerManifest[]) {
    this._providers = Array.isArray(value) ? value : [];
    this.invalidate();
  }

  get providers(): StreamerManifest[] {
    return this._providers;
  }

  set selected(value: boolean) {
    this._selected = Boolean(value);
    this.toggleAttribute('selected', this._selected);
    this.invalidate();
  }

  get selected(): boolean {
    return this._selected;
  }

  set disabled(value: boolean) {
    this._disabled = Boolean(value);
    this.toggleAttribute('disabled', this._disabled);
    this.invalidate();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  connectedCallback(): void {
    this.ensureHostStyles();
    this.invalidate();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === 'selected') this._selected = value !== null;
    if (name === 'disabled') this._disabled = value !== null;
    this.invalidate();
  }

  private ensureHostStyles(): void {
    const style = this.style;
    if (!style.display) style.display = 'block';
    (style as CSSStyleDeclaration & { contentVisibility?: string }).contentVisibility = 'auto';
    (style as CSSStyleDeclaration & { containIntrinsicSize?: string }).containIntrinsicSize = '160px 240px';
    style.contain = 'layout paint style';
  }

  private invalidate(): void {
    if (!this.isConnected) return;
    this.renderNow();
  }

  private onClick = (event: MouseEvent): void => {
    if (this._disabled || !this._title) return;
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent('mc-card-click', {
        bubbles: true,
        composed: true,
        detail: { tmdbType: this._title.tmdbType, tmdbId: this._title.tmdbId },
      }),
    );
  };

  private renderNow(): void {
    const title = this._title;
    if (!title) {
      render(html``, this);
      return;
    }

    const badges = this._providers.slice(0, MAX_BADGES);
    const poster = title.posterUrl ?? '';
    const year = title.year ?? '';

    render(
      html`
        <button
          type="button"
          class="mc-card ${this._selected ? 'mc-card--selected' : ''} ${this._disabled
            ? 'mc-card--disabled'
            : ''}"
          aria-pressed=${this._selected ? 'true' : 'false'}
          ?disabled=${this._disabled}
          @click=${this.onClick}
        >
          <div class="mc-card__poster">
            ${poster
              ? html`<img
                  src=${poster}
                  alt=${title.title}
                  loading="lazy"
                  decoding="async"
                  referrerpolicy="no-referrer"
                />`
              : html`<div class="mc-card__poster-fallback" aria-hidden="true"></div>`}
            ${badges.length
              ? html`<mc-provider-badges
                  class="mc-card__badges"
                  .providers=${badges}
                ></mc-provider-badges>`
              : null}
            ${this._selected
              ? html`<span class="mc-card__check" aria-hidden="true">✓</span>`
              : null}
          </div>
          <div class="mc-card__meta">
            <span class="mc-card__title" title=${title.title}>${title.title}</span>
            ${year ? html`<span class="mc-card__year">${year}</span>` : null}
          </div>
        </button>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-library-card')) {
  customElements.define('mc-library-card', MCLibraryCard);
}
```

---

## File 3 — `app/src/components/mc-skeleton-tile.ts`

```ts
import { html, render } from 'lit-html';

export class MCSkeletonTile extends HTMLElement {
  connectedCallback(): void {
    this.ensureHostStyles();
    render(
      html`
        <div class="mc-skeleton" aria-hidden="true">
          <div class="mc-skeleton__poster"></div>
          <div class="mc-skeleton__line mc-skeleton__line--title"></div>
          <div class="mc-skeleton__line mc-skeleton__line--year"></div>
        </div>
      `,
      this,
    );
  }

  private ensureHostStyles(): void {
    const style = this.style;
    if (!style.display) style.display = 'block';
    (style as CSSStyleDeclaration & { contentVisibility?: string }).contentVisibility = 'auto';
    (style as CSSStyleDeclaration & { containIntrinsicSize?: string }).containIntrinsicSize = '160px 240px';
    style.contain = 'layout paint style';
    this.setAttribute('role', 'presentation');
    this.setAttribute('aria-busy', 'true');
  }
}

if (!customElements.get('mc-skeleton-tile')) {
  customElements.define('mc-skeleton-tile', MCSkeletonTile);
}
```

---

## File 4 — `app/src/components/mc-empty-state.ts`

```ts
import { html, render } from 'lit-html';

export interface MCEmptyStateAction {
  label: string;
  event: string;
}

export class MCEmptyState extends HTMLElement {
  private _heading = '';
  private _message = '';
  private _action: MCEmptyStateAction | null = null;

  static get observedAttributes(): string[] {
    return ['heading', 'message'];
  }

  set heading(value: string) {
    this._heading = value ?? '';
    this.invalidate();
  }

  get heading(): string {
    return this._heading;
  }

  set message(value: string) {
    this._message = value ?? '';
    this.invalidate();
  }

  get message(): string {
    return this._message;
  }

  set action(value: MCEmptyStateAction | null) {
    this._action = value && value.label && value.event ? value : null;
    this.invalidate();
  }

  get action(): MCEmptyStateAction | null {
    return this._action;
  }

  connectedCallback(): void {
    if (this._heading === '' && this.hasAttribute('heading')) {
      this._heading = this.getAttribute('heading') ?? '';
    }
    if (this._message === '' && this.hasAttribute('message')) {
      this._message = this.getAttribute('message') ?? '';
    }
    this.invalidate();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === 'heading') this._heading = value ?? '';
    if (name === 'message') this._message = value ?? '';
    this.invalidate();
  }

  private onAction = (): void => {
    const action = this._action;
    if (!action) return;
    this.dispatchEvent(
      new CustomEvent('mc-empty-action', {
        bubbles: true,
        composed: true,
        detail: { event: action.event },
      }),
    );
  };

  private invalidate(): void {
    if (!this.isConnected) return;
    render(
      html`
        <div class="mc-empty" role="status">
          <h3 class="mc-empty__heading">${this._heading}</h3>
          ${this._message
            ? html`<p class="mc-empty__message">${this._message}</p>`
            : null}
          ${this._action
            ? html`<button
                type="button"
                class="mc-empty__action"
                @click=${this.onAction}
              >
                ${this._action.label}
              </button>`
            : null}
        </div>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-empty-state')) {
  customElements.define('mc-empty-state', MCEmptyState);
}
```

---

## File 5 — `app/src/components/mc-filter-bar.ts`

```ts
import { html, render } from 'lit-html';
import type { StreamerManifest, TmdbTitleType } from '../types';

const STORAGE_KEY = 'mc.picker.filters';
const DEBOUNCE_MS = 250;

export interface MCFilterState {
  providers: string[];
  type: TmdbTitleType | 'all';
  query: string;
  genre?: string;
}

interface PersistedShape {
  providers?: unknown;
  type?: unknown;
  query?: unknown;
  genre?: unknown;
}

function readPersisted(): Partial<MCFilterState> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedShape;
    const out: Partial<MCFilterState> = {};
    if (Array.isArray(parsed.providers) && parsed.providers.every((p) => typeof p === 'string')) {
      out.providers = parsed.providers as string[];
    }
    if (parsed.type === 'movie' || parsed.type === 'tv' || parsed.type === 'all') {
      out.type = parsed.type;
    }
    if (typeof parsed.query === 'string') {
      out.query = parsed.query;
    }
    if (typeof parsed.genre === 'string') {
      out.genre = parsed.genre;
    }
    return out;
  } catch {
    return {};
  }
}

function writePersisted(state: MCFilterState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / disabled storage
  }
}

const TYPE_OPTIONS: Array<{ id: TmdbTitleType | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV' },
];

export class MCFilterBar extends HTMLElement {
  private _providers: StreamerManifest[] = [];
  private _state: MCFilterState = { providers: [], type: 'all', query: '', genre: undefined };
  private _debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private _hydrated = false;

  set providers(value: StreamerManifest[]) {
    this._providers = Array.isArray(value) ? value : [];
    this.invalidate();
  }

  get providers(): StreamerManifest[] {
    return this._providers;
  }

  set selectedProviders(value: string[]) {
    this._state.providers = Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
    this.invalidate();
  }

  get selectedProviders(): string[] {
    return this._state.providers.slice();
  }

  set type(value: TmdbTitleType | 'all') {
    this._state.type = value === 'movie' || value === 'tv' ? value : 'all';
    this.invalidate();
  }

  get type(): TmdbTitleType | 'all' {
    return this._state.type;
  }

  set query(value: string) {
    this._state.query = typeof value === 'string' ? value : '';
    this.invalidate();
  }

  get query(): string {
    return this._state.query;
  }

  set genre(value: string | undefined) {
    this._state.genre = typeof value === 'string' && value ? value : undefined;
    this.invalidate();
  }

  get genre(): string | undefined {
    return this._state.genre;
  }

  connectedCallback(): void {
    if (!this._hydrated) {
      const persisted = readPersisted();
      this._state = {
        providers: persisted.providers ?? this._state.providers,
        type: persisted.type ?? this._state.type,
        query: persisted.query ?? this._state.query,
        genre: persisted.genre ?? this._state.genre,
      };
      this._hydrated = true;
    }
    this.invalidate();
  }

  disconnectedCallback(): void {
    if (this._debounceHandle !== null) {
      clearTimeout(this._debounceHandle);
      this._debounceHandle = null;
    }
  }

  private emit(): void {
    writePersisted(this._state);
    this.dispatchEvent(
      new CustomEvent<MCFilterState>('mc-filter-change', {
        bubbles: true,
        composed: true,
        detail: {
          providers: this._state.providers.slice(),
          type: this._state.type,
          query: this._state.query,
          genre: this._state.genre,
        },
      }),
    );
  }

  private onQueryInput = (event: Event): void => {
    const value = (event.target as HTMLInputElement).value;
    this._state.query = value;
    if (this._debounceHandle !== null) clearTimeout(this._debounceHandle);
    this._debounceHandle = setTimeout(() => {
      this._debounceHandle = null;
      this.emit();
    }, DEBOUNCE_MS);
  };

  private onQueryClear = (): void => {
    this._state.query = '';
    if (this._debounceHandle !== null) {
      clearTimeout(this._debounceHandle);
      this._debounceHandle = null;
    }
    this.emit();
    this.invalidate();
  };

  private onTypeClick = (next: TmdbTitleType | 'all'): void => {
    if (this._state.type === next) return;
    this._state.type = next;
    this.emit();
    this.invalidate();
  };

  private onProviderToggle = (providerId: string): void => {
    const set = new Set(this._state.providers);
    if (set.has(providerId)) set.delete(providerId);
    else set.add(providerId);
    this._state.providers = [...set];
    this.emit();
    this.invalidate();
  };

  private onGenreChange = (event: Event): void => {
    const value = (event.target as HTMLSelectElement).value;
    this._state.genre = value ? value : undefined;
    this.emit();
    this.invalidate();
  };

  private invalidate(): void {
    if (!this.isConnected) return;
    const providerIdsSelected = new Set(this._state.providers);

    render(
      html`
        <div class="mc-filter-bar">
          <label class="mc-filter-bar__search">
            <span class="mc-filter-bar__sr">Search titles</span>
            <input
              type="search"
              class="mc-filter-bar__input"
              placeholder="Search titles"
              .value=${this._state.query}
              @input=${this.onQueryInput}
            />
            ${this._state.query
              ? html`<button
                  type="button"
                  class="mc-filter-bar__clear"
                  aria-label="Clear search"
                  @click=${this.onQueryClear}
                >
                  ×
                </button>`
              : null}
          </label>

          <div class="mc-filter-bar__types" role="tablist" aria-label="Title type">
            ${TYPE_OPTIONS.map(
              (option) => html`
                <button
                  type="button"
                  role="tab"
                  class="mc-filter-bar__type ${this._state.type === option.id
                    ? 'mc-filter-bar__type--active'
                    : ''}"
                  aria-selected=${this._state.type === option.id ? 'true' : 'false'}
                  @click=${() => this.onTypeClick(option.id)}
                >
                  ${option.label}
                </button>
              `,
            )}
          </div>

          <label class="mc-filter-bar__genre">
            <span class="mc-filter-bar__sr">Genre</span>
            <select
              class="mc-filter-bar__select"
              .value=${this._state.genre ?? ''}
              @change=${this.onGenreChange}
            >
              <option value="">All genres</option>
              <option value="drama">Drama</option>
              <option value="comedy">Comedy</option>
              <option value="crime">Crime</option>
              <option value="scifi">Sci-Fi</option>
              <option value="fantasy">Fantasy</option>
              <option value="thriller">Thriller</option>
              <option value="action">Action</option>
              <option value="romance">Romance</option>
              <option value="documentary">Documentary</option>
              <option value="animation">Animation</option>
              <option value="horror">Horror</option>
              <option value="reality">Reality</option>
            </select>
          </label>

          <div class="mc-filter-bar__providers" role="group" aria-label="Providers">
            ${this._providers.map(
              (provider) => html`
                <button
                  type="button"
                  class="mc-filter-bar__provider ${providerIdsSelected.has(provider.id)
                    ? 'mc-filter-bar__provider--active'
                    : ''}"
                  aria-pressed=${providerIdsSelected.has(provider.id) ? 'true' : 'false'}
                  title=${provider.name}
                  @click=${() => this.onProviderToggle(provider.id)}
                >
                  ${provider.logo
                    ? html`<img
                        src=${provider.logo}
                        alt=${provider.shortName || provider.name}
                        loading="lazy"
                        decoding="async"
                        referrerpolicy="no-referrer"
                      />`
                    : html`<span>${provider.shortName || provider.name}</span>`}
                </button>
              `,
            )}
          </div>
        </div>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-filter-bar')) {
  customElements.define('mc-filter-bar', MCFilterBar);
}
```

---

## File 6 — `app/src/components/index.ts`

```ts
export { MCLibraryCard } from './mc-library-card';
export { MCProviderBadges } from './mc-provider-badges';
export { MCSkeletonTile } from './mc-skeleton-tile';
export { MCEmptyState, type MCEmptyStateAction } from './mc-empty-state';
export { MCFilterBar, type MCFilterState } from './mc-filter-bar';

import './mc-library-card';
import './mc-provider-badges';
import './mc-skeleton-tile';
import './mc-empty-state';
import './mc-filter-bar';
```

---

## Verification and commit recipe

```bash
cd C:\dev\mychannel-universal\app
npx tsc --noEmit
# expect: exit 0, no errors

cd C:\dev\mychannel-universal
git add app/src/components
git commit -m "feat(picker): add UI primitives — card, badges, skeleton, empty, filter-bar"
git push origin v2-rebuild
```

Then append to `orchestration/evidence-log.md`:

```
## c2 — UI primitives shipped
- commit: <SHA>
- files: app/src/components/{mc-library-card,mc-provider-badges,mc-skeleton-tile,mc-empty-state,mc-filter-bar,index}.ts
- tsc: clean
- notes: code authored by Cursor but written to disk by Al (plan-mode tool gate prevented direct .ts writes; see orchestration/lane1/c2-code-bundle.md)
```

---

## What I did not verify

- `npx tsc --noEmit` — I cannot run it until I get past the mode gate. Types are imported from `app/src/types.ts` (re-export of `shared/types.ts`): `LibraryTitle`, `StreamerManifest`, `TmdbTitleType`. I checked each is exported from [/shared/types.ts](/C:/dev/mychannel-universal/shared/types.ts) L37-47, L63-78, L4-5. `lit-html` is already a devDep in [app/package.json](app/package.json) L30. No new deps introduced.
- Runtime behaviour in a browser — same reason.
- CSS — components emit plain class names; styles land later in `app/www/css/components.css` (not in c2 scope; brief says components only).

If these shapes mismatch anything in the shared contract, the tsc run on the other side will catch it and I'll fix it the moment the mode gate is open.
