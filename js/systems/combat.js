import { getEffectiveStats } from './player.js';

export function createCombatState(player, monster) {
  return {
    player,
    monster: { ...monster },
    log: [],
    turn: 'player',
    fled: false,
    won: false,
    lost: false,
  };
}

function rollCrit(critChance) {
  return Math.random() < critChance;
}

function rollDodge(dodgeChance) {
  return Math.random() < dodgeChance;
}

function calcDamage(attacker, defender, baseDmg, isCrit, synergyEffects, weapon, defenderTags) {
  let dmg = baseDmg;
  if (isCrit) dmg = Math.floor(dmg * 1.8);

  if (weapon?.onHit?.bonusVsTag && defenderTags) {
    for (const tag of defenderTags) {
      if (weapon.onHit.bonusVsTag === tag) {
        dmg += weapon.onHit.bonusDamage || 0;
      }
    }
  }

  if (synergyEffects?.flatDamageVsTag && defenderTags) {
    for (const tag of defenderTags) {
      dmg += synergyEffects.flatDamageVsTag[tag] || 0;
    }
  }

  if (synergyEffects?.damageVsTags && defenderTags) {
    for (const tag of defenderTags) {
      const bonus = synergyEffects.damageVsTags[tag] || 0;
      dmg = Math.floor(dmg * (1 + bonus));
    }
  }

  const defReduction = Math.floor(defender.def * 0.5);
  dmg = Math.max(1, dmg - defReduction);
  return dmg;
}

export function playerAttack(combat, player) {
  const stats = getEffectiveStats(player, player.synergyEffects);
  const weapon = player.equipment.mainHand;
  const synergyEffects = player.synergyEffects || {};

  if (rollDodge(combat.monster.dodgeChance || 0.02)) {
    combat.log.push({ text: `${combat.monster.name} dodged your attack!`, class: '' });
    return;
  }

  const isCrit = rollCrit(player.critChance);
  let dmg = calcDamage(
    player, combat.monster, player.attack,
    isCrit, synergyEffects, weapon, combat.monster.tags
  );

  combat.monster.currentHp -= dmg;
  combat.log.push({
    text: `You hit ${combat.monster.name} for ${dmg} damage${isCrit ? ' CRITICAL!' : ''}!`,
    class: isCrit ? 'crit' : 'damage',
  });

  if (synergyEffects.poisonChance && Math.random() < synergyEffects.poisonChance) {
    applyPoison(combat.monster, 4, 2 + (synergyEffects.poisonBonusTurns || 0));
    combat.log.push({ text: `${combat.monster.name} is poisoned!`, class: 'damage' });
  }

  if (weapon?.onHit?.effect === 'poison') {
    const turns = (weapon.onHit.turns || 2) + (synergyEffects.poisonBonusTurns || 0);
    const poisonDmg = Math.floor(weapon.onHit.damage * (synergyEffects.poisonDamageMult || 1));
    applyPoison(combat.monster, poisonDmg, turns);
    combat.log.push({ text: `Poison applied to ${combat.monster.name}!`, class: 'damage' });
  }

  if (combat.monster.currentHp <= 0) {
    combat.won = true;
    combat.log.push({ text: `${combat.monster.name} defeated!`, class: 'heal' });
  }
}

export function playerSkill(combat, player) {
  if (player.skillCooldown > 0) {
    combat.log.push({ text: 'Exterminator Strike is on cooldown!', class: '' });
    return;
  }

  const stats = getEffectiveStats(player, player.synergyEffects);
  const baseDmg = player.attack + stats.intelligence * 2 + 10;
  const isCrit = rollCrit(player.critChance + 0.1);

  let dmg = calcDamage(player, combat.monster, baseDmg, isCrit, player.synergyEffects, null, combat.monster.tags);
  dmg = Math.floor(dmg * 1.3);

  combat.monster.currentHp -= dmg;
  player.skillCooldown = 3;
  combat.log.push({
    text: `Exterminator Strike! ${dmg} damage to ${combat.monster.name}${isCrit ? ' CRITICAL!' : ''}!`,
    class: isCrit ? 'crit' : 'damage',
  });

  if (combat.monster.tags?.includes('insect') || combat.monster.tags?.includes('rodent')) {
    const bonus = 8;
    combat.monster.currentHp -= bonus;
    combat.log.push({ text: `Pest control bonus: +${bonus} damage!`, class: 'crit' });
  }

  if (combat.monster.currentHp <= 0) {
    combat.won = true;
    combat.log.push({ text: `${combat.monster.name} defeated!`, class: 'heal' });
  }
}

