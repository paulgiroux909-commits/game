import { RARITY_MAP } from './rarities.js';
import { ATTR_KEYS } from './stats.js';

// Generic item slot categories. Mapped to concrete equipment slots in equipment.js.
// slot values: head, chest, hands, legs, boots, necklace, ring, charm, weapon, offhand

// Stat keys that scale numerically with rarity & floor.
const SCALE_KEYS = new Set([
  'maxHp', 'maxStamina', 'maxMana', 'manaRegen', 'moveSpeedPct', 'attackSpeedPct',
  'meleeDamage', 'spellPower', 'armor', 'critChance', 'critMult', 'dodgeChance',
  'lifesteal', 'thorns', 'lootLuck', 'goldFindPct',
]);

// Rarity-based name affixes for flavor.
const PREFIX = {
  common: ['Dented', 'Plain', 'Salvaged', 'Standard-Issue'],
  uncommon: ['Sturdy', 'Polished', 'Reinforced', 'Tuned'],
  rare: ['Gleaming', 'Superior', 'Pristine', 'Veteran'],
  epic: ['Heroic', 'Resonant', 'Ascendant', 'Overclocked'],
  legendary: ['Mythbreaking', 'Worldscar', 'Legendary', 'Sovereign'],
  mythic: ['Apocryphal', 'Cataclysmic', 'Mythic', 'Unmaker\'s'],
  celestial: ['Celestial', 'Star-Forged', 'Apotheotic', 'Borant-Recalled'],
};

