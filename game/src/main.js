// main.js — Dine & Dash Bistro: game loop, state machine and tap handling.
// Screens: title → playing ⇄ pause → win / lose (each end screen restarts).

import { BALANCE } from './config.js';
import { Rng, seedFromQuery } from './random.js';
import { Kitchen } from './kitchen.js';
import { Shift } from './customers.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { drawScene } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seed = seedFromQuery(window.location.search);
const shotKind = params.get('shot');

export class Game {
  constructor(seedValue) {
    this.seed = seedValue;
    this.sound = new SoundBank();
    this.screen = 'title';
    this.showHow = false;
    this.message = 'Welcome to the bistro!';
    this.popups = [];
    this.bestCombo = 1;
    this.frozen = false; // screenshot staging freezes time
    this.goldenPinged = new Set();
    this.resetShift();
  }
  resetShift() {
    this.rng = new Rng(this.seed);
    this.kitchen = new Kitchen();
    this.shift = new Shift(this.rng);
    this.popups = [];
    this.bestCombo = 1;
    this.goldenPinged = new Set();
  }
  startShift() {
    this.resetShift();
    this.screen = 'playing';
    this.message = 'First customers incoming — check the order board!';
    this.sound.ding();
  }
  popup(x, y, text, color = '#2e7d32', size = 26) {
    this.popups.push({ x, y, text, color, size, life: 1.6 });
  }
  comboMult() { return Math.min(BALANCE.comboMax, 1 + BALANCE.comboStep * Math.max(0, this.shift.combo - 1)); }

  // ---- tap actions -----------------------------------------------------------
  onTap(x, y) {
    const region = input.hit(x, y);
    this.sound.ensure();
    if (!region) return;
    const { action, data } = region;
    if (this.screen === 'title') {
      if (action === 'start') this.startShift();
      else if (action === 'how') { this.showHow = !this.showHow; this.sound.click(); }
      return;
    }
    if (this.screen === 'pause') {
      if (action === 'resume') this.screen = 'playing';
      else if (action === 'restart') this.startShift();
      return;
    }
    if (this.screen === 'win' || this.screen === 'lose') {
      if (action === 'restart') this.startShift();
      return;
    }
    // playing
    switch (action) {
      case 'bin': this.tapBin(data); break;
      case 'grill': this.tapGrill(data); break;
      case 'tray': this.tapTray(data); break;
      case 'trash': this.tapTrash(); break;
      case 'undo': this.tapUndo(); break;
      case 'serve': this.tapServe(data); break;
      default: break;
    }
  }
  tapBin(id) {
    const k = this.kitchen;
    if (k.selectedRaw && k.selectedRaw !== id) k.selectedRaw = null;
    if (this.isRaw(id)) {
      k.toggleSelectRaw(id);
      this.message = k.selectedRaw ? `${nameOf(id)} picked up — click a grill slot to cook it!` : `${nameOf(id)} put back.`;
      this.sound.click();
    } else if (k.addReadyToPlate(id)) {
      this.sound.pop();
      this.message = `${nameOf(id)} added to the plate.`;
      this.checkPlateFeedback();
    }
  }
  isRaw(id) { return ['pattyRaw', 'chickenRaw', 'batterRaw', 'eggRaw', 'baconRaw'].includes(id); }
  tapGrill(index) {
    const k = this.kitchen;
    if (k.selectedRaw) {
      const slot = k.startCooking(index);
      if (slot >= 0) { this.sound.sizzle(); this.message = `${nameOf(k.grill[slot].rawId)} is on the heat — watch for GOLDEN!`; }
      else this.message = 'That grill slot is busy!';
      return;
    }
    if (!k.grill[index]) { this.sound.click(); return; }
    const result = k.collectSlot(index);
    this.goldenPinged.delete(index);
    if (!result) return;
    if (result.outcome === 'tray') { this.sound.golden(); this.message = `${nameOf(result.cookedId)} is golden! It waits in the holding tray.`; }
    else if (result.outcome === 'burnt') { this.shift.coins = Math.max(0, this.shift.coins - BALANCE.burntPenalty); this.sound.trash(); this.message = `Burnt! Trashed it (-$${BALANCE.burntPenalty}). Take food off in the golden window.`; }
    else { this.sound.trash(); this.message = 'Too soon — still raw inside! It had to be thrown away.'; }
  }
  tapTray(index) {
    if (this.kitchen.addTrayToPlate(index)) {
      this.sound.pop();
      this.message = 'Cooked item plated!';
      this.checkPlateFeedback();
    }
  }
  tapTrash() {
    const n = this.kitchen.trashPlate();
    if (n > 0) {
      this.shift.coins = Math.max(0, this.shift.coins - BALANCE.wrongIngredientPenalty);
      this.sound.trash();
      this.message = `Plate trashed (-$${BALANCE.wrongIngredientPenalty}). Start the dish again, in order!`;
    }
  }
  tapUndo() {
    const removed = this.kitchen.popPlate();
    if (removed) { this.sound.click(); this.message = `${nameOf(removed)} taken off the plate.`; }
  }
  tapServe(customerId) {
    const idx = this.shift.customers.findIndex((c) => c.id === customerId);
    const reward = this.shift.serve(customerId, this.kitchen.plate);
    if (!reward) {
      if (this.kitchen.plate.length) { this.sound.click(); this.message = 'That plate does not match this order yet — check the icons!'; }
      return;
    }
    this.kitchen.clearPlate();
    this.bestCombo = Math.max(this.bestCombo, this.comboMult());
    void idx; // popups float over the assembly plate, clear of the order cards
    this.popup(540, 545, `+$${reward.coins}`, '#2e7d32', 30);
    if (this.shift.combo >= 2) this.popup(748, 545, `COMBO x${this.comboMult().toFixed(2).replace(/\.?0+$/, '')}!`, '#e2711d', 22);
    this.sound.ding(); this.sound.coins();
    this.message = `Served! $${reward.price} + $${reward.tip} tip. ${this.shift.combo >= 2 ? 'Combo building — serve fast!' : ''}`;
    if (this.shift.won) this.finishDay(true);
  }
  checkPlateFeedback() {
    const match = this.shift.customers.find((c) => c.dish.steps.join() === this.kitchen.plate.join());
    if (match) { this.message = `${match.dish.name} complete! Click ${match.name} to serve it!`; this.sound.ding(); }
  }

