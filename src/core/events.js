// Tiny event bus for decoupling systems and UI.
class EventBus {
  constructor() {
    this.handlers = new Map();
  }
  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(fn);
    return () => this.off(type, fn);
  }
  off(type, fn) {
    this.handlers.get(type)?.delete(fn);
  }
  emit(type, payload) {
    const hs = this.handlers.get(type);
    if (hs) for (const fn of [...hs]) fn(payload);
  }
}

export const bus = new EventBus();
