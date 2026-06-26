import { CONFIG } from './core/config.js';
import { RNG } from './core/rng.js';
import { Input } from './core/input.js';
import { Loop } from './core/loop.js';
import { clamp } from './core/util.js';

import { Player } from './systems/player.js';
import { Donut } from './systems/donut.js';
import { generateFloor, updateBossLock } from './systems/dungeon.js';
import { World } from './systems/combat.js';
import { rollItem, rollItemMinRarity, makeItemById, rollGold } from './systems/loot.js';
import { preferredSlot } from './systems/equipment.js';

import { Renderer } from './render/renderer.js';
import { HUD } from './ui/hud.js';
import { Menu } from './ui/menu.js';
import { Overlays } from './ui/overlays.js';

import { INTRO_PAGES, getFloorIntro, SYSTEM_BARKS } from './data/lore.js';
import { EVENTS } from './data/events-data.js';
import { rarityName } from './ui/format.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.input = new Input(this.canvas);
    this.renderer = new Renderer(this.canvas, this);
    this.hud = new HUD(this);
    this.menu = new Menu(this);
    this.overlays = new Overlays(this);

    this.paused = false;
    this.started = false;
    this.barkTimer = 0;

    this.loop = new Loop((dt) => this.update(dt), () => this.render());

    document.getElementById('start-btn').addEventListener('click', () => this.onStartPressed());
  }

  // ---------- lifecycle ----------
  onStartPressed() {
    document.getElementById('title-screen').classList.add('hidden');
    this.overlays.showStory(INTRO_PAGES, () => this.startRun(true));
  }

  startRun(firstTime = false) {
    this.seed = (Date.now() >>> 0);
    this.rng = new RNG(this.seed);
    this.run = { kills: 0, itemsFound: 0, donutMorale: 0, floor: 1, startTime: performance.now() };

    this.player = new Player();
    this.donut = new Donut(this.player);

    this.setupFloor(1);

    this.hud.show();
    this.hud.update();
    this.started = true;
    this.loop.start();

    // declutter: fade the controls hint after the player has had time to read it
    const hint = document.getElementById('controls-hint');
    if (hint) {
      hint.style.transition = 'opacity 1s';
      clearTimeout(this._hintTimer);
      hint.style.opacity = '1';
      this._hintTimer = setTimeout(() => { hint.style.opacity = '0'; }, 15000);
    }

    this.overlays.showStory([getFloorIntro(1)], () => { this.paused = false; });
    this.paused = true;
  }

  restart() {
    // reset state and go again from floor 1
    this.startRun(false);
  }

  setupFloor(floor) {
    this.run.floor = floor;
    this.dungeon = generateFloor(floor, this.rng);
    this.world = new World(this);
    this.world.enterRoom(this.dungeon.startId, null);
    this.hud.update();
  }

  descend() {
    const next = this.dungeon.floor + 1;
    this.setupFloor(next);
    this.overlays.showStory([getFloorIntro(next)], () => { this.paused = false; });
    this.paused = true;
  }

  // ---------- main loop ----------
  update(dt) {
    // global toggles first (work even while paused by menu)
    if (this.started && this.input.actionPressed('inventory') && !this.anyBlockingOverlay()) {
      this.menu.toggle();
    }
    if (this.input.actionPressed('escape') && this.menu.open) this.menu.close();

    if (this.started && !this.paused) {
      this.world.update(dt);

      // ambient System barks
      this.barkTimer -= dt;
      if (this.barkTimer <= 0) {
        this.barkTimer = 26 + this.rng.range(0, 18);
        if (this.world.enemies.length === 0) this.toast(this.rng.pick(SYSTEM_BARKS));
      }

      this.hud.update();
    }

    this.input.endFrame();
  }

  render() {
    this.renderer.render();
  }

  anyBlockingOverlay() {
    return [
      'levelup-screen', 'event-screen', 'floor-clear-screen', 'death-screen', 'story-screen', 'title-screen',
    ].some(id => !document.getElementById(id).classList.contains('hidden'));
  }

  // ---------- callbacks used by World ----------
  log(msg, kind) { this.overlays.log(msg, kind); }
  toast(msg, kind) { this.overlays.toast(msg, kind); }

  rollGoldFor(range) { return rollGold(this.rng, range, this.player.stats.goldFind); }

  dropLootAt(x, y, minTier = 0) {
    const lootLuck = this.player.stats.lootLuck;
    const item = minTier > 0
      ? rollItemMinRarity(this.rng, this.dungeon.floor, lootLuck, minTier)
      : rollItem(this.rng, this.dungeon.floor, lootLuck);
    this.world.drops.push({
      id: Math.random(), kind: 'item', x: x + this.rng.range(-12, 12), y: y + this.rng.range(-12, 12), r: 11, item,
    });
  }

  pickupItem(item) {
    this.run.itemsFound++;
    const slot = preferredSlot(item, this.player.equipment);
    if (slot && !this.player.equipment[slot]) {
      this.player.equip(item, slot);
      this.donut.recompute();
      this.log(`Equipped ${item.name} (${rarityName(item.rarity)})`, 'loot');
      this.toastLoot(item, 'Equipped');
    } else {
      this.player.addItem(item);
      this.log(`Looted ${item.name} (${rarityName(item.rarity)}) — sent to bag`, 'loot');
      this.toastLoot(item, 'Looted');
    }
    if (item.rarityTier >= 4) this.toast(`✨ The crowd ROARS for your ${rarityName(item.rarity)} find!`);
    this.hud.update();
    if (this.menu.open) this.menu.render();
  }

  toastLoot(item, verb) {
    const color = getComputedStyle(document.documentElement).getPropertyValue(`--r-${item.rarity}`).trim();
    const t = document.createElement('div');
    t.className = 'toast-item';
    t.style.borderLeftColor = color;
    t.innerHTML = `${verb}: <span style="color:${color}">${item.name}</span>`;
    const wrap = document.getElementById('toast');
    wrap.appendChild(t);
    while (wrap.children.length > 5) wrap.firstChild.remove();
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2200);
  }

  openChest(x, y) {
    const n = this.rng.int(1, 2);
    for (let i = 0; i < n; i++) this.dropLootAt(x + this.rng.range(-30, 30), y + this.rng.range(-20, 20), 1);
    this.world.drops.push({ id: Math.random(), kind: 'gold', x, y, r: 12, amount: this.rollGoldFor([10, 25]) });
    this.log('You crack open the chest!', 'loot');
  }

  onRoomEntered(room) {
    updateBossLock(this.dungeon);
    if (room.type === 'event' && !room.eventDone) {
      room.eventDone = true;
      // small delay so the room is visible first
      setTimeout(() => this.triggerEvent(() => {}), 350);
    }
    if (room.type === 'boss' && !room.cleared) {
      this.toast('⚠ The Floor Boss awakens. The galaxy holds its breath.');
    }
  }

  onRoomCleared(room) {
    updateBossLock(this.dungeon);
    if (room.type === 'neighborhood') {
      this.toast('★ Neighborhood Boss defeated!');
      const unlocked = updateBossLock(this.dungeon);
      if (unlocked) this.toast('The path to the FLOOR BOSS is now open.');
    } else if (room.type === 'boss') {
      this.onFloorBossDefeated();
    } else if (room.type === 'combat') {
      this.log('Room cleared. Doors unlocked.', 'system');
    }
  }

  onBossKilled(e) {
    this.run.kills++;
  }

  onLevelUp(levels) {
    this.donut.recompute();
    this.overlays.showLevelup(levels);
  }

  onFloorBossDefeated() {
    const floor = this.dungeon.floor;
    const summary = `
      <p>You slew <b>${this.dungeon.def.name}</b>'s floor boss. The audience is on its feet. Sponsors are calling.</p>
      <div style="margin-top:12px;display:flex;gap:18px;justify-content:center;color:#ffd54f">
        <div>Level ${this.player.level}</div>
        <div>${this.player.gold} gold</div>
        <div>${this.run.itemsFound} items found</div>
      </div>
      <p style="margin-top:12px;color:#9a9ab0">The stairs to Floor ${floor + 1} grind open. It will be harder down there.</p>`;
    this.overlays.showFloorClear(floor, summary);
  }

  onPlayerDeath() {
    if (this.deadHandled) return;
    this.deadHandled = true;
    setTimeout(() => { this.deadHandled = false; }, 100);
    const t = ((performance.now() - this.run.startTime) / 1000).toFixed(0);
    const summary = `
      <p>Carl has died on Floor ${this.dungeon.floor}. Somewhere, trillions of viewers groan in disappointment. Princess Donut is already auditioning a replacement.</p>
      <div style="margin-top:12px;color:#ffd54f">Reached Level ${this.player.level} · ${this.player.gold} gold · ${this.run.itemsFound} items · ${t}s survived</div>
      <p style="margin-top:10px;color:#9a9ab0">Tip: lean into a synergy. Raw stats won't carry you down the dark.</p>`;
    this.overlays.showDeath(summary);
  }

  // ---------- whacky events ----------
  triggerEvent(onResolved) {
    const event = this.rng.pick(EVENTS);
    const ctx = {
      player: this.player,
      run: this.run,
      rng: this.rng,
      onResolved,
      helpers: {
        heal: (n) => { this.player.hp = clamp(this.player.hp + n, 0, this.player.stats.maxHp); },
        damage: (n) => {
          this.player.hp -= n;
          if (this.player.hp <= 0) { this.player.hp = 0; this.onPlayerDeath(); }
        },
        addGold: (n) => { this.player.gold = Math.max(0, this.player.gold + n); },
        grantItem: (templateId) => {
          const item = templateId
            ? makeItemById(templateId, this.rng, this.dungeon.floor)
            : rollItem(this.rng, this.dungeon.floor, this.player.stats.lootLuck);
          this.pickupItem(item);
        },
        addStatPoint: (n) => { this.player.statPoints += n; },
        buffAttr: (key, n) => { this.player.baseAttr[key] += n; this.player.recompute(); this.donut.recompute(); },
        addMaxHpPenalty: (n) => { this.player.maxHpPenalty += n; this.player.recompute(); this.player.hp = Math.min(this.player.hp, this.player.stats.maxHp); },
        toast: (m) => this.toast(m),
        log: (m, k) => this.log(m, k),
      },
    };
    this.overlays.showEvent(event, ctx);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__game = new Game();
});
