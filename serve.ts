// Dine & Dash Bistro — local development server (Node 22, stdlib only).
//
// Serves the game/ folder on http://localhost:8080 so the bistro can be
// played in a desktop browser with no build step and no network access.
// Usage: node serve.ts [--port 8080]
// It is deliberately boring: correct MIME types for the file kinds a
// browser game ships, no caching, and a hard refusal of any path that
// tries to climb out of game/.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = resolve(fileURLToPath(new URL('./game', import.meta.url)));

const argv = process.argv.slice(2);
const portFlagAt = argv.indexOf('--port');
const wanted = portFlagAt === -1 ? 8080 : Number(argv[portFlagAt + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';

  const filePath = resolve(join(gameRoot, normalize(pathname)));
  const insideGame = filePath === gameRoot || filePath.startsWith(gameRoot + sep);
  if (!insideGame) {
    res.writeHead(403).end('forbidden');
    return;
  }

  let size: number;
  try {
    const info = statSync(filePath);
    if (!info.isFile()) throw new Error('directory, not a file');
    size = info.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }

  res.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Dine & Dash Bistro is serving game/ at http://localhost:${port}`);
});
