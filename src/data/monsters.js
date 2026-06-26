// Monster archetypes. base stats are for the floor on which they first appear.
// behavior: 'chaser' (melee), 'shooter' (ranged), 'charger' (dashes), 'bruiser' (slow tanky)
// `tier`: 'normal' | 'neighborhood' (mini-boss) | 'floor' (floor boss)

export const MONSTERS = {
  // -------- FLOOR 1 NORMALS --------
  brain_rat: {
    id: 'brain_rat', name: 'Brain Rat', tier: 'normal', behavior: 'chaser',
    color: '#a9657a', radius: 14, hp: 26, damage: 7, speed: 95, xp: 14, gold: [2, 6],
    desc: 'A rat the size of a dog with a wrinkled, exposed brain. It is smarter than it looks. That is not a compliment.',
  },
  cave_goblin: {
    id: 'cave_goblin', name: 'Cave Goblin', tier: 'normal', behavior: 'chaser',
    color: '#6aa84f', radius: 15, hp: 34, damage: 9, speed: 78, xp: 18, gold: [4, 9],
    desc: 'A snickering green goblin clutching a sharpened spoon. Works in packs and bad puns.',
  },
  goo_blob: {
    id: 'goo_blob', name: 'Sentient Goo', tier: 'normal', behavior: 'bruiser',
    color: '#7ad1c8', radius: 19, hp: 60, damage: 11, speed: 42, xp: 22, gold: [3, 8],
    desc: 'A jiggling blob of biohazard. Slow, but splits your patience and your HP.',
  },
  goblin_slinger: {
    id: 'goblin_slinger', name: 'Goblin Slinger', tier: 'normal', behavior: 'shooter',
    color: '#9fbf3b', radius: 14, hp: 24, damage: 8, speed: 70, xp: 20, gold: [5, 11],
    projectileSpeed: 230, range: 320,
    desc: 'A goblin with a slingshot and a grudge. Keeps its distance and your blood pressure high.',
  },
  feral_dog: {
    id: 'feral_dog', name: 'Feral Hellhound', tier: 'normal', behavior: 'charger',
    color: '#8a5a2b', radius: 15, hp: 30, damage: 12, speed: 120, xp: 24, gold: [4, 10],
    desc: 'Once someone\'s good boy. Now it has too many teeth and a taste for crawlers.',
  },

  // -------- FLOOR 1 NEIGHBORHOOD BOSSES (mini-bosses) --------
  goblin_king: {
    id: 'goblin_king', name: 'King Snotsworth III', tier: 'neighborhood', behavior: 'bruiser',
    color: '#3c7a1e', radius: 26, hp: 240, damage: 18, speed: 60, xp: 140, gold: [40, 70],
    desc: 'Self-crowned ruler of the goblin tunnels. Wields a golden plunger as a scepter and means business.',
  },
  the_porter: {
    id: 'the_porter', name: 'The Porter', tier: 'neighborhood', behavior: 'charger',
    color: '#b5651d', radius: 28, hp: 300, damage: 22, speed: 95, xp: 160, gold: [50, 90],
    desc: 'A hulking figure that "relocates" crawlers — usually into a wall. Charges in a straight, devastating line.',
  },
  madame_whiskers: {
    id: 'madame_whiskers', name: 'Madame Whiskers', tier: 'neighborhood', behavior: 'shooter',
    color: '#c47ab0', radius: 24, hp: 210, damage: 16, speed: 80, xp: 150, gold: [45, 80],
    projectileSpeed: 250, range: 360,
    desc: 'A monstrous alley cat the size of a fridge. Donut refuses to acknowledge a rival exists.',
  },

  // -------- FLOOR 1 BOSS --------
  the_maw: {
    id: 'the_maw', name: 'The Hungry Maw of Floor One', tier: 'floor', behavior: 'bruiser',
    color: '#9b1d2e', radius: 40, hp: 900, damage: 28, speed: 55, xp: 600, gold: [180, 320],
    enrageHp: 0.4,
    desc: 'A writhing mass of teeth, doors, and screaming furniture — the dungeon\'s own appetite given form. Beat it to descend to Floor 2. The whole galaxy is watching.',
  },

  // -------- DEEPER FLOOR NORMALS (for scaling demo beyond floor 1) --------
  iron_construct: {
    id: 'iron_construct', name: 'Rust Construct', tier: 'normal', behavior: 'bruiser',
    color: '#9a9a9a', radius: 18, hp: 70, damage: 14, speed: 50, xp: 30, gold: [6, 14],
    desc: 'Scrap metal animated by spite and System code.',
  },
  shadow_stalker: {
    id: 'shadow_stalker', name: 'Shadow Stalker', tier: 'normal', behavior: 'charger',
    color: '#3a2a55', radius: 14, hp: 40, damage: 15, speed: 135, xp: 32, gold: [7, 15],
    desc: 'You only see it right before it reaches you. Then it is too late.',
  },
};

// Floor 1 spawn pools.
export const FLOOR_DEFS = {
  1: {
    name: 'Floor 1',
    subtitle: 'The Ruined Sublevels',
    theme: { floor: '#171420', wall: '#2a2336', accent: '#3a2f4d' },
    normals: ['brain_rat', 'cave_goblin', 'goo_blob', 'goblin_slinger', 'feral_dog'],
    neighborhoodBosses: ['goblin_king', 'the_porter', 'madame_whiskers'],
    floorBoss: 'the_maw',
  },
  2: {
    name: 'Floor 2',
    subtitle: 'The Bottom of the Stairs',
    theme: { floor: '#101a18', wall: '#1d2e2a', accent: '#2c4a40' },
    normals: ['brain_rat', 'goblin_slinger', 'feral_dog', 'iron_construct', 'shadow_stalker'],
    neighborhoodBosses: ['the_porter', 'madame_whiskers', 'goblin_king'],
    floorBoss: 'the_maw',
  },
};

export function getFloorDef(floor) {
  return FLOOR_DEFS[floor] || {
    ...FLOOR_DEFS[2],
    name: `Floor ${floor}`,
    subtitle: 'Deeper into the Dark',
  };
}