  // ---- per-frame update ---------------------------------------------------------
  update(dt) {
    // Frozen (screenshot staging): hold every popup and timer exactly as
    // composed, so the captured frame is the staged scene, not a later one.
    if (this.frozen) return;
    for (const p of this.popups) { p.life -= dt; p.y -= 34 * dt; }
    this.popups = this.popups.filter((p) => p.life > 0);
    if (this.screen !== 'playing') return;
    this.kitchen.update(dt);
    // golden-window pings
    this.kitchen.grill.forEach((slot, i) => {
      if (!slot) { this.goldenPinged.delete(i); return; }
      if (this.kitchen.slotPhase(i) === 'golden' && !this.goldenPinged.has(i)) {
        this.goldenPinged.add(i);
        this.sound.golden();
        this.message = `${nameOf(slot.rawId)} is GOLDEN — click the grill to take it off!`;
      }
    });
    const events = this.shift.update(dt);
    for (const ev of events) {
      if (ev.type === 'left') {
        this.sound.strike();
        this.popup(224 + 416 * 0, 150, '😠 WALK-OUT!', '#c0392b', 24);
        this.message = `${ev.customer.name} left angry! Strike ${this.shift.strikes} of ${BALANCE.maxStrikes}.`;
      } else if (ev.type === 'arrived') {
        this.message = `${ev.customer.name} wants a ${ev.customer.dish.name}!`;
      }
    }
    if (this.shift.failed) this.finishDay(false);
    else if (this.shift.timeLeft <= 0) this.finishDay(this.shift.won);
  }
  finishDay(wonDay) {
    this.screen = wonDay ? 'win' : 'lose';
    if (wonDay) this.sound.win(); else this.sound.lose();
  }
  onKey(key) {
    const k = key.toLowerCase();
    if (k === 'm') { this.sound.muted = !this.sound.muted; this.message = this.sound.muted ? 'Sound muted (M to unmute).' : 'Sound on!'; return; }
    if (k === 'p' || k === 'escape') {
      if (this.screen === 'playing') this.screen = 'pause';
      else if (this.screen === 'pause') this.screen = 'playing';
    }
    if (k === 'enter' && this.screen === 'title') this.startShift();
  }
}

function nameOf(id) {
  const names = { bun: 'Bun', pattyRaw: 'Patty', patty: 'Grilled Patty', cheese: 'Cheese', lettuce: 'Lettuce', tomato: 'Tomato', cucumber: 'Cucumber', dressing: 'Dressing', batterRaw: 'Batter', pancake: 'Pancakes', berries: 'Berries', syrup: 'Syrup', eggRaw: 'Egg', egg: 'Fried Egg', peppers: 'Peppers', toast: 'Toast', chickenRaw: 'Chicken', chicken: 'Grilled Chicken', baconRaw: 'Bacon', bacon: 'Crispy Bacon' };
  return names[id] || id;
}

const game = new Game(seed);
const input = new Input(canvas, {
  onTap: (x, y) => game.onTap(x, y),
  onKey: (key) => game.onKey(key),
});
game.input = input;

if (shotKind) stageShot(game, shotKind);

// status line for screen readers / smoke checks
const statusEl = document.getElementById('status');
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  game.update(dt);
  drawScene(ctx, game, input);
  if (statusEl) statusEl.textContent = `Dine & Dash Bistro — ${game.screen}, $${game.shift.coins} of $${BALANCE.coinTarget}, ${Math.ceil(game.shift.timeLeft)} seconds left.`;
  if (shotKind && !window.__shotReady) window.__shotReady = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__game = game;