// Base item templates. base = magnitudes at COMMON rarity, floor 1.
// `attrs` = attribute bonuses (also scaled). `synergy` = tags used by synergy sets.
export const ITEM_TEMPLATES = [
  // ---------- WEAPONS (right hand) ----------
  { id: 'crowbar', name: 'Trusty Crowbar', slot: 'weapon', minFloor: 1,
    base: { meleeDamage: 7, critChance: 4 }, synergy: ['blunt', 'crawler'],
    flavor: '"Every crawler\'s first friend. Pry, smash, repeat." — it just feels right in your hand.' },
  { id: 'rusty_machete', name: 'Rusty Machete', slot: 'weapon', minFloor: 1,
    base: { meleeDamage: 9, lifesteal: 3 }, synergy: ['blade', 'blood'],
    flavor: 'Tetanus is the least of your worries down here.' },
  { id: 'flame_kebab', name: 'Flaming Skewer', slot: 'weapon', minFloor: 1,
    base: { meleeDamage: 6, spellPower: 5 }, synergy: ['blade', 'fire'],
    flavor: 'Cooks the goblin AND seasons it. The crowd loves a multitasker.' },
  { id: 'frost_pick', name: 'Frostbite Ice Pick', slot: 'weapon', minFloor: 1,
    base: { meleeDamage: 7, attackSpeedPct: 6 }, synergy: ['blade', 'ice'],
    flavor: 'Slows whatever it stabs. Also great for impromptu snow cones.' },
  { id: 'foam_finger', name: 'Foam Finger of Doom', slot: 'weapon', minFloor: 1,
    base: { meleeDamage: 4, critMult: 0.2 }, attrs: { charisma: 1 }, synergy: ['blunt', 'showman'],
    flavor: 'A sponsored weapon. Smacking monsters with it boosts your viewer numbers.' },
  { id: 'goblin_cleaver', name: "Goblin Bonecleaver", slot: 'weapon', minFloor: 1,
    base: { meleeDamage: 11 }, attrs: { strength: 1 }, synergy: ['blade', 'primal'],
    flavor: 'Took it off a goblin. The goblin no longer needs it.' },

  // ---------- OFFHAND (left hand) ----------
  { id: 'trash_lid', name: 'Trash Can Lid', slot: 'offhand', minFloor: 1,
    base: { armor: 4, maxHp: 12 }, synergy: ['shield', 'crawler'],
    flavor: 'Surprisingly heroic. Smells of last week\'s leftovers.' },
  { id: 'parry_dagger', name: 'Parrying Shiv', slot: 'offhand', minFloor: 1,
    base: { critChance: 5, dodgeChance: 4 }, synergy: ['blade'],
    flavor: 'For when "the best defense is a stabbier offense."' },
  { id: 'spell_tome', name: 'Soggy Spellbook', slot: 'offhand', minFloor: 1,
    base: { spellPower: 7, maxMana: 10 }, attrs: { intelligence: 1 }, synergy: ['arcane'],
    flavor: 'Half the pages are stuck together. The fireball page, thankfully, is not.' },
  { id: 'lucky_horseshoe', name: 'Off-Hand Horseshoe', slot: 'offhand', minFloor: 1,
    base: { lootLuck: 3 }, attrs: { luck: 1 }, synergy: ['luck'],
    flavor: 'You found it in a stable that no longer exists. The horse, you assume, also does not.' },

  // ---------- HEAD ----------
  { id: 'bike_helmet', name: 'Cracked Bike Helmet', slot: 'head', minFloor: 1,
    base: { armor: 3, maxHp: 8 }, synergy: ['crawler'],
    flavor: 'Safety first, even during the apocalypse.' },
  { id: 'goblin_crown', name: 'Tiny Goblin Crown', slot: 'head', minFloor: 1,
    base: { goldFindPct: 8 }, attrs: { charisma: 1 }, synergy: ['showman', 'royal'],
    flavor: 'Fits a goblin perfectly. On you it looks like a ring.' },
  { id: 'tin_foil_hat', name: 'Tinfoil Thinking Cap', slot: 'head', minFloor: 1,
    base: { maxMana: 12, spellPower: 4 }, attrs: { intelligence: 1 }, synergy: ['arcane', 'tech'],
    flavor: 'Blocks the alien mind-reading. Probably. The System is laughing.' },
  { id: 'night_goggles', name: 'Scavenged Night-Vision', slot: 'head', minFloor: 1,
    base: { critChance: 5, dodgeChance: 3 }, attrs: { dexterity: 1 }, synergy: ['tech'],
    flavor: 'See the monster before it sees you. Battery not included.' },

  // ---------- CHEST ----------
  { id: 'bathrobe', name: 'Borant Bathrobe', slot: 'chest', minFloor: 1,
    base: { maxHp: 10, maxMana: 8 }, synergy: ['crawler', 'showman'],
    flavor: 'Your starting fit. Comfy, breezy, surprisingly resilient. The fans adore it.' },
  { id: 'flak_vest', name: 'Salvaged Flak Vest', slot: 'chest', minFloor: 1,
    base: { armor: 6, maxHp: 18 }, attrs: { constitution: 1 }, synergy: ['tech', 'tank'],
    flavor: 'Heavy, hot, and the only reason your torso is still attached.' },
  { id: 'spiked_jacket', name: 'Spiked Leather Jacket', slot: 'chest', minFloor: 1,
    base: { thorns: 4, armor: 3 }, attrs: { strength: 1 }, synergy: ['primal', 'blood'],
    flavor: 'Hug a monster, hurt a monster.' },
  { id: 'mage_robe', name: 'Moth-Eaten Mage Robe', slot: 'chest', minFloor: 1,
    base: { spellPower: 6, maxMana: 14 }, attrs: { intelligence: 1 }, synergy: ['arcane'],
    flavor: 'It billows dramatically. The drama is the point.' },

  // ---------- HANDS ----------
  { id: 'work_gloves', name: 'Leather Work Gloves', slot: 'hands', minFloor: 1,
    base: { meleeDamage: 4, attackSpeedPct: 5 }, synergy: ['crawler'],
    flavor: 'For honest work, like beating up sewer monsters.' },
  { id: 'brass_knuckles', name: 'Heirloom Brass Knuckles', slot: 'hands', minFloor: 1,
    base: { meleeDamage: 6, critChance: 4 }, attrs: { strength: 1 }, synergy: ['blunt', 'primal'],
    flavor: 'Grandpa\'s. He\'d be so proud, and a little concerned.' },
  { id: 'oven_mitts', name: 'Enchanted Oven Mitts', slot: 'hands', minFloor: 1,
    base: { spellPower: 4, maxMana: 8 }, synergy: ['fire', 'arcane'],
    flavor: 'Hold the fireball without burning yourself. Mostly.' },
  { id: 'pickpocket_gloves', name: "Cutpurse's Gloves", slot: 'hands', minFloor: 1,
    base: { goldFindPct: 10, lootLuck: 2 }, attrs: { dexterity: 1 }, synergy: ['luck'],
    flavor: 'The dead don\'t need their pocket change.' },

  // ---------- LEGS ----------
  { id: 'cargo_shorts', name: 'Tactical Cargo Shorts', slot: 'legs', minFloor: 1,
    base: { maxStamina: 12, moveSpeedPct: 4 }, synergy: ['crawler'],
    flavor: 'So many pockets. None of them have anything useful in them.' },
  { id: 'greaves', name: 'Dented Steel Greaves', slot: 'legs', minFloor: 1,
    base: { armor: 5, maxHp: 12 }, attrs: { constitution: 1 }, synergy: ['tank'],
    flavor: 'Clank. Clank. Clank. Stealth is not your strong suit.' },
  { id: 'runner_tights', name: "Sprinter's Tights", slot: 'legs', minFloor: 1,
    base: { moveSpeedPct: 9, dodgeChance: 4 }, attrs: { dexterity: 1 }, synergy: ['swift'],
    flavor: 'Run away faster, or toward danger faster. Your call.' },

  // ---------- BOOTS ----------
  { id: 'flip_flops', name: 'Lucky Flip-Flops', slot: 'boots', minFloor: 1,
    base: { moveSpeedPct: 5, lootLuck: 2 }, attrs: { luck: 1 }, synergy: ['crawler', 'luck'],
    flavor: 'The flip-flops you descended in. They\'ve been through everything with you.' },
  { id: 'steel_toe', name: 'Steel-Toed Boots', slot: 'boots', minFloor: 1,
    base: { meleeDamage: 3, armor: 3 }, synergy: ['blunt', 'tank'],
    flavor: 'A kick from these has ended more than one monster.' },
  { id: 'sneakers', name: 'Pump-Up Sneakers', slot: 'boots', minFloor: 1,
    base: { moveSpeedPct: 8, attackSpeedPct: 4 }, attrs: { dexterity: 1 }, synergy: ['swift'],
    flavor: 'They light up when you run. Subtlety is dead anyway.' },
  { id: 'ember_boots', name: 'Ember-Soled Boots', slot: 'boots', minFloor: 1,
    base: { spellPower: 3, moveSpeedPct: 4 }, synergy: ['fire'],
    flavor: 'Leave a trail of tiny scorch marks. The cleanup crew hates you.' },

  // ---------- NECKLACE ----------
  { id: 'dog_tags', name: 'Soldier\'s Dog Tags', slot: 'necklace', minFloor: 1,
    base: { maxHp: 14, armor: 2 }, attrs: { constitution: 1 }, synergy: ['tank'],
    flavor: 'They belonged to someone braver than you. For now.' },
  { id: 'fang_pendant', name: 'Monster Fang Pendant', slot: 'necklace', minFloor: 1,
    base: { meleeDamage: 5, lifesteal: 2 }, attrs: { strength: 1 }, synergy: ['primal', 'blood'],
    flavor: 'Wear your enemies. It\'s a whole vibe.' },
  { id: 'crystal_amulet', name: 'Humming Crystal Amulet', slot: 'necklace', minFloor: 1,
    base: { spellPower: 6, manaRegen: 2 }, attrs: { intelligence: 1 }, synergy: ['arcane'],
    flavor: 'It hums a tune you almost recognize. The aliens find it catchy.' },
  { id: 'rabbit_foot', name: "Rabbit's Foot Charm", slot: 'necklace', minFloor: 1,
    base: { lootLuck: 4, critChance: 3 }, attrs: { luck: 1 }, synergy: ['luck'],
    flavor: 'Unlucky for the rabbit. Lucky for you.' },

  // ---------- RING ----------
  { id: 'signet', name: 'Cracked Signet Ring', slot: 'ring', minFloor: 1,
    base: { goldFindPct: 6 }, attrs: { charisma: 1 }, synergy: ['royal'],
    flavor: 'Hints at noble blood. The blood is mostly yours, currently.' },
  { id: 'iron_band', name: 'Iron Band', slot: 'ring', minFloor: 1,
    base: { meleeDamage: 4, armor: 2 }, synergy: ['tank', 'primal'],
    flavor: 'Plain, heavy, dependable. Like a good friend.' },
  { id: 'spark_ring', name: 'Ring of Sparks', slot: 'ring', minFloor: 1,
    base: { spellPower: 5, critChance: 3 }, synergy: ['arcane', 'fire'],
    flavor: 'Zaps you a little when you put it on. Worth it.' },

  // ---------- CHARM ----------
  { id: 'cat_toy', name: "Donut's Favorite Cat Toy", slot: 'charm', minFloor: 1,
    base: { critChance: 4 }, attrs: { charisma: 1 }, synergy: ['feline', 'showman'],
    flavor: 'Donut allows you to carry it. She has not forgotten it is hers.' },
  { id: 'gold_coin', name: 'Mysterious Gold Coin', slot: 'charm', minFloor: 1,
    base: { goldFindPct: 12, lootLuck: 3 }, synergy: ['luck'],
    flavor: 'It always lands on heads. You\'re not sure that\'s a good thing.' },
  { id: 'phoenix_feather', name: 'Singed Phoenix Feather', slot: 'charm', minFloor: 1,
    base: { spellPower: 4, maxHp: 10 }, synergy: ['fire', 'holy'],
    flavor: 'Warm to the touch. Whispers of second chances.' },
  { id: 'glass_eye', name: 'Glass Eye of the Glasscannon', slot: 'charm', minFloor: 1,
    base: { meleeDamage: 8, spellPower: 6, maxHp: -8 }, synergy: ['glass'],
    flavor: 'Big damage, brittle ego. High risk, high reward, high ratings.' },
  { id: 'pocket_sand', name: 'Pouch of Pocket Sand', slot: 'charm', minFloor: 1,
    base: { dodgeChance: 6 }, attrs: { dexterity: 1 }, synergy: ['swift'],
    flavor: '"POCKET SAND!" Works embarrassingly often.' },
];

