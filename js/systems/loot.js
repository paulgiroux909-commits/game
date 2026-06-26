import { RARITIES } from '../config.js';
import { ITEMS, LOOT_TABLES, getItem } from '../data/items.js';

const RARITY_ORDER = Object.keys(RARITIES);

export function rollRarity(bonus = 0) {
  const weights = RARITY_ORDER.map(r => {
    let w = RARITIES[r].weight;
    if (bonus > 0 && r !== 'common') w *= (1 + bonus);
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < RARITY_ORDER.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return RARITY_ORDER[i];
  }
  return 'common';
}

export function rollLoot(tableName, luckBonus = 0) {
  const table = LOOT_TABLES[tableName];
  if (!table) return null;

  const rarity = rollRarity(luckBonus * 0.02);
  const minIdx = RARITY_ORDER.indexOf(table.minRarity);
  const maxIdx = RARITY_ORDER.indexOf(table.maxRarity);
  const rarityIdx = RARITY_ORDER.indexOf(rarity);
  const clampedRarity = RARITY_ORDER[Math.max(minIdx, Math.min(maxIdx, rarityIdx))];

  const pool = table.pool
    .map(id => ITEMS[id])
    .filter(item => item && RARITY_ORDER.indexOf(item.rarity) <= RARITY_ORDER.indexOf(clampedRarity));

  if (pool.length === 0) {
    const fallback = table.pool[Math.floor(Math.random() * table.pool.length)];
    return getItem(fallback);
  }

  const item = pool[Math.floor(Math.random() * pool.length)];
  return getItem(item.id);
}

export function generateFloorLoot(floor, isBoss = false, isNeighborhood = false) {
  if (isBoss) return rollLoot('floor1_boss', 3);
  if (isNeighborhood) return rollLoot('floor1_neighborhood', 2);
  return rollLoot('floor1_chest', 1);
}

export function getRarityColor(rarity) {
  return RARITIES[rarity]?.color || '#aaaaaa';
}

export function getRarityName(rarity) {
  return RARITIES[rarity]?.name || 'Unknown';
}

export function formatItemStats(item) {
  if (!item.stats) return '';
  return Object.entries(item.stats)
    .map(([k, v]) => `${k.slice(0, 3).toUpperCase()} +${v}`)
    .join(', ');
}

export function formatItemDetail(item) {
  const lines = [
    `<div class="item-name rarity-${item.rarity}">${item.name}</div>`,
    `<div class="rarity-label" style="color:${getRarityColor(item.rarity)}">${getRarityName(item.rarity)}</div>`,
    `<div class="item-slot">Slot: ${item.slot}</div>`,
    `<div class="item-desc">${item.description}</div>`,
  ];
  if (item.stats) {
    lines.push(`<div class="item-stats-detail">${formatItemStats(item)}</div>`);
  }
  if (item.tags) {
    lines.push(`<div class="item-tags">${item.tags.map(t => `<span class="synergy-tag">${t}</span>`).join('')}</div>`);
  }
  return lines.join('');
}
