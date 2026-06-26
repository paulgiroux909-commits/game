export const MONSTERS = {
  // Floor 1 regular monsters
  dungeon_rat: {
    id: 'dungeon_rat', name: 'Dungeon Rat', floor: 1,
    tags: ['rodent', 'beast'],
    hp: 15, atk: 4, def: 1, xp: 12, luck: 0,
    description: 'A rat the size of a small dog. Its eyes glow with dungeon malice.',
    lootTable: 'floor1_common',
    sprite: '🐀',
  },
  giant_cockroach: {
    id: 'giant_cockroach', name: 'Giant Cockroach', floor: 1,
    tags: ['insect', 'beast'],
    hp: 20, atk: 5, def: 2, xp: 15, luck: 0,
    description: 'Carl\'s professional nemesis, now dungeon-sized.',
    lootTable: 'floor1_common',
    sprite: '🪳',
  },
  goblin_scavenger: {
    id: 'goblin_scavenger', name: 'Goblin Scavenger', floor: 1,
    tags: ['goblin', 'humanoid'],
    hp: 25, atk: 6, def: 3, xp: 20, luck: 1,
    description: 'A scrawny goblin picking through other crawlers\' remains.',
    lootTable: 'floor1_common',
    sprite: '👺',
  },
  slime_puddle: {
    id: 'slime_puddle', name: 'Slime Puddle', floor: 1,
    tags: ['ooze', 'beast'],
    hp: 30, atk: 4, def: 5, xp: 18, luck: 0,
    description: 'A gelatinous mass blocking the corridor. Very gross.',
    lootTable: 'floor1_common',
    sprite: '🟢',
  },
  feral_cat: {
    id: 'feral_cat', name: 'Feral Dungeon Cat', floor: 1,
    tags: ['beast', 'feline'],
    hp: 18, atk: 7, def: 1, xp: 16, luck: 2,
    description: 'Donut hisses at it. It hisses back. Diplomatic incident.',
    lootTable: 'floor1_common',
    sprite: '🐱',
  },
  skeleton_crawler: {
    id: 'skeleton_crawler', name: 'Skeleton Crawler', floor: 1,
    tags: ['undead', 'humanoid'],
    hp: 22, atk: 6, def: 4, xp: 22, luck: 0,
    description: 'A previous contestant who didn\'t make it. A cautionary tale.',
    lootTable: 'floor1_common',
    sprite: '💀',
  },
  poison_spider: {
    id: 'poison_spider', name: 'Poison Spider', floor: 1,
    tags: ['insect', 'poison'],
    hp: 16, atk: 5, def: 1, xp: 14, luck: 0,
    description: 'Eight legs of NOPE.',
    onHit: { effect: 'poison', damage: 3, turns: 2 },
    lootTable: 'floor1_common',
    sprite: '🕷️',
  },

  // Neighborhood Boss
  rat_king: {
    id: 'rat_king', name: 'Rat King', floor: 1,
    tags: ['rodent', 'boss', 'neighborhood'],
    bossType: 'neighborhood',
    hp: 80, atk: 10, def: 5, xp: 100, luck: 2,
    description: 'A writhing mass of rats fused into a crown-wearing horror. Rules the eastern warrens.',
    lootTable: 'floor1_neighborhood',
    sprite: '👑',
    abilities: ['summon_rats', 'plague_bite'],
    intro: 'The Rat King emerges from a pile of squealing bodies. "Squeak squeak," it seems to say. Carl understands: it wants to fight.',
  },

  // Floor Boss
  tutorial_warden: {
    id: 'tutorial_warden', name: 'Tutorial Warden', floor: 1,
    tags: ['construct', 'boss', 'floor'],
    bossType: 'floor',
    hp: 150, atk: 14, def: 8, xp: 300, luck: 3,
    description: 'A hulking construct built by the Management to "gently" educate new crawlers.',
    lootTable: 'floor1_boss',
    sprite: '🤖',
    abilities: ['ground_slam', 'tutorial_laser'],
    intro: 'SYSTEM: "Congratulations, Crawler Carl! You\'ve reached the Floor 1 checkpoint. Please demonstrate your combat aptitude." The Tutorial Warden activates with a cheerful beep.',
  },
};

export const FLOOR1_SPAWNS = [
  { monster: 'dungeon_rat', weight: 30 },
  { monster: 'giant_cockroach', weight: 20 },
  { monster: 'goblin_scavenger', weight: 15 },
  { monster: 'slime_puddle', weight: 12 },
  { monster: 'feral_cat', weight: 10 },
  { monster: 'skeleton_crawler', weight: 8 },
  { monster: 'poison_spider', weight: 5 },
];

export function getMonster(id) {
  const m = MONSTERS[id];
  if (!m) return null;
  return { ...m, currentHp: m.hp, maxHp: m.hp, effects: [] };
}

export function spawnRandomMonster(floor = 1) {
  const table = FLOOR1_SPAWNS;
  const total = table.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return getMonster(entry.monster);
  }
  return getMonster(table[0].monster);
}

export function scaleMonster(monster, floorMult = 1) {
  return {
    ...monster,
    currentHp: Math.floor(monster.hp * floorMult),
    maxHp: Math.floor(monster.hp * floorMult),
    atk: Math.floor(monster.atk * floorMult),
    def: Math.floor(monster.def * floorMult),
  };
}
