export const RARITIES = {
  common:     { name: 'Common',     weight: 50.0,  color: '#aaaaaa', multiplier: 1.0 },
  uncommon:   { name: 'Uncommon',   weight: 25.0,  color: '#44cc44', multiplier: 1.3 },
  rare:       { name: 'Rare',       weight: 12.0,  color: '#4488ff', multiplier: 1.6 },
  epic:       { name: 'Epic',       weight: 7.0,   color: '#aa44ff', multiplier: 2.0 },
  legendary:  { name: 'Legendary',  weight: 4.0,   color: '#ff8800', multiplier: 2.5 },
  mythic:     { name: 'Mythic',     weight: 1.5,   color: '#ff2244', multiplier: 3.2 },
  unique:     { name: 'Unique',     weight: 0.4,   color: '#ffd700', multiplier: 4.0 },
  celestial:  { name: 'Celestial',  weight: 0.1,   color: '#ffffff', multiplier: 6.0 },
};

export const EQUIP_SLOTS = [
  'head', 'necklace', 'chest', 'mainHand', 'offHand',
  'hands', 'legs', 'boots', 'charm1', 'charm2', 'charm3',
];

export const SLOT_LABELS = {
  head: 'Head', necklace: 'Necklace', chest: 'Chest',
  mainHand: 'Main Hand', offHand: 'Off Hand',
  hands: 'Hands', legs: 'Legs', boots: 'Boots',
  charm1: 'Charm 1', charm2: 'Charm 2', charm3: 'Charm 3',
};

export const BASE_STATS = {
  strength: 0,
  constitution: 0,
  dexterity: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
  luck: 0,
  explorer: 0,
};

export const STAT_LABELS = {
  strength: 'Strength',
  constitution: 'Constitution',
  dexterity: 'Dexterity',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
  luck: 'Luck',
  explorer: 'Explorer',
};

export const TILE_SIZE = 32;
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;

export const TILES = {
  WALL: 0,
  FLOOR: 1,
  DOOR: 2,
  STAIRS: 3,
  CHEST: 4,
  EVENT: 5,
  BOSS: 6,
  ENTRANCE: 7,
};

export const COLORS = {
  wall: '#2a2a4a',
  floor: '#1a1a2e',
  floorAlt: '#1e1e32',
  player: '#ff4466',
  donut: '#ff88cc',
  monster: '#ff6644',
  boss: '#ff0000',
  chest: '#ffd700',
  stairs: '#44ff88',
  event: '#aa44ff',
  entrance: '#4488ff',
};

export const XP_PER_LEVEL = (level) => Math.floor(50 * Math.pow(1.4, level - 1));
export const STAT_POINTS_PER_LEVEL = 3;

export const FLOOR_SCALE = {
  monsterHpMult: 1.0,
  monsterAtkMult: 1.0,
  lootBonus: 0,
};
