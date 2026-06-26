import { ATTRIBUTES } from '../data/stats.js';
import { INTRO_PAGES } from '../data/lore.js';

export class Overlays {
  constructor(game) {
    this.game = game;
    this.logEl = document.getElementById('log');
    this.toastEl = document.getElementById('toast');

    // level up
    this.levelupScreen = document.getElementById('levelup-screen');
    this.levelupStats = document.getElementById('levelup-stats');
    this.levelupPoints = document.getElementById('levelup-points');
    document.getElementById('levelup-done').addEventListener('click', () => this.closeLevelup());

    // event
    this.eventScreen = document.getElementById('event-screen');

    // floor clear
    this.fcScreen = document.getElementById('floor-clear-screen');
    document.getElementById('fc-next').addEventListener('click', () => {
      this.fcScreen.classList.add('hidden');
      this.game.descend();
    });

    // death
    this.deathScreen = document.getElementById('death-screen');
    document.getElementById('death-restart').addEventListener('click', () => {
      this.deathScreen.classList.add('hidden');
      this.game.restart();
    });

    // story
    this.storyScreen = document.getElementById('story-screen');
    this.storyText = document.getElementById('story-text');
    this.storyNext = document.getElementById('story-next');
  }

  // ---------- message log ----------
  log(msg, kind = '') {
    const line = document.createElement('div');
    line.className = `log-line ${kind}`;
    line.textContent = msg;
    this.logEl.prepend(line);
    while (this.logEl.children.length > 7) this.logEl.lastChild.remove();
  }

  toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = `toast-item ${kind}`;
    t.textContent = msg;
    this.toastEl.appendChild(t);
    while (this.toastEl.children.length > 5) this.toastEl.firstChild.remove();
    setTimeout(() => {
      t.style.transition = 'opacity 0.4s';
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 400);
    }, 2200);
  }

  // ---------- story crawl ----------
  showStory(pages, onDone) {
    let i = 0;
    const render = () => { this.storyText.textContent = pages[i]; };
    this.storyScreen.classList.remove('hidden');
    render();
    const handler = () => {
      i++;
      if (i >= pages.length) {
        this.storyScreen.classList.add('hidden');
        this.storyNext.removeEventListener('click', handler);
        onDone?.();
      } else render();
    };
    this.storyNext.removeEventListener('click', this._storyHandler || (() => {}));
    this._storyHandler = handler;
    this.storyNext.addEventListener('click', handler);
  }

  // ---------- level up ----------
  showLevelup(levels) {
    this.game.paused = true;
    this.levelupScreen.classList.remove('hidden');
    document.getElementById('levelup-sub').textContent =
      `Carl reached level ${this.game.player.level}! Allocate stat points to survive what's coming.`;
    this.renderLevelup();
  }

  renderLevelup() {
    const p = this.game.player;
    this.levelupPoints.textContent = `Stat Points Remaining: ${p.statPoints}`;
    this.levelupStats.innerHTML = ATTRIBUTES.map(a => `
      <div class="lvl-stat">
        <span>${a.icon} <b>${a.abbr}</b> <span style="color:#9a9ab0">${a.name}</span></span>
        <span><b>${p.baseAttr[a.key]}</b> <button class="plus" data-attr="${a.key}" ${p.statPoints <= 0 ? 'disabled' : ''}>+</button></span>
      </div>`).join('');
    this.levelupStats.querySelectorAll('.plus').forEach(btn => {
      btn.addEventListener('click', () => {
        if (p.spendStatPoint(btn.dataset.attr)) {
          this.game.donut.recompute();
          this.renderLevelup();
          this.game.hud.update();
        }
      });
    });
  }

  closeLevelup() {
    this.levelupScreen.classList.add('hidden');
    this.game.paused = false;
  }

  // ---------- whacky event ----------
  showEvent(event, ctx) {
    this.game.paused = true;
    this.eventScreen.classList.remove('hidden');
    document.getElementById('event-icon').textContent = event.icon || '❗';
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-body').textContent = event.body;
    const choicesEl = document.getElementById('event-choices');
    choicesEl.innerHTML = '';
    event.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'event-choice';
      btn.innerHTML = `${choice.text}<span class="ec-hint">${choice.hint || ''}</span>`;
      btn.addEventListener('click', () => {
        try { choice.apply(ctx); } catch (e) { console.error(e); }
        this.eventScreen.classList.add('hidden');
        this.game.paused = false;
        this.game.hud.update();
        ctx.onResolved?.();
      });
      choicesEl.appendChild(btn);
    });
  }

  // ---------- floor clear ----------
  showFloorClear(floor, summaryHtml) {
    this.game.paused = true;
    this.fcScreen.classList.remove('hidden');
    document.getElementById('fc-title').textContent = `FLOOR ${floor} CLEARED!`;
    document.getElementById('fc-body').innerHTML = summaryHtml;
  }

  // ---------- death ----------
  showDeath(summaryHtml) {
    this.game.paused = true;
    this.deathScreen.classList.remove('hidden');
    document.getElementById('death-body').innerHTML = summaryHtml;
  }
}
