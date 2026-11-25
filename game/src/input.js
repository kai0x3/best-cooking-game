// input.js — pointer + keyboard wiring. Hit regions are rectangles the
// game registers each frame; a click resolves to the topmost region hit.

export class Input {
  constructor(canvas, handlers) {
    this.canvas = canvas;
    this.handlers = handlers; // { onTap(x,y), onKey(key) }
    this.regions = [];        // {x,y,w,h,action,data}
    canvas.addEventListener('pointerdown', (ev) => {
      const p = this.toGame(ev);
      handlers.onTap(p.x, p.y);
    });
    window.addEventListener('keydown', (ev) => {
      handlers.onKey(ev.key);
    });
  }
  toGame(ev) {
    const r = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / r.width;
    const sy = this.canvas.height / r.height;
    return { x: (ev.clientX - r.left) * sx, y: (ev.clientY - r.top) * sy };
  }
  clearRegions() { this.regions = []; }
  addRegion(x, y, w, h, action, data = null) {
    this.regions.push({ x, y, w, h, action, data });
  }
  // Topmost (last registered) region containing the point, or null.
  hit(x, y) {
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const r = this.regions[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
    }
    return null;
  }
}
