// recipes.js — dish definitions plus the plate-matching rules.
// Pure logic (imports only config data), so Node tests can exercise it.

import { DISHES, INGREDIENTS } from './config.js';

export function dishById(id) { return DISHES.find((d) => d.id === id) || null; }
export function ingredientById(id) { return INGREDIENTS[id] || null; }

// The dishes available at a given shift second (difficulty ramp gate).
export function dishesAvailableAt(elapsedSeconds) {
  return DISHES.filter((d) => elapsedSeconds >= d.minTime);
}

// The next ingredient a plate still needs for a dish, or null when complete.
export function nextNeeded(dish, plate) {
  if (!dish || plate.length >= dish.steps.length) return null;
  return dish.steps[plate.length];
}

// True only when the plate is exactly the dish's sequence, in order.
export function plateMatchesDish(plate, dish) {
  if (!dish || plate.length !== dish.steps.length) return false;
  return dish.steps.every((step, i) => plate[i] === step);
}

// Which dish (if any) a plate exactly matches.
export function dishForPlate(plate, dishes = DISHES) {
  return dishes.find((d) => plateMatchesDish(plate, d)) || null;
}

// True when the plate is a correct prefix of the dish (still buildable).
export function plateIsPrefixOf(plate, dish) {
  if (!dish || plate.length > dish.steps.length) return false;
  return plate.every((item, i) => dish.steps[i] === item);
}

// Can this plate still become this dish? Used to hint the "needed next" icon.
export function plateCanBecome(plate, dish) { return plateIsPrefixOf(plate, dish); }

// If `item` were added, would the plate stay a valid prefix of the dish?
export function addingKeepsPrefix(plate, item, dish) {
  return plateIsPrefixOf([...plate, item], dish);
}

// Score a partial plate against a dish: matched prefix length.
export function prefixLength(plate, dish) {
  let n = 0;
  while (n < plate.length && n < dish.steps.length && plate[n] === dish.steps[n]) n += 1;
  return n;
}

// Human-readable recipe line, e.g. "Bun → Grilled Patty → Cheese".
export function recipeLabel(dish) {
  return dish.steps.map((s) => (INGREDIENTS[s] ? INGREDIENTS[s].name : s)).join(' → ');
}
