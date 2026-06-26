import { CONFIG } from '../core/config.js';

export class HUD {
  constructor(game) {
    this.game = game;
    this.el = {
      hud: document.getElementById('hud'),
      hpFill: document.getElementById('hp-fill'),
      hpLabel: document.getElementById('hp-label'),
      stamFill: document.getElementById('stam-fill'),
      stamLabel: document.getElementById('stam-label'),
      manaFill: document.getElementById('mana-fill'),
      manaLabel: document.getElementById('mana-label'),
      xpFill: document.getElementById('xp-fill'),
      xpLabel: document.getElementById('xp-label'),
      donutHpFill: document.getElementById('donut-hp-fill'),
      donutHpLabel: document.getElementById('donut-hp-label'),
      floorName: document.getElementById('floor-name'),
      floorSub: document.getElementById('floor-sub'),
      gold: document.getElementById('gold'),
      levelBadge: document.getElementById('level-badge'),
      abilityBar: document.getElementById('ability-bar'),
    };
    this._buildAbilities();
  }

  show() { this.el.hud.classList.remove('hidden'); }

  _buildAbilities() {
    this.el.abilityBar.innerHTML = `
      <div class="ability" data-ab="attack"><span class="key">J</span><span class="icon">🗡️</span><div class="cd hidden"></div></div>
      <div class="ability" data-ab="dodge"><span class="key">SPC</span><span class="icon">💨</span><div class="cd hidden"></div></div>
      <div class="ability" data-ab="donut"><span class="key">K</span><span class="icon">🐱</span><div class="cd hidden"></div></div>
    `;
  }

  _cd(ab, frac) {
    const el = this.el.abilityBar.querySelector(`[data-ab="${ab}"] .cd`);
    if (!el) return;
    if (frac <= 0) { el.classList.add('hidden'); }
    else { el.classList.remove('hidden'); el.textContent = frac.toFixed(1); }
  }

  update() {
    const game = this.game;
    const p = game.player;
    const d = game.donut;
    const s = p.stats;

    const set = (fill, label, cur, max, suffix = '') => {
      fill.style.width = `${Math.max(0, Math.min(100, (cur / max) * 100))}%`;
      label.textContent = `${Math.ceil(cur)} / ${Math.round(max)}${suffix}`;
    };
    set(this.el.hpFill, this.el.hpLabel, p.hp, s.maxHp);
    set(this.el.stamFill, this.el.stamLabel, p.stamina, s.maxStamina);
    set(this.el.manaFill, this.el.manaLabel, p.mana, s.maxMana);
    this.el.xpFill.style.width = `${Math.min(100, (p.xp / p.xpToNext) * 100)}%`;
    this.el.xpLabel.textContent = `XP ${Math.round(p.xp)} / ${p.xpToNext}`;

    if (d.downed) {
      this.el.donutHpFill.style.width = `0%`;
      this.el.donutHpLabel.textContent = `DOWNED (${Math.ceil(d.reviveTimer)}s)`;
    } else {
      set(this.el.donutHpFill, this.el.donutHpLabel, d.hp, d.maxHp);
    }

    this.el.gold.textContent = `⛀ ${p.gold} gold`;
    this.el.levelBadge.textContent = `LVL ${p.level}${p.statPoints > 0 ? ' ●' : ''}`;
    this.el.floorName.textContent = game.dungeon.def.name;
    this.el.floorSub.textContent = game.dungeon.def.subtitle;

    // ability cooldowns
    this._cd('dodge', p.dodgeCd);
    this._cd('donut', game.world ? game.world.donutSpecialCd : 0);
  }
}
