export const CONFIG = {
  VIEW_W: 960,
  VIEW_H: 600,
  TILE: 48,
  PLAYER_RADIUS: 16,
  DONUT_RADIUS: 11,

  // base movement
  PLAYER_SPEED: 210,      // px / sec
  DONUT_SPEED: 240,

  // combat
  BASE_ATTACK_COOLDOWN: 0.42,  // seconds
  DODGE_COOLDOWN: 1.6,
  DODGE_DURATION: 0.22,
  DODGE_SPEED_MULT: 3.1,

  // regen per second
  STAMINA_REGEN: 14,
  MANA_REGEN: 4,

  // progression
  XP_BASE: 100,
  XP_GROWTH: 1.35,
  STAT_POINTS_PER_LEVEL: 3,

  // difficulty scaling: each floor multiplies enemy power
  FLOOR_HP_SCALE: 1.55,
  FLOOR_DMG_SCALE: 1.4,
};

export const KEYBIND = {
  up: ['w', 'arrowup'],
  down: ['s', 'arrowdown'],
  left: ['a', 'arrowleft'],
  right: ['d', 'arrowright'],
  attack: ['j'],
  donut: ['k'],
  dodge: [' '],
  inventory: ['i', 'tab'],
  interact: ['e'],
  escape: ['escape'],
};
