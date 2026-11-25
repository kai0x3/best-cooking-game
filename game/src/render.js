// render.js — every pixel of Dine & Dash Bistro, drawn in code on canvas:
// kitchen backdrop, order board, ingredient bins with hand-drawn food icons,
// the grill with progress rings, the assembly plate, HUD and all screens.

import { BALANCE, BIN_ORDER, INGREDIENTS, VIEW } from './config.js';
import { nextNeeded } from './recipes.js';

export const W = VIEW.width;
export const H = VIEW.height;

// ---- small drawing helpers -------------------------------------------------
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function panel(ctx, x, y, w, h, fill, stroke = '#5b3a22', lw = 3) {
  rr(ctx, x, y, w, h, 14); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke();
}
function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.font = `${weight} ${size}px 'Trebuchet MS', Verdana, sans-serif`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}
function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }

// ---- ingredient icons (all drawn, no images) -------------------------------
export function drawIngredient(ctx, id, cx, cy, s) {
  const ing = INGREDIENTS[id]; if (!ing) return;
  const u = s / 40; // unit: icons are designed on a 40px grid
  ctx.save(); ctx.translate(cx, cy);
  ctx.lineWidth = 2 * u; ctx.strokeStyle = 'rgba(60,35,15,0.55)';
  switch (id) {
    case 'bun':
      ctx.fillStyle = ing.color; ctx.beginPath(); ctx.arc(0, 2 * u, 15 * u, Math.PI, 0); ctx.fill(); ctx.stroke();
      rr(ctx, -15 * u, 1 * u, 30 * u, 7 * u, 3 * u); ctx.fillStyle = ing.dark; ctx.fill();
      ctx.fillStyle = '#fff3cf'; [[-7, -7], [0, -10], [7, -7]].forEach(([x, y]) => circle(ctx, x * u, y * u, 1.6 * u, '#fff3cf'));
      break;
    case 'pattyRaw': case 'patty':
      rr(ctx, -15 * u, -6 * u, 30 * u, 12 * u, 6 * u); ctx.fillStyle = ing.color; ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.dark; [[-8, 0], [2, -2], [9, 1]].forEach(([x, y]) => circle(ctx, x * u, y * u, 2 * u, ing.dark));
      break;
    case 'cheese':
      ctx.fillStyle = ing.color; ctx.beginPath(); ctx.moveTo(-15 * u, 8 * u); ctx.lineTo(15 * u, 8 * u); ctx.lineTo(0, -12 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.dark; [[-4, 2], [5, 5], [1, -4]].forEach(([x, y]) => circle(ctx, x * u, y * u, 2.2 * u, ing.dark));
      break;
    case 'lettuce':
      ctx.fillStyle = ing.color; [[-9, 2], [0, -4], [9, 2], [-4, 7], [5, 7]].forEach(([x, y]) => circle(ctx, x * u, y * u, 7.5 * u, ing.color));
      ctx.strokeStyle = ing.dark; ctx.beginPath(); ctx.arc(0, 1 * u, 12 * u, 0.3, 2.6); ctx.stroke();
      break;
    case 'tomato':
      circle(ctx, 0, 2 * u, 13 * u, ing.color); ctx.strokeStyle = ing.dark; ctx.beginPath(); ctx.arc(0, 2 * u, 13 * u, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#4d9430'; ctx.beginPath(); ctx.moveTo(0, -11 * u); ctx.lineTo(4 * u, -5 * u); ctx.lineTo(-4 * u, -5 * u); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; circle(ctx, -5 * u, -2 * u, 3 * u, 'rgba(255,255,255,0.5)');
      break;
    case 'cucumber':
      circle(ctx, -6 * u, 0, 9 * u, ing.color); circle(ctx, 7 * u, 3 * u, 9 * u, ing.color);
      ctx.fillStyle = '#cdeeb9'; circle(ctx, -6 * u, 0, 5.5 * u, '#cdeeb9'); circle(ctx, 7 * u, 3 * u, 5.5 * u, '#cdeeb9');
      break;
    case 'dressing':
      rr(ctx, -6 * u, -13 * u, 12 * u, 24 * u, 4 * u); ctx.fillStyle = ing.color; ctx.fill(); ctx.stroke();
      rr(ctx, -3 * u, -18 * u, 6 * u, 6 * u, 2 * u); ctx.fillStyle = '#e2711d'; ctx.fill();
      text(ctx, 'D', 0, 1 * u, 12 * u, '#b06a1e');
      break;
    case 'batterRaw':
      ctx.fillStyle = '#7fb3d5'; ctx.beginPath(); ctx.moveTo(-15 * u, -4 * u); ctx.lineTo(15 * u, -4 * u); ctx.lineTo(11 * u, 10 * u); ctx.lineTo(-11 * u, 10 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.color; ctx.beginPath(); ctx.ellipse(0, -4 * u, 14 * u, 4.5 * u, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'pancake':
      ctx.fillStyle = ing.color; [6, 0, -6].forEach((y) => { ctx.beginPath(); ctx.ellipse(0, y * u, 15 * u, 5.5 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle = '#ffe9a8'; rr(ctx, -4 * u, -13 * u, 8 * u, 5 * u, 2 * u); ctx.fill();
      break;
    case 'berries':
      ctx.fillStyle = ing.color; [[-8, 4], [0, -5], [8, 4], [-3, 8], [5, 9]].forEach(([x, y]) => circle(ctx, x * u, y * u, 5.5 * u, ing.color));
      ctx.fillStyle = '#4d9430'; [[0, -11], [-9, -2]].forEach(([x, y]) => circle(ctx, x * u, y * u, 2.6 * u, '#4d9430'));
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; [[-9, 2], [7, 2]].forEach(([x, y]) => circle(ctx, x * u, y * u, 1.6 * u, 'rgba(255,255,255,0.55)'));
      break;
    case 'syrup':
      rr(ctx, -7 * u, -12 * u, 14 * u, 24 * u, 5 * u); ctx.fillStyle = ing.color; ctx.fill(); ctx.stroke();
      rr(ctx, -3.5 * u, -17 * u, 7 * u, 6 * u, 2 * u); ctx.fillStyle = '#5b3a22'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; rr(ctx, -4.5 * u, -8 * u, 3 * u, 14 * u, 2 * u); ctx.fill();
      break;
    case 'eggRaw':
      ctx.fillStyle = ing.color; ctx.beginPath(); ctx.ellipse(0, 1 * u, 10 * u, 13 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    case 'egg':
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 1 * u, 15 * u, 10 * u, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      circle(ctx, 1 * u, 0, 6 * u, '#f2b705');
      break;
    case 'peppers':
      ctx.strokeStyle = ing.color; ctx.lineWidth = 4.5 * u;
      [[-9, -8, -2, 8], [0, -10, 5, 9], [9, -7, 12, 8]].forEach(([x1, y1, x2, y2]) => { ctx.beginPath(); ctx.moveTo(x1 * u, y1 * u); ctx.quadraticCurveTo((x1 + 3) * u, 0, x2 * u, y2 * u); ctx.stroke(); });
      ctx.strokeStyle = '#e84a3c'; ctx.beginPath(); ctx.moveTo(4 * u, -9 * u); ctx.quadraticCurveTo(10 * u, 0, 6 * u, 9 * u); ctx.stroke();
      break;
    case 'toast':
      ctx.fillStyle = ing.color; ctx.beginPath(); ctx.moveTo(-12 * u, 12 * u); ctx.lineTo(-12 * u, -4 * u); ctx.arc(0, -4 * u, 12 * u, Math.PI, 0); ctx.lineTo(12 * u, 12 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fdf0d0'; ctx.beginPath(); ctx.moveTo(-8 * u, 9 * u); ctx.lineTo(-8 * u, -3 * u); ctx.arc(0, -3 * u, 8 * u, Math.PI, 0); ctx.lineTo(8 * u, 9 * u); ctx.closePath(); ctx.fill();
      break;
    case 'chickenRaw': case 'chicken':
      ctx.fillStyle = ing.color; ctx.beginPath(); ctx.ellipse(-2 * u, -2 * u, 13 * u, 9 * u, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#f7ead9'; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(7 * u, 4 * u); ctx.lineTo(13 * u, 10 * u); ctx.stroke();
      circle(ctx, 14 * u, 11 * u, 3.4 * u, '#f7ead9'); circle(ctx, 11 * u, 13 * u, 3 * u, '#f7ead9');
      break;
    case 'baconRaw': case 'bacon':
      ctx.lineWidth = 5.5 * u;
      [-7, 3].forEach((y, i) => {
        ctx.strokeStyle = ing.color; ctx.beginPath(); ctx.moveTo(-14 * u, y * u);
        ctx.bezierCurveTo(-6 * u, (y - 6) * u, 6 * u, (y + 6) * u, 14 * u, y * u); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,235,220,0.8)'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(-14 * u, y * u);
        ctx.bezierCurveTo(-6 * u, (y - 6) * u, 6 * u, (y + 6) * u, 14 * u, y * u); ctx.stroke(); ctx.lineWidth = 5.5 * u;
        void i;
      });
      break;
    default:
      circle(ctx, 0, 0, 12 * u, ing.color);
  }
  ctx.restore();
}

// ---- customer faces ----------------------------------------------------------
export function drawFace(ctx, face, cx, cy, r, mood) {
  circle(ctx, cx, cy, r, face.skin);
  ctx.strokeStyle = 'rgba(60,35,15,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  // hair by style
  ctx.fillStyle = face.hair;
  if (face.style === 'cap') { ctx.beginPath(); ctx.arc(cx, cy - r * 0.15, r * 0.98, Math.PI, 0); ctx.fill(); rr(ctx, cx - r * 1.15, cy - r * 0.28, r * 2.3, r * 0.22, r * 0.1); ctx.fill(); }
  else if (face.style === 'bun') { ctx.beginPath(); ctx.arc(cx, cy - r * 0.25, r * 0.95, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(cx + r * 0.9, cy - r * 0.2); ctx.closePath(); ctx.fill(); circle(ctx, cx, cy - r * 1.05, r * 0.34, face.hair); }
  else if (face.style === 'spiky') { for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * r * 0.34 - r * 0.16, cy - r * 0.62); ctx.lineTo(cx + i * r * 0.34, cy - r * 1.18); ctx.lineTo(cx + i * r * 0.34 + r * 0.16, cy - r * 0.62); ctx.closePath(); ctx.fill(); } }
  else { ctx.beginPath(); ctx.arc(cx, cy - r * 0.2, r * 0.96, Math.PI, Math.PI * 1.85); ctx.lineTo(cx + r * 0.85, cy - r * 0.35); ctx.lineTo(cx - r * 0.85, cy - r * 0.35); ctx.closePath(); ctx.fill(); }
  // eyes + mouth by mood: 1 happy, 0 neutral, -1 angry
  ctx.fillStyle = '#26221f';
  circle(ctx, cx - r * 0.34, cy + r * 0.05, r * 0.09, '#26221f');
  circle(ctx, cx + r * 0.34, cy + r * 0.05, r * 0.09, '#26221f');
  ctx.strokeStyle = '#26221f'; ctx.lineWidth = 2.4; ctx.beginPath();
  if (mood > 0) ctx.arc(cx, cy + r * 0.28, r * 0.42, 0.25, Math.PI - 0.25);
  else if (mood < 0) ctx.arc(cx, cy + r * 0.72, r * 0.4, Math.PI + 0.4, Math.PI * 2 - 0.4);
  else { ctx.moveTo(cx - r * 0.25, cy + r * 0.48); ctx.lineTo(cx + r * 0.25, cy + r * 0.48); }
  ctx.stroke();
  if (mood >= 0) { ctx.fillStyle = 'rgba(240,110,90,0.35)'; circle(ctx, cx - r * 0.62, cy + r * 0.32, r * 0.16, 'rgba(240,110,90,0.35)'); circle(ctx, cx + r * 0.62, cy + r * 0.32, r * 0.16, 'rgba(240,110,90,0.35)'); }
}

// ---- layout constants shared with main.js hit-testing ------------------------
export const LAYOUT = {
  orderCards: [0, 1, 2].map((i) => ({ x: 24 + i * 416, y: 66, w: 400, h: 128 })),
  bins: BIN_ORDER.map((id, i) => {
    const row = i < 8 ? 0 : 1; const col = i % 8;
    return { id, x: 24 + col * 155, y: 232 + row * 84, w: 146, h: 76 };
  }),
  grillSlots: [0, 1, 2].map((i) => ({ x: 44 + i * 128, y: 486, w: 112, h: 112 })),
  traySlots: Array.from({ length: 6 }, (_, i) => ({ x: 878 + (i % 3) * 124, y: 486 + Math.floor(i / 3) * 96, w: 112, h: 86 })),
  plate: { x: 470, y: 470, w: 340, h: 190 },
  trashBtn: { x: 470, y: 676, w: 160, h: 52 },
  undoBtn: { x: 650, y: 676, w: 160, h: 52 },
  startBtn: { x: 440, y: 560, w: 400, h: 72 },
  howBtn: { x: 440, y: 648, w: 400, h: 56 },
  restartBtn: { x: 440, y: 520, w: 400, h: 68 },
};

// ---- scene pieces --------------------------------------------------------------
function drawBackdrop(ctx) {
  // wall
  const wall = ctx.createLinearGradient(0, 0, 0, 400);
  wall.addColorStop(0, '#f7e3c3'); wall.addColorStop(1, '#efd3a7');
  ctx.fillStyle = wall; ctx.fillRect(0, 0, W, 420);
  // tile grid lines
  ctx.strokeStyle = 'rgba(180,140,90,0.25)'; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 54); ctx.lineTo(x, 400); ctx.stroke(); }
  for (let y = 86; y <= 400; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // floor / counter base
  const floor = ctx.createLinearGradient(0, 400, 0, H);
  floor.addColorStop(0, '#a9713d'); floor.addColorStop(1, '#7d4f26');
  ctx.fillStyle = floor; ctx.fillRect(0, 400, W, H - 400);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let x = 0; x < W; x += 90) ctx.fillRect(x, 400, 2, H - 400);
  // bunting
  const cols = ['#e84a3c', '#ffc93c', '#7ec850', '#4aa3e8', '#e87ab0'];
  for (let i = 0; i < 16; i++) {
    const x = 20 + i * 79; const y = 196 + Math.sin(i * 0.9) * 4;
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 34, y); ctx.lineTo(x + 17, y + 22); ctx.closePath(); ctx.fill();
  }
}

function drawHUD(ctx, game) {
  ctx.fillStyle = '#3d2417'; ctx.fillRect(0, 0, W, 54);
  ctx.fillStyle = '#5b3a22'; ctx.fillRect(0, 50, W, 4);
  text(ctx, `💰 $${game.shift.coins}`, 84, 27, 24, '#ffd94d', 'center');
  text(ctx, `Target $${BALANCE.coinTarget}`, 252, 27, 19, '#ffe9b0', 'center', 'bold');
  // timer bar
  const frac = game.shift.timeLeft / BALANCE.shiftSeconds;
  rr(ctx, 400, 14, 380, 26, 13); ctx.fillStyle = '#241407'; ctx.fill();
  rr(ctx, 403, 17, 374 * frac, 20, 10); ctx.fillStyle = frac > 0.35 ? '#7ec850' : frac > 0.15 ? '#ffc93c' : '#e84a3c'; ctx.fill();
  text(ctx, `⏱ ${Math.ceil(game.shift.timeLeft)}s`, 590, 27, 18, '#ffffff');
  // strikes
  for (let i = 0; i < BALANCE.maxStrikes; i++) {
    text(ctx, i < game.shift.strikes ? '✖' : '♥', 852 + i * 34, 27, 24, i < game.shift.strikes ? '#e84a3c' : '#ff8a7a');
  }
  // combo
  if (game.shift.combo >= 2) text(ctx, `COMBO x${Math.min(BALANCE.comboMax, 1 + BALANCE.comboStep * (game.shift.combo - 1)).toFixed(2).replace(/\.?0+$/, '')}`, 1010, 27, 20, '#ffd94d');
  else text(ctx, `Served ${game.shift.servedCount}`, 1010, 27, 18, '#ffe9b0');
  text(ctx, game.sound.muted ? '🔇 M' : '🔊 M', 1164, 27, 19, '#ffe9b0');
  text(ctx, '⏸ P', 1232, 27, 19, '#ffe9b0');
}

function drawOrders(ctx, game, ui) {
  panel(ctx, 16, 60, 1248, 142, '#fff8ea');
  text(ctx, 'ORDER BOARD — click a customer to serve a matching plate!', 640, 76, 15, '#8a6a3f');
  game.shift.customers.forEach((c, i) => {
    const card = LAYOUT.orderCards[i];
    const ready = game.kitchen.plate.length > 0 && game.kitchen.plate.join() === c.dish.steps.join();
    rr(ctx, card.x, card.y + 14, card.w, card.h - 8, 12);
    ctx.fillStyle = ready ? '#dff5cf' : '#ffffff'; ctx.fill();
    ctx.lineWidth = ready ? 4 : 2; ctx.strokeStyle = ready ? '#4d9430' : '#d9c48f'; ctx.stroke();
    const mood = c.patienceFrac > 0.5 ? 1 : c.patienceFrac > 0.25 ? 0 : -1;
    drawFace(ctx, c.face, card.x + 52, card.y + 62, 34, mood);
    text(ctx, c.name, card.x + 52, card.y + 112, 14, '#5b3a22');
    text(ctx, c.dish.name, card.x + 104, card.y + 34, 19, '#3d2417', 'left');
    text(ctx, `$${c.dish.price}`, card.x + card.w - 14, card.y + 34, 18, '#b8860b', 'right');
    // dish steps as icons with done/next highlighting
    c.dish.steps.forEach((step, si) => {
      const ix = card.x + 116 + si * 52; const iy = card.y + 76;
      const done = game.kitchen.plate[si] === step && game.kitchen.plate.slice(0, si + 1).every((p, j) => p === c.dish.steps[j]);
      circle(ctx, ix, iy, 21, done ? '#bfe8a8' : '#f3e7cd');
      if (done) { ctx.strokeStyle = '#4d9430'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ix, iy, 21, 0, Math.PI * 2); ctx.stroke(); }
      drawIngredient(ctx, step, ix, iy, 30);
    });
    // patience bar
    const pw = card.w - 108;
    rr(ctx, card.x + 100, card.y + 108, pw, 10, 5); ctx.fillStyle = '#eadfc6'; ctx.fill();
    rr(ctx, card.x + 100, card.y + 108, pw * c.patienceFrac, 10, 5);
    ctx.fillStyle = c.patienceFrac > 0.5 ? '#7ec850' : c.patienceFrac > 0.25 ? '#ffc93c' : '#e84a3c'; ctx.fill();
    if (ready) text(ctx, '✔ READY — CLICK TO SERVE!', card.x + card.w / 2 + 40, card.y + 128 - 6, 13, '#4d9430');
    ui.addRegion(card.x, card.y + 14, card.w, card.h - 8, 'serve', c.id);
  });
  for (let i = game.shift.customers.length; i < 3; i++) {
    const card = LAYOUT.orderCards[i];
    rr(ctx, card.x, card.y + 14, card.w, card.h - 8, 12); ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fill();
    text(ctx, 'waiting for a customer…', card.x + card.w / 2, card.y + 74, 16, '#b39b72');
  }
}

function drawBins(ctx, game, ui) {
  text(ctx, 'INGREDIENT BINS — click a ready item to plate it · click a RAW item, then the grill, to cook it', 640, 220, 16, '#5b3a22');
  for (const bin of LAYOUT.bins) {
    const ing = INGREDIENTS[bin.id];
    const selected = game.kitchen.selectedRaw === bin.id;
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 10);
    ctx.fillStyle = selected ? '#ffe9a8' : ing.kind === 'raw' ? '#f6dfd2' : '#fdf6e3'; ctx.fill();
    ctx.lineWidth = selected ? 4 : 2; ctx.strokeStyle = selected ? '#e2711d' : '#c9a86a'; ctx.stroke();
    drawIngredient(ctx, bin.id, bin.x + 34, bin.y + 38, 44);
    text(ctx, ing.name, bin.x + 62, bin.y + 30, 15, '#3d2417', 'left');
    text(ctx, ing.kind === 'raw' ? 'RAW · grill it!' : 'ready', bin.x + 62, bin.y + 52, 12, ing.kind === 'raw' ? '#c0392b' : '#4d9430', 'left', 'bold');
    ui.addRegion(bin.x, bin.y, bin.w, bin.h, 'bin', bin.id);
  }
}

function drawGrill(ctx, game, ui) {
  panel(ctx, 16, 408, 428, 368, '#4a4a52');
  text(ctx, '🔥 GRILL & PAN — take food off in the GOLDEN window!', 230, 432, 16, '#ffd94d');
  game.kitchen.grill.forEach((slot, i) => {
    const s = LAYOUT.grillSlots[i];
    rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fillStyle = '#2c2c33'; ctx.fill();
    ctx.strokeStyle = '#17171c'; ctx.lineWidth = 3; ctx.stroke();
    // burner coils
    ctx.strokeStyle = 'rgba(255,120,60,0.5)'; ctx.lineWidth = 3;
    [14, 24].forEach((r) => { ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + s.h / 2, r, 0, Math.PI * 2); ctx.stroke(); });
    if (slot) {
      const phase = game.kitchen.slotPhase(i);
      const prog = game.kitchen.slotProgress(i);
      drawIngredient(ctx, slot.rawId, s.x + s.w / 2, s.y + s.h / 2 - 8, phase === 'burnt' ? 52 : 56);
      if (phase === 'burnt') text(ctx, '💨 BURNT!', s.x + s.w / 2, s.y + s.h - 16, 14, '#ff7a6b');
      // progress ring
      ctx.lineWidth = 6; ctx.strokeStyle = '#17171c';
      ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + s.h / 2 - 8, 40, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = phase === 'golden' ? '#7ec850' : phase === 'burnt' ? '#e84a3c' : '#ffc93c';
      ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + s.h / 2 - 8, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, prog)); ctx.stroke();
      if (phase === 'golden') text(ctx, '✔ GOLDEN!', s.x + s.w / 2, s.y + s.h - 16, 15, '#9fe870');
      else if (phase === 'cooking') text(ctx, 'cooking…', s.x + s.w / 2, s.y + s.h - 16, 13, '#ffe9b0');
    } else {
      text(ctx, game.kitchen.selectedRaw ? 'CLICK TO\nCOOK!' : 'empty', s.x + s.w / 2, s.y + s.h / 2, 14, '#9a9aa5');
    }
    ui.addRegion(s.x, s.y, s.w, s.h, 'grill', i);
  });
  text(ctx, game.kitchen.selectedRaw ? `Holding RAW ${INGREDIENTS[game.kitchen.selectedRaw].name} — click a grill slot!` : 'Tip: patty, chicken, batter, egg & bacon must be cooked first.', 230, 640, 14, '#ffe9b0');
  text(ctx, 'Too early = raw ✖ · Golden = perfect ✔ · Too late = burnt 💨', 230, 668, 13, '#cfc4ae');
  // decorative pans
  text(ctx, '🍳 🥘 🍔 🥗 🥞', 230, 724, 30, '#ffffff');
}

