export type PickerReturnIntent =
  | { type: 'slot-edit'; slotId: string }
  | null;

let intent: PickerReturnIntent = null;

export function setReturnIntent(next: PickerReturnIntent): void {
  intent = next;
}

export function consumeReturnIntent(): PickerReturnIntent {
  const v = intent;
  intent = null;
  return v;
}
