import { templatesForFloor, buildItem, ITEM_TEMPLATES } from '../data/items.js';
import { rollRarity } from '../data/rarities.js';

const TEMPLATE_BY_ID = Object.fromEntries(ITEM_TEMPLATES.map(t => [t.id, t]));

// Roll a random item appropriate for the floor, biased by the player's loot luck.
export function rollItem(rng, floor, lootLuck = 0, opts = {}) {
  let pool = templatesForFloor(floor);
  if (opts.slot) pool = pool.filter(t => t.slot === opts.slot);
  if (pool.length === 0) pool = templatesForFloor(floor);
  const template = rng.pick(pool);
  const rarityKey = rollRarity(rng, lootLuck, floor);
  return buildItem(template, rarityKey, floor, rng);
}

// Build a specific item by template id (used by events that grant named items).
export function makeItemById(templateId, rng, floor = 1, rarityKey) {
  const t = TEMPLATE_BY_ID[templateId];
  if (!t) return rollItem(rng, floor);
  const r = rarityKey || rollRarity(rng, 0, floor);
  return buildItem(t, r, floor, rng);
}

// Force at least a given rarity (for boss drops). Rolls normally, then upgrades.
export function rollItemMinRarity(rng, floor, lootLuck, minTier) {
  const tiersOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'celestial'];
  let item = rollItem(rng, floor, lootLuck);
  if (item.rarityTier < minTier) {
    const t = TEMPLATE_BY_ID[item.templateId];
    item = buildItem(t, tiersOrder[minTier], floor, rng);
  }
  return item;
}

export function rollGold(rng, range, goldFind = 1) {
  const [a, b] = range;
  return Math.max(1, Math.round(rng.int(a, b) * goldFind));
}