function drawPlate(ctx, game, ui) {
  panel(ctx, 452, 408, 376, 368, '#fff8ea');
  text(ctx, 'ASSEMBLY PLATE', 640, 432, 17, '#5b3a22');
  const p = LAYOUT.plate;
  // plate ellipse
  ctx.fillStyle = '#e8e2d4'; ctx.beginPath(); ctx.ellipse(640, 566, 168, 92, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fbf8f1'; ctx.beginPath(); ctx.ellipse(640, 560, 152, 82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9bfa8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(640, 560, 152, 82, 0, 0, Math.PI * 2); ctx.stroke();
  // stacked items bottom-up
  game.kitchen.plate.forEach((item, i) => {
    drawIngredient(ctx, item, 640 + (i % 2 ? 10 : -10), 606 - i * 17, 62);
  });
  if (game.kitchen.plate.length === 0) text(ctx, 'plate is empty', 640, 560, 16, '#b39b72');
  // next-needed hint from the best-matching order
  let hint = 'Build an order from the board above!';
  const target = game.shift.customers.find((c) => game.kitchen.plate.every((it, j) => c.dish.steps[j] === it));
  if (target) { const n = nextNeeded(target.dish, game.kitchen.plate); hint = n ? `For ${target.dish.name}: next → ${INGREDIENTS[n].name}` : `${target.dish.name} complete — click ${target.name} to serve!`; }
  else if (game.kitchen.plate.length) hint = 'This stack matches no order — trash it or undo.';
  text(ctx, hint, 640, 452 + 6, 14, '#8a6a3f');
  // buttons
  const tb = LAYOUT.trashBtn; const ub = LAYOUT.undoBtn;
  rr(ctx, tb.x, tb.y, tb.w, tb.h, 10); ctx.fillStyle = '#e84a3c'; ctx.fill();
  text(ctx, '🗑 TRASH (-$2)', tb.x + tb.w / 2, tb.y + tb.h / 2, 16, '#ffffff');
  ui.addRegion(tb.x, tb.y, tb.w, tb.h, 'trash');
  rr(ctx, ub.x, ub.y, ub.w, ub.h, 10); ctx.fillStyle = '#4aa3e8'; ctx.fill();
  text(ctx, '↩ UNDO ITEM', ub.x + ub.w / 2, ub.y + ub.h / 2, 16, '#ffffff');
  ui.addRegion(ub.x, ub.y, ub.w, ub.h, 'undo');
  void p;
}

function drawTray(ctx, game, ui) {
  panel(ctx, 844, 408, 420, 368, '#fdf6e3');
  text(ctx, 'HOLDING TRAY — click a cooked item to plate it', 1054, 432, 15, '#5b3a22');
  LAYOUT.traySlots.forEach((s, i) => {
    rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = '#d9c48f'; ctx.lineWidth = 2; ctx.stroke();
    const item = game.kitchen.tray[i];
    if (item) { drawIngredient(ctx, item, s.x + s.w / 2, s.y + s.h / 2 - 8, 46); text(ctx, INGREDIENTS[item].name, s.x + s.w / 2, s.y + s.h - 13, 11, '#5b3a22'); }
    else text(ctx, '·', s.x + s.w / 2, s.y + s.h / 2, 20, '#d9c48f');
    ui.addRegion(s.x, s.y, s.w, s.h, 'tray', i);
  });
  // message ribbon (font shrinks until the line fits the ribbon)
  rr(ctx, 862, 692, 384, 62, 10); ctx.fillStyle = '#3d2417'; ctx.fill();
  const msg = game.message || 'Welcome to the bistro!';
  let msgSize = 15;
  ctx.font = `bold ${msgSize}px 'Trebuchet MS', Verdana, sans-serif`;
  while (ctx.measureText(msg).width > 366 && msgSize > 10) {
    msgSize -= 1;
    ctx.font = `bold ${msgSize}px 'Trebuchet MS', Verdana, sans-serif`;
  }
  text(ctx, msg, 1054, 723, msgSize, '#ffe9b0');
}

// ---- overlays / screens ---------------------------------------------------------
function dim(ctx, alpha = 0.62) { ctx.fillStyle = `rgba(24,14,6,${alpha})`; ctx.fillRect(0, 0, W, H); }
function bigButton(ctx, ui, rect, label, fill, action) {
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 16); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#3d2417'; ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2, 28, '#ffffff');
  ui.addRegion(rect.x, rect.y, rect.w, rect.h, action);
}
function drawTitle(ctx, game, ui) {
  dim(ctx, 0.45);
  panel(ctx, 240, 92, 800, 616, '#fff8ea', '#5b3a22', 4);
  text(ctx, '🍔 DINE & DASH 🥞', 640, 148, 52, '#c0392b');
  text(ctx, 'B I S T R O', 640, 192, 26, '#b8860b');
  text(ctx, 'Cook fast. Serve faster. Keep every customer smiling!', 640, 232, 19, '#5b3a22', 'center', 'normal');
  // showcase dishes
  const demo = [['bun', 'patty', 'cheese'], ['pancake', 'berries', 'syrup'], ['egg', 'cheese', 'peppers']];
  demo.forEach((items, di) => {
    const cx = 400 + di * 240;
    ctx.fillStyle = '#fbf8f1'; ctx.beginPath(); ctx.ellipse(cx, 316, 86, 46, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9bfa8'; ctx.stroke();
    items.forEach((it, ii) => drawIngredient(ctx, it, cx, 330 - ii * 13, 52));
    text(ctx, ['Bistro Burger', 'Berry Pancakes', 'Cheese Omelette'][di], cx, 384, 15, '#5b3a22');
  });
  if (game.showHow) {
    const lines = [
      '1. Read the ORDER BOARD — each customer wants one dish, in order.',
      '2. Click READY bins to stack ingredients on the plate in recipe order.',
      '3. RAW food (patty, chicken, batter, egg, bacon): click it, then the',
      '    grill. Take it off in the GOLDEN window — raw or burnt is trash!',
      '4. Cooked food waits in the HOLDING TRAY — click it to plate it.',
      '5. Plate matches an order exactly? Click that customer to SERVE.',
      '    Fast serves earn tips and build your COMBO multiplier!',
      '6. Earn $220 before the 150s shift ends. 3 walk-outs = shift failed!',
      'Keys: P pause · M mute · Mouse: everything else.',
    ];
    rr(ctx, 300, 408, 680, 138, 10); ctx.fillStyle = '#fdf0d0'; ctx.fill();
    lines.forEach((l, i) => text(ctx, l, 316, 428 + i * 15.5, 13.5, '#3d2417', 'left', 'normal'));
  } else {
    text(ctx, 'Earn $220 in a 150-second shift · 3 angry walk-outs ends the day!', 640, 448, 17, '#3d2417');
    text(ctx, 'Grill patties, flip pancakes, stack burgers — in exact recipe order.', 640, 478, 16, '#8a6a3f', 'center', 'normal');
    text(ctx, 'Seed: ?seed=N makes a shift reproducible · Sound on for sizzles & dings 🔊', 640, 508, 14, '#8a6a3f', 'center', 'normal');
  }
  bigButton(ctx, ui, LAYOUT.startBtn, '▶  START THE SHIFT', '#4d9430', 'start');
  bigButton(ctx, ui, { ...LAYOUT.howBtn }, game.showHow ? 'HIDE HOW TO PLAY' : 'HOW TO PLAY', '#4aa3e8', 'how');
}
function drawPause(ctx, game, ui) {
  dim(ctx);
  panel(ctx, 390, 240, 500, 300, '#fff8ea');
  text(ctx, '⏸ PAUSED', 640, 310, 44, '#3d2417');
  text(ctx, 'The grill is holding its breath…', 640, 356, 17, '#8a6a3f', 'center', 'normal');
  bigButton(ctx, ui, { x: 465, y: 392, w: 350, h: 58 }, '▶  RESUME (P)', '#4d9430', 'resume');
  bigButton(ctx, ui, { x: 465, y: 462, w: 350, h: 58 }, '↻  RESTART SHIFT', '#e2711d', 'restart');
}
function drawEnd(ctx, game, ui) {
  dim(ctx, 0.55);
  const wonDay = game.screen === 'win';
  panel(ctx, 290, 130, 700, 480, '#fff8ea', '#5b3a22', 4);
  text(ctx, wonDay ? '🎉 SHIFT COMPLETE! 🎉' : '😖 SHIFT FAILED', 640, 196, 44, wonDay ? '#4d9430' : '#c0392b');
  text(ctx, wonDay ? 'The bistro hit its target — the crowd goes home happy!' : (game.shift.strikes >= BALANCE.maxStrikes ? 'Three customers stormed out. The boss is not pleased…' : 'Time ran out before the coin target was reached.'), 640, 244, 17, '#5b3a22', 'center', 'normal');
  // final plate showcase
  ['bun', 'patty', 'cheese', 'lettuce', 'tomato'].forEach((it, i) => drawIngredient(ctx, it, 640, 356 - i * 15, 64));
  text(ctx, `Coins earned: $${game.shift.coins}  /  Target $${BALANCE.coinTarget}`, 640, 428, 24, '#b8860b');
  text(ctx, `Dishes served: ${game.shift.servedCount} · Walk-outs: ${game.shift.strikes} · Best combo x${game.bestCombo}`, 640, 464, 18, '#3d2417');
  bigButton(ctx, ui, LAYOUT.restartBtn, '↻  PLAY ANOTHER SHIFT', '#4d9430', 'restart');
}

// ---- main entry ------------------------------------------------------------------
export function drawScene(ctx, game, ui) {
  ui.clearRegions();
  ctx.clearRect(0, 0, W, H);
  drawBackdrop(ctx);
  drawOrders(ctx, game, ui);
  drawBins(ctx, game, ui);
  drawGrill(ctx, game, ui);
  drawPlate(ctx, game, ui);
  drawTray(ctx, game, ui);
  drawHUD(ctx, game);
  // floating popups (+$ coins, COMBO!, etc.)
  for (const p of game.popups) {
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    text(ctx, p.text, p.x, p.y, p.size || 26, p.color);
    ctx.restore();
  }
  if (game.screen === 'title') drawTitle(ctx, game, ui);
  else if (game.screen === 'pause') drawPause(ctx, game, ui);
  else if (game.screen === 'win' || game.screen === 'lose') drawEnd(ctx, game, ui);
}
