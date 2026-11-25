// Dine & Dash Bistro — hand-in program (Node 22, standard library only).
//
// What this does, in order:
//   1. Works out where the entry lives (this file's folder) and where the
//      output must go: MAKEFUN_OUTPUT_DIR when set, else /output.
//   2. Copies the playable game (game/) and the screenshots (screenshots/)
//      across, so the judge receives exactly the files in this repository.
//   3. Asks the vendored make.fun library to summarise the output as
//      dossier.json, passing the scorer's caps so a hand-in that the scorer
//      would refuse fails here first, loudly, instead of at grading time.
//
// Run it with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play it with: node serve.ts   (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const entryDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this bounty: the dossier text budget shapes the
// JSON bytes; the remaining caps only refuse oversized hand-ins.
const SCORER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(entryDir, 'game'), join(outputDir, 'game'));

const shotsDir = join(entryDir, 'screenshots');
if (existsSync(shotsDir)) {
  copyTree(shotsDir, join(outputDir, 'screenshots'));
} else {
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outputDir, SCORER_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Dine & Dash Bistro handed in to ${outputDir} (dossier: ${dossier.length} bytes)`);
