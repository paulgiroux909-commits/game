import { BASE_STATS, XP_PER_LEVEL, STAT_POINTS_PER_LEVEL } from '../config.js';
import { checkSynergies, getSynergyEffects } from '../data/synergies.js';

export function createPlayer() {
  return {
    name: 'Carl',
    class: 'Exterminator',
    race: 'Human',
    level: 1,
    xp: 0,
    xpToNext: XP_PER_LEVEL(1),
    statPoints: 0,
    baseStats: {
      strength: 8,
      constitution: 7,
      dexterity: 6,
      intelligence: 7,
      wisdom: 5,
      charisma: 4,
      luck: 3,
      explorer: 2,
    },
    bonusStats: { ...BASE_STATS },
    hp: 0,
    maxHp: 0,
    stamina: 50,
    maxStamina: 50,
    mana: 20,
    maxMana: 20,
    equipment: {},
    inventory: [],
    effects: [],
    kills: 0,
    floorsCleared: 0,
    itemsFound: 0,
    deaths: 0,
    skillCooldown: 0,
    donutCooldown: 0,
  };
}

export function createDonut() {
  return {
    name: 'Princess Donut',
    species: 'Persian Cat',
    level: 1,
    loyalty: 100,
    active: true,
    abilities: {
      charm: { name: 'Charm Offensive', heal: 8, cooldown: 3 },
      hiss: { name: 'Royal Hiss', damage: 5, cooldown: 2 },
      distraction: { name: 'Distraction', effect: 'enemy_skip', cooldown: 4 },
    },
    charmCooldown: 0,
    hissCooldown: 0,
  };
}

export function getEffectiveStats(player, synergyEffects = null) {
  const stats = { ...player.baseStats };
  for (const [key, val] of Object.entries(player.bonusStats)) {
    stats[key] = (stats[key] || 0) + val;
  }

  for (const item of Object.values(player.equipment)) {
    if (!item) continue;
    for (const [key, val] of Object.entries(item.stats || {})) {
      stats[key] = (stats[key] || 0) + val;
    }
  }

  if (synergyEffects?.allStatsBonus) {
    for (const key of Object.keys(stats)) {
      stats[key] += synergyEffects.allStatsBonus;
    }
  }
  if (synergyEffects?.luckBonus) stats.luck += synergyEffects.luckBonus;
  if (synergyEffects?.charismaBonus) stats.charisma += synergyEffects.charismaBonus;

  return stats;
}

export function recalculatePlayer(player) {
  const synergies = checkSynergies(player.equipment);
  const synergyEffects = getSynergyEffects(synergies);
  const stats = getEffectiveStats(player, synergyEffects);

  const baseHp = 50 + stats.constitution * 5 + player.level * 10;
  const oldMaxHp = player.maxHp || baseHp;
  player.maxHp = baseHp;
  if (player.hp === 0 || player.hp > player.maxHp) {
    player.hp = player.maxHp;
  } else {
    const ratio = player.hp / oldMaxHp;
    player.hp = Math.min(player.maxHp, Math.floor(player.maxHp * ratio));
  }

  player.maxStamina = 30 + stats.dexterity * 2;
  player.maxMana = 15 + stats.intelligence * 2;
  player.attack = 5 + stats.strength * 2;
  player.defense = 2 + Math.floor(stats.constitution / 2) + (synergyEffects.defenseBonus || 0);
  player.critChance = 0.05 + stats.luck * 0.01 + (synergyEffects.critBonus || 0);
  player.dodgeChance = 0.03 + stats.dexterity * 0.005;
  player.activeSynergies = synergies;
  player.synergyEffects = synergyEffects;

  return player;
}

export function addXp(player, amount) {
  const bonus = player.synergyEffects?.xpBonus || 0;
  player.xp += Math.floor(amount * (1 + bonus));
  let leveled = false;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.statPoints += STAT_POINTS_PER_LEVEL;
    player.xpToNext = XP_PER_LEVEL(player.level);
    leveled = true;
  }
  recalculatePlayer(player);
  return leveled;
}

export function allocateStat(player, stat, amount = 1) {
  if (player.statPoints < amount) return false;
  player.baseStats[stat] = (player.baseStats[stat] || 0) + amount;
  player.statPoints -= amount;
  recalculatePlayer(player);
  return true;
}

export function healPlayer(player, amount) {
  player.hp = Math.min(player.maxHp, player.hp + amount);
}

export function damagePlayer(player, amount) {
  player.hp = Math.max(0, player.hp - amount);
  return player.hp <= 0;
}

export function addToInventory(player, item) {
  if (player.inventory.length >= 30) return false;
  player.inventory.push(item);
  player.itemsFound++;
  return true;
}

export function equipItem(player, item) {
  let slot = item.slot;
  if (slot === 'charm') {
    slot = ['charm1', 'charm2', 'charm3'].find(s => !player.equipment[s]) || 'charm1';
  }

  const current = player.equipment[slot];
  if (current) {
    player.inventory.push(current);
  }

  player.equipment[slot] = item;
  player.inventory = player.inventory.filter(i => i.uid !== item.uid);
  recalculatePlayer(player);
  return slot;
}

export function unequipItem(player, slot) {
  const item = player.equipment[slot];
  if (!item) return false;
  if (player.inventory.length >= 30) return false;
  player.inventory.push(item);
  delete player.equipment[slot];
  recalculatePlayer(player);
  return true;
}

export function tickEffects(player) {
  const remaining = [];
  for (const effect of player.effects) {
    if (effect.type === 'poison') {
      player.hp = Math.max(0, player.hp - effect.damage);
    }
    effect.turns--;
    if (effect.turns > 0) remaining.push(effect);
  }
  player.effects = remaining;
  if (player.skillCooldown > 0) player.skillCooldown--;
  if (player.donutCooldown > 0) player.donutCooldown--;
  return player.hp <= 0;
}
