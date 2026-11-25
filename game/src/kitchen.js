// kitchen.js — grill/pan cooking state, the holding tray and plate assembly.
// Pure state machine (no DOM): time only moves when update(dt) is called,
// which keeps the cooking rules directly testable in Node.

import { INGREDIENTS, COOK_WINDOW } from './config.js';

export const GRILL_SLOTS = 3;

// Cooking phase for an elapsed time against an ingredient's cookSeconds:
// 'cooking' (still raw inside), 'golden' (perfect to take off), 'burnt'.
export function cookPhase(elapsed, cookSeconds) {
  const f = elapsed / cookSeconds;
  if (f < COOK_WINDOW.goldenFrom) return 'cooking';
  if (f <= COOK_WINDOW.goldenTo) return 'golden';
  return 'burnt';
}

export class Kitchen {
  constructor() {
    this.grill = Array.from({ length: GRILL_SLOTS }, () => null); // {rawId, elapsed}
    this.tray = [];        // cooked ingredient ids waiting to be plated
    this.plate = [];       // ingredient ids stacked on the assembly plate
    this.selectedRaw = null; // raw bin currently picked up (id) or null
  }

  // Pick up / put down a raw ingredient from its bin.
  toggleSelectRaw(rawId) {
    const ing = INGREDIENTS[rawId];
    if (!ing || ing.kind !== 'raw') return false;
    this.selectedRaw = this.selectedRaw === rawId ? null : rawId;
    return true;
  }

  freeGrillSlot() { return this.grill.findIndex((s) => s === null); }

  // Put the selected raw item on a free grill slot. Returns slot index or -1.
  startCooking(slotIndex = -1) {
    if (!this.selectedRaw) return -1;
    const idx = slotIndex >= 0 && this.grill[slotIndex] === null ? slotIndex : this.freeGrillSlot();
    if (idx < 0) return -1;
    this.grill[idx] = { rawId: this.selectedRaw, elapsed: 0 };
    this.selectedRaw = null;
    return idx;
  }

  update(dt) {
    for (const slot of this.grill) if (slot) slot.elapsed += dt;
  }

  slotPhase(index) {
    const slot = this.grill[index];
    if (!slot) return null;
    return cookPhase(slot.elapsed, INGREDIENTS[slot.rawId].cookSeconds);
  }

  slotProgress(index) {
    const slot = this.grill[index];
    if (!slot) return 0;
    return Math.min(1, slot.elapsed / INGREDIENTS[slot.rawId].cookSeconds);
  }

  // Take an item off the grill. Outcomes:
  //  { outcome:'tray', cookedId }  golden — lands in the holding tray
  //  { outcome:'raw' }              too early — unusable, item is discarded
  //  { outcome:'burnt' }            too late — burnt, item is trashed
  //  null when the slot is empty.
  collectSlot(index) {
    const slot = this.grill[index];
    if (!slot) return null;
    const phase = this.slotPhase(index);
    this.grill[index] = null;
    if (phase === 'golden') {
      const cookedId = INGREDIENTS[slot.rawId].cookedId;
      this.tray.push(cookedId);
      return { outcome: 'tray', cookedId };
    }
    return { outcome: phase === 'burnt' ? 'burnt' : 'raw', cookedId: null };
  }

  // Add a ready ingredient straight to the plate.
  addReadyToPlate(ingredientId) {
    const ing = INGREDIENTS[ingredientId];
    if (!ing || ing.kind !== 'ready') return false;
    this.plate.push(ingredientId);
    return true;
  }

  // Move a tray item (by tray index) onto the plate.
  addTrayToPlate(trayIndex) {
    if (trayIndex < 0 || trayIndex >= this.tray.length) return false;
    const [item] = this.tray.splice(trayIndex, 1);
    this.plate.push(item);
    return true;
  }

  // Trash the whole plate (wrong build). Returns how many items were lost.
  trashPlate() { const n = this.plate.length; this.plate = []; return n; }

  // Remove just the top plate item (undo a single mistake).
  popPlate() { return this.plate.pop() ?? null; }

  clearPlate() { this.plate = []; }
}
