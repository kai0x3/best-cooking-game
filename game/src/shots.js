// shots.js — deterministic staged scenes for ?shot=start|play|serve|end.
// Each scene freezes time, composes a rich mid-game (or end) picture and
// lets main.js flag window.__shotReady once it has been drawn.

import { BALANCE } from './config.js';
import { Customer } from './customers.js';
import { dishById } from './recipes.js';
import { Rng } from './random.js';

function makeCustomer(game, dishId, patienceFrac) {
  const rng = new Rng(game.seed * 31 + dishId.length * 7 + game.shift.customers.length);
  const c = new Customer(dishById(dishId), rng, 1);
  c.patience = Math.round(c.patienceMax * patienceFrac);
  return c;
}

function baseMidShift(game) {
  game.resetShift();
  game.screen = 'playing';
  game.frozen = true;
  game.shift.elapsed = 62;
  game.shift.coins = 96;
  game.shift.servedCount = 3;
  game.shift.strikes = 0;
  game.shift.customers = [
    makeCustomer(game, 'burger', 0.72),
    makeCustomer(game, 'pancakes', 0.5),
    makeCustomer(game, 'salad', 0.88),
  ];
}

export function stageShot(game, kind) {
  if (kind === 'start') {
    game.screen = 'title';
    game.showHow = false;
    game.frozen = true;
    // a lively kitchen sits behind the title card
    baseMidShift(game);
    game.screen = 'title';
    game.kitchen.grill[0] = { rawId: 'pattyRaw', elapsed: 2.2 };
    game.kitchen.tray = ['egg'];
    game.kitchen.plate = ['bun'];
    return;
  }
  if (kind === 'play') {
    baseMidShift(game);
    // burger mid-assembly on the plate
    game.kitchen.plate = ['bun', 'patty'];
    // a patty mid-cook on the grill (progress ring part-filled)
    game.kitchen.grill[0] = { rawId: 'pattyRaw', elapsed: 2.6 };
    // batter just turned golden in slot 2
    game.kitchen.grill[1] = { rawId: 'batterRaw', elapsed: 3.4 };
    // a fried egg waits in the holding tray
    game.kitchen.tray = ['egg'];
    game.message = 'Pancakes are GOLDEN — take them off!';
    return;
  }
  if (kind === 'serve') {
    baseMidShift(game);
    game.shift.coins = 148;
    game.shift.combo = 3;
    game.shift.comboTimer = 9;
    game.bestCombo = 1.5;
    // completed burger plate, ready to serve customer one
    game.kitchen.plate = ['bun', 'patty', 'cheese', 'lettuce', 'tomato'];
    game.kitchen.grill[0] = { rawId: 'eggRaw', elapsed: 1.4 };
    game.kitchen.tray = ['bacon'];
    game.popups = [
      { x: 540, y: 545, text: '+$57', color: '#2e7d32', size: 34, life: 1.5 },
      { x: 748, y: 545, text: 'COMBO x1.5!', color: '#e2711d', size: 22, life: 1.5 },
      { x: 1080, y: 640, text: '💰 TIP +$8', color: '#b8860b', size: 22, life: 1.5 },
    ];
    game.message = 'Served! $44 + $8 tip — combo x1.5!';
    return;
  }
  if (kind === 'end') {
    baseMidShift(game);
    game.shift.coins = 246;
    game.shift.servedCount = 9;
    game.shift.strikes = 1;
    game.shift.elapsed = BALANCE.shiftSeconds - 12;
    game.bestCombo = 2;
    game.screen = 'win';
    return;
  }
  // unknown shot name: fall back to the title screen
  game.screen = 'title';
  game.frozen = true;
}
