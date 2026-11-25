// config.js — every balance number and content table for Dine & Dash Bistro.
// Pure data: no DOM, no canvas, safe to import from Node tests.

// Canvas design size (CSS pixels). The page scales the canvas to fit.
export const VIEW = { width: 1280, height: 800 };

// Shift balance.
export const BALANCE = {
  shiftSeconds: 150,        // one day shift
  coinTarget: 220,          // dollars needed to win the day
  maxStrikes: 3,             // angry walk-outs before the shift fails
  maxOrders: 3,              // order board slots
  wrongIngredientPenalty: 2, // dollars lost when trashing a wrong plate item
  burntPenalty: 1,           // dollars lost when a burnt item is trashed
  baseTipMax: 8,             // tip at full patience
  comboStep: 0.25,           // +25% per combo level
  comboMax: 3,               // combo multiplier cap (x3)
  comboWindowSeconds: 14,    // serve again within this to keep the combo
  spawnFirstDelay: 0.4,      // seconds before the first customer
  spawnIntervalEarly: 5.5,   // seconds between arrivals early in the shift
  spawnIntervalLate: 3.2,    // ... and late in the shift
};

// Ingredient catalogue. `kind`: 'ready' goes straight to the plate,
// 'raw' must be cooked first and becomes `cookedId` in the holding tray.
// `cookSeconds` is the time to reach the START of the golden window's end:
// golden window is [goldenFrom, goldenTo] as fractions of cookSeconds.
export const INGREDIENTS = {
  bun:      { id: 'bun',      name: 'Bun',      kind: 'ready', color: '#e8b04b', dark: '#b97e26' },
  pattyRaw: { id: 'pattyRaw', name: 'Patty',    kind: 'raw', cookedId: 'patty', cookSeconds: 5.0, color: '#a05a3a', dark: '#6f3a22' },
  patty:    { id: 'patty',    name: 'Grilled Patty', kind: 'cooked', color: '#7a4326', dark: '#4e2a15' },
  cheese:   { id: 'cheese',   name: 'Cheese',   kind: 'ready', color: '#ffc93c', dark: '#d99a12' },
  lettuce:  { id: 'lettuce',  name: 'Lettuce',  kind: 'ready', color: '#7ec850', dark: '#4d9430' },
  tomato:   { id: 'tomato',   name: 'Tomato',   kind: 'ready', color: '#e84a3c', dark: '#b02a1e' },
  cucumber: { id: 'cucumber', name: 'Cucumber', kind: 'ready', color: '#3fae6a', dark: '#257a46' },
  dressing: { id: 'dressing', name: 'Dressing', kind: 'ready', color: '#fdf3d8', dark: '#d9c48f' },
  batterRaw:{ id: 'batterRaw',name: 'Batter',   kind: 'raw', cookedId: 'pancake', cookSeconds: 4.2, color: '#f5d98b', dark: '#d4af4e' },
  pancake:  { id: 'pancake',  name: 'Pancakes', kind: 'cooked', color: '#eebd63', dark: '#c08f2e' },
  berries:  { id: 'berries',  name: 'Berries',  kind: 'ready', color: '#7a4fd0', dark: '#4e2c96' },
  syrup:    { id: 'syrup',    name: 'Syrup',    kind: 'ready', color: '#b06a1e', dark: '#7d470d' },
  eggRaw:   { id: 'eggRaw',   name: 'Egg',      kind: 'raw', cookedId: 'egg', cookSeconds: 3.6, color: '#fff6da', dark: '#e8c93c' },
  egg:      { id: 'egg',      name: 'Fried Egg', kind: 'cooked', color: '#ffffff', dark: '#f2b705' },
  peppers:  { id: 'peppers',  name: 'Peppers',  kind: 'ready', color: '#e2711d', dark: '#a34c0e' },
  toast:    { id: 'toast',    name: 'Toast',    kind: 'ready', color: '#eec27f', dark: '#bd8c44' },
  chickenRaw:{ id: 'chickenRaw', name: 'Chicken', kind: 'raw', cookedId: 'chicken', cookSeconds: 5.6, color: '#f2b8a0', dark: '#cf7f5e' },
  chicken:  { id: 'chicken',  name: 'Grilled Chicken', kind: 'cooked', color: '#d98d5f', dark: '#9c5a33' },
  baconRaw: { id: 'baconRaw', name: 'Bacon',    kind: 'raw', cookedId: 'bacon', cookSeconds: 4.6, color: '#e88a8a', dark: '#b84a4a' },
  bacon:    { id: 'bacon',    name: 'Crispy Bacon', kind: 'cooked', color: '#c05252', dark: '#7e2c2c' },
};

// Golden cooking window, as fractions of an ingredient's cookSeconds.
export const COOK_WINDOW = { goldenFrom: 0.65, goldenTo: 1.25 };

// The bins the player clicks, in display order (raw + ready items).
export const BIN_ORDER = [
  'bun', 'pattyRaw', 'cheese', 'lettuce', 'tomato',
  'cucumber', 'dressing', 'batterRaw', 'berries', 'syrup',
  'eggRaw', 'peppers', 'toast', 'chickenRaw', 'baconRaw',
];

// Dish catalogue: ordered ingredient sequences (cooked ids for cooked food).
// `price` is the base coin reward; `minTime` is the earliest shift second the
// dish can be ordered (difficulty ramp); `patience` is seconds at shift start.
export const DISHES = [
  { id: 'salad',    name: 'Garden Salad',  price: 26, minTime: 0,  patience: 62,
    steps: ['lettuce', 'tomato', 'cucumber', 'dressing'] },
  { id: 'pancakes', name: 'Berry Pancakes', price: 30, minTime: 0, patience: 64,
    steps: ['pancake', 'berries', 'syrup'] },
  { id: 'omelette', name: 'Cheese Omelette', price: 32, minTime: 8, patience: 60,
    steps: ['egg', 'cheese', 'peppers'] },
  { id: 'burger',   name: 'Bistro Burger', price: 44, minTime: 18, patience: 66,
    steps: ['bun', 'patty', 'cheese', 'lettuce', 'tomato'] },
  { id: 'club',     name: 'Club Sandwich', price: 48, minTime: 45, patience: 68,
    steps: ['toast', 'chicken', 'bacon', 'lettuce', 'tomato'] },
];

// Customer face variety (all drawn in code).
export const FACES = [
  { skin: '#f6c89f', hair: '#4a2f1d', style: 'cap' },
  { skin: '#c68863', hair: '#191919', style: 'bun' },
  { skin: '#ffe0bd', hair: '#c94f30', style: 'spiky' },
  { skin: '#8d5a3b', hair: '#2b2b2b', style: 'flat' },
  { skin: '#f6c89f', hair: '#e8c93c', style: 'bun' },
  { skin: '#ffe0bd', hair: '#5b3a8e', style: 'spiky' },
  { skin: '#c68863', hair: '#7a7a7a', style: 'cap' },
  { skin: '#8d5a3b', hair: '#e2711d', style: 'flat' },
];
export const NAMES = ['Mia', 'Leo', 'Sofia', 'Noah', 'Ava', 'Eli', 'Luna', 'Omar', 'Ivy', 'Hugo', 'Nina', 'Sam'];
