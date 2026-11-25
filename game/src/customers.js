// customers.js — order generation, patience, serving rewards and strikes.
// Pure logic driven by an injected RNG, so Node tests can replay a shift.

import { BALANCE, FACES, NAMES } from './config.js';
import { dishesAvailableAt, plateMatchesDish } from './recipes.js';

let nextCustomerId = 1;

export class Customer {
  constructor(dish, rng, patienceScale = 1) {
    this.id = nextCustomerId++;
    this.dish = dish;
    this.name = rng.pick(NAMES);
    this.face = rng.pick(FACES);
    this.patienceMax = Math.max(24, dish.patience * patienceScale);
    this.patience = this.patienceMax;
    this.served = false;
    this.left = false;
  }
  get patienceFrac() { return Math.max(0, this.patience / this.patienceMax); }
  update(dt) {
    if (this.served || this.left) return;
    this.patience -= dt;
    if (this.patience <= 0) { this.patience = 0; this.left = true; }
  }
}

// Reward for serving `customer` with the current combo count:
// base price + patience tip, scaled by the combo multiplier.
export function serveReward(customer, comboCount) {
  const tip = Math.round(BALANCE.baseTipMax * customer.patienceFrac);
  const mult = Math.min(BALANCE.comboMax, 1 + BALANCE.comboStep * Math.max(0, comboCount));
  const coins = Math.round((customer.dish.price + tip) * mult);
  return { coins, tip, mult, price: customer.dish.price };
}

export class Shift {
  // rng: an Rng-like object with pick()/range()/float().
  constructor(rng) {
    this.rng = rng;
    this.customers = [];       // active orders, oldest first
    this.coins = 0;
    this.strikes = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.servedCount = 0;
    this.spawnTimer = BALANCE.spawnFirstDelay;
    this.elapsed = 0;
  }

  get timeLeft() { return Math.max(0, BALANCE.shiftSeconds - this.elapsed); }
  get won() { return this.coins >= BALANCE.coinTarget && this.strikes < BALANCE.maxStrikes; }
  get failed() { return this.strikes >= BALANCE.maxStrikes; }
  get over() { return this.failed || this.timeLeft <= 0; }

  // Patience shrinks as the shift goes on (difficulty ramp).
  patienceScale() { return 1 - 0.3 * (this.elapsed / BALANCE.shiftSeconds); }
  spawnInterval() {
    const t = this.elapsed / BALANCE.shiftSeconds;
    return BALANCE.spawnIntervalEarly + (BALANCE.spawnIntervalLate - BALANCE.spawnIntervalEarly) * t;
  }

  spawnCustomer() {
    if (this.customers.length >= BALANCE.maxOrders) return null;
    const pool = dishesAvailableAt(this.elapsed);
    const dish = this.rng.pick(pool);
    const c = new Customer(dish, this.rng, this.patienceScale());
    this.customers.push(c);
    return c;
  }

  // Advance the shift. Returns events: {type:'arrived'|'left', customer}.
  update(dt) {
    const events = [];
    if (this.over) return events;
    this.elapsed += dt;
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.customers.length < BALANCE.maxOrders) {
      const c = this.spawnCustomer();
      if (c) events.push({ type: 'arrived', customer: c });
      this.spawnTimer = this.spawnInterval() * this.rng.range(0.8, 1.2);
    }
    for (const c of this.customers) {
      c.update(dt);
      if (c.left) { this.strikes += 1; this.combo = 0; events.push({ type: 'left', customer: c }); }
    }
    this.customers = this.customers.filter((c) => !c.left && !c.served);
    return events;
  }

  // Serve a plate to a customer. Succeeds only on an exact recipe match.
  serve(customerId, plate) {
    const c = this.customers.find((x) => x.id === customerId);
    if (!c || !plateMatchesDish(plate, c.dish)) return null;
    const reward = serveReward(c, this.combo);
    c.served = true;
    this.coins += reward.coins;
    this.servedCount += 1;
    this.combo += 1;
    this.comboTimer = BALANCE.comboWindowSeconds;
    this.customers = this.customers.filter((x) => x !== c);
    return reward;
  }
}