let _instanceCounter = 1;

// Build a concrete item instance from a template + rarity + floor.
export function buildItem(template, rarityKey, floor, rng) {
  const rarity = RARITY_MAP[rarityKey];
  const floorScale = 1 + (floor - 1) * 0.12;
  const mult = rarity.mult * floorScale;

  const stats = {};
  for (const [k, v] of Object.entries(template.base || {})) {
    if (!SCALE_KEYS.has(k)) continue;
    let val = v * mult;
    // round to keep numbers readable; small % stats rounded to 1 decimal
    val = (k === 'critMult') ? Math.round(val * 100) / 100 : Math.round(val);
    if (val !== 0) stats[k] = val;
  }

  const attrs = {};
  for (const [k, v] of Object.entries(template.attrs || {})) {
    if (!ATTR_KEYS.includes(k)) continue;
    // attribute bonus scales with rarity tier, floor adds a little
    const val = Math.max(1, Math.round(v * (1 + rarity.tier * 0.6) * floorScale));
    attrs[k] = val;
  }

  // Higher rarities sometimes get a bonus random affix stat.
  if (rarity.tier >= 3 && rng) {
    const affixPool = ['critChance', 'critMult', 'moveSpeedPct', 'lifesteal', 'lootLuck', 'armor'];
    const k = rng.pick(affixPool);
    const amt = k === 'critMult' ? Math.round((0.15 * rarity.tier) * 100) / 100
              : Math.round((2 + rarity.tier) * floorScale);
    stats[k] = (stats[k] || 0) + amt;
  }

  const prefixList = PREFIX[rarityKey];
  const prefix = prefixList ? (rng ? rng.pick(prefixList) : prefixList[0]) : '';
  const name = rarity.tier === 0 ? template.name : `${prefix} ${template.name}`;

  return {
    uid: `it_${_instanceCounter++}`,
    templateId: template.id,
    name,
    slot: template.slot,
    rarity: rarityKey,
    rarityTier: rarity.tier,
    stats,
    attrs,
    tags: (template.synergy || []).slice(),
    flavor: template.flavor,
  };
}

export function templatesForFloor(floor) {
  return ITEM_TEMPLATES.filter(t => (t.minFloor || 1) <= floor);
}
