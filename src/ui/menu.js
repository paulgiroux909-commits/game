import { EQUIP_SLOTS, slotsForItem, preferredSlot } from '../systems/equipment.js';
import { ATTRIBUTES } from '../data/stats.js';
import { SYNERGIES } from '../data/synergies.js';
import { itemTooltipHTML, fmtStat, rarityClass, rarityBorderClass, rarityName, STAT_LABELS } from './format.js';

export class Menu {
  constructor(game) {
    this.game = game;
    this.screen = document.getElementById('menu-screen');
    this.tooltip = document.getElementById('item-tooltip');
    this.activeTab = 'equip';
    this.open = false;

    this.panels = {
      equip: document.getElementById('tab-equip'),
      bag: document.getElementById('tab-bag'),
      char: document.getElementById('tab-char'),
      synergy: document.getElementById('tab-synergy'),
    };

    document.querySelectorAll('.menu-tabs .tab').forEach(btn => {
      btn.addEventListener('click', () => this.setTab(btn.dataset.tab));
    });
    document.getElementById('menu-close').addEventListener('click', () => this.close());
    this.screen.addEventListener('mousemove', (e) => this._moveTooltip(e));
  }

  toggle() { this.open ? this.close() : this.openMenu(); }

  openMenu() {
    this.open = true;
    this.game.paused = true;
    this.screen.classList.remove('hidden');
    this.render();
  }

  close() {
    this.open = false;
    this.game.paused = false;
    this.screen.classList.add('hidden');
    this._hideTooltip();
  }

  setTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.menu-tabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    Object.entries(this.panels).forEach(([k, el]) => el.classList.toggle('active', k === tab));
    this.render();
  }

  render() {
    if (!this.open) return;
    this.renderEquip();
    this.renderBag();
    this.renderChar();
    this.renderSynergy();
  }

  // ---------- Equipment tab ----------
  renderEquip() {
    const p = this.game.player;
    const slotsHtml = EQUIP_SLOTS.map(s => {
      const it = p.equipment[s.key];
      if (it) {
        return `<div class="slot ${rarityBorderClass(it.rarity)}" data-slot="${s.key}" style="border-left:4px solid ${this._rc(it.rarity)}">
          <div class="slot-name">${s.name}</div>
          <div class="slot-item ${rarityClass(it.rarity)}">${it.name}</div>
        </div>`;
      }
      return `<div class="slot empty" data-slot="${s.key}">
        <div class="slot-name">${s.name}</div>
        <div class="slot-item">— empty —</div>
      </div>`;
    }).join('');

    this.panels.equip.innerHTML = `
      <div class="equip-grid">
        <div>
          <h3 style="margin-bottom:8px">Equipment</h3>
          <div class="slots">${slotsHtml}</div>
          <p style="color:#9a9ab0;font-size:12px;margin-top:10px">Click a slot to unequip. Click an inventory item to equip it.</p>
        </div>
        <div>
          <h3 style="margin-bottom:8px">Combat Summary</h3>
          ${this._charSummaryHtml()}
        </div>
      </div>`;

    this.panels.equip.querySelectorAll('.slot').forEach(el => {
      const key = el.dataset.slot;
      el.addEventListener('click', () => { p.unequip(key); this._afterChange(); });
      el.addEventListener('mouseenter', (e) => {
        const it = p.equipment[key];
        if (it) this._showTooltip(itemTooltipHTML(it), e);
      });
      el.addEventListener('mouseleave', () => this._hideTooltip());
    });
  }

  _charSummaryHtml() {
    const s = this.game.player.stats;
    const rows = [
      ['Max HP', Math.round(s.maxHp)],
      ['Melee Damage', Math.round(s.meleeDamage)],
      ['Spell Power', Math.round(s.spellPower)],
      ['Armor', Math.round(s.armor)],
      ['Crit Chance', `${(s.critChance * 100).toFixed(0)}%`],
      ['Crit Mult', `${s.critMult.toFixed(2)}x`],
      ['Dodge', `${(s.dodgeChance * 100).toFixed(0)}%`],
      ['Move Speed', `${Math.round(s.moveSpeed * 100)}%`],
      ['Attack Speed', `${Math.round(s.attackSpeed * 100)}%`],
      ['Lifesteal', `${(s.lifesteal * 100).toFixed(0)}%`],
      ['Thorns', Math.round(s.thorns)],
      ['Loot Luck', s.lootLuck.toFixed(1)],
      ['Gold Find', `${Math.round(s.goldFind * 100)}%`],
    ];
    return `<div class="char-summary">${rows.map(r => `<div class="stat-row"><span>${r[0]}</span><span class="sv">${r[1]}</span></div>`).join('')}</div>`;
  }

  // ---------- Inventory tab ----------
  renderBag() {
    const p = this.game.player;
    if (p.inventory.length === 0) {
      this.panels.bag.innerHTML = `<p class="empty-note">Your bag is empty. Kill things. Take their stuff.</p>`;
      return;
    }
    // sort by rarity desc then slot
    const items = [...p.inventory].sort((a, b) => b.rarityTier - a.rarityTier);
    const html = items.map(it => `
      <div class="bag-item ${rarityBorderClass(it.rarity)}" data-uid="${it.uid}" style="border-left-color:${this._rc(it.rarity)}">
        <div class="bi-name ${rarityClass(it.rarity)}">${it.name}</div>
        <div class="bi-slot">${it.slot}</div>
        <div class="bi-rarity ${rarityClass(it.rarity)}">${rarityName(it.rarity)}</div>
      </div>`).join('');
    this.panels.bag.innerHTML = `
      <div style="margin-bottom:10px;color:#9a9ab0;font-size:12px">Click an item to equip. Right-click to drop. (${p.inventory.length} items)</div>
      <div class="bag-grid">${html}</div>`;

    this.panels.bag.querySelectorAll('.bag-item').forEach(el => {
      const it = p.inventory.find(i => i.uid === el.dataset.uid);
      el.addEventListener('click', () => {
        const slot = preferredSlot(it, p.equipment);
        if (slot) { p.equip(it, slot); this._afterChange(); }
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        p.dropFromBag(it); this._afterChange();
        this.game.toast(`Dropped ${it.name}.`);
      });
      el.addEventListener('mouseenter', (e) => this._showTooltip(itemTooltipHTML(it), e));
      el.addEventListener('mouseleave', () => this._hideTooltip());
    });
  }

  // ---------- Character tab ----------
  renderChar() {
    const p = this.game.player;
    const attrRows = ATTRIBUTES.map(a => {
      const base = p.baseAttr[a.key];
      const total = p.attr[a.key];
      const bonus = total - base;
      const plus = p.statPoints > 0
        ? `<button class="plus" data-attr="${a.key}">+</button>` : '';
      return `<div class="lvl-stat">
        <span>${a.icon} <b>${a.name}</b> <span style="color:#9a9ab0">(${a.abbr})</span></span>
        <span>${total}${bonus > 0 ? ` <span class="stat-bonus">(${base}+${bonus})</span>` : ''} ${plus}</span>
      </div>`;
    }).join('');

    this.panels.char.innerHTML = `
      <h3>CARL — Level ${p.level} Primal</h3>
      <p style="color:#9a9ab0;font-size:12px;margin:4px 0 12px">
        ${p.statPoints > 0 ? `<b style="color:#ff7043">${p.statPoints} stat point(s) to spend!</b>` : 'No unspent stat points.'}
        &nbsp;·&nbsp; Gold: <span style="color:#ffd54f">${p.gold}</span>
      </p>
      <div id="char-attrs" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${attrRows}</div>
      <div style="margin-top:16px">
        ${ATTRIBUTES.map(a => `<div style="font-size:12px;color:#9a9ab0;margin:3px 0">${a.icon} <b>${a.abbr}</b> — ${a.desc}</div>`).join('')}
      </div>`;

    this.panels.char.querySelectorAll('.plus').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.game.player.spendStatPoint(btn.dataset.attr)) {
          this.game.donut.recompute();
          this._afterChange();
        }
      });
    });
  }

  // ---------- Synergy tab ----------
  renderSynergy() {
    const states = this.game.player.synergyState;
    const byId = Object.fromEntries(states.map(s => [s.synergy.id, s]));
    const html = SYNERGIES.map(syn => {
      const st = byId[syn.id];
      const active = st && st.activeTier;
      const tiers = syn.tiers.map(t => {
        const has = st && st.have >= t.count;
        return `<div style="margin:3px 0;color:${has ? '#ffe14d' : '#9a9ab0'}">
          ${has ? '✓' : '○'} <b>${t.count}+ pieces:</b> ${t.text}</div>`;
      }).join('');
      return `<div class="synergy-card ${active ? 'active' : 'inactive'}">
        <h4>${syn.icon} ${syn.name} <span class="sc-prog">— ${st ? st.have : 0} matching item(s) equipped</span></h4>
        <div style="color:#cfcfe0;font-size:12px;margin:4px 0">${syn.desc}</div>
        ${tiers}
      </div>`;
    }).join('');
    this.panels.synergy.innerHTML = `
      <p style="color:#9a9ab0;font-size:12px;margin-bottom:10px">Equip items sharing a tag to unlock build-defining synergies. Mixing tags spreads you thin — commit to a theme.</p>
      ${html}`;
  }

  _afterChange() {
    this.game.donut.recompute();
    this.render();
    this.game.hud.update();
  }

  _rc(rarity) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--r-${rarity}`).trim() || '#fff';
  }

  // ---------- tooltip ----------
  _showTooltip(html, e) {
    this.tooltip.innerHTML = html;
    this.tooltip.classList.remove('hidden');
    this._moveTooltip(e);
  }
  _moveTooltip(e) {
    if (this.tooltip.classList.contains('hidden')) return;
    const pad = 16;
    let x = e.clientX + pad, y = e.clientY + pad;
    const r = this.tooltip.getBoundingClientRect();
    if (x + r.width > window.innerWidth) x = e.clientX - r.width - pad;
    if (y + r.height > window.innerHeight) y = window.innerHeight - r.height - pad;
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }
  _hideTooltip() { this.tooltip.classList.add('hidden'); }
}
