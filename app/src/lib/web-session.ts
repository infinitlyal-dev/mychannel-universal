const DRAFT_SLOTS = 'mychannel_draft_slots_v1';

export function loadDraftSlotsJson(): string | null {
  try {
    return sessionStorage.getItem(DRAFT_SLOTS);
  } catch {
    return null;
  }
}

export function saveDraftSlotsJson(raw: string): void {
  try {
    sessionStorage.setItem(DRAFT_SLOTS, raw);
  } catch {
    /* private mode */
  }
}

export function clearDraftSlots(): void {
  try {
    sessionStorage.removeItem(DRAFT_SLOTS);
  } catch {
    /* ignore */
  }
}
