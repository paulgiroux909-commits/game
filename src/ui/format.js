import { RARITY_MAP } from '../data/rarities.js';
import { ATTRIBUTES } from '../data/stats.js';

const ATTR_NAME = Object.fromEntries(ATTRIBUTES.map(a => [a.key, a.abbr]));

export const STAT_LABELS = {
  maxHp: 'Max HP', maxStamina: 'Max Stamina', maxMana: 'Max Mana', manaRegen: 'Mana Regen',
  moveSpeedPct: 'Move Speed', attackSpeedPct: 'Attack Speed', meleeDamage: 'Melee Dmg',
  spellPower: 'Spell Power', armor: 'Armor', critChance: 'Crit Chance', critMult: 'Crit Mult',
  dodgeChance: 'Dodge', lifesteal: 'Lifesteal', thorns: 'Thorns', lootLuck: 'Loot Luck',
  goldFindPct: 'Gold Find',
};

const PERCENT_KEYS = new Set(['moveSpeedPct', 'attackSpeedPct', 'critChance', 'dodgeChance', 'lifesteal', 'goldFindPct']);

export function fmtStat(key, val) {
  const label = STAT_LABELS[key] || key;
  let v = val;
  let str;
  if (key === 'critMult') str = `+${v}x`;
  else if (PERCENT_KEYS.has(key)) str = `${v > 0 ? '+' : ''}${v}%`;
  else str = `${v > 0 ? '+' : ''}${v}`;
  return `${str} ${label}`;
}

export function rarityClass(rarity) { return `r-${rarity}`; }
export function rarityBorderClass(rarity) { return `b-${rarity}`; }
export function rarityName(rarity) { return RARITY_MAP[rarity]?.name || rarity; }

export function itemTooltipHTML(item) {
  let html = `<h4 class="${rarityClass(item.rarity)}">${item.name}</h4>`;
  html += `<div class="tt-rarity ${rarityClass(item.rarity)}">${rarityName(item.rarity)} · ${item.slot}</div>`;
  for (const [k, v] of Object.entries(item.attrs || {})) {
    html += `<div class="tt-stat">+${v} ${ATTR_NAME[k] || k}</div>`;
  }
  for (const [k, v] of Object.entries(item.stats || {})) {
    html += `<div class="tt-stat ${v < 0 ? 'neg' : ''}">${fmtStat(k, v)}</div>`;
  }
  if (item.tags && item.tags.length) {
    html += `<div>` + item.tags.map(t => `<span class="tt-tag">${t}</span>`).join('') + `</div>`;
  }
  if (item.flavor) html += `<div class="tt-flavor">${item.flavor}</div>`;
  return html;
}
