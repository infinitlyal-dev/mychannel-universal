export * from '../../shared/types';
import type { PersistedTitle as BasePersistedTitle } from '../../shared/types';

/**
 * Client-only extension of PersistedTitle.
 * See V1.5-TECH-DEBT.md: "Promote runtimeMinutes onto shared/types.ts".
 */
export interface PersistedTitleClient extends BasePersistedTitle {
  runtimeMinutes?: number | null;
}
