export const ITEMS = {
  // --- COMMON ---
  rusty_pipe: {
    id: 'rusty_pipe', name: 'Rusty Pipe', slot: 'mainHand', rarity: 'common',
    tags: ['blunt', 'exterminator'],
    stats: { strength: 2 },
    description: 'A dented pipe. Better than bare fists in a dungeon full of rats.',
  },
  torn_hoodie: {
    id: 'torn_hoodie', name: 'Torn Hoodie', slot: 'chest', rarity: 'common',
    tags: ['cloth'],
    stats: { constitution: 1 },
    description: 'Carl\'s lucky hoodie. It\'s seen better days.',
  },
  work_boots: {
    id: 'work_boots', name: 'Work Boots', slot: 'boots', rarity: 'common',
    tags: ['exterminator'],
    stats: { constitution: 1, dexterity: 1 },
    description: 'Steel-toed boots from the exterminator days.',
  },
  rat_trap_charm: {
    id: 'rat_trap_charm', name: 'Rat Trap Charm', slot: 'charm', rarity: 'common',
    tags: ['rodent', 'exterminator'],
    stats: { strength: 1 },
    description: 'A tiny spring-loaded trap on a chain. Satisfying click.',
  },
  lucky_penny: {
    id: 'lucky_penny', name: 'Lucky Penny', slot: 'charm', rarity: 'common',
    tags: ['luck'],
    stats: { luck: 1 },
    description: 'Heads up. Don\'t ask where Carl found it.',
  },

  // --- UNCOMMON ---
  exterminator_gloves: {
    id: 'exterminator_gloves', name: 'Exterminator Gloves', slot: 'hands', rarity: 'uncommon',
    tags: ['exterminator', 'poison'],
    stats: { strength: 2, dexterity: 2 },
    description: 'Thick rubber gloves. Poison-resistant and grip-friendly.',
  },
  spray_can_shield: {
    id: 'spray_can_shield', name: 'Bug Spray Can', slot: 'offHand', rarity: 'uncommon',
    tags: ['exterminator', 'poison'],
    stats: { constitution: 2, intelligence: 1 },
    description: 'A massive can of industrial bug spray. Blocks and burns.',
  },
  cat_collar_charm: {
    id: 'cat_collar_charm', name: 'Donut\'s Old Collar', slot: 'charm', rarity: 'uncommon',
    tags: ['donut', 'luck'],
    stats: { luck: 2, charisma: 1 },
    description: 'A rhinestone collar. Princess Donut demands you keep it.',
  },
  leather_cap: {
    id: 'leather_cap', name: 'Leather Cap', slot: 'head', rarity: 'uncommon',
    tags: ['leather'],
    stats: { constitution: 2, wisdom: 1 },
    description: 'Basic head protection. The dungeon smells worse with it on.',
  },

  // --- RARE ---
  rat_slayer_blade: {
    id: 'rat_slayer_blade', name: 'Rat-Slayer Blade', slot: 'mainHand', rarity: 'rare',
    tags: ['blade', 'rodent', 'exterminator'],
    stats: { strength: 5, dexterity: 2 },
    description: 'Forged specifically for vermin. The edge never dulls on fur.',
    onHit: { bonusVsTag: 'rodent', bonusDamage: 8 },
  },
  reinforced_jeans: {
    id: 'reinforced_jeans', name: 'Reinforced Jeans', slot: 'legs', rarity: 'rare',
    tags: ['leather', 'exterminator'],
    stats: { constitution: 4, dexterity: 1 },
    description: 'Kevlar-lined denim. Fashion meets survival.',
  },
  donut_fan_pendant: {
    id: 'donut_fan_pendant', name: 'Donut Fan Pendant', slot: 'necklace', rarity: 'rare',
    tags: ['donut', 'luck'],
    stats: { luck: 3, charisma: 2 },
    description: 'A tiny donut-shaped locket. Donut is flattered.',
  },
  crawler_band: {
    id: 'crawler_band', name: 'Crawler Wristband', slot: 'hands', rarity: 'rare',
    tags: ['crawler'],
    stats: { explorer: 3, dexterity: 2 },
    description: 'Given to all new crawlers. It tracks your suffering.',
  },

  // --- EPIC ---
  poison_fog_grenade: {
    id: 'poison_fog_grenade', name: 'Poison Fog Grenade', slot: 'offHand', rarity: 'epic',
    tags: ['exterminator', 'poison'],
    stats: { intelligence: 4, strength: 2 },
    description: 'Exterminator-grade toxin. Do not inhale. Carl already did.',
    onHit: { effect: 'poison', damage: 5, turns: 3 },
  },
  management_headset: {
    id: 'management_headset', name: 'Management Headset', slot: 'head', rarity: 'epic',
    tags: ['management', 'wisdom'],
    stats: { wisdom: 5, intelligence: 3 },
    description: 'You can hear the announcer\'s whispers. Terrifying and useful.',
  },
  vermin_lord_crown: {
    id: 'vermin_lord_crown', name: 'Vermin Lord Crown', slot: 'head', rarity: 'epic',
    tags: ['rodent', 'dark'],
    stats: { strength: 4, charisma: 3 },
    description: 'The rats bow before you. Carl finds this deeply unsettling.',
  },

  // --- LEGENDARY ---
  princess_donut_cape: {
    id: 'princess_donut_cape', name: 'Princess Donut\'s Cape', slot: 'chest', rarity: 'legendary',
    tags: ['donut', 'royal'],
    stats: { charisma: 6, luck: 4, constitution: 3 },
    description: 'A tiny royal cape that somehow fits Carl. Donut insists.',
  },
  exterminators_fury: {
    id: 'exterminators_fury', name: 'Exterminator\'s Fury', slot: 'mainHand', rarity: 'legendary',
    tags: ['exterminator', 'poison', 'blunt'],
    stats: { strength: 8, intelligence: 3 },
    description: 'A weaponized pest control sprayer welded to a sledgehammer.',
    onHit: { effect: 'poison', damage: 8, turns: 2 },
  },

  // --- MYTHIC ---
  carls_resolve: {
    id: 'carls_resolve', name: 'Carl\'s Resolve', slot: 'necklace', rarity: 'mythic',
    tags: ['crawler', 'will'],
    stats: { constitution: 6, wisdom: 5, luck: 3 },
    description: 'The will to survive when everyone else would quit.',
  },

  // --- UNIQUE ---
  donut_royal_scepter: {
    id: 'donut_royal_scepter', name: 'Donut\'s Royal Scepter', slot: 'mainHand', rarity: 'unique',
    tags: ['donut', 'royal', 'luck'],
    stats: { charisma: 8, luck: 6, intelligence: 4 },
    description: 'A scepter Donut claimed from a defeated boss. It\'s just a stick with gems.',
  },

  // --- CELESTIAL ---
  celestial_crawler_mark: {
    id: 'celestial_crawler_mark', name: 'Celestial Crawler Mark', slot: 'charm', rarity: 'celestial',
    tags: ['crawler', 'celestial'],
    stats: { strength: 5, constitution: 5, dexterity: 5, intelligence: 5, wisdom: 5, charisma: 5, luck: 5, explorer: 5 },
    description: 'A mark bestowed by forces beyond the dungeon. The Management is nervous.',
  },
};

