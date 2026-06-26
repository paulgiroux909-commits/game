export const SYNERGIES = [
  {
    id: 'exterminator_kit',
    name: 'Exterminator Kit',
    description: '+15% damage vs insects and rodents. Poison effects last 1 extra turn.',
    requiredTags: ['exterminator'],
    minItems: 2,
    effects: { damageVsTags: { insect: 0.15, rodent: 0.15 }, poisonBonusTurns: 1 },
  },
  {
    id: 'donut_entourage',
    name: 'Donut\'s Entourage',
    description: '+3 Luck and +10% crit chance while Donut is active.',
    requiredTags: ['donut'],
    minItems: 2,
    effects: { luckBonus: 3, critBonus: 0.10 },
  },
  {
    id: 'rat_slayer_set',
    name: 'Rat Slayer',
    description: 'Massive +25 damage vs rodents when wielding a rodent-tagged weapon with exterminator gear.',
    requiredTags: ['rodent', 'exterminator'],
    minItems: 2,
    requireWeapon: true,
    effects: { flatDamageVsTag: { rodent: 25 } },
  },
  {
    id: 'lucky_streak',
    name: 'Lucky Streak',
    description: '+5 Luck and 5% chance to find bonus loot on kill.',
    requiredTags: ['luck'],
    minItems: 3,
    effects: { luckBonus: 5, bonusLootChance: 0.05 },
  },
  {
    id: 'crawler_veteran',
    name: 'Crawler Veteran',
    description: '+20% XP gain and +2 to all stats.',
    requiredTags: ['crawler'],
    minItems: 2,
    effects: { xpBonus: 0.20, allStatsBonus: 2 },
  },
  {
    id: 'royal_regalia',
    name: 'Royal Regalia',
    description: 'Donut\'s charm action heals 15 HP. +4 Charisma.',
    requiredTags: ['royal', 'donut'],
    minItems: 2,
    effects: { donutHealBonus: 15, charismaBonus: 4 },
  },
  {
    id: 'poison_master',
    name: 'Poison Master',
    description: 'Poison damage increased by 50%. Attacks have 20% chance to apply poison.',
    requiredTags: ['poison'],
    minItems: 2,
    effects: { poisonDamageMult: 1.5, poisonChance: 0.20 },
  },
  {
    id: 'full_plate',
    name: 'Full Plate',
    description: '+8 Defense when wearing head, chest, legs, and boots.',
    requiredSlots: ['head', 'chest', 'legs', 'boots'],
    minItems: 4,
    effects: { defenseBonus: 8 },
  },
  {
    id: 'celestial_blessing',
    name: 'Celestial Blessing',
    description: 'All stats +3. 10% chance to negate fatal damage once per floor.',
    requiredTags: ['celestial'],
    minItems: 1,
    effects: { allStatsBonus: 3, deathSave: 0.10 },
  },
];

export function checkSynergies(equippedItems) {
  const items = Object.values(equippedItems).filter(Boolean);
  const active = [];

  for (const synergy of SYNERGIES) {
    if (synergy.requiredTags) {
      const tagCounts = {};
      for (const item of items) {
        for (const tag of (item.tags || [])) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
      const met = synergy.requiredTags.every(tag => (tagCounts[tag] || 0) >= 1);
      const totalTagged = synergy.requiredTags.reduce((s, t) => s + (tagCounts[t] || 0), 0);
      if (met && totalTagged >= synergy.minItems) {
        if (synergy.requireWeapon) {
          const hasWeapon = items.some(i => i.slot === 'mainHand');
          if (!hasWeapon) continue;
        }
        active.push(synergy);
      }
    }

    if (synergy.requiredSlots) {
      const filled = synergy.requiredSlots.filter(slot => {
        if (slot.startsWith('charm')) {
          return items.some(i => i.slot === 'charm');
        }
        return equippedItems[slot];
      });
      if (filled.length >= synergy.minItems) {
        active.push(synergy);
      }
    }
  }

  return active;
}

export function getSynergyEffects(activeSynergies) {
  const effects = {
    luckBonus: 0, critBonus: 0, defenseBonus: 0, charismaBonus: 0,
    allStatsBonus: 0, xpBonus: 0, bonusLootChance: 0,
    poisonBonusTurns: 0, poisonDamageMult: 1, poisonChance: 0,
    donutHealBonus: 0, deathSave: 0,
    damageVsTags: {}, flatDamageVsTag: {},
  };

  for (const s of activeSynergies) {
    const e = s.effects;
    if (e.luckBonus) effects.luckBonus += e.luckBonus;
    if (e.critBonus) effects.critBonus += e.critBonus;
    if (e.defenseBonus) effects.defenseBonus += e.defenseBonus;
    if (e.charismaBonus) effects.charismaBonus += e.charismaBonus;
    if (e.allStatsBonus) effects.allStatsBonus += e.allStatsBonus;
    if (e.xpBonus) effects.xpBonus += e.xpBonus;
    if (e.bonusLootChance) effects.bonusLootChance += e.bonusLootChance;
    if (e.poisonBonusTurns) effects.poisonBonusTurns += e.poisonBonusTurns;
    if (e.poisonDamageMult) effects.poisonDamageMult *= e.poisonDamageMult;
    if (e.poisonChance) effects.poisonChance += e.poisonChance;
    if (e.donutHealBonus) effects.donutHealBonus += e.donutHealBonus;
    if (e.deathSave) effects.deathSave = Math.max(effects.deathSave, e.deathSave);
    if (e.damageVsTags) {
      for (const [tag, val] of Object.entries(e.damageVsTags)) {
        effects.damageVsTags[tag] = (effects.damageVsTags[tag] || 0) + val;
      }
    }
    if (e.flatDamageVsTag) {
      for (const [tag, val] of Object.entries(e.flatDamageVsTag)) {
        effects.flatDamageVsTag[tag] = (effects.flatDamageVsTag[tag] || 0) + val;
      }
    }
  }

  return effects;
}
