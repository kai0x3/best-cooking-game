// test-logic.mjs — Node tests for Dine & Dash Bistro's pure game rules.
// Run: node test-logic.mjs   (exits non-zero on the first failure)

import assert from 'node:assert/strict';
import { Rng, seedFromQuery } from './game/src/random.js';
import { dishById, plateMatchesDish, dishForPlate, nextNeeded, plateIsPrefixOf } from './game/src/recipes.js';
import { Kitchen, cookPhase } from './game/src/kitchen.js';
import { Shift, Customer, serveReward } from './game/src/customers.js';
import { BALANCE } from './game/src/config.js';

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log(`ok ${passed} - ${name}`); }

const burger = dishById('burger');
const salad = dishById('salad');

// --- recipes ---------------------------------------------------------------
check('exact burger sequence matches', () => {
  assert.equal(plateMatchesDish(['bun', 'patty', 'cheese', 'lettuce', 'tomato'], burger), true);
});
check('wrong order is rejected', () => {
  assert.equal(plateMatchesDish(['bun', 'cheese', 'patty', 'lettuce', 'tomato'], burger), false);
});
check('missing ingredient is rejected', () => {
  assert.equal(plateMatchesDish(['bun', 'patty', 'cheese', 'lettuce'], burger), false);
});
check('extra ingredient is rejected', () => {
  assert.equal(plateMatchesDish(['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'cheese'], burger), false);
});
check('dishForPlate finds the salad', () => {
  assert.equal(dishForPlate(['lettuce', 'tomato', 'cucumber', 'dressing'])?.id, 'salad');
});
check('nextNeeded walks the recipe in order', () => {
  assert.equal(nextNeeded(burger, []), 'bun');
  assert.equal(nextNeeded(burger, ['bun']), 'patty');
  assert.equal(nextNeeded(burger, burger.steps), null);
});
check('prefix logic accepts a partial build and rejects a wrong start', () => {
  assert.equal(plateIsPrefixOf(['bun', 'patty'], burger), true);
  assert.equal(plateIsPrefixOf(['cheese'], burger), false);
});

// --- cooking ---------------------------------------------------------------
check('cookPhase moves cooking -> golden -> burnt', () => {
  assert.equal(cookPhase(1.0, 5.0), 'cooking');
  assert.equal(cookPhase(4.0, 5.0), 'golden');
  assert.equal(cookPhase(7.0, 5.0), 'burnt');
});
check('golden collection lands the cooked item in the tray', () => {
  const k = new Kitchen();
  k.toggleSelectRaw('pattyRaw');
  const slot = k.startCooking();
  assert.equal(slot, 0);
  k.update(4.0); // 0.8 of the 5s cook time: golden
  const res = k.collectSlot(0);
  assert.equal(res.outcome, 'tray');
  assert.equal(res.cookedId, 'patty');
  assert.deepEqual(k.tray, ['patty']);
});
check('collecting too early discards the raw item', () => {
  const k = new Kitchen();
  k.toggleSelectRaw('eggRaw');
  k.startCooking();
  k.update(0.5);
  assert.equal(k.collectSlot(0).outcome, 'raw');
  assert.deepEqual(k.tray, []);
});
check('collecting too late yields a burnt item', () => {
  const k = new Kitchen();
  k.toggleSelectRaw('baconRaw');
  k.startCooking();
  k.update(99);
  assert.equal(k.collectSlot(0).outcome, 'burnt');
});
check('ready items plate directly; tray items move to the plate', () => {
  const k = new Kitchen();
  assert.equal(k.addReadyToPlate('bun'), true);
  k.tray = ['patty'];
  assert.equal(k.addTrayToPlate(0), true);
  assert.deepEqual(k.plate, ['bun', 'patty']);
  assert.equal(k.addReadyToPlate('pattyRaw'), false); // raw cannot be plated
});

// --- customers, patience, serving -------------------------------------------
check('patience expiry marks the customer as left', () => {
  const rng = new Rng(7);
  const c = new Customer(salad, rng, 1);
  c.update(c.patienceMax + 1);
  assert.equal(c.left, true);
});
check('a walk-out costs a strike and clears the order', () => {
  const s = new Shift(new Rng(3));
  const c = s.spawnCustomer();
  assert.ok(c);
  c.patience = 0.01;
  const events = s.update(0.05);
  assert.equal(s.strikes, 1);
  assert.equal(events.some((e) => e.type === 'left'), true);
  assert.equal(s.customers.length, 0);
});
check('serve awards price + tip and removes the customer', () => {
  const s = new Shift(new Rng(11));
  const c = s.spawnCustomer();
  const reward = s.serve(c.id, [...c.dish.steps]);
  assert.ok(reward);
  assert.equal(reward.price, c.dish.price);
  assert.equal(s.coins, reward.coins);
  assert.equal(s.servedCount, 1);
  assert.equal(s.customers.length, 0);
});
check('serve refuses a wrong plate', () => {
  const s = new Shift(new Rng(11));
  const c = s.spawnCustomer();
  assert.equal(s.serve(c.id, ['bun']), null);
  assert.equal(s.coins, 0);
});
check('combo raises the reward', () => {
  const rng = new Rng(5);
  const c = new Customer(burger, rng, 1);
  const plain = serveReward(c, 0);
  const comboed = serveReward(c, 4);
  assert.ok(comboed.coins > plain.coins);
  assert.ok(comboed.mult <= BALANCE.comboMax);
});
check('three strikes fail the shift', () => {
  const s = new Shift(new Rng(9));
  s.strikes = BALANCE.maxStrikes;
  assert.equal(s.failed, true);
  assert.equal(s.over, true);
});
check('reaching the coin target wins', () => {
  const s = new Shift(new Rng(9));
  s.coins = BALANCE.coinTarget;
  assert.equal(s.won, true);
});

// --- rng ---------------------------------------------------------------------
check('seeded RNG is reproducible and seed parsing works', () => {
  const a = new Rng(42); const b = new Rng(42);
  assert.deepEqual([a.float(), a.float(), a.float()], [b.float(), b.float(), b.float()]);
  assert.equal(seedFromQuery('?seed=17'), 17);
  assert.equal(seedFromQuery(''), 1);
});

console.log(`\nAll ${passed} assertions groups passed.`);
