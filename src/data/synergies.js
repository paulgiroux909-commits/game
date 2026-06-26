// Synergy sets reward thematic builds. Each tier unlocks when you have N+ equipped
// items carrying the matching tag. Bonuses are flat stat grants (same keys as deriveStats flat).
export const SYNERGIES = [
  {
    id: 'crawler', name: "True Crawler", tag: 'crawler', icon: '🦴',
    desc: 'You embrace the starting-gear underdog life. The crowd roots for you.',
    tiers: [
      { count: 2, bonus: { maxHp: 20, goldFindPct: 10 }, text: '+20 HP, +10% Gold Find' },
      { count: 4, bonus: { maxHp: 50, lootLuck: 4, critChance: 5 }, text: '+50 HP, +4 Loot Luck, +5% Crit (the underdog narrative)' },
    ],
  },
  {
    id: 'inferno', name: 'Inferno', tag: 'fire', icon: '🔥',
    desc: 'Everything you touch burns. Attacks apply Burn (damage over time).',
    tiers: [
      { count: 2, bonus: { spellPower: 10, meleeDamage: 6 }, text: '+10 Spell Power, +6 Melee. Attacks apply minor Burn.', proc: 'burn1' },
      { count: 4, bonus: { spellPower: 28, critMult: 0.4 }, text: '+28 Spell Power, +0.4 Crit Mult. Burn spreads to nearby foes.', proc: 'burn2' },
    ],
  },
  {
    id: 'deepfreeze', name: 'Deep Freeze', tag: 'ice', icon: '❄️',
    desc: 'Your hits chill enemies, slowing them down.',
    tiers: [
      { count: 2, bonus: { attackSpeedPct: 10, critChance: 4 }, text: '+10% Attack Speed, +4% Crit. Hits slow enemies.', proc: 'chill' },
    ],
  },
  {
    id: 'bloodthirst', name: 'Bloodthirst', tag: 'blood', icon: '🩸',
    desc: 'You heal from the carnage you create.',
    tiers: [
      { count: 2, bonus: { lifesteal: 6, meleeDamage: 8 }, text: '+6% Lifesteal, +8 Melee Damage' },
      { count: 3, bonus: { lifesteal: 12, maxHp: 30 }, text: '+12% Lifesteal, +30 HP. Kills briefly boost attack speed.', proc: 'frenzy' },
    ],
  },
  {
    id: 'arcanist', name: 'Arcanist', tag: 'arcane', icon: '🔮',
    desc: 'You bend the System\'s magic to your will.',
    tiers: [
      { count: 2, bonus: { spellPower: 14, maxMana: 20, manaRegen: 3 }, text: '+14 Spell Power, +20 Mana, +3 Mana Regen' },
      { count: 4, bonus: { spellPower: 40, critChance: 8 }, text: '+40 Spell Power, +8% Crit. Spells cost less.' },
    ],
  },
  {
    id: 'juggernaut', name: 'Juggernaut', tag: 'tank', icon: '🛡️',
    desc: 'Immovable. Unkillable. Mildly inconvenienced.',
    tiers: [
      { count: 2, bonus: { armor: 8, maxHp: 40 }, text: '+8 Armor, +40 HP' },
      { count: 4, bonus: { armor: 20, thorns: 10, maxHp: 90 }, text: '+20 Armor, +10 Thorns, +90 HP' },
    ],
  },
  {
    id: 'fortune', name: "Fortune's Favorite", tag: 'luck', icon: '🍀',
    desc: 'The dice always seem to land your way. The producers suspect cheating.',
    tiers: [
      { count: 2, bonus: { lootLuck: 8, goldFindPct: 20, critChance: 5 }, text: '+8 Loot Luck, +20% Gold, +5% Crit' },
      { count: 3, bonus: { lootLuck: 18, critChance: 10, critMult: 0.5 }, text: '+18 Loot Luck, +10% Crit, +0.5 Crit Mult' },
    ],
  },
  {
    id: 'swift', name: 'Quicksilver', tag: 'swift', icon: '💨',
    desc: 'Too fast to hit, too fast to catch.',
    tiers: [
      { count: 2, bonus: { moveSpeedPct: 12, dodgeChance: 8, attackSpeedPct: 8 }, text: '+12% Move, +8% Dodge, +8% Attack Speed' },
      { count: 3, bonus: { moveSpeedPct: 25, dodgeChance: 16 }, text: '+25% Move, +16% Dodge. Dodging refunds stamina.' },
    ],
  },
  {
    id: 'primal', name: 'Primal Fury', tag: 'primal', icon: '🪓',
    desc: 'The Primal class path: raw, brutal, and beloved by the bloodthirsty audience.',
    tiers: [
      { count: 2, bonus: { meleeDamage: 12, critChance: 6 }, text: '+12 Melee Damage, +6% Crit' },
      { count: 4, bonus: { meleeDamage: 30, critMult: 0.6, lifesteal: 5 }, text: '+30 Melee, +0.6 Crit Mult, +5% Lifesteal' },
    ],
  },
  {
    id: 'showman', name: 'Crowd Pleaser', tag: 'showman', icon: '✨',
    desc: 'You play to the cameras. Charisma is a weapon, and the gifts keep coming.',
    tiers: [
      { count: 2, bonus: { goldFindPct: 25, lootLuck: 5 }, text: '+25% Gold, +5 Loot Luck (sponsor gifts)' },
      { count: 3, bonus: { goldFindPct: 50, lootLuck: 12, maxHp: 30 }, text: '+50% Gold, +12 Loot Luck, +30 HP (fan-funded armor)' },
    ],
  },
  {
    id: 'feline', name: 'Feline Bond', tag: 'feline', icon: '🐱',
    desc: 'You and Princess Donut move as one. She fights harder for you.',
    tiers: [
      { count: 1, bonus: { critChance: 5 }, donut: { dmg: 0.5, cdr: 0.25 }, text: 'Donut deals +50% damage and acts faster. +5% Crit for you.' },
    ],
  },
  {
    id: 'glasscannon', name: 'Glass Cannon', tag: 'glass', icon: '💥',
    desc: 'Live fast, hit like a truck, die in one good sneeze.',
    tiers: [
      { count: 1, bonus: { meleeDamage: 18, spellPower: 14, critMult: 0.5, maxHp: -25 }, text: '+18 Melee, +14 Spell Power, +0.5 Crit Mult, but -25 HP' },
    ],
  },
];

// Returns list of { synergy, tier, active } describing current synergy state.
export function evaluateSynergies(equippedItems) {
  const tagCounts = {};
  for (const item of equippedItems) {
    if (!item) continue;
    for (const t of item.tags || []) tagCounts[t] = (tagCounts[t] || 0) + 1;
  }
  const results = [];
  for (const syn of SYNERGIES) {
    const have = tagCounts[syn.tag] || 0;
    let activeTier = null;
    let nextTier = null;
    for (const tier of syn.tiers) {
      if (have >= tier.count) activeTier = tier;
      else { nextTier = tier; break; }
    }
    results.push({ synergy: syn, have, activeTier, nextTier });
  }
  return results;
}
