(() => {
  // js/config.js
  var RARITIES = {
    common: { name: "Common", weight: 50, color: "#aaaaaa", multiplier: 1 },
    uncommon: { name: "Uncommon", weight: 25, color: "#44cc44", multiplier: 1.3 },
    rare: { name: "Rare", weight: 12, color: "#4488ff", multiplier: 1.6 },
    epic: { name: "Epic", weight: 7, color: "#aa44ff", multiplier: 2 },
    legendary: { name: "Legendary", weight: 4, color: "#ff8800", multiplier: 2.5 },
    mythic: { name: "Mythic", weight: 1.5, color: "#ff2244", multiplier: 3.2 },
    unique: { name: "Unique", weight: 0.4, color: "#ffd700", multiplier: 4 },
    celestial: { name: "Celestial", weight: 0.1, color: "#ffffff", multiplier: 6 }
  };
  var SLOT_LABELS = {
    head: "Head",
    necklace: "Necklace",
    chest: "Chest",
    mainHand: "Main Hand",
    offHand: "Off Hand",
    hands: "Hands",
    legs: "Legs",
    boots: "Boots",
    charm1: "Charm 1",
    charm2: "Charm 2",
    charm3: "Charm 3"
  };
  var BASE_STATS = {
    strength: 0,
    constitution: 0,
    dexterity: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
    luck: 0,
    explorer: 0
  };
  var STAT_LABELS = {
    strength: "Strength",
    constitution: "Constitution",
    dexterity: "Dexterity",
    intelligence: "Intelligence",
    wisdom: "Wisdom",
    charisma: "Charisma",
    luck: "Luck",
    explorer: "Explorer"
  };
  var TILE_SIZE = 32;
  var MAP_WIDTH = 40;
  var MAP_HEIGHT = 30;
  var TILES = {
    WALL: 0,
    FLOOR: 1,
    DOOR: 2,
    STAIRS: 3,
    CHEST: 4,
    EVENT: 5,
    BOSS: 6,
    ENTRANCE: 7
  };
  var COLORS = {
    wall: "#2a2a4a",
    floor: "#1a1a2e",
    floorAlt: "#1e1e32",
    player: "#ff4466",
    donut: "#ff88cc",
    monster: "#ff6644",
    boss: "#ff0000",
    chest: "#ffd700",
    stairs: "#44ff88",
    event: "#aa44ff",
    entrance: "#4488ff"
  };
  var XP_PER_LEVEL = (level) => Math.floor(50 * Math.pow(1.4, level - 1));
  var STAT_POINTS_PER_LEVEL = 3;

  // js/data/synergies.js
  var SYNERGIES = [
    {
      id: "exterminator_kit",
      name: "Exterminator Kit",
      description: "+15% damage vs insects and rodents. Poison effects last 1 extra turn.",
      requiredTags: ["exterminator"],
      minItems: 2,
      effects: { damageVsTags: { insect: 0.15, rodent: 0.15 }, poisonBonusTurns: 1 }
    },
    {
      id: "donut_entourage",
      name: "Donut's Entourage",
      description: "+3 Luck and +10% crit chance while Donut is active.",
      requiredTags: ["donut"],
      minItems: 2,
      effects: { luckBonus: 3, critBonus: 0.1 }
    },
    {
      id: "rat_slayer_set",
      name: "Rat Slayer",
      description: "Massive +25 damage vs rodents when wielding a rodent-tagged weapon with exterminator gear.",
      requiredTags: ["rodent", "exterminator"],
      minItems: 2,
      requireWeapon: true,
      effects: { flatDamageVsTag: { rodent: 25 } }
    },
    {
      id: "lucky_streak",
      name: "Lucky Streak",
      description: "+5 Luck and 5% chance to find bonus loot on kill.",
      requiredTags: ["luck"],
      minItems: 3,
      effects: { luckBonus: 5, bonusLootChance: 0.05 }
    },
    {
      id: "crawler_veteran",
      name: "Crawler Veteran",
      description: "+20% XP gain and +2 to all stats.",
      requiredTags: ["crawler"],
      minItems: 2,
      effects: { xpBonus: 0.2, allStatsBonus: 2 }
    },
    {
      id: "royal_regalia",
      name: "Royal Regalia",
      description: "Donut's charm action heals 15 HP. +4 Charisma.",
      requiredTags: ["royal", "donut"],
      minItems: 2,
      effects: { donutHealBonus: 15, charismaBonus: 4 }
    },
    {
      id: "poison_master",
      name: "Poison Master",
      description: "Poison damage increased by 50%. Attacks have 20% chance to apply poison.",
      requiredTags: ["poison"],
      minItems: 2,
      effects: { poisonDamageMult: 1.5, poisonChance: 0.2 }
    },
    {
      id: "full_plate",
      name: "Full Plate",
      description: "+8 Defense when wearing head, chest, legs, and boots.",
      requiredSlots: ["head", "chest", "legs", "boots"],
      minItems: 4,
      effects: { defenseBonus: 8 }
    },
    {
      id: "celestial_blessing",
      name: "Celestial Blessing",
      description: "All stats +3. 10% chance to negate fatal damage once per floor.",
      requiredTags: ["celestial"],
      minItems: 1,
      effects: { allStatsBonus: 3, deathSave: 0.1 }
    }
  ];
  function checkSynergies(equippedItems) {
    const items = Object.values(equippedItems).filter(Boolean);
    const active = [];
    for (const synergy of SYNERGIES) {
      if (synergy.requiredTags) {
        const tagCounts = {};
        for (const item of items) {
          for (const tag of item.tags || []) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        }
        const met = synergy.requiredTags.every((tag) => (tagCounts[tag] || 0) >= 1);
        const totalTagged = synergy.requiredTags.reduce((s, t) => s + (tagCounts[t] || 0), 0);
        if (met && totalTagged >= synergy.minItems) {
          if (synergy.requireWeapon) {
            const hasWeapon = items.some((i) => i.slot === "mainHand");
            if (!hasWeapon) continue;
          }
          active.push(synergy);
        }
      }
      if (synergy.requiredSlots) {
        const filled = synergy.requiredSlots.filter((slot) => {
          if (slot.startsWith("charm")) {
            return items.some((i) => i.slot === "charm");
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
  function getSynergyEffects(activeSynergies) {
    const effects = {
      luckBonus: 0,
      critBonus: 0,
      defenseBonus: 0,
      charismaBonus: 0,
      allStatsBonus: 0,
      xpBonus: 0,
      bonusLootChance: 0,
      poisonBonusTurns: 0,
      poisonDamageMult: 1,
      poisonChance: 0,
      donutHealBonus: 0,
      deathSave: 0,
      damageVsTags: {},
      flatDamageVsTag: {}
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

  // js/systems/player.js
  function createPlayer() {
    return {
      name: "Carl",
      class: "Exterminator",
      race: "Human",
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
        explorer: 2
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
      donutCooldown: 0
    };
  }
  function createDonut() {
    return {
      name: "Princess Donut",
      species: "Persian Cat",
      level: 1,
      loyalty: 100,
      active: true,
      abilities: {
        charm: { name: "Charm Offensive", heal: 8, cooldown: 3 },
        hiss: { name: "Royal Hiss", damage: 5, cooldown: 2 },
        distraction: { name: "Distraction", effect: "enemy_skip", cooldown: 4 }
      },
      charmCooldown: 0,
      hissCooldown: 0
    };
  }
  function getEffectiveStats(player, synergyEffects = null) {
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
  function recalculatePlayer(player) {
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
    player.dodgeChance = 0.03 + stats.dexterity * 5e-3;
    player.activeSynergies = synergies;
    player.synergyEffects = synergyEffects;
    return player;
  }
  function addXp(player, amount) {
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
  function allocateStat(player, stat, amount = 1) {
    if (player.statPoints < amount) return false;
    player.baseStats[stat] = (player.baseStats[stat] || 0) + amount;
    player.statPoints -= amount;
    recalculatePlayer(player);
    return true;
  }
  function healPlayer(player, amount) {
    player.hp = Math.min(player.maxHp, player.hp + amount);
  }
  function addToInventory(player, item) {
    if (player.inventory.length >= 30) return false;
    player.inventory.push(item);
    player.itemsFound++;
    return true;
  }
  function equipItem(player, item) {
    let slot = item.slot;
    if (slot === "charm") {
      slot = ["charm1", "charm2", "charm3"].find((s) => !player.equipment[s]) || "charm1";
    }
    const current = player.equipment[slot];
    if (current) {
      player.inventory.push(current);
    }
    player.equipment[slot] = item;
    player.inventory = player.inventory.filter((i) => i.uid !== item.uid);
    recalculatePlayer(player);
    return slot;
  }
  function unequipItem(player, slot) {
    const item = player.equipment[slot];
    if (!item) return false;
    if (player.inventory.length >= 30) return false;
    player.inventory.push(item);
    delete player.equipment[slot];
    recalculatePlayer(player);
    return true;
  }

  // js/systems/dungeon.js
  function generateFloor1() {
    const map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        map[y][x] = TILES.WALL;
      }
    }
    const rooms = [];
    const numRooms = 10 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numRooms * 3; i++) {
      const w = 4 + Math.floor(Math.random() * 6);
      const h = 4 + Math.floor(Math.random() * 5);
      const x = 1 + Math.floor(Math.random() * (MAP_WIDTH - w - 2));
      const y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - h - 2));
      const room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };
      let overlap = false;
      for (const other of rooms) {
        if (room.x - 1 < other.x + other.w + 1 && room.x + room.w + 1 > other.x - 1 && room.y - 1 < other.y + other.h + 1 && room.y + room.h + 1 > other.y - 1) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        carveRoom(map, room);
        rooms.push(room);
        if (rooms.length >= numRooms) break;
      }
    }
    for (let i = 1; i < rooms.length; i++) {
      connectRooms(map, rooms[i - 1], rooms[i]);
    }
    const entities = [];
    const playerStart = { x: rooms[0].cx, y: rooms[0].cy };
    map[playerStart.y][playerStart.x] = TILES.ENTRANCE;
    const bossRoom = rooms[rooms.length - 1];
    map[bossRoom.cy][bossRoom.cx] = TILES.BOSS;
    entities.push({
      type: "boss",
      id: "tutorial_warden",
      x: bossRoom.cx,
      y: bossRoom.cy,
      defeated: false
    });
    const neighborhoodRoom = rooms[Math.floor(rooms.length / 2)];
    map[neighborhoodRoom.cy][neighborhoodRoom.cx] = TILES.BOSS;
    entities.push({
      type: "neighborhood_boss",
      id: "rat_king",
      x: neighborhoodRoom.cx,
      y: neighborhoodRoom.cy,
      defeated: false
    });
    const usedPositions = /* @__PURE__ */ new Set([
      `${playerStart.x},${playerStart.y}`,
      `${bossRoom.cx},${bossRoom.cy}`,
      `${neighborhoodRoom.cx},${neighborhoodRoom.cy}`
    ]);
    for (let i = 1; i < rooms.length - 1; i++) {
      const room = rooms[i];
      if (room === neighborhoodRoom) continue;
      if (Math.random() < 0.6) {
        const pos = findFreeTile(map, room, usedPositions);
        if (pos) {
          entities.push({ type: "monster", x: pos.x, y: pos.y, defeated: false });
          usedPositions.add(`${pos.x},${pos.y}`);
        }
      }
      if (Math.random() < 0.35) {
        const pos = findFreeTile(map, room, usedPositions);
        if (pos) {
          map[pos.y][pos.x] = TILES.CHEST;
          entities.push({ type: "chest", x: pos.x, y: pos.y, opened: false });
          usedPositions.add(`${pos.x},${pos.y}`);
        }
      }
      if (Math.random() < 0.2) {
        const pos = findFreeTile(map, room, usedPositions);
        if (pos) {
          map[pos.y][pos.x] = TILES.EVENT;
          entities.push({ type: "event", x: pos.x, y: pos.y, triggered: false });
          usedPositions.add(`${pos.x},${pos.y}`);
        }
      }
    }
    const stairsRoom = rooms[rooms.length - 2] || bossRoom;
    const stairsPos = findFreeTile(map, stairsRoom, usedPositions);
    if (stairsPos) {
      map[stairsPos.y][stairsPos.x] = TILES.STAIRS;
      entities.push({ type: "stairs", x: stairsPos.x, y: stairsPos.y, locked: true });
    }
    return {
      map,
      rooms,
      entities,
      playerPos: playerStart,
      explored: /* @__PURE__ */ new Set([`${playerStart.x},${playerStart.y}`]),
      floor: 1,
      name: "The Tutorial Labyrinth"
    };
  }
  function carveRoom(map, room) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        map[y][x] = TILES.FLOOR;
      }
    }
  }
  function connectRooms(map, a, b) {
    let x = a.cx, y = a.cy;
    while (x !== b.cx) {
      map[y][x] = TILES.FLOOR;
      x += x < b.cx ? 1 : -1;
    }
    while (y !== b.cy) {
      map[y][x] = TILES.FLOOR;
      y += y < b.cy ? 1 : -1;
    }
  }
  function findFreeTile(map, room, used) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      if (map[y][x] === TILES.FLOOR && !used.has(`${x},${y}`)) {
        return { x, y };
      }
    }
    return null;
  }
  function isWalkable(map, x, y) {
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return false;
    const tile = map[y][x];
    return tile === TILES.FLOOR || tile === TILES.DOOR || tile === TILES.ENTRANCE || tile === TILES.STAIRS || tile === TILES.CHEST || tile === TILES.EVENT || tile === TILES.BOSS;
  }
  function getEntityAt(entities, x, y) {
    return entities.find((e) => e.x === x && e.y === y && !e.defeated && !e.opened && !e.triggered);
  }
  function movePlayer(dungeon, dx, dy) {
    const nx = dungeon.playerPos.x + dx;
    const ny = dungeon.playerPos.y + dy;
    if (!isWalkable(dungeon.map, nx, ny)) return null;
    const entity = getEntityAt(dungeon.entities, nx, ny);
    if (entity) return { moved: false, entity, nx, ny };
    dungeon.playerPos = { x: nx, y: ny };
    dungeon.explored.add(`${nx},${ny}`);
    return { moved: true, entity: null };
  }

  // js/data/monsters.js
  var MONSTERS = {
    // Floor 1 regular monsters
    dungeon_rat: {
      id: "dungeon_rat",
      name: "Dungeon Rat",
      floor: 1,
      tags: ["rodent", "beast"],
      hp: 15,
      atk: 4,
      def: 1,
      xp: 12,
      luck: 0,
      description: "A rat the size of a small dog. Its eyes glow with dungeon malice.",
      lootTable: "floor1_common",
      sprite: "🐀"
    },
    giant_cockroach: {
      id: "giant_cockroach",
      name: "Giant Cockroach",
      floor: 1,
      tags: ["insect", "beast"],
      hp: 20,
      atk: 5,
      def: 2,
      xp: 15,
      luck: 0,
      description: "Carl's professional nemesis, now dungeon-sized.",
      lootTable: "floor1_common",
      sprite: "🪳"
    },
    goblin_scavenger: {
      id: "goblin_scavenger",
      name: "Goblin Scavenger",
      floor: 1,
      tags: ["goblin", "humanoid"],
      hp: 25,
      atk: 6,
      def: 3,
      xp: 20,
      luck: 1,
      description: "A scrawny goblin picking through other crawlers' remains.",
      lootTable: "floor1_common",
      sprite: "👺"
    },
    slime_puddle: {
      id: "slime_puddle",
      name: "Slime Puddle",
      floor: 1,
      tags: ["ooze", "beast"],
      hp: 30,
      atk: 4,
      def: 5,
      xp: 18,
      luck: 0,
      description: "A gelatinous mass blocking the corridor. Very gross.",
      lootTable: "floor1_common",
      sprite: "🟢"
    },
    feral_cat: {
      id: "feral_cat",
      name: "Feral Dungeon Cat",
      floor: 1,
      tags: ["beast", "feline"],
      hp: 18,
      atk: 7,
      def: 1,
      xp: 16,
      luck: 2,
      description: "Donut hisses at it. It hisses back. Diplomatic incident.",
      lootTable: "floor1_common",
      sprite: "🐱"
    },
    skeleton_crawler: {
      id: "skeleton_crawler",
      name: "Skeleton Crawler",
      floor: 1,
      tags: ["undead", "humanoid"],
      hp: 22,
      atk: 6,
      def: 4,
      xp: 22,
      luck: 0,
      description: "A previous contestant who didn't make it. A cautionary tale.",
      lootTable: "floor1_common",
      sprite: "💀"
    },
    poison_spider: {
      id: "poison_spider",
      name: "Poison Spider",
      floor: 1,
      tags: ["insect", "poison"],
      hp: 16,
      atk: 5,
      def: 1,
      xp: 14,
      luck: 0,
      description: "Eight legs of NOPE.",
      onHit: { effect: "poison", damage: 3, turns: 2 },
      lootTable: "floor1_common",
      sprite: "🕷️"
    },
    // Neighborhood Boss
    rat_king: {
      id: "rat_king",
      name: "Rat King",
      floor: 1,
      tags: ["rodent", "boss", "neighborhood"],
      bossType: "neighborhood",
      hp: 80,
      atk: 10,
      def: 5,
      xp: 100,
      luck: 2,
      description: "A writhing mass of rats fused into a crown-wearing horror. Rules the eastern warrens.",
      lootTable: "floor1_neighborhood",
      sprite: "👑",
      abilities: ["summon_rats", "plague_bite"],
      intro: 'The Rat King emerges from a pile of squealing bodies. "Squeak squeak," it seems to say. Carl understands: it wants to fight.'
    },
    // Floor Boss
    tutorial_warden: {
      id: "tutorial_warden",
      name: "Tutorial Warden",
      floor: 1,
      tags: ["construct", "boss", "floor"],
      bossType: "floor",
      hp: 150,
      atk: 14,
      def: 8,
      xp: 300,
      luck: 3,
      description: 'A hulking construct built by the Management to "gently" educate new crawlers.',
      lootTable: "floor1_boss",
      sprite: "🤖",
      abilities: ["ground_slam", "tutorial_laser"],
      intro: `SYSTEM: "Congratulations, Crawler Carl! You've reached the Floor 1 checkpoint. Please demonstrate your combat aptitude." The Tutorial Warden activates with a cheerful beep.`
    }
  };
  var FLOOR1_SPAWNS = [
    { monster: "dungeon_rat", weight: 30 },
    { monster: "giant_cockroach", weight: 20 },
    { monster: "goblin_scavenger", weight: 15 },
    { monster: "slime_puddle", weight: 12 },
    { monster: "feral_cat", weight: 10 },
    { monster: "skeleton_crawler", weight: 8 },
    { monster: "poison_spider", weight: 5 }
  ];
  function getMonster(id) {
    const m = MONSTERS[id];
    if (!m) return null;
    return { ...m, currentHp: m.hp, maxHp: m.hp, effects: [] };
  }
  function spawnRandomMonster(floor = 1) {
    const table = FLOOR1_SPAWNS;
    const total = table.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    for (const entry of table) {
      roll -= entry.weight;
      if (roll <= 0) return getMonster(entry.monster);
    }
    return getMonster(table[0].monster);
  }
  function scaleMonster(monster, floorMult = 1) {
    return {
      ...monster,
      currentHp: Math.floor(monster.hp * floorMult),
      maxHp: Math.floor(monster.hp * floorMult),
      atk: Math.floor(monster.atk * floorMult),
      def: Math.floor(monster.def * floorMult)
    };
  }

  // js/systems/combat.js
  function createCombatState(player, monster) {
    return {
      player,
      monster: { ...monster },
      log: [],
      turn: "player",
      fled: false,
      won: false,
      lost: false
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
  function playerAttack(combat, player) {
    const stats = getEffectiveStats(player, player.synergyEffects);
    const weapon = player.equipment.mainHand;
    const synergyEffects = player.synergyEffects || {};
    if (rollDodge(combat.monster.dodgeChance || 0.02)) {
      combat.log.push({ text: `${combat.monster.name} dodged your attack!`, class: "" });
      return;
    }
    const isCrit = rollCrit(player.critChance);
    let dmg = calcDamage(
      player,
      combat.monster,
      player.attack,
      isCrit,
      synergyEffects,
      weapon,
      combat.monster.tags
    );
    combat.monster.currentHp -= dmg;
    combat.log.push({
      text: `You hit ${combat.monster.name} for ${dmg} damage${isCrit ? " CRITICAL!" : ""}!`,
      class: isCrit ? "crit" : "damage"
    });
    if (synergyEffects.poisonChance && Math.random() < synergyEffects.poisonChance) {
      applyPoison(combat.monster, 4, 2 + (synergyEffects.poisonBonusTurns || 0));
      combat.log.push({ text: `${combat.monster.name} is poisoned!`, class: "damage" });
    }
    if (weapon?.onHit?.effect === "poison") {
      const turns = (weapon.onHit.turns || 2) + (synergyEffects.poisonBonusTurns || 0);
      const poisonDmg = Math.floor(weapon.onHit.damage * (synergyEffects.poisonDamageMult || 1));
      applyPoison(combat.monster, poisonDmg, turns);
      combat.log.push({ text: `Poison applied to ${combat.monster.name}!`, class: "damage" });
    }
    if (combat.monster.currentHp <= 0) {
      combat.won = true;
      combat.log.push({ text: `${combat.monster.name} defeated!`, class: "heal" });
    }
  }
  function playerSkill(combat, player) {
    if (player.skillCooldown > 0) {
      combat.log.push({ text: "Exterminator Strike is on cooldown!", class: "" });
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
      text: `Exterminator Strike! ${dmg} damage to ${combat.monster.name}${isCrit ? " CRITICAL!" : ""}!`,
      class: isCrit ? "crit" : "damage"
    });
    if (combat.monster.tags?.includes("insect") || combat.monster.tags?.includes("rodent")) {
      const bonus = 8;
      combat.monster.currentHp -= bonus;
      combat.log.push({ text: `Pest control bonus: +${bonus} damage!`, class: "crit" });
    }
    if (combat.monster.currentHp <= 0) {
      combat.won = true;
      combat.log.push({ text: `${combat.monster.name} defeated!`, class: "heal" });
    }
  }
  function donutAction(combat, player, donut) {
    if (player.donutCooldown > 0) {
      combat.log.push({ text: "Donut is grooming herself. Try again later.", class: "donut" });
      return;
    }
    const healBonus = player.synergyEffects?.donutHealBonus || 0;
    const heal = 8 + healBonus + Math.floor(player.baseStats.charisma / 2);
    player.hp = Math.min(player.maxHp, player.hp + heal);
    player.donutCooldown = 3;
    combat.log.push({
      text: `Princess Donut uses Charm Offensive! Carl heals ${heal} HP.`,
      class: "donut heal"
    });
    if (Math.random() < 0.3 + player.baseStats.luck * 0.02) {
      const dmg = 5 + Math.floor(player.baseStats.charisma / 3);
      combat.monster.currentHp -= dmg;
      combat.log.push({
        text: `Donut's Royal Hiss deals ${dmg} damage to ${combat.monster.name}!`,
        class: "donut damage"
      });
      if (combat.monster.currentHp <= 0) {
        combat.won = true;
        combat.log.push({ text: `${combat.monster.name} defeated!`, class: "heal" });
      }
    }
  }
  function monsterAttack(combat, player) {
    const monster = combat.monster;
    if (rollDodge(player.dodgeChance)) {
      combat.log.push({ text: "You dodged the attack!", class: "heal" });
      return;
    }
    let dmg = monster.atk + Math.floor(Math.random() * 4);
    dmg = Math.max(1, dmg - player.defense);
    player.hp -= dmg;
    combat.log.push({
      text: `${monster.name} hits you for ${dmg} damage!`,
      class: "damage"
    });
    if (monster.onHit?.effect === "poison") {
      player.effects.push({
        type: "poison",
        damage: monster.onHit.damage,
        turns: monster.onHit.turns
      });
      combat.log.push({ text: "You are poisoned!", class: "damage" });
    }
    if (monster.abilities?.includes("plague_bite") && Math.random() < 0.3) {
      player.effects.push({ type: "poison", damage: 5, turns: 3 });
      combat.log.push({ text: "Plague Bite! You are badly poisoned!", class: "damage" });
    }
    if (player.hp <= 0) {
      if (player.synergyEffects?.deathSave && Math.random() < player.synergyEffects.deathSave) {
        player.hp = 1;
        combat.log.push({ text: "Celestial Blessing saves you from death!", class: "crit" });
      } else {
        combat.lost = true;
        combat.log.push({ text: "You have been defeated...", class: "damage" });
      }
    }
  }
  function applyPoison(target, damage, turns) {
    if (!target.effects) target.effects = [];
    target.effects.push({ type: "poison", damage, turns });
  }
  function tickMonsterEffects(combat) {
    const monster = combat.monster;
    if (!monster.effects) return;
    const remaining = [];
    for (const effect of monster.effects) {
      if (effect.type === "poison") {
        monster.currentHp -= effect.damage;
        combat.log.push({
          text: `${monster.name} takes ${effect.damage} poison damage.`,
          class: "damage"
        });
      }
      effect.turns--;
      if (effect.turns > 0) remaining.push(effect);
    }
    monster.effects = remaining;
    if (monster.currentHp <= 0) {
      combat.won = true;
      combat.log.push({ text: `${monster.name} succumbed to poison!`, class: "heal" });
    }
  }
  function tryFlee(combat, player) {
    const stats = getEffectiveStats(player);
    const fleeChance = 0.3 + stats.dexterity * 0.02;
    if (combat.monster.bossType || Math.random() > fleeChance) {
      combat.log.push({ text: "Failed to flee!", class: "damage" });
      return false;
    }
    combat.fled = true;
    combat.log.push({ text: "You escaped!", class: "heal" });
    return true;
  }
  function bossSpecialAbility(combat, player) {
    const monster = combat.monster;
    if (!monster.abilities || monster.abilities.length === 0) return;
    const ability = monster.abilities[Math.floor(Math.random() * monster.abilities.length)];
    switch (ability) {
      case "summon_rats": {
        const dmg = 6;
        player.hp -= dmg;
        combat.log.push({ text: `Rat King summons a rat swarm! ${dmg} damage!`, class: "damage" });
        break;
      }
      case "plague_bite": {
        player.effects.push({ type: "poison", damage: 6, turns: 3 });
        combat.log.push({ text: "Plague Bite! Nasty poison!", class: "damage" });
        break;
      }
      case "ground_slam": {
        const dmg = 12;
        player.hp -= Math.max(1, dmg - player.defense);
        combat.log.push({ text: `Tutorial Warden uses Ground Slam! ${dmg} damage!`, class: "damage" });
        break;
      }
      case "tutorial_laser": {
        const dmg = 8;
        player.hp -= Math.max(1, dmg - player.defense);
        combat.log.push({ text: "Tutorial Laser! PEW PEW! " + dmg + " damage!", class: "damage" });
        break;
      }
    }
    if (player.hp <= 0) combat.lost = true;
  }

  // js/data/items.js
  var ITEMS = {
    // --- COMMON ---
    rusty_pipe: {
      id: "rusty_pipe",
      name: "Rusty Pipe",
      slot: "mainHand",
      rarity: "common",
      tags: ["blunt", "exterminator"],
      stats: { strength: 2 },
      description: "A dented pipe. Better than bare fists in a dungeon full of rats."
    },
    torn_hoodie: {
      id: "torn_hoodie",
      name: "Torn Hoodie",
      slot: "chest",
      rarity: "common",
      tags: ["cloth"],
      stats: { constitution: 1 },
      description: "Carl's lucky hoodie. It's seen better days."
    },
    work_boots: {
      id: "work_boots",
      name: "Work Boots",
      slot: "boots",
      rarity: "common",
      tags: ["exterminator"],
      stats: { constitution: 1, dexterity: 1 },
      description: "Steel-toed boots from the exterminator days."
    },
    rat_trap_charm: {
      id: "rat_trap_charm",
      name: "Rat Trap Charm",
      slot: "charm",
      rarity: "common",
      tags: ["rodent", "exterminator"],
      stats: { strength: 1 },
      description: "A tiny spring-loaded trap on a chain. Satisfying click."
    },
    lucky_penny: {
      id: "lucky_penny",
      name: "Lucky Penny",
      slot: "charm",
      rarity: "common",
      tags: ["luck"],
      stats: { luck: 1 },
      description: "Heads up. Don't ask where Carl found it."
    },
    // --- UNCOMMON ---
    exterminator_gloves: {
      id: "exterminator_gloves",
      name: "Exterminator Gloves",
      slot: "hands",
      rarity: "uncommon",
      tags: ["exterminator", "poison"],
      stats: { strength: 2, dexterity: 2 },
      description: "Thick rubber gloves. Poison-resistant and grip-friendly."
    },
    spray_can_shield: {
      id: "spray_can_shield",
      name: "Bug Spray Can",
      slot: "offHand",
      rarity: "uncommon",
      tags: ["exterminator", "poison"],
      stats: { constitution: 2, intelligence: 1 },
      description: "A massive can of industrial bug spray. Blocks and burns."
    },
    cat_collar_charm: {
      id: "cat_collar_charm",
      name: "Donut's Old Collar",
      slot: "charm",
      rarity: "uncommon",
      tags: ["donut", "luck"],
      stats: { luck: 2, charisma: 1 },
      description: "A rhinestone collar. Princess Donut demands you keep it."
    },
    leather_cap: {
      id: "leather_cap",
      name: "Leather Cap",
      slot: "head",
      rarity: "uncommon",
      tags: ["leather"],
      stats: { constitution: 2, wisdom: 1 },
      description: "Basic head protection. The dungeon smells worse with it on."
    },
    // --- RARE ---
    rat_slayer_blade: {
      id: "rat_slayer_blade",
      name: "Rat-Slayer Blade",
      slot: "mainHand",
      rarity: "rare",
      tags: ["blade", "rodent", "exterminator"],
      stats: { strength: 5, dexterity: 2 },
      description: "Forged specifically for vermin. The edge never dulls on fur.",
      onHit: { bonusVsTag: "rodent", bonusDamage: 8 }
    },
    reinforced_jeans: {
      id: "reinforced_jeans",
      name: "Reinforced Jeans",
      slot: "legs",
      rarity: "rare",
      tags: ["leather", "exterminator"],
      stats: { constitution: 4, dexterity: 1 },
      description: "Kevlar-lined denim. Fashion meets survival."
    },
    donut_fan_pendant: {
      id: "donut_fan_pendant",
      name: "Donut Fan Pendant",
      slot: "necklace",
      rarity: "rare",
      tags: ["donut", "luck"],
      stats: { luck: 3, charisma: 2 },
      description: "A tiny donut-shaped locket. Donut is flattered."
    },
    crawler_band: {
      id: "crawler_band",
      name: "Crawler Wristband",
      slot: "hands",
      rarity: "rare",
      tags: ["crawler"],
      stats: { explorer: 3, dexterity: 2 },
      description: "Given to all new crawlers. It tracks your suffering."
    },
    // --- EPIC ---
    poison_fog_grenade: {
      id: "poison_fog_grenade",
      name: "Poison Fog Grenade",
      slot: "offHand",
      rarity: "epic",
      tags: ["exterminator", "poison"],
      stats: { intelligence: 4, strength: 2 },
      description: "Exterminator-grade toxin. Do not inhale. Carl already did.",
      onHit: { effect: "poison", damage: 5, turns: 3 }
    },
    management_headset: {
      id: "management_headset",
      name: "Management Headset",
      slot: "head",
      rarity: "epic",
      tags: ["management", "wisdom"],
      stats: { wisdom: 5, intelligence: 3 },
      description: "You can hear the announcer's whispers. Terrifying and useful."
    },
    vermin_lord_crown: {
      id: "vermin_lord_crown",
      name: "Vermin Lord Crown",
      slot: "head",
      rarity: "epic",
      tags: ["rodent", "dark"],
      stats: { strength: 4, charisma: 3 },
      description: "The rats bow before you. Carl finds this deeply unsettling."
    },
    // --- LEGENDARY ---
    princess_donut_cape: {
      id: "princess_donut_cape",
      name: "Princess Donut's Cape",
      slot: "chest",
      rarity: "legendary",
      tags: ["donut", "royal"],
      stats: { charisma: 6, luck: 4, constitution: 3 },
      description: "A tiny royal cape that somehow fits Carl. Donut insists."
    },
    exterminators_fury: {
      id: "exterminators_fury",
      name: "Exterminator's Fury",
      slot: "mainHand",
      rarity: "legendary",
      tags: ["exterminator", "poison", "blunt"],
      stats: { strength: 8, intelligence: 3 },
      description: "A weaponized pest control sprayer welded to a sledgehammer.",
      onHit: { effect: "poison", damage: 8, turns: 2 }
    },
    // --- MYTHIC ---
    carls_resolve: {
      id: "carls_resolve",
      name: "Carl's Resolve",
      slot: "necklace",
      rarity: "mythic",
      tags: ["crawler", "will"],
      stats: { constitution: 6, wisdom: 5, luck: 3 },
      description: "The will to survive when everyone else would quit."
    },
    // --- UNIQUE ---
    donut_royal_scepter: {
      id: "donut_royal_scepter",
      name: "Donut's Royal Scepter",
      slot: "mainHand",
      rarity: "unique",
      tags: ["donut", "royal", "luck"],
      stats: { charisma: 8, luck: 6, intelligence: 4 },
      description: "A scepter Donut claimed from a defeated boss. It's just a stick with gems."
    },
    // --- CELESTIAL ---
    celestial_crawler_mark: {
      id: "celestial_crawler_mark",
      name: "Celestial Crawler Mark",
      slot: "charm",
      rarity: "celestial",
      tags: ["crawler", "celestial"],
      stats: { strength: 5, constitution: 5, dexterity: 5, intelligence: 5, wisdom: 5, charisma: 5, luck: 5, explorer: 5 },
      description: "A mark bestowed by forces beyond the dungeon. The Management is nervous."
    }
  };
  var LOOT_TABLES = {
    floor1_common: {
      pool: ["rusty_pipe", "torn_hoodie", "work_boots", "rat_trap_charm", "lucky_penny"],
      minRarity: "common",
      maxRarity: "uncommon"
    },
    floor1_chest: {
      pool: [
        "exterminator_gloves",
        "spray_can_shield",
        "cat_collar_charm",
        "leather_cap",
        "rat_slayer_blade",
        "reinforced_jeans",
        "donut_fan_pendant",
        "crawler_band"
      ],
      minRarity: "uncommon",
      maxRarity: "epic"
    },
    floor1_boss: {
      pool: ["princess_donut_cape", "exterminators_fury", "vermin_lord_crown", "management_headset"],
      minRarity: "rare",
      maxRarity: "legendary"
    },
    floor1_neighborhood: {
      pool: ["rat_slayer_blade", "reinforced_jeans", "poison_fog_grenade", "crawler_band"],
      minRarity: "uncommon",
      maxRarity: "rare"
    }
  };
  function getItem(id) {
    const item = ITEMS[id];
    if (!item) return null;
    return { ...item, uid: `${id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
  }

  // js/systems/loot.js
  var RARITY_ORDER = Object.keys(RARITIES);
  function rollRarity(bonus = 0) {
    const weights = RARITY_ORDER.map((r) => {
      let w = RARITIES[r].weight;
      if (bonus > 0 && r !== "common") w *= 1 + bonus;
      return w;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < RARITY_ORDER.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return RARITY_ORDER[i];
    }
    return "common";
  }
  function rollLoot(tableName, luckBonus = 0) {
    const table = LOOT_TABLES[tableName];
    if (!table) return null;
    const rarity = rollRarity(luckBonus * 0.02);
    const minIdx = RARITY_ORDER.indexOf(table.minRarity);
    const maxIdx = RARITY_ORDER.indexOf(table.maxRarity);
    const rarityIdx = RARITY_ORDER.indexOf(rarity);
    const clampedRarity = RARITY_ORDER[Math.max(minIdx, Math.min(maxIdx, rarityIdx))];
    const pool = table.pool.map((id) => ITEMS[id]).filter((item2) => item2 && RARITY_ORDER.indexOf(item2.rarity) <= RARITY_ORDER.indexOf(clampedRarity));
    if (pool.length === 0) {
      const fallback = table.pool[Math.floor(Math.random() * table.pool.length)];
      return getItem(fallback);
    }
    const item = pool[Math.floor(Math.random() * pool.length)];
    return getItem(item.id);
  }
  function generateFloorLoot(floor, isBoss = false, isNeighborhood = false) {
    if (isBoss) return rollLoot("floor1_boss", 3);
    if (isNeighborhood) return rollLoot("floor1_neighborhood", 2);
    return rollLoot("floor1_chest", 1);
  }
  function getRarityColor(rarity) {
    return RARITIES[rarity]?.color || "#aaaaaa";
  }
  function getRarityName(rarity) {
    return RARITIES[rarity]?.name || "Unknown";
  }
  function formatItemStats(item) {
    if (!item.stats) return "";
    return Object.entries(item.stats).map(([k, v]) => `${k.slice(0, 3).toUpperCase()} +${v}`).join(", ");
  }
  function formatItemDetail(item) {
    const lines = [
      `<div class="item-name rarity-${item.rarity}">${item.name}</div>`,
      `<div class="rarity-label" style="color:${getRarityColor(item.rarity)}">${getRarityName(item.rarity)}</div>`,
      `<div class="item-slot">Slot: ${item.slot}</div>`,
      `<div class="item-desc">${item.description}</div>`
    ];
    if (item.stats) {
      lines.push(`<div class="item-stats-detail">${formatItemStats(item)}</div>`);
    }
    if (item.tags) {
      lines.push(`<div class="item-tags">${item.tags.map((t) => `<span class="synergy-tag">${t}</span>`).join("")}</div>`);
    }
    return lines.join("");
  }

  // js/data/events.js
  var EVENTS = [
    {
      id: "sponsor_message",
      title: "Sponsor Break",
      description: 'The dungeon pauses for a word from our sponsors. A holographic ad for "CrawlerBucks™" flickers to life. "Earn points! Spend points! Die less efficiently!"',
      choices: [
        { text: "Watch the ad (+5 Luck, but lose 5 HP from annoyance)", effect: { luck: 1, hp: -5 } },
        { text: "Skip ad (Management is displeased)", effect: { spawnMonster: true } },
        { text: "Yell at the screen (Donut approves, +2 Charisma)", effect: { charisma: 2 } }
      ]
    },
    {
      id: "mysterious_fountain",
      title: "Suspicious Fountain",
      description: 'A glowing fountain bubbles in an alcove. The water smells like energy drinks and regret. A sign reads: "DRINK ME — Management assumes no liability."',
      choices: [
        { text: "Drink the water (50% heal, 50% poison)", effect: { gamble: { good: { hp: 30 }, bad: { effect: "poison", damage: 5, turns: 3 } } } },
        { text: "Fill your spray can (+3 INT)", effect: { intelligence: 3 } },
        { text: "Let Donut drink it (Donut gains a level of sass)", effect: { donutBuff: true, luck: 2 } }
      ]
    },
    {
      id: "trapped_crawler",
      title: "Trapped Crawler",
      description: "You hear whimpering from behind a partially collapsed wall. Another crawler is trapped — a kid in a bathrobe, maybe 19. He looks terrified.",
      choices: [
        { text: "Help him out (+3 WIS, but attract a monster)", effect: { wisdom: 3, spawnMonster: true } },
        { text: "Loot his dropped items while he's stuck", effect: { loot: "floor1_chest" } },
        { text: "Give him advice and move on (Carl's specialty)", effect: { explorer: 2, wisdom: 1 } }
      ]
    },
    {
      id: "donut_demands",
      title: "Princess Donut's Demand",
      description: "Donut plants herself in the middle of the corridor and refuses to move. She wants something. The Management AI sighs audibly.",
      choices: [
        { text: "Give her your last ration (+5 Donut loyalty, heal 10 HP)", effect: { hp: 10, luck: 2 } },
        { text: "Negotiate (CHA check — succeed for buff, fail for sass)", effect: { gamble: { good: { charisma: 3, luck: 2 }, bad: { charisma: -1 } } } },
        { text: "Pick her up and keep walking (Donut scratches you, -3 HP)", effect: { hp: -3, strength: 1 } }
      ]
    },
    {
      id: "gambling_machine",
      title: "Crawler Slots",
      description: 'A slot machine materializes. "JACKPOT OR JACKSHIT!" flashes in neon. It costs nothing to play but your dignity.',
      choices: [
        { text: "Pull the lever (Luck-based outcome)", effect: { luckGamble: true } },
        { text: "Examine the machine (find a hidden compartment)", effect: { loot: "floor1_chest" } },
        { text: "Walk away like a responsible adult", effect: { wisdom: 2 } }
      ]
    },
    {
      id: "management_tips",
      title: "Management Tips",
      description: 'A cheerful hologram of a smiling face appears. "TIP OF THE DAY: Did you know that 73% of crawlers die on Floor 1? Be the 27%!" It winks.',
      choices: [
        { text: "Listen carefully (+2 WIS, +1 Explorer)", effect: { wisdom: 2, explorer: 1 } },
        { text: "Ask about the exit (vague non-answer, +1 INT)", effect: { intelligence: 1 } },
        { text: "Flip it off (Donut high-fives you, +2 LCK)", effect: { luck: 2 } }
      ]
    },
    {
      id: "rat_merchant",
      title: "Rat Merchant",
      description: `A surprisingly well-dressed rat sits behind a tiny counter. "Squeak squeak," it offers. Somehow you understand: it's selling goods scavenged from dead crawlers.`,
      choices: [
        { text: "Buy a mystery item (random loot)", effect: { loot: "floor1_chest" } },
        { text: "Trade a ration for +2 STR", effect: { strength: 2, hp: -5 } },
        { text: "Decline politely (the rat respects this, +1 LCK)", effect: { luck: 1 } }
      ]
    },
    {
      id: "hidden_cache",
      title: "Hidden Cache",
      description: "Your exterminator instincts kick in. Something smells wrong about this wall — which means something valuable might be behind it.",
      choices: [
        { text: "Break through (find loot, but make noise)", effect: { loot: "floor1_chest", spawnMonster: true } },
        { text: "Search carefully (smaller loot, no noise)", effect: { loot: "floor1_common" } },
        { text: "Mark it and come back later (+Explorer)", effect: { explorer: 3 } }
      ]
    }
  ];
  function getRandomEvent() {
    return EVENTS[Math.floor(Math.random() * EVENTS.length)];
  }

  // js/data/story.js
  var FLOOR1_STORY = [
    {
      speaker: "system",
      text: "WELCOME, CRAWLER CARL, TO THE DUNGEON WORLD TOURNAMENT!"
    },
    {
      speaker: "system",
      text: 'You have been selected — along with your "companion," Princess Donut — to compete in the most deadly reality show in the multiverse.'
    },
    {
      speaker: "carl",
      text: `Wait, what? I was just trying to get to my exterminator van. And Donut is a cat. She's not a "companion," she's a princess.`
    },
    {
      speaker: "donut",
      text: "*demands belly rubs while the world ends*"
    },
    {
      speaker: "system",
      text: "FLOOR 1: THE TUTORIAL LABYRINTH has been assigned. Survive, loot, level up, and proceed to Floor 2. Or die. The audience is watching!"
    },
    {
      speaker: "carl",
      text: "Great. A tutorial for how to die. At least I know how to kill rats."
    },
    {
      speaker: "system",
      text: "Your starting stats have been assigned based on your mundane human existence. Class: EXTERMINATOR. Race: HUMAN. Good luck, Crawler!"
    }
  ];
  var STORY_BEATS = {
    first_kill: {
      speaker: "carl",
      text: "One down. About ten billion to go. Donut, try not to get eaten."
    },
    first_loot: {
      speaker: "system",
      text: "ITEM ACQUIRED! Remember: equipment synergies can mean the difference between crawling and dying."
    },
    neighborhood_boss_found: {
      speaker: "system",
      text: "NEIGHBORHOOD BOSS DETECTED: The Rat King controls this section of the warrens. Defeat it to unlock safer passage."
    },
    neighborhood_boss_defeated: {
      speaker: "carl",
      text: "That was... a lot of rats. Donut looks traumatized. Let's never speak of this."
    },
    floor_boss_found: {
      speaker: "system",
      text: "FLOOR BOSS APPROACHING: The Tutorial Warden awaits. Demonstrate your combat aptitude to proceed to Floor 2."
    },
    floor_boss_defeated: {
      speaker: "system",
      text: "CONGRATULATIONS, CRAWLER CARL! Floor 1 COMPLETE. Floor 2: The Goblin Market awaits... (Coming in full release!)"
    },
    level_up: {
      speaker: "donut",
      text: "*purrs approvingly as Carl grows stronger*"
    },
    donut_save: {
      speaker: "carl",
      text: "Thanks, Donut. I owe you extra treats for that one."
    },
    low_hp: {
      speaker: "carl",
      text: "This is fine. Everything is fine. I've been in worse crawlspaces."
    }
  };
  var QUESTS = [
    { id: "explore", text: "Explore the Tutorial Labyrinth", completed: false },
    { id: "loot", text: "Find your first piece of equipment", completed: false },
    { id: "neighborhood_boss", text: "Defeat the Rat King (Neighborhood Boss)", completed: false },
    { id: "floor_boss", text: "Defeat the Tutorial Warden (Floor Boss)", completed: false },
    { id: "survive", text: "Clear Floor 1", completed: false }
  ];

  // js/systems/renderer.js
  var Renderer = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.camera = { x: 0, y: 0 };
      this.animFrame = 0;
    }
    resize() {
      const container = this.canvas.parentElement;
      const maxW = container.clientWidth - 4;
      const maxH = container.clientHeight - 40;
      const scale = Math.min(maxW / (MAP_WIDTH * TILE_SIZE), maxH / (MAP_HEIGHT * TILE_SIZE), 1.5);
      this.scale = scale;
      this.canvas.style.width = `${MAP_WIDTH * TILE_SIZE * scale}px`;
      this.canvas.style.height = `${MAP_HEIGHT * TILE_SIZE * scale}px`;
    }
    updateCamera(px, py) {
      this.camera.x = px * TILE_SIZE - this.canvas.width / (2 * (this.scale || 1));
      this.camera.y = py * TILE_SIZE - this.canvas.height / (2 * (this.scale || 1));
      this.camera.x = Math.max(0, Math.min(this.camera.x, MAP_WIDTH * TILE_SIZE - this.canvas.width / (this.scale || 1)));
      this.camera.y = Math.max(0, Math.min(this.camera.y, MAP_HEIGHT * TILE_SIZE - this.canvas.height / (this.scale || 1)));
    }
    render(dungeon, player, donut) {
      const ctx = this.ctx;
      const { map, playerPos, explored, entities } = dungeon;
      this.animFrame++;
      ctx.fillStyle = "#080810";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.updateCamera(playerPos.x, playerPos.y);
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const key = `${x},${y}`;
          if (!explored.has(key)) continue;
          const sx = x * TILE_SIZE - this.camera.x;
          const sy = y * TILE_SIZE - this.camera.y;
          if (sx < -TILE_SIZE || sy < -TILE_SIZE || sx > this.canvas.width || sy > this.canvas.height) continue;
          const tile = map[y][x];
          const isAlt = (x + y) % 2 === 0;
          switch (tile) {
            case TILES.WALL:
              ctx.fillStyle = COLORS.wall;
              ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = "#3a3a5a";
              ctx.fillRect(sx, sy, TILE_SIZE, 3);
              break;
            case TILES.FLOOR:
            case TILES.DOOR:
              ctx.fillStyle = isAlt ? COLORS.floorAlt : COLORS.floor;
              ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
              break;
            case TILES.ENTRANCE:
              ctx.fillStyle = COLORS.floor;
              ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = COLORS.entrance;
              ctx.fillRect(sx + 8, sy + 8, 16, 16);
              break;
            case TILES.STAIRS:
              ctx.fillStyle = COLORS.floor;
              ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = COLORS.stairs;
              ctx.font = "20px serif";
              ctx.fillText("⇡", sx + 6, sy + 24);
              break;
            case TILES.CHEST:
              ctx.fillStyle = COLORS.floor;
              ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = COLORS.chest;
              ctx.font = "18px serif";
              ctx.fillText("📦", sx + 4, sy + 24);
              break;
            case TILES.EVENT:
              ctx.fillStyle = COLORS.floor;
              ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = COLORS.event;
              ctx.font = "18px serif";
              ctx.fillText("❓", sx + 4, sy + 24);
              break;
            case TILES.BOSS:
              ctx.fillStyle = "#2a0a0a";
              ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = COLORS.boss;
              ctx.font = "18px serif";
              ctx.fillText("💀", sx + 4, sy + 24);
              break;
          }
        }
      }
      for (const entity of entities) {
        const key = `${entity.x},${entity.y}`;
        if (!explored.has(key)) continue;
        if (entity.defeated || entity.opened || entity.triggered) continue;
        const sx = entity.x * TILE_SIZE - this.camera.x;
        const sy = entity.y * TILE_SIZE - this.camera.y;
        if (entity.type === "monster") {
          ctx.font = "20px serif";
          ctx.fillText("👹", sx + 4, sy + 24);
        }
      }
      const psx = playerPos.x * TILE_SIZE - this.camera.x;
      const psy = playerPos.y * TILE_SIZE - this.camera.y;
      ctx.fillStyle = COLORS.player;
      ctx.beginPath();
      ctx.arc(psx + TILE_SIZE / 2, psy + TILE_SIZE / 2, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("C", psx + TILE_SIZE / 2, psy + TILE_SIZE / 2 + 4);
      ctx.textAlign = "left";
      if (donut?.active) {
        const pulse = Math.sin(this.animFrame * 0.1) * 2;
        ctx.font = `${14 + pulse}px serif`;
        ctx.fillText("🐱", psx + TILE_SIZE - 4, psy - 2);
      }
      this.renderFog(dungeon);
    }
    renderFog(dungeon) {
      const ctx = this.ctx;
      const { map, explored, playerPos } = dungeon;
      const visible = /* @__PURE__ */ new Set();
      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -6; dx <= 6; dx++) {
          if (dx * dx + dy * dy > 36) continue;
          const x = playerPos.x + dx, y = playerPos.y + dy;
          if (x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT) {
            visible.add(`${x},${y}`);
          }
        }
      }
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const key = `${x},${y}`;
          if (!explored.has(key)) continue;
          const sx = x * TILE_SIZE - this.camera.x;
          const sy = y * TILE_SIZE - this.camera.y;
          const alpha = visible.has(key) ? 0 : 0.6;
          if (alpha > 0) {
            ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  };

  // js/ui/menus.js
  var UIManager = class {
    constructor(game) {
      this.game = game;
      this.selectedItem = null;
      this.pendingStats = {};
      this.setupEventListeners();
    }
    setupEventListeners() {
      document.getElementById("btn-start").addEventListener("click", () => this.game.startGame());
      document.getElementById("btn-story-continue").addEventListener("click", () => this.game.advanceStory());
      document.getElementById("btn-levelup-confirm").addEventListener("click", () => this.game.confirmLevelUp());
      document.getElementById("btn-menu-close").addEventListener("click", () => this.game.closeMenu());
      document.getElementById("btn-restart").addEventListener("click", () => this.game.restart());
      document.getElementById("btn-loot-take").addEventListener("click", () => this.game.takeLoot());
      document.getElementById("btn-loot-equip").addEventListener("click", () => this.game.equipLoot());
      document.getElementById("btn-loot-leave").addEventListener("click", () => this.game.leaveLoot());
      document.querySelectorAll(".btn-combat").forEach((btn) => {
        btn.addEventListener("click", () => this.game.combatAction(btn.dataset.action));
      });
      document.querySelectorAll(".tab").forEach((tab) => {
        tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
      });
    }
    switchTab(tabName) {
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabName));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === `tab-${tabName}`));
    }
    showOverlay(id) {
      document.querySelectorAll(".overlay").forEach((o) => o.classList.remove("active"));
      const el = document.getElementById(id);
      if (el) el.classList.add("active");
    }
    hideAllOverlays() {
      document.querySelectorAll(".overlay").forEach((o) => o.classList.remove("active"));
    }
    showStory(lines, index = 0) {
      this.showOverlay("story-screen");
      const textEl = document.getElementById("story-text");
      const line = lines[index];
      const speakerClass = line.speaker === "system" ? "system" : "speaker";
      const speakerName = line.speaker === "system" ? "SYSTEM" : line.speaker === "carl" ? "Carl" : line.speaker === "donut" ? "Princess Donut" : line.speaker;
      textEl.innerHTML = `<span class="${speakerClass}">${speakerName}:</span> ${line.text}`;
    }
    updateHUD(player, donut, quests) {
      document.getElementById("hp-display").textContent = `HP: ${player.hp}/${player.maxHp}`;
      document.getElementById("level-display").textContent = `Lv ${player.level}`;
      const statsMini = document.getElementById("stats-mini");
      const stats = player.baseStats;
      statsMini.innerHTML = Object.entries(stats).map(([k, v]) => `<div>${STAT_LABELS[k]?.slice(0, 3) || k}: <span style="color:var(--gold)">${v}</span></div>`).join("");
      const donutStatus = document.getElementById("donut-status");
      donutStatus.innerHTML = `
      <div>🐱 ${donut.name}</div>
      <div>Loyalty: ${donut.loyalty}%</div>
      <div style="color:#ff88cc;font-size:10px">Charm: ${player.donutCooldown > 0 ? `CD ${player.donutCooldown}` : "Ready"}</div>
    `;
      const synergyList = document.getElementById("synergy-list");
      if (player.activeSynergies?.length) {
        synergyList.innerHTML = player.activeSynergies.map((s) => `<div class="synergy-tag" title="${s.description}">${s.name}</div>`).join("");
      } else {
        synergyList.innerHTML = '<div style="color:var(--text-dim)">None active</div>';
      }
      const questLog = document.getElementById("quest-log");
      questLog.innerHTML = quests.map((q) => `<div class="${q.completed ? "" : "active-quest"}">${q.completed ? "✓" : "○"} ${q.text}</div>`).join("");
    }
    showMessage(text, duration = 3e3) {
      const el = document.getElementById("message-log");
      el.textContent = text;
      el.style.opacity = "1";
      clearTimeout(this.messageTimeout);
      this.messageTimeout = setTimeout(() => {
        el.style.opacity = "0";
      }, duration);
    }
    showCombat(combat) {
      this.showOverlay("combat-screen");
      const monster = combat.monster;
      document.getElementById("combat-enemy-name").textContent = monster.sprite ? `${monster.sprite} ${monster.name}` : monster.name;
      this.updateCombatHP(combat);
      this.renderCombatLog(combat.log);
    }
    updateCombatHP(combat) {
      const player = combat.player;
      const monster = combat.monster;
      const pPct = player.hp / player.maxHp * 100;
      const mPct = monster.currentHp / monster.maxHp * 100;
      document.getElementById("combat-player-hp").style.width = `${pPct}%`;
      document.getElementById("combat-enemy-hp").style.width = `${mPct}%`;
      document.getElementById("combat-player-hp-text").textContent = `${player.hp}/${player.maxHp}`;
      document.getElementById("combat-enemy-hp-text").textContent = `${monster.currentHp}/${monster.maxHp}`;
    }
    renderCombatLog(log) {
      const el = document.getElementById("combat-log");
      el.innerHTML = log.slice(-8).map(
        (l) => `<div class="${l.class || ""}">${l.text}</div>`
      ).join("");
      el.scrollTop = el.scrollHeight;
    }
    showEvent(event) {
      this.showOverlay("event-screen");
      document.getElementById("event-title").textContent = event.title;
      document.getElementById("event-description").textContent = event.description;
      const choicesEl = document.getElementById("event-choices");
      choicesEl.innerHTML = event.choices.map(
        (c, i) => `<button class="event-choice" data-choice="${i}">${c.text}</button>`
      ).join("");
      choicesEl.querySelectorAll(".event-choice").forEach((btn) => {
        btn.addEventListener("click", () => this.game.resolveEvent(parseInt(btn.dataset.choice)));
      });
    }
    showLevelUp(player) {
      this.showOverlay("levelup-screen");
      this.pendingStats = {};
      const points = player.statPoints;
      document.getElementById("points-remaining").textContent = points;
      this.renderStatAllocation(player, points);
    }
    renderStatAllocation(player, remaining) {
      const el = document.getElementById("stat-allocation");
      el.innerHTML = Object.entries(STAT_LABELS).map(([key, label]) => {
        const pending = this.pendingStats[key] || 0;
        const current = player.baseStats[key] + pending;
        return `<div class="stat-row">
        <span class="stat-name">${label}</span>
        <button class="stat-btn" data-stat="${key}" data-dir="-1" ${pending <= 0 ? "disabled" : ""}>−</button>
        <span class="stat-value">${current}</span>
        <button class="stat-btn" data-stat="${key}" data-dir="1" ${remaining <= 0 ? "disabled" : ""}>+</button>
      </div>`;
      }).join("");
      el.querySelectorAll(".stat-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const stat = btn.dataset.stat;
          const dir = parseInt(btn.dataset.dir);
          if (dir > 0 && remaining > 0) {
            this.pendingStats[stat] = (this.pendingStats[stat] || 0) + 1;
            remaining--;
          } else if (dir < 0 && (this.pendingStats[stat] || 0) > 0) {
            this.pendingStats[stat]--;
            remaining++;
          }
          document.getElementById("points-remaining").textContent = remaining;
          document.getElementById("btn-levelup-confirm").disabled = remaining === player.statPoints;
          this.renderStatAllocation(player, remaining);
        });
      });
      document.getElementById("btn-levelup-confirm").disabled = remaining === player.statPoints;
    }
    getPendingStats() {
      return { ...this.pendingStats };
    }
    showMenu(player, tab = "inventory") {
      this.showOverlay("menu-screen");
      this.switchTab(tab);
      this.renderInventory(player);
      this.renderEquipment(player);
      this.renderCharacterSheet(player);
      this.renderCodex(player);
    }
    renderInventory(player) {
      const grid = document.getElementById("inventory-grid");
      if (player.inventory.length === 0) {
        grid.innerHTML = '<div style="color:var(--text-dim)">No items in inventory.</div>';
        return;
      }
      grid.innerHTML = player.inventory.map((item) => {
        const equipped = Object.values(player.equipment).some((e) => e?.uid === item.uid);
        return `<div class="item-card rarity-${item.rarity} ${equipped ? "equipped" : ""}" data-uid="${item.uid}">
        <div class="item-name">${item.name}</div>
        <div class="item-slot">${SLOT_LABELS[item.slot] || item.slot}</div>
        <div class="item-stats">${formatItemStats(item)}</div>
      </div>`;
      }).join("");
      grid.querySelectorAll(".item-card").forEach((card) => {
        card.addEventListener("click", () => {
          grid.querySelectorAll(".item-card").forEach((c) => c.classList.remove("selected"));
          card.classList.add("selected");
          const item = player.inventory.find((i) => i.uid === card.dataset.uid);
          this.selectedItem = item;
          document.getElementById("item-detail").innerHTML = formatItemDetail(item) + `<br><button class="btn-primary" style="margin-top:8px" id="btn-equip-selected">Equip</button>`;
          document.getElementById("btn-equip-selected")?.addEventListener("click", () => {
            this.game.equipFromInventory(item);
          });
        });
      });
    }
    renderEquipment(player) {
      const layout = document.getElementById("equipment-layout");
      const slots = ["head", "necklace", "chest", "mainHand", "offHand", "hands", "legs", "boots"];
      let html = slots.map((slot) => {
        const item = player.equipment[slot];
        return `<div class="equip-slot ${slot} ${item ? "filled" : ""} rarity-${item?.rarity || ""}" data-slot="${slot}">
        <div class="equip-slot-label">${SLOT_LABELS[slot]}</div>
        <div>${item ? item.name : "—"}</div>
      </div>`;
      }).join("");
      html += '<div class="charms-row">';
      for (const slot of ["charm1", "charm2", "charm3"]) {
        const item = player.equipment[slot];
        html += `<div class="equip-slot ${item ? "filled" : ""} rarity-${item?.rarity || ""}" data-slot="${slot}" style="flex:1">
        <div class="equip-slot-label">${SLOT_LABELS[slot]}</div>
        <div>${item ? item.name : "—"}</div>
      </div>`;
      }
      html += "</div>";
      layout.innerHTML = html;
      layout.querySelectorAll(".equip-slot").forEach((slot) => {
        slot.addEventListener("click", () => {
          const s = slot.dataset.slot;
          const item = player.equipment[s];
          if (item) {
            this.game.unequipFromSlot(s);
          }
        });
      });
    }
    renderCharacterSheet(player) {
      const el = document.getElementById("character-sheet");
      const stats = player.baseStats;
      let html = `<h4 style="margin-bottom:8px">${player.name} — ${player.class} (${player.race})</h4>`;
      html += `<div>Level ${player.level} | XP: ${player.xp}/${player.xpToNext}</div>`;
      html += '<div class="stat-grid" style="margin-top:12px">';
      for (const [key, label] of Object.entries(STAT_LABELS)) {
        html += `<div class="stat-block"><span class="label">${label}</span><span class="value">${stats[key]}</span></div>`;
      }
      html += "</div>";
      html += `<div class="derived-stats">
      <div class="stat-block"><span class="label">Attack</span><span class="value">${player.attack}</span></div>
      <div class="stat-block"><span class="label">Defense</span><span class="value">${player.defense}</span></div>
      <div class="stat-block"><span class="label">Crit Chance</span><span class="value">${(player.critChance * 100).toFixed(1)}%</span></div>
      <div class="stat-block"><span class="label">Dodge</span><span class="value">${(player.dodgeChance * 100).toFixed(1)}%</span></div>
      <div class="stat-block"><span class="label">Kills</span><span class="value">${player.kills}</span></div>
      <div class="stat-block"><span class="label">Items Found</span><span class="value">${player.itemsFound}</span></div>
    </div>`;
      el.innerHTML = html;
    }
    renderCodex(player) {
      const el = document.getElementById("codex-content");
      const discovered = /* @__PURE__ */ new Set();
      for (const item of [...player.inventory, ...Object.values(player.equipment)]) {
        if (item) discovered.add(item.id);
      }
      el.innerHTML = Object.values(ITEMS).map((item) => {
        const found = discovered.has(item.id);
        return `<div class="codex-entry">
        <div class="name rarity-${item.rarity}" style="color:${found ? "" : "var(--text-dim)"}">
          ${found ? item.name : "???"}
        </div>
        <div class="desc">${found ? item.description : "Not yet discovered."}</div>
      </div>`;
      }).join("");
    }
    showLoot(item) {
      this.showOverlay("loot-screen");
      document.getElementById("loot-item-display").innerHTML = formatItemDetail(item);
    }
    showEndScreen(won, player, stats) {
      this.showOverlay("end-screen");
      document.getElementById("end-title").textContent = won ? "Floor 1 Cleared!" : "You Died";
      document.getElementById("end-message").textContent = won ? "Carl and Princess Donut survive to crawl another day. Floor 2 awaits..." : "The dungeon claims another crawler. The audience boos. Donut demands a rematch.";
      document.getElementById("end-stats").innerHTML = `
      <div>Level: ${player.level}</div>
      <div>Kills: ${player.kills}</div>
      <div>Items Found: ${player.itemsFound}</div>
      <div>Time: ${stats.time}</div>
    `;
    }
  };

  // js/main.js
  var Game = class {
    constructor() {
      this.state = "title";
      this.player = null;
      this.donut = null;
      this.dungeon = null;
      this.combat = null;
      this.quests = [];
      this.storyLines = [];
      this.storyIndex = 0;
      this.pendingLoot = null;
      this.currentEvent = null;
      this.startTime = null;
      this.keys = {};
      this.canvas = document.getElementById("dungeon-canvas");
      this.renderer = new Renderer(this.canvas);
      this.ui = new UIManager(this);
      this.setupInput();
      this.renderer.resize();
      window.addEventListener("resize", () => this.renderer.resize());
      requestAnimationFrame(() => this.gameLoop());
    }
    setupInput() {
      window.addEventListener("keydown", (e) => {
        this.keys[e.key.toLowerCase()] = true;
        this.handleKey(e.key.toLowerCase());
      });
      window.addEventListener("keyup", (e) => {
        this.keys[e.key.toLowerCase()] = false;
      });
    }
    handleKey(key) {
      if (this.state === "dungeon") {
        if (key === "i") {
          this.ui.showMenu(this.player, "inventory");
          this.state = "menu";
          return;
        }
        if (key === "c") {
          this.ui.showMenu(this.player, "character");
          this.state = "menu";
          return;
        }
        if (key === "l" && this.player.statPoints > 0) {
          this.ui.showLevelUp(this.player);
          this.state = "levelup";
          return;
        }
        if (key === "e" || key === " ") {
          this.interact();
          return;
        }
        if (key === "escape") return;
        let dx = 0, dy = 0;
        if (key === "w" || key === "arrowup") dy = -1;
        if (key === "s" || key === "arrowdown") dy = 1;
        if (key === "a" || key === "arrowleft") dx = -1;
        if (key === "d" || key === "arrowright") dx = 1;
        if (dx || dy) this.movePlayer(dx, dy);
      }
      if (this.state === "menu" && key === "escape") this.closeMenu();
      if (this.state === "levelup" && key === "escape") {
        this.state = "dungeon";
        this.ui.hideAllOverlays();
      }
    }
    startGame() {
      this.player = createPlayer();
      this.donut = createDonut();
      recalculatePlayer(this.player);
      this.dungeon = generateFloor1();
      this.quests = QUESTS.map((q) => ({ ...q }));
      this.storyLines = [...FLOOR1_STORY];
      this.storyIndex = 0;
      this.startTime = Date.now();
      this.state = "story";
      this.ui.showStory(this.storyLines, 0);
      this.ui.updateHUD(this.player, this.donut, this.quests);
    }
    advanceStory() {
      this.storyIndex++;
      if (this.storyIndex < this.storyLines.length) {
        this.ui.showStory(this.storyLines, this.storyIndex);
      } else {
        this.state = "dungeon";
        this.ui.hideAllOverlays();
        this.ui.showMessage("Use WASD to move. Press E to interact. Good luck, Crawler!");
      }
    }
    movePlayer(dx, dy) {
      const result = movePlayer(this.dungeon, dx, dy);
      if (!result) return;
      if (!result.moved && result.entity) {
        this.handleEntityEncounter(result.entity, result.nx, result.ny);
        return;
      }
      if (result.moved) {
        const tile = this.dungeon.map[this.dungeon.playerPos.y][this.dungeon.playerPos.x];
        if (tile === 4 || tile === 5 || tile === 6 || tile === 3) {
          const entity = this.dungeon.entities.find(
            (e) => e.x === this.dungeon.playerPos.x && e.y === this.dungeon.playerPos.y
          );
          if (entity) this.handleEntityEncounter(entity);
        }
      }
    }
    interact() {
      const { x, y } = this.dungeon.playerPos;
      const neighbors = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of neighbors) {
        const entity = this.dungeon.entities.find(
          (e) => e.x === x + dx && e.y === y + dy && !e.defeated && !e.opened && !e.triggered
        );
        if (entity) {
          this.handleEntityEncounter(entity, entity.x, entity.y);
          return;
        }
      }
      this.ui.showMessage("Nothing to interact with here.");
    }
    handleEntityEncounter(entity) {
      switch (entity.type) {
        case "monster": {
          const monster = scaleMonster(spawnRandomMonster(), 1 + this.dungeon.floor * 0.1);
          this.startCombat(monster);
          break;
        }
        case "chest":
          if (!entity.opened) {
            entity.opened = true;
            const item = rollLoot("floor1_chest", this.player.baseStats.luck * 0.05);
            this.pendingLoot = item;
            this.ui.showLoot(item);
            this.state = "loot";
            this.completeQuest("loot");
            this.triggerStoryBeat("first_loot");
          }
          break;
        case "event":
          if (!entity.triggered) {
            entity.triggered = true;
            this.currentEvent = getRandomEvent();
            this.state = "event";
            this.ui.showEvent(this.currentEvent);
          }
          break;
        case "neighborhood_boss":
          if (!entity.defeated) {
            this.triggerStoryBeat("neighborhood_boss_found");
            const monster = scaleMonster(getMonster(entity.id), 1.1);
            this.startCombat(monster, entity);
          }
          break;
        case "boss":
          if (!entity.defeated) {
            this.triggerStoryBeat("floor_boss_found");
            const monster = scaleMonster(getMonster(entity.id), 1.2);
            this.startCombat(monster, entity);
          }
          break;
        case "stairs": {
          const nb = this.dungeon.entities.find((e) => e.type === "neighborhood_boss");
          const fb = this.dungeon.entities.find((e) => e.type === "boss");
          if (nb && !nb.defeated) {
            this.ui.showMessage("The stairs are locked. Defeat the Rat King first.");
          } else if (fb && !fb.defeated) {
            this.ui.showMessage("The stairs are locked. Defeat the Tutorial Warden first.");
          } else {
            this.winGame();
          }
          break;
        }
      }
    }
    startCombat(monster, entity = null) {
      this.combat = createCombatState(this.player, monster);
      this.combat.entity = entity;
      if (monster.intro) {
        this.ui.showMessage(monster.intro, 5e3);
      }
      this.state = "combat";
      this.ui.showCombat(this.combat);
    }
    combatAction(action) {
      if (!this.combat || this.combat.won || this.combat.lost || this.combat.fled) return;
      switch (action) {
        case "attack":
          playerAttack(this.combat, this.player);
          break;
        case "skill":
          playerSkill(this.combat, this.player);
          break;
        case "donut":
          donutAction(this.combat, this.player, this.donut);
          break;
        case "flee":
          if (tryFlee(this.combat, this.player)) {
            this.endCombat();
            return;
          }
          break;
      }
      this.ui.updateCombatHP(this.combat);
      this.ui.renderCombatLog(this.combat.log);
      if (this.combat.won) {
        setTimeout(() => this.onCombatWin(), 800);
        return;
      }
      if (this.combat.lost) {
        setTimeout(() => this.onCombatLoss(), 800);
        return;
      }
      tickMonsterEffects(this.combat);
      this.ui.updateCombatHP(this.combat);
      this.ui.renderCombatLog(this.combat.log);
      if (this.combat.won) {
        setTimeout(() => this.onCombatWin(), 800);
        return;
      }
      if (this.combat.monster.bossType && Math.random() < 0.4) {
        bossSpecialAbility(this.combat, this.player);
      } else {
        monsterAttack(this.combat, this.player);
      }
      this.ui.updateCombatHP(this.combat);
      this.ui.renderCombatLog(this.combat.log);
      if (this.combat.lost) {
        setTimeout(() => this.onCombatLoss(), 800);
      }
    }
    onCombatWin() {
      const monster = this.combat.monster;
      this.player.kills++;
      const leveled = addXp(this.player, monster.xp);
      if (leveled) {
        this.state = "levelup";
        this.ui.showLevelUp(this.player);
        this.triggerStoryBeat("level_up");
      }
      if (monster.bossType === "neighborhood") {
        this.completeQuest("neighborhood_boss");
        this.triggerStoryBeat("neighborhood_boss_defeated");
        if (this.combat.entity) this.combat.entity.defeated = true;
      }
      if (monster.bossType === "floor") {
        this.completeQuest("floor_boss");
        this.triggerStoryBeat("floor_boss_defeated");
        if (this.combat.entity) this.combat.entity.defeated = true;
        const stairs = this.dungeon.entities.find((e) => e.type === "stairs");
        if (stairs) stairs.locked = false;
      }
      if (this.player.kills === 1) this.triggerStoryBeat("first_kill");
      this.completeQuest("explore");
      const lootChance = monster.bossType ? 1 : 0.35 + (this.player.synergyEffects?.bonusLootChance || 0);
      if (Math.random() < lootChance) {
        const item = generateFloorLoot(1, monster.bossType === "floor", monster.bossType === "neighborhood");
        if (item) {
          this.pendingLoot = item;
          this.ui.showLoot(item);
          this.state = "loot";
          this.ui.hideAllOverlays();
          this.ui.showOverlay("loot-screen");
          this.endCombat(false);
          return;
        }
      }
      this.endCombat();
    }
    onCombatLoss() {
      this.player.deaths++;
      this.state = "gameover";
      const elapsed = Math.floor((Date.now() - this.startTime) / 1e3);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      this.ui.showEndScreen(false, this.player, { time: `${mins}m ${secs}s` });
    }
    endCombat(hideOverlay = true) {
      if (hideOverlay) this.ui.hideAllOverlays();
      this.combat = null;
      if (this.state !== "loot" && this.state !== "levelup") this.state = "dungeon";
      this.ui.updateHUD(this.player, this.donut, this.quests);
    }
    takeLoot() {
      if (this.pendingLoot) {
        addToInventory(this.player, this.pendingLoot);
        this.ui.showMessage(`Picked up ${this.pendingLoot.name}!`);
      }
      this.pendingLoot = null;
      this.ui.hideAllOverlays();
      if (this.player.statPoints > 0 && this.state !== "levelup") {
      }
      this.state = this.player.statPoints > 0 ? "levelup" : "dungeon";
      if (this.state === "levelup") this.ui.showLevelUp(this.player);
      this.ui.updateHUD(this.player, this.donut, this.quests);
    }
    equipLoot() {
      if (this.pendingLoot) {
        equipItem(this.player, this.pendingLoot);
        this.ui.showMessage(`Equipped ${this.pendingLoot.name}!`);
      }
      this.pendingLoot = null;
      this.ui.hideAllOverlays();
      this.state = this.player.statPoints > 0 ? "levelup" : "dungeon";
      if (this.state === "levelup") this.ui.showLevelUp(this.player);
      this.ui.updateHUD(this.player, this.donut, this.quests);
    }
    leaveLoot() {
      this.pendingLoot = null;
      this.ui.hideAllOverlays();
      this.state = "dungeon";
    }
    resolveEvent(choiceIndex) {
      const event = this.currentEvent;
      if (!event) return;
      const choice = event.choices[choiceIndex];
      const effect = choice.effect;
      if (effect.hp) {
        if (effect.hp > 0) healPlayer(this.player, effect.hp);
        else this.player.hp = Math.max(1, this.player.hp + effect.hp);
      }
      for (const stat of ["strength", "constitution", "dexterity", "intelligence", "wisdom", "charisma", "luck", "explorer"]) {
        if (effect[stat]) this.player.baseStats[stat] += effect[stat];
      }
      if (effect.loot) {
        const item = rollLoot(effect.loot);
        if (item) {
          this.pendingLoot = item;
          recalculatePlayer(this.player);
          this.ui.hideAllOverlays();
          this.ui.showLoot(item);
          this.state = "loot";
          return;
        }
      }
      if (effect.spawnMonster) {
        const monster = spawnRandomMonster();
        this.ui.hideAllOverlays();
        this.startCombat(scaleMonster(monster));
        return;
      }
      if (effect.gamble) {
        if (Math.random() < 0.5) {
          const good = effect.gamble.good;
          if (good.hp) healPlayer(this.player, good.hp);
          for (const stat of Object.keys(good)) {
            if (stat !== "hp" && good[stat]) this.player.baseStats[stat] += good[stat];
          }
          this.ui.showMessage("Fortune smiles upon you!");
        } else {
          const bad = effect.gamble.bad;
          if (bad.hp) this.player.hp = Math.max(1, this.player.hp + bad.hp);
          if (bad.effect === "poison") {
            this.player.effects.push({ type: "poison", damage: bad.damage, turns: bad.turns });
          }
          for (const stat of Object.keys(bad)) {
            if (!["hp", "effect", "damage", "turns"].includes(stat) && bad[stat]) {
              this.player.baseStats[stat] += bad[stat];
            }
          }
          this.ui.showMessage("That didn't go well...");
        }
      }
      if (effect.luckGamble) {
        const roll = Math.random() + this.player.baseStats.luck * 0.02;
        if (roll > 0.8) {
          const item = rollLoot("floor1_boss", 2);
          this.pendingLoot = item;
          recalculatePlayer(this.player);
          this.ui.hideAllOverlays();
          this.ui.showLoot(item);
          this.state = "loot";
          return;
        } else if (roll > 0.5) {
          healPlayer(this.player, 20);
          this.ui.showMessage("You win 20 HP!");
        } else {
          this.player.hp = Math.max(1, this.player.hp - 10);
          this.ui.showMessage("JACKSHIT! You lose 10 HP.");
        }
      }
      recalculatePlayer(this.player);
      this.currentEvent = null;
      this.ui.hideAllOverlays();
      this.state = "dungeon";
      this.ui.updateHUD(this.player, this.donut, this.quests);
    }
    confirmLevelUp() {
      const pending = this.ui.getPendingStats();
      for (const [stat, amount] of Object.entries(pending)) {
        if (amount > 0) allocateStat(this.player, stat, amount);
      }
      this.ui.hideAllOverlays();
      this.state = "dungeon";
      this.ui.updateHUD(this.player, this.donut, this.quests);
      this.ui.showMessage("Stats upgraded! You feel stronger.");
    }
    closeMenu() {
      this.ui.hideAllOverlays();
      this.state = "dungeon";
    }
    equipFromInventory(item) {
      equipItem(this.player, item);
      this.ui.renderInventory(this.player);
      this.ui.renderEquipment(this.player);
      this.ui.updateHUD(this.player, this.donut, this.quests);
      this.ui.showMessage(`Equipped ${item.name}`);
    }
    unequipFromSlot(slot) {
      unequipItem(this.player, slot);
      this.ui.renderInventory(this.player);
      this.ui.renderEquipment(this.player);
      this.ui.updateHUD(this.player, this.donut, this.quests);
    }
    completeQuest(id) {
      const q = this.quests.find((q2) => q2.id === id);
      if (q) q.completed = true;
    }
    triggerStoryBeat(beatId) {
      const beat = STORY_BEATS[beatId];
      if (beat) this.ui.showMessage(beat.text, 4e3);
    }
    winGame() {
      this.completeQuest("survive");
      this.state = "victory";
      const elapsed = Math.floor((Date.now() - this.startTime) / 1e3);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      this.ui.showEndScreen(true, this.player, { time: `${mins}m ${secs}s` });
    }
    restart() {
      this.state = "title";
      this.ui.showOverlay("title-screen");
      this.player = null;
      this.donut = null;
      this.dungeon = null;
      this.combat = null;
    }
    gameLoop() {
      if (this.state === "dungeon" && this.dungeon) {
        this.renderer.render(this.dungeon, this.player, this.donut);
        if (this.player && this.player.hp / this.player.maxHp < 0.25) {
          if (Math.random() < 1e-3) this.triggerStoryBeat("low_hp");
        }
      }
      requestAnimationFrame(() => this.gameLoop());
    }
  };
  function bootGame() {
    window.DCCGame = new Game();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootGame);
  } else {
    bootGame();
  }
})();
