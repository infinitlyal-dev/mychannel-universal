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
