// Rarity tiers. `weight` controls drop frequency (lower rarity = larger weight).
// `mult` scales the magnitude of an item's stats. `tier` is used by luck math.
export const RARITIES = [
  { key: 'common',    name: 'Common',    weight: 1000, mult: 1.0,  tier: 0, color: '#b8b8b8' },
  { key: 'uncommon',  name: 'Uncommon',  weight: 420,  mult: 1.35, tier: 1, color: '#5cd65c' },
  { key: 'rare',      name: 'Rare',      weight: 165,  mult: 1.8,  tier: 2, color: '#3da5ff' },
  { key: 'epic',      name: 'Epic',      weight: 62,   mult: 2.4,  tier: 3, color: '#b65cff' },
  { key: 'legendary', name: 'Legendary', weight: 20,   mult: 3.2,  tier: 4, color: '#ff9d2e' },
  { key: 'mythic',    name: 'Mythic',    weight: 5,    mult: 4.3,  tier: 5, color: '#ff4f8b' },
  { key: 'celestial', name: 'Celestial', weight: 1,    mult: 6.0,  tier: 6, color: '#ffe14d' },
];

export const RARITY_MAP = Object.fromEntries(RARITIES.map(r => [r.key, r]));

// Roll a rarity. `lootLuck` biases the weighting toward rarer tiers.
// Higher floors also slightly increase the floor of what can drop.
export function rollRarity(rng, lootLuck = 0, floor = 1) {
  // luck applies a multiplicative bonus to the weights of rarer items
  const adjusted = RARITIES.map(r => {
    // each tier above common gets boosted by luck; deeper floors boost too
    const luckBoost = 1 + (lootLuck * 0.02 + (floor - 1) * 0.06) * r.tier;
    return { key: r.key, weight: r.weight * luckBoost };
  });
  return rng.weighted(adjusted).key;
}

export function rarityColor(key) {
  return RARITY_MAP[key]?.color || '#fff';
}
