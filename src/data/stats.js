// The seven core attributes as used in the Dungeon Crawler Carl system.
export const ATTRIBUTES = [
  { key: 'strength', name: 'Strength', abbr: 'STR', icon: '💪',
    desc: 'Melee damage, carry weight, and the ability to smash through obstacles.' },
  { key: 'constitution', name: 'Constitution', abbr: 'CON', icon: '❤️',
    desc: 'Maximum health and resistance to status effects.' },
  { key: 'dexterity', name: 'Dexterity', abbr: 'DEX', icon: '🏃',
    desc: 'Movement & attack speed, dodge chance, and crit chance.' },
  { key: 'intelligence', name: 'Intelligence', abbr: 'INT', icon: '🧠',
    desc: 'Spell power and the size of your mana pool.' },
  { key: 'wisdom', name: 'Wisdom', abbr: 'WIS', icon: '🔮',
    desc: 'Mana regeneration and resistance to mental effects.' },
  { key: 'charisma', name: 'Charisma', abbr: 'CHA', icon: '✨',
    desc: 'Crowd favor (better loot boxes), prices, and Donut\'s magic.' },
  { key: 'luck', name: 'Luck', abbr: 'LCK', icon: '🍀',
    desc: 'Loot rarity, crit damage, and the chance weird things go your way.' },
];

export const ATTR_KEYS = ATTRIBUTES.map(a => a.key);

export function makeAttributeBlock(values = {}) {
  const block = {};
  for (const k of ATTR_KEYS) block[k] = values[k] ?? 1;
  return block;
}

// Derived stats are recomputed from attributes + equipment + synergy bonuses.
// `a` = effective attribute totals, level = character level.
export function deriveStats(a, level, flat = {}) {
  const g = (k) => (flat[k] || 0);
  const maxHp = Math.round(60 + a.constitution * 12 + level * 6 + g('maxHp'));
  const maxStamina = Math.round(40 + a.dexterity * 4 + a.strength * 2 + g('maxStamina'));
  const maxMana = Math.round(10 + a.intelligence * 6 + a.wisdom * 3 + g('maxMana'));

  return {
    maxHp,
    maxStamina,
    maxMana,
    manaRegen: 4 + a.wisdom * 0.6 + g('manaRegen'),
    moveSpeed: 1 + a.dexterity * 0.012 + g('moveSpeedPct') / 100,        // multiplier
    attackSpeed: 1 + a.dexterity * 0.018 + g('attackSpeedPct') / 100,    // multiplier
    meleeDamage: 6 + a.strength * 2.4 + g('meleeDamage'),
    spellPower: a.intelligence * 1.8 + g('spellPower'),
    armor: Math.round(a.constitution * 0.8 + g('armor')),                // flat dmg reduction
    critChance: Math.min(0.75, 0.03 + a.luck * 0.012 + a.dexterity * 0.004 + g('critChance') / 100),
    critMult: 1.6 + a.luck * 0.03 + g('critMult'),
    dodgeChance: Math.min(0.6, a.dexterity * 0.006 + g('dodgeChance') / 100),
    lifesteal: g('lifesteal') / 100,
    thorns: g('thorns') || 0,
    // luck shifts loot toward higher rarity
    lootLuck: a.luck + a.charisma * 0.4 + g('lootLuck'),
    goldFind: 1 + a.charisma * 0.03 + g('goldFindPct') / 100,
  };
}
