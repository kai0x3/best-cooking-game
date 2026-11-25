[![Competition](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/kai0x3/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/kai0x3/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Dine & Dash Bistro

A fast, family-friendly 2D canvas cooking game for the make.fun bounty
[Best Cooking Game](https://make.fun/bounty/best-cooking-game-20261125-0137).
Every picture is drawn in code — there are no image or audio assets at all.

Run a bistro kitchen through a 150-second lunch rush. Customers arrive at
the order board, each wanting one dish built from an exact ingredient
sequence: a Garden Salad, Berry Pancakes, a Cheese Omelette, a Bistro
Burger or a Club Sandwich. Stack ready ingredients straight onto the
assembly plate, but raw food — patties, chicken, batter, eggs and bacon —
must first go on the grill. Take it off in the **golden window**: too
early and it is raw inside, too late and it burns. Cooked food waits in
the holding tray until you plate it. When a plate matches an order
exactly, click that customer to serve: you earn the dish price plus a
tip based on their remaining patience, and quick consecutive serves
build a combo multiplier up to x3. Earn **$220** before the shift timer
runs out — but three customers whose patience empties will walk out
angry, and three walk-outs fail the shift. Orders grow longer and
patience shorter as the shift heats up.

## Controls

- **Mouse (click)** — everything: pick ingredient bins, load the grill,
  collect cooked food, plate from the holding tray, serve customers,
  trash or undo a plate.
- **P** or **Esc** — pause / resume.
- **M** — mute / unmute the WebAudio synth sounds (clicks, sizzles,
  golden dings, coin arpeggios, walk-out tones).
- **Enter** — start from the title screen.

Add `?seed=N` to the URL for a reproducible shift (seeded mulberry32
RNG). Screenshot scenes are staged with `?shot=start|play|serve|end&seed=1`.

## How to run

```sh
node serve.ts            # serves game/ at http://localhost:8080
```

No build step, no dependencies — Node 22 and a desktop browser are all
you need. To produce the hand-in output:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

- `screenshots/1-cover.jpg` — title screen over the busy bistro (`?shot=start&seed=1`)
- `screenshots/2-assembly.jpg` — mid-shift: orders up, a burger half-built, the grill cooking (`?shot=play&seed=1`)
- `screenshots/3-serve.jpg` — a completed burger being served, coins and combo popups flying (`?shot=serve&seed=1`)
- `screenshots/4-end.jpg` — the win screen with the final takings (`?shot=end&seed=1`)

## Source layout

- `game/src/config.js` — dishes, ingredients and every balance number
- `game/src/random.js` — seeded mulberry32 RNG
- `game/src/recipes.js` — dish definitions and plate-matching rules
- `game/src/kitchen.js` — grill/pan cooking state, holding tray, plate
- `game/src/customers.js` — order generation, patience, serving, strikes
- `game/src/audio.js` — WebAudio synth sound effects
- `game/src/input.js` — pointer and keyboard input with hit regions
- `game/src/render.js` — all canvas drawing (kitchen, faces, food icons, HUD, screens)
- `game/src/shots.js` — the deterministic `?shot=` screenshot staging
- `game/src/main.js` — game loop and screen state machine
- `test-logic.mjs` — Node tests for the cooking, matching and serving rules
