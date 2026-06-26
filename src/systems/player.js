import { CONFIG } from '../core/config.js';
import { makeAttributeBlock, deriveStats, ATTR_KEYS } from '../data/stats.js';
import { makeEmptyEquipment, EQUIP_SLOTS } from './equipment.js';
import { evaluateSynergies } from '../data/synergies.js';
import { xpForLevel } from './progression.js';

export class Player {
  constructor() {
    // Carl starts as a barely-clothed underdog.
    this.baseAttr = makeAttributeBlock({
      strength: 3, constitution: 4, dexterity: 3,
      intelligence: 2, wisdom: 2, charisma: 3, luck: 3,
    });
    this.level = 1;
    this.xp = 0;
    this.xpToNext = xpForLevel(1);
    this.statPoints = 0;
    this.gold = 0;

    this.inventory = [];
    this.equipment = makeEmptyEquipment();
    this.maxHpPenalty = 0; // from cursed events

    // transform / gameplay state (set by combat system)
    this.x = 0; this.y = 0;
    this.facing = { x: 1, y: 0 };
    this.attackCd = 0;
    this.dodgeCd = 0;
    this.dodgeTime = 0;
    this.invuln = 0;

    // effective stats (filled by recompute)
    this.attr = {};
    this.stats = {};
    this.synergyState = [];
    this.procs = new Set();
    this.donutBonus = { dmg: 0, cdr: 0 };

    this.recompute(true);
    this.hp = this.stats.maxHp;
    this.stamina = this.stats.maxStamina;
    this.mana = this.stats.maxMana;
  }

  equippedItems() {
    return EQUIP_SLOTS.map(s => this.equipment[s.key]).filter(Boolean);
  }

  recompute(full = false) {
    // 1) effective attributes = base + equipment attr bonuses
    const attr = {};
    for (const k of ATTR_KEYS) attr[k] = this.baseAttr[k];
    for (const item of this.equippedItems()) {
      for (const [k, v] of Object.entries(item.attrs || {})) attr[k] += v;
    }

    // 2) flat stat totals from equipment
    const flat = {};
    const add = (k, v) => { flat[k] = (flat[k] || 0) + v; };
    for (const item of this.equippedItems()) {
      for (const [k, v] of Object.entries(item.stats || {})) add(k, v);
    }

    // 3) synergies
    this.synergyState = evaluateSynergies(this.equippedItems());
    this.procs = new Set();
    this.donutBonus = { dmg: 0, cdr: 0 };
    for (const s of this.synergyState) {
      if (!s.activeTier) continue;
      for (const [k, v] of Object.entries(s.activeTier.bonus || {})) add(k, v);
      if (s.activeTier.proc) this.procs.add(s.activeTier.proc);
      if (s.activeTier.donut) {
        this.donutBonus.dmg += s.activeTier.donut.dmg || 0;
        this.donutBonus.cdr += s.activeTier.donut.cdr || 0;
      }
    }

    // cursed-event max HP penalty
    add('maxHp', -this.maxHpPenalty);

    this.attr = attr;
    this.stats = deriveStats(attr, this.level, flat);

    // clamp current pools to new maxes
    if (!full) {
      this.hp = Math.min(this.hp, this.stats.maxHp);
      this.stamina = Math.min(this.stamina, this.stats.maxStamina);
      this.mana = Math.min(this.mana, this.stats.maxMana);
    }
  }

  get speed() {
    return CONFIG.PLAYER_SPEED * this.stats.moveSpeed;
  }

  get attackCooldown() {
    return CONFIG.BASE_ATTACK_COOLDOWN / this.stats.attackSpeed;
  }

  addItem(item) {
    this.inventory.push(item);
  }

  // Equip from inventory; returns previously-equipped item (back to bag) or null.
  equip(item, slotKey) {
    const prev = this.equipment[slotKey];
    this.equipment[slotKey] = item;
    const idx = this.inventory.indexOf(item);
    if (idx >= 0) this.inventory.splice(idx, 1);
    if (prev) this.inventory.push(prev);
    this.recompute();
    return prev;
  }

  unequip(slotKey) {
    const item = this.equipment[slotKey];
    if (!item) return;
    this.equipment[slotKey] = null;
    this.inventory.push(item);
    this.recompute();
  }

  dropFromBag(item) {
    const idx = this.inventory.indexOf(item);
    if (idx >= 0) this.inventory.splice(idx, 1);
  }

  gainXp(amount) {
    this.xp += amount;
    let leveled = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      leveled++;
      this.statPoints += CONFIG.STAT_POINTS_PER_LEVEL;
      this.xpToNext = xpForLevel(this.level);
    }
    if (leveled > 0) {
      this.recompute();
      // level ups fully restore Carl — a small mercy from the System
      this.hp = this.stats.maxHp;
      this.stamina = this.stats.maxStamina;
      this.mana = this.stats.maxMana;
    }
    return leveled;
  }

  spendStatPoint(attrKey) {
    if (this.statPoints <= 0) return false;
    this.baseAttr[attrKey]++;
    this.statPoints--;
    this.recompute();
    return true;
  }
}
