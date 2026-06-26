import { KEYBIND } from './config.js';

// Centralized keyboard + mouse input.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();   // edge-triggered (consumed each frame)
    this.mouse = { x: 0, y: 0, down: false, clicked: false };
    this.enabled = true;

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      // prevent tab from leaving canvas / space scrolling
      if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
      }
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    canvas.addEventListener('mousemove', (e) => this._setMouse(e));
    canvas.addEventListener('mousedown', (e) => {
      this._setMouse(e);
      this.mouse.down = true;
      this.mouse.clicked = true;
    });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });

    // touch as movement+attack fallback
    canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      this._setMouseTouch(t);
      this.mouse.down = true;
      this.mouse.clicked = true;
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      this._setMouseTouch(e.touches[0]);
    }, { passive: true });
    canvas.addEventListener('touchend', () => { this.mouse.down = false; });
  }

  _setMouse(e) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * this.canvas.width;
    this.mouse.y = ((e.clientY - r.top) / r.height) * this.canvas.height;
  }
  _setMouseTouch(t) {
    if (!t) return;
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((t.clientX - r.left) / r.width) * this.canvas.width;
    this.mouse.y = ((t.clientY - r.top) / r.height) * this.canvas.height;
  }

  _anyDown(list) {
    for (const k of list) if (this.keys.has(k)) return true;
    return false;
  }
  _anyPressed(list) {
    for (const k of list) if (this.pressed.has(k)) return true;
    return false;
  }

  // axis input -1..1
  get moveX() {
    return (this._anyDown(KEYBIND.right) ? 1 : 0) - (this._anyDown(KEYBIND.left) ? 1 : 0);
  }
  get moveY() {
    return (this._anyDown(KEYBIND.down) ? 1 : 0) - (this._anyDown(KEYBIND.up) ? 1 : 0);
  }

  action(name) { return this._anyDown(KEYBIND[name]); }
  actionPressed(name) { return this._anyPressed(KEYBIND[name]); }

  // call at end of each frame
  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