export function donutAction(combat, player, donut) {
  if (player.donutCooldown > 0) {
    combat.log.push({ text: 'Donut is grooming herself. Try again later.', class: 'donut' });
    return;
  }

  const healBonus = player.synergyEffects?.donutHealBonus || 0;
  const heal = 8 + healBonus + Math.floor(player.baseStats.charisma / 2);
  player.hp = Math.min(player.maxHp, player.hp + heal);
  player.donutCooldown = 3;

  combat.log.push({
    text: `Princess Donut uses Charm Offensive! Carl heals ${heal} HP.`,
    class: 'donut heal',
  });

  if (Math.random() < 0.3 + player.baseStats.luck * 0.02) {
    const dmg = 5 + Math.floor(player.baseStats.charisma / 3);
    combat.monster.currentHp -= dmg;
    combat.log.push({
      text: `Donut's Royal Hiss deals ${dmg} damage to ${combat.monster.name}!`,
      class: 'donut damage',
    });
    if (combat.monster.currentHp <= 0) {
      combat.won = true;
      combat.log.push({ text: `${combat.monster.name} defeated!`, class: 'heal' });
    }
  }
}

export function monsterAttack(combat, player) {
  const monster = combat.monster;

  if (rollDodge(player.dodgeChance)) {
    combat.log.push({ text: 'You dodged the attack!', class: 'heal' });
    return;
  }

  let dmg = monster.atk + Math.floor(Math.random() * 4);
  dmg = Math.max(1, dmg - player.defense);

  player.hp -= dmg;
  combat.log.push({
    text: `${monster.name} hits you for ${dmg} damage!`,
    class: 'damage',
  });

  if (monster.onHit?.effect === 'poison') {
    player.effects.push({
      type: 'poison',
      damage: monster.onHit.damage,
      turns: monster.onHit.turns,
    });
    combat.log.push({ text: 'You are poisoned!', class: 'damage' });
  }

  if (monster.abilities?.includes('plague_bite') && Math.random() < 0.3) {
    player.effects.push({ type: 'poison', damage: 5, turns: 3 });
    combat.log.push({ text: 'Plague Bite! You are badly poisoned!', class: 'damage' });
  }

  if (player.hp <= 0) {
    if (player.synergyEffects?.deathSave && Math.random() < player.synergyEffects.deathSave) {
      player.hp = 1;
      combat.log.push({ text: 'Celestial Blessing saves you from death!', class: 'crit' });
    } else {
      combat.lost = true;
      combat.log.push({ text: 'You have been defeated...', class: 'damage' });
    }
  }
}

function applyPoison(target, damage, turns) {
  if (!target.effects) target.effects = [];
  target.effects.push({ type: 'poison', damage, turns });
}

export function tickMonsterEffects(combat) {
  const monster = combat.monster;
  if (!monster.effects) return;
  const remaining = [];
  for (const effect of monster.effects) {
    if (effect.type === 'poison') {
      monster.currentHp -= effect.damage;
      combat.log.push({
        text: `${monster.name} takes ${effect.damage} poison damage.`,
        class: 'damage',
      });
    }
    effect.turns--;
    if (effect.turns > 0) remaining.push(effect);
  }
  monster.effects = remaining;
  if (monster.currentHp <= 0) {
    combat.won = true;
    combat.log.push({ text: `${monster.name} succumbed to poison!`, class: 'heal' });
  }
}

export function tryFlee(combat, player) {
  const stats = getEffectiveStats(player);
  const fleeChance = 0.3 + stats.dexterity * 0.02;
  if (combat.monster.bossType || Math.random() > fleeChance) {
    combat.log.push({ text: 'Failed to flee!', class: 'damage' });
    return false;
  }
  combat.fled = true;
  combat.log.push({ text: 'You escaped!', class: 'heal' });
  return true;
}

export function bossSpecialAbility(combat, player) {
  const monster = combat.monster;
  if (!monster.abilities || monster.abilities.length === 0) return;

  const ability = monster.abilities[Math.floor(Math.random() * monster.abilities.length)];

  switch (ability) {
    case 'summon_rats': {
      const dmg = 6;
      player.hp -= dmg;
      combat.log.push({ text: `Rat King summons a rat swarm! ${dmg} damage!`, class: 'damage' });
      break;
    }
    case 'plague_bite': {
      player.effects.push({ type: 'poison', damage: 6, turns: 3 });
      combat.log.push({ text: 'Plague Bite! Nasty poison!', class: 'damage' });
      break;
    }
    case 'ground_slam': {
      const dmg = 12;
      player.hp -= Math.max(1, dmg - player.defense);
      combat.log.push({ text: `Tutorial Warden uses Ground Slam! ${dmg} damage!`, class: 'damage' });
      break;
    }
    case 'tutorial_laser': {
      const dmg = 8;
      player.hp -= Math.max(1, dmg - player.defense);
      combat.log.push({ text: 'Tutorial Laser! PEW PEW! ' + dmg + ' damage!', class: 'damage' });
      break;
    }
  }

  if (player.hp <= 0) combat.lost = true;
}
