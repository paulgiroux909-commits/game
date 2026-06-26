// Fixed-timestep game loop with capped frame delta.
export class Loop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.last = 0;
    this.acc = 0;
    this.step = 1 / 60;
    this.running = false;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._tick);
  }

  stop() { this.running = false; }

  _tick(now) {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25; // avoid spiral of death after tab switch
    this.acc += dt;
    let steps = 0;
    while (this.acc >= this.step && steps < 5) {
      this.update(this.step);
      this.acc -= this.step;
      steps++;
    }
    this.render();
    requestAnimationFrame(this._tick);
  }
}