export const LOOT_TABLES = {
  floor1_common: {
    pool: ['rusty_pipe', 'torn_hoodie', 'work_boots', 'rat_trap_charm', 'lucky_penny'],
    minRarity: 'common', maxRarity: 'uncommon',
  },
  floor1_chest: {
    pool: ['exterminator_gloves', 'spray_can_shield', 'cat_collar_charm', 'leather_cap',
           'rat_slayer_blade', 'reinforced_jeans', 'donut_fan_pendant', 'crawler_band'],
    minRarity: 'uncommon', maxRarity: 'epic',
  },
  floor1_boss: {
    pool: ['princess_donut_cape', 'exterminators_fury', 'vermin_lord_crown', 'management_headset'],
    minRarity: 'rare', maxRarity: 'legendary',
  },
  floor1_neighborhood: {
    pool: ['rat_slayer_blade', 'reinforced_jeans', 'poison_fog_grenade', 'crawler_band'],
    minRarity: 'uncommon', maxRarity: 'rare',
  },
};

export function getItem(id) {
  const item = ITEMS[id];
  if (!item) return null;
  return { ...item, uid: `${id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
}

export function getItemsByRarity(rarity) {
  return Object.values(ITEMS).filter(i => i.rarity === rarity);
}

export function getItemsByTag(tag) {
  return Object.values(ITEMS).filter(i => i.tags?.includes(tag));
}
