const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hudEl = document.getElementById("hud");
const playerCoreStatsEl = document.getElementById("playerCoreStats");
const resourceStatsEl = document.getElementById("resourceStats");
const levelButtonsEl = document.getElementById("levelButtons");
const skillPointInfoEl = document.getElementById("skillPointInfo");
const equipmentPanelEl = document.getElementById("equipmentPanel");
const inventoryPanelEl = document.getElementById("inventoryPanel");
const synergyPanelEl = document.getElementById("synergyPanel");
const logPanelEl = document.getElementById("logPanel");
const objectivePanelEl = document.getElementById("objectivePanel");
const restartBtn = document.getElementById("restartBtn");

const RARITY_TABLE = [
  { key: "common", label: "Common", weight: 62, multiplier: 1, color: "#d4d9ef" },
  { key: "rare", label: "Rare", weight: 22, multiplier: 1.25, color: "#7fb8ff" },
  { key: "ultra-rare", label: "Ultra Rare", weight: 10, multiplier: 1.65, color: "#c389ff" },
  { key: "legendary", label: "Legendary", weight: 5, multiplier: 2.2, color: "#ffbf5b" },
  { key: "celestial", label: "Celestial", weight: 1, multiplier: 3.2, color: "#89fff4" },
];

const STAT_META = [
  ["strength", "Strength"],
  ["dexterity", "Dexterity"],
  ["constitution", "Constitution"],
  ["intelligence", "Intelligence"],
  ["charisma", "Charisma"],
  ["luck", "Luck"],
];

const EQUIP_SLOT_META = [
  ["head", "Head"],
  ["chest", "Chest"],
  ["hands", "Hands"],
  ["legs", "Legs"],
  ["boots", "Boots"],
  ["necklace", "Necklace"],
  ["leftHand", "Left Hand"],
  ["rightHand", "Right Hand"],
  ["charmA", "Charm I"],
  ["charmB", "Charm II"],
];

const ITEM_TEMPLATES = [
  {
    id: "scrap-helm",
    name: "Scrap Helmet",
    slot: "head",
    flavor: "Industrial leftovers reforged by desperate crawlers.",
    stats: { constitution: 2, armor: 2 },
  },
  {
    id: "donut-tiara",
    name: "Princess Donut's Stage Tiara",
    slot: "head",
    flavor: "Rhinestones that radiate deadly confidence.",
    stats: { charisma: 3, donutPower: 2, crit: 0.01 },
  },
  {
    id: "duct-chest",
    name: "Duct-Taped Tactical Vest",
    slot: "chest",
    flavor: "Looks awful. Works surprisingly well.",
    stats: { maxHp: 18, armor: 4 },
  },
  {
    id: "crawler-aegis",
    name: "Crawler's Aegis Harness",
    slot: "chest",
    flavor: "A sponsor-grade chest plate with hazard runes.",
    stats: { maxHp: 24, armor: 5, strength: 1 },
  },
  {
    id: "bombardier-gloves",
    name: "Bombardier Gloves",
    slot: "hands",
    flavor: "Every punch has a chance to start an argument with physics.",
    stats: { attackSpeed: 0.14, dexterity: 2 },
  },
  {
    id: "donut-claws",
    name: "Donut's Bejeweled Claw Caps",
    slot: "hands",
    flavor: "Fashion weaponized.",
    stats: { donutPower: 4, charisma: 2, crit: 0.015 },
  },
  {
    id: "knee-pads",
    name: "Carl's Concrete Knee Pads",
    slot: "legs",
    flavor: "Built for sliding through blood and bureaucracy.",
    stats: { constitution: 2, armor: 2, moveSpeed: 0.12 },
  },
  {
    id: "tax-leggings",
    name: "Tax-Evader Leggings",
    slot: "legs",
    flavor: "Sprint now, explain later.",
    stats: { dexterity: 2, moveSpeed: 0.18 },
  },
  {
    id: "rocket-boots",
    name: "Rocket Boots of Mild Liability",
    slot: "boots",
    flavor: "You will move quickly. Safety not included.",
    stats: { moveSpeed: 0.24, dexterity: 1 },
  },
  {
    id: "sewer-boots",
    name: "Sewer Stompers",
    slot: "boots",
    flavor: "Immune to bad smells and weak footing.",
    stats: { moveSpeed: 0.14, armor: 1, constitution: 1 },
  },
  {
    id: "crawler-locket",
    name: "Crawler's Locket",
    slot: "necklace",
    flavor: "Warm pulse from a mysterious sponsor feed.",
    stats: { luck: 3, intelligence: 2, lootBonus: 0.06 },
  },
  {
    id: "announcer-mic",
    name: "Announcer's Broken Mic Pendant",
    slot: "necklace",
    flavor: "The dungeon can still hear you.",
    stats: { charisma: 3, intelligence: 1, donutPower: 1 },
  },
  {
    id: "rusty-machete",
    name: "Rusty Machete",
    slot: "rightHand",
    flavor: "It's seen things.",
    stats: { flatAttack: 6, lifesteal: 0.03 },
  },
  {
    id: "anarchist-hammer",
    name: "Anarchist's Sledge",
    slot: "leftHand",
    flavor: "Argument-ending kinetic diplomacy.",
    stats: { flatAttack: 9, strength: 2 },
  },
  {
    id: "crowbar-left",
    name: "Reinforced Crowbar",
    slot: "leftHand",
    flavor: "A classic dungeon multipurpose solution.",
    stats: { flatAttack: 5, attackSpeed: 0.08 },
  },
  {
    id: "shiv-right",
    name: "Sponsor's Carbon Shiv",
    slot: "rightHand",
    flavor: "Small, fast, and unfair.",
    stats: { flatAttack: 4, crit: 0.03, dexterity: 1 },
  },
  {
    id: "chaos-charm",
    name: "Charm of Chaotic TV Ratings",
    slot: "charm",
    flavor: "Bad ideas happen more often, but so do miracles.",
    stats: { luck: 2, crit: 0.012, donutPower: 1 },
  },
  {
    id: "sponsor-token",
    name: "Sponsor Favor Token",
    slot: "charm",
    flavor: "Converts applause directly into violence.",
    stats: { flatAttack: 3, charisma: 2, lootBonus: 0.04 },
  },
  {
    id: "hazard-bead",
    name: "Hazard Bead",
    slot: "charm",
    flavor: "Tiny orb, questionable probability field.",
    stats: { intelligence: 2, luck: 2 },
  },
];

const SYNERGY_DEFS = [
  {
    id: "royal-broadcast",
    name: "Royal Broadcast",
    description: "Tiara + Crawler's Locket: Donut attacks faster and harder.",
    isActive: (ids) => ids.has("donut-tiara") && ids.has("crawler-locket"),
    bonus: { donutRate: 0.25, donutPower: 4 },
  },
  {
    id: "boom-brigade",
    name: "Boom Brigade",
    description: "Bombardier Gloves + Anarchist's Sledge: Carl's attacks cause splash damage.",
    isActive: (ids) => ids.has("bombardier-gloves") && ids.has("anarchist-hammer"),
    bonus: { splashDamage: 0.35 },
  },
  {
    id: "alley-sprinter",
    name: "Alley Sprinter",
    description: "Rocket Boots + Knee Pads: speed spikes and chance to dodge hits.",
    isActive: (ids) => ids.has("rocket-boots") && ids.has("knee-pads"),
    bonus: { moveSpeed: 0.2, dodgeChance: 0.08 },
  },
  {
    id: "blood-and-glitter",
    name: "Blood and Glitter",
    description: "Rusty Machete + Chaos Charm: lifesteal and crit chance increased.",
    isActive: (ids) => ids.has("rusty-machete") && ids.has("chaos-charm"),
    bonus: { lifesteal: 0.06, crit: 0.035 },
  },
  {
    id: "double-trouble",
    name: "Double Trouble",
    description: "Equip both hands with weapons: attack speed and crit rise.",
    isActive: (ids, equipped) => Boolean(equipped.leftHand) && Boolean(equipped.rightHand),
    bonus: { attackSpeed: 0.18, crit: 0.02 },
  },
];

const FLOOR_DATA = {
  floorNumber: 1,
  storyIntro: [
    "The world has ended. Welcome to the dungeon.",
    "Carl drops into Floor 1 with Princess Donut on his shoulder.",
    "The first floor is a lethal obstacle course disguised as entertainment.",
  ],
  neighborhoods: [
    {
      name: "Collapsed Stairwell District",
      targetKills: 10,
      ambience: "#28304f",
      monsters: [
        { name: "Gutter Rat", hp: 26, damage: 6, speed: 1.08, xp: 9, radius: 13, color: "#8c8271" },
        { name: "Tapeworm Slime", hp: 32, damage: 5, speed: 0.86, xp: 10, radius: 14, color: "#7ca67a" },
      ],
      boss: {
        name: "Neighborhood Boss: Rat King Auditor",
        hp: 210,
        damage: 14,
        speed: 0.9,
        xp: 120,
        radius: 22,
        color: "#d1a351",
        lootRolls: 2,
      },
    },
    {
      name: "Subway Burrow",
      targetKills: 12,
      ambience: "#31284f",
      monsters: [
        { name: "Metro Goblin", hp: 36, damage: 8, speed: 1.16, xp: 12, radius: 13, color: "#76a884" },
        { name: "Ticket Ghoul", hp: 42, damage: 9, speed: 0.92, xp: 13, radius: 15, color: "#967da9" },
      ],
      boss: {
        name: "Neighborhood Boss: Conductrix Vexa",
        hp: 300,
        damage: 18,
        speed: 1.05,
        xp: 160,
        radius: 23,
        color: "#d17af0",
        lootRolls: 2,
      },
    },
    {
      name: "The Audience Pit",
      targetKills: 14,
      ambience: "#4a2837",
      monsters: [
        { name: "Camera Drone Mite", hp: 40, damage: 10, speed: 1.28, xp: 14, radius: 12, color: "#95cdfc" },
        { name: "Ad Break Fiend", hp: 48, damage: 11, speed: 1.02, xp: 15, radius: 16, color: "#f18972" },
      ],
      boss: {
        name: "Neighborhood Boss: Claptrap Minotaur",
        hp: 410,
        damage: 22,
        speed: 1.1,
        xp: 220,
        radius: 24,
        color: "#ef9f5a",
        lootRolls: 3,
      },
    },
  ],
  floorBoss: {
    name: "Floor Boss: Maestro of the First Floor",
    hp: 760,
    damage: 30,
    speed: 1.18,
    xp: 500,
    radius: 34,
    color: "#ff5f8b",
    lootRolls: 4,
  },
};

const EVENT_DEFS = [
  {
    id: "loot-pinata",
    name: "Whacky Event: Loot Piñata Meltdown",
    description: "For a short window, every enemy is extra likely to drop loot.",
    durationMs: 16000,
    apply: (mods) => {
      mods.dropBonus += 0.6;
    },
  },
  {
    id: "gravity-tax",
    name: "Whacky Event: Gravity Tax Audit",
    description: "Carl is slowed while enemies hit harder.",
    durationMs: 13000,
    apply: (mods) => {
      mods.playerMoveMult *= 0.75;
      mods.enemyDamageMult *= 1.28;
    },
  },
  {
    id: "donut-spotlight",
    name: "Whacky Event: Donut Demands Spotlight",
    description: "Donut steals the show and fires faster.",
    durationMs: 18000,
    apply: (mods) => {
      mods.donutRateBonus += 0.45;
      mods.donutPowerBonus += 4;
    },
  },
  {
    id: "sponsor-shield",
    name: "Whacky Event: Sponsor Care Package",
    description: "Temporary defensive field protects Carl.",
    durationMs: 14000,
    apply: (mods) => {
      mods.armorBonus += 10;
      mods.critBonus += 0.03;
    },
  },
];

const keys = {};

let runState = null;
let player = null;
let inventory = [];
let equipment = null;
let enemies = [];
let combatEffects = [];
let activeSynergies = [];
let logs = [];

const uiState = {
  rerenderInventory: true,
  rerenderEquipment: true,
  rerenderStats: true,
  rerenderSynergy: true,
  rerenderObjective: true,
  rerenderLogs: true,
};

document.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

restartBtn.addEventListener("click", () => {
  resetRun();
});

function createBasePlayer() {
  const baseStats = {
    strength: 6,
    dexterity: 6,
    constitution: 6,
    intelligence: 5,
    charisma: 5,
    luck: 4,
  };
  return {
    x: canvas.width * 0.5,
    y: canvas.height * 0.52,
    radius: 16,
    baseStats,
    stats: { ...baseStats },
    level: 1,
    skillPoints: 0,
    xp: 0,
    xpToNext: 90,
    hp: 100,
    maxHp: 100,
    attack: 14,
    armor: 0,
    crit: 0.05,
    moveSpeed: 3.1,
    attackCooldownMs: 880,
    attackTimerMs: 0,
    attackRange: 165,
    lifesteal: 0,
    donutPower: 6,
    donutAttackMs: 1400,
    donutTimerMs: 0,
    dodgeChance: 0,
    lootBonus: 0,
  };
}

function createEmptyEquipment() {
  return {
    head: null,
    chest: null,
    hands: null,
    legs: null,
    boots: null,
    necklace: null,
    leftHand: null,
    rightHand: null,
    charmA: null,
    charmB: null,
  };
}

function createRunState() {
  return {
    floor: 1,
    elapsedMs: 0,
    totalKills: 0,
    neighborhoodIndex: 0,
    neighborhoodKills: 0,
    neighborhoodBossActive: false,
    neighborhoodBossesCleared: 0,
    floorBossActive: false,
    floorBossDefeated: false,
    spawnTimerMs: 0,
    ended: false,
    won: false,
    pendingEventMs: randomBetween(12000, 21000),
    activeEvent: null,
    activeEventTimerMs: 0,
    currentEventMods: defaultEventMods(),
  };
}

function defaultEventMods() {
  return {
    playerMoveMult: 1,
    enemyDamageMult: 1,
    donutRateBonus: 0,
    donutPowerBonus: 0,
    dropBonus: 0,
    armorBonus: 0,
    critBonus: 0,
  };
}

function resetRun() {
  player = createBasePlayer();
  runState = createRunState();
  inventory = [];
  equipment = createEmptyEquipment();
  enemies = [];
  combatEffects = [];
  activeSynergies = [];
  logs = [];
  addLog("Run started. Carl and Donut drop into Floor 1.", "info");
  for (const line of FLOOR_DATA.storyIntro) {
    addLog(line, "story");
  }
  addLog("Objective: survive the neighborhoods, defeat each neighborhood boss, then kill the floor boss.", "objective");
  recalculateBuild();
  spawnStarterKit();
  markAllUiDirty();
}

function spawnStarterKit() {
  const starterTemplates = ["scrap-helm", "rusty-machete", "sewer-boots"];
  for (const id of starterTemplates) {
    const template = ITEM_TEMPLATES.find((item) => item.id === id);
    if (template) {
      const item = makeLootItem(template, "common");
      inventory.push(item);
    }
  }
  addLog("You found your starter scavenged gear in the first room.", "loot");
}

function markAllUiDirty() {
  Object.keys(uiState).forEach((key) => {
    uiState[key] = true;
  });
}

function addLog(text, type = "info") {
  const prefixMap = {
    info: "INFO",
    story: "STORY",
    loot: "LOOT",
    combat: "COMBAT",
    event: "EVENT",
    objective: "OBJECTIVE",
    level: "LEVEL",
  };
  const prefix = prefixMap[type] ?? "INFO";
  logs.unshift(`[${prefix}] ${text}`);
  logs = logs.slice(0, 90);
  uiState.rerenderLogs = true;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function chooseRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function getThreatScale() {
  const timeScale = 1 + runState.elapsedMs / 165000;
  const killScale = 1 + runState.totalKills * 0.008;
  const levelScale = 1 + (player.level - 1) * 0.11;
  return timeScale * killScale * levelScale;
}

function currentNeighborhood() {
  return FLOOR_DATA.neighborhoods[Math.min(runState.neighborhoodIndex, FLOOR_DATA.neighborhoods.length - 1)];
}

function spawnEnemy(template, overrides = {}) {
  const spawnOnLeft = Math.random() < 0.5;
  const x = spawnOnLeft ? -40 : canvas.width + 40;
  const y = randomBetween(45, canvas.height - 45);
  const threat = getThreatScale();
  const hpScale = overrides.boss ? 1.08 : 1;
  const damageScale = overrides.boss ? 1.12 : 1;
  const enemy = {
    id: `enemy-${Date.now()}-${Math.random()}`,
    name: template.name,
    x,
    y,
    radius: template.radius,
    maxHp: Math.round(template.hp * threat * hpScale),
    hp: Math.round(template.hp * threat * hpScale),
    damage: Math.round(template.damage * threat * damageScale),
    speed: template.speed * Math.min(1.45, 1 + runState.elapsedMs / 300000),
    xp: Math.round(template.xp * (1 + runState.neighborhoodIndex * 0.22)),
    color: template.color,
    attackTimerMs: randomBetween(200, 700),
    isBoss: Boolean(overrides.boss),
    bossKind: overrides.bossKind || null,
    lootRolls: overrides.lootRolls || 0,
    maxContactRange: template.radius + player.radius + 2,
  };
  enemies.push(enemy);
}

function spawnNeighborhoodBoss() {
  if (runState.neighborhoodBossActive || runState.neighborhoodIndex >= FLOOR_DATA.neighborhoods.length) {
    return;
  }
  const n = currentNeighborhood();
  runState.neighborhoodBossActive = true;
  spawnEnemy(n.boss, { boss: true, bossKind: "neighborhood", lootRolls: n.boss.lootRolls });
  addLog(`Neighborhood boss spawned: ${n.boss.name}.`, "objective");
  uiState.rerenderObjective = true;
}

function spawnFloorBoss() {
  if (runState.floorBossActive || runState.floorBossDefeated) {
    return;
  }
  runState.floorBossActive = true;
  spawnEnemy(FLOOR_DATA.floorBoss, {
    boss: true,
    bossKind: "floor",
    lootRolls: FLOOR_DATA.floorBoss.lootRolls,
  });
  addLog("The floor trembles. The Floor Boss has arrived.", "objective");
  uiState.rerenderObjective = true;
}

function maybeSpawnEnemies(dtMs) {
  if (runState.ended) {
    return;
  }

  const n = currentNeighborhood();
  const activeRegular = enemies.filter((enemy) => !enemy.isBoss).length;
  const activeBoss = enemies.some((enemy) => enemy.isBoss);
  const spawnCap = 8 + Math.floor(runState.neighborhoodIndex * 2 + runState.elapsedMs / 80000);
  runState.spawnTimerMs -= dtMs;

  if (runState.neighborhoodIndex < FLOOR_DATA.neighborhoods.length) {
    const remaining = n.targetKills - runState.neighborhoodKills;
    if (remaining <= 0 && !runState.neighborhoodBossActive && !activeBoss) {
      spawnNeighborhoodBoss();
      return;
    }

    if (!runState.neighborhoodBossActive && runState.spawnTimerMs <= 0 && activeRegular < spawnCap) {
      const template = chooseRandom(n.monsters);
      spawnEnemy(template);
      runState.spawnTimerMs = randomBetween(500, 1000);
    }
  } else if (!runState.floorBossActive && !activeBoss) {
    spawnFloorBoss();
  } else if (runState.floorBossActive && runState.spawnTimerMs <= 0 && activeRegular < 5) {
    const fallback = chooseRandom(FLOOR_DATA.neighborhoods[FLOOR_DATA.neighborhoods.length - 1].monsters);
    spawnEnemy(fallback);
    runState.spawnTimerMs = randomBetween(1200, 1700);
  }
}

function nearestEnemyWithinRange(range) {
  let target = null;
  let bestDist = Number.MAX_SAFE_INTEGER;
  for (const enemy of enemies) {
    const d = distance(player.x, player.y, enemy.x, enemy.y);
    if (d < range && d < bestDist) {
      bestDist = d;
      target = enemy;
    }
  }
  return target;
}

function damageEnemy(enemy, amount, source = "Carl") {
  enemy.hp -= amount;
  combatEffects.push({
    type: "text",
    x: enemy.x,
    y: enemy.y - enemy.radius - 8,
    ttl: 600,
    text: `${source} -${Math.round(amount)}`,
    color: source === "Donut" ? "#ff95db" : "#ff9f9f",
  });
  if (enemy.hp <= 0) {
    onEnemyKilled(enemy);
  }
}

function onEnemyKilled(enemy) {
  enemies = enemies.filter((entry) => entry.id !== enemy.id);
  runState.totalKills += 1;
  gainXp(enemy.xp);

  if (!enemy.isBoss && runState.neighborhoodIndex < FLOOR_DATA.neighborhoods.length && !runState.neighborhoodBossActive) {
    runState.neighborhoodKills += 1;
  }

  if (enemy.isBoss && enemy.bossKind === "neighborhood") {
    runState.neighborhoodBossActive = false;
    runState.neighborhoodBossesCleared += 1;
    runState.neighborhoodIndex += 1;
    runState.neighborhoodKills = 0;
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.25);
    addLog("Neighborhood boss defeated. Carl catches his breath and advances.", "objective");
    enemies = enemies.filter((entry) => !entry.isBoss);
  }

  if (enemy.isBoss && enemy.bossKind === "floor") {
    runState.floorBossActive = false;
    runState.floorBossDefeated = true;
    runState.ended = true;
    runState.won = true;
    addLog("Floor boss down. Stairwell to Floor 2 opens (demo end).", "story");
  }

  handleLootDrops(enemy);
  uiState.rerenderObjective = true;
}

function gainXp(amount) {
  player.xp += amount;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.skillPoints += 3;
    player.xpToNext = Math.round(80 * Math.pow(1.34, player.level));
    addLog(`Level ${player.level} reached. Allocate your new stat points.`, "level");
    recalculateBuild();
  }
  uiState.rerenderStats = true;
}

function getEquippedItems() {
  return Object.values(equipment).filter(Boolean);
}

function getItemIds() {
  const ids = new Set();
  for (const item of getEquippedItems()) {
    ids.add(item.templateId);
  }
  return ids;
}

function recalculateBuild() {
  const baseStats = { ...player.baseStats };

  const flat = {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    charisma: 0,
    luck: 0,
    maxHp: 0,
    armor: 0,
    moveSpeed: 0,
    attackSpeed: 0,
    flatAttack: 0,
    crit: 0,
    donutPower: 0,
    lifesteal: 0,
    lootBonus: 0,
    dodgeChance: 0,
  };

  for (const item of getEquippedItems()) {
    for (const [key, value] of Object.entries(item.stats)) {
      if (flat[key] === undefined) {
        flat[key] = 0;
      }
      flat[key] += value;
    }
  }

  const ids = getItemIds();
  activeSynergies = [];
  for (const synergy of SYNERGY_DEFS) {
    if (synergy.isActive(ids, equipment)) {
      activeSynergies.push(synergy);
      for (const [key, value] of Object.entries(synergy.bonus)) {
        if (flat[key] === undefined) {
          flat[key] = 0;
        }
        flat[key] += value;
      }
    }
  }

  const finalStats = {};
  for (const [stat] of STAT_META) {
    finalStats[stat] = baseStats[stat] + (flat[stat] || 0);
  }
  player.stats = finalStats;

  const strength = finalStats.strength;
  const dexterity = finalStats.dexterity;
  const constitution = finalStats.constitution;
  const intelligence = finalStats.intelligence;
  const charisma = finalStats.charisma;
  const luck = finalStats.luck;

  player.maxHp = Math.round(88 + constitution * 13 + strength * 2 + (flat.maxHp || 0));
  player.attack = Math.round(6 + strength * 1.8 + dexterity * 0.7 + (flat.flatAttack || 0));
  player.armor = Number((constitution * 0.68 + (flat.armor || 0)).toFixed(2));
  player.moveSpeed = 2.6 + dexterity * 0.07 + (flat.moveSpeed || 0);
  player.crit = 0.03 + dexterity * 0.003 + luck * 0.003 + (flat.crit || 0);
  player.attackCooldownMs = Math.max(280, 890 / (1 + dexterity * 0.02 + (flat.attackSpeed || 0)));
  player.donutPower = Math.round(4 + charisma * 0.75 + intelligence * 0.55 + (flat.donutPower || 0));
  player.donutAttackMs = Math.max(360, 1350 / (1 + charisma * 0.012 + (flat.donutRate || 0)));
  player.lifesteal = Math.min(0.45, 0.01 + luck * 0.002 + (flat.lifesteal || 0));
  player.lootBonus = Math.min(0.5, luck * 0.006 + (flat.lootBonus || 0));
  player.dodgeChance = Math.min(0.35, dexterity * 0.003 + (flat.dodgeChance || 0));
  player.hp = Math.min(player.maxHp, Math.max(0, player.hp));

  uiState.rerenderSynergy = true;
  uiState.rerenderStats = true;
}

function weightedRandom(table) {
  const sum = table.reduce((acc, item) => acc + item.weight, 0);
  let roll = Math.random() * sum;
  for (const item of table) {
    roll -= item.weight;
    if (roll <= 0) {
      return item;
    }
  }
  return table[table.length - 1];
}

function rollRarity() {
  const fortune = Math.min(0.38, player.lootBonus + player.stats.luck * 0.0025);
  const scaledTable = RARITY_TABLE.map((entry) => {
    const multByTier = {
      common: 1 - fortune,
      rare: 1 + fortune * 0.45,
      "ultra-rare": 1 + fortune * 0.9,
      legendary: 1 + fortune * 1.25,
      celestial: 1 + fortune * 1.8,
    };
    return { ...entry, weight: entry.weight * multByTier[entry.key] };
  });
  return weightedRandom(scaledTable);
}

function makeLootItem(template, forcedRarityKey) {
  const rarity = forcedRarityKey
    ? RARITY_TABLE.find((item) => item.key === forcedRarityKey) || RARITY_TABLE[0]
    : rollRarity();

  const mult = rarity.multiplier;
  const resultStats = {};
  for (const [key, value] of Object.entries(template.stats)) {
    if (Math.abs(value) < 0.05) {
      resultStats[key] = value;
      continue;
    }
    if (key === "crit" || key === "lifesteal" || key === "lootBonus" || key === "attackSpeed" || key === "moveSpeed") {
      resultStats[key] = Number((value * (0.6 + mult * 0.5)).toFixed(3));
    } else {
      resultStats[key] = Math.max(1, Math.round(value * mult));
    }
  }

  return {
    id: `loot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    templateId: template.id,
    name: template.name,
    slot: template.slot,
    rarity: rarity.key,
    rarityLabel: rarity.label,
    flavor: template.flavor,
    stats: resultStats,
  };
}

function spawnLootRoll() {
  const template = chooseRandom(ITEM_TEMPLATES);
  const item = makeLootItem(template);
  inventory.push(item);
  uiState.rerenderInventory = true;
  addLog(`${item.rarityLabel} loot found: ${item.name}.`, "loot");
}

function handleLootDrops(enemy) {
  let rolls = enemy.lootRolls || 0;
  if (!enemy.isBoss) {
    const dropChance = Math.min(0.92, 0.2 + player.lootBonus + runState.currentEventMods.dropBonus);
    if (Math.random() < dropChance) {
      rolls += 1;
    }
  }
  for (let i = 0; i < rolls; i += 1) {
    spawnLootRoll();
  }
}

function equipItem(itemId) {
  const idx = inventory.findIndex((item) => item.id === itemId);
  if (idx === -1) {
    return;
  }
  const [item] = inventory.splice(idx, 1);
  let replaced = null;

  if (item.slot === "charm") {
    if (!equipment.charmA) {
      equipment.charmA = item;
    } else if (!equipment.charmB) {
      equipment.charmB = item;
    } else {
      replaced = equipment.charmA;
      equipment.charmA = item;
    }
  } else {
    replaced = equipment[item.slot];
    equipment[item.slot] = item;
  }

  if (replaced) {
    inventory.push(replaced);
  }
  recalculateBuild();
  uiState.rerenderInventory = true;
  uiState.rerenderEquipment = true;
  addLog(`Equipped ${item.name} (${item.rarityLabel}).`, "info");
}

function unequipSlot(slot) {
  if (slot === "charmA" || slot === "charmB") {
    if (equipment[slot]) {
      inventory.push(equipment[slot]);
      addLog(`Unequipped ${equipment[slot].name}.`, "info");
      equipment[slot] = null;
    }
  } else if (equipment[slot]) {
    inventory.push(equipment[slot]);
    addLog(`Unequipped ${equipment[slot].name}.`, "info");
    equipment[slot] = null;
  }
  recalculateBuild();
  uiState.rerenderEquipment = true;
  uiState.rerenderInventory = true;
}

function applyLevelPoint(stat) {
  if (player.skillPoints <= 0) {
    return;
  }
  if (player.baseStats[stat] === undefined) {
    return;
  }
  player.skillPoints -= 1;
  player.baseStats[stat] += 1;
  recalculateBuild();
}

function updatePlayerMovement(dtMs) {
  let dx = 0;
  let dy = 0;
  if (keys.w || keys.arrowup) dy -= 1;
  if (keys.s || keys.arrowdown) dy += 1;
  if (keys.a || keys.arrowleft) dx -= 1;
  if (keys.d || keys.arrowright) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const magnitude = Math.hypot(dx, dy);
    const speed = player.moveSpeed * runState.currentEventMods.playerMoveMult;
    player.x += (dx / magnitude) * speed * (dtMs / 16.666);
    player.y += (dy / magnitude) * speed * (dtMs / 16.666);
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
  }
}

function resolveCarlAttack(dtMs) {
  player.attackTimerMs -= dtMs;
  if (player.attackTimerMs > 0) {
    return;
  }
  const target = nearestEnemyWithinRange(player.attackRange);
  if (!target) {
    return;
  }
  player.attackTimerMs = player.attackCooldownMs;
  const crit = Math.random() < Math.min(0.75, player.crit + runState.currentEventMods.critBonus);
  const dmg = player.attack * (crit ? 1.75 : 1);
  damageEnemy(target, dmg, crit ? "Carl CRIT" : "Carl");
  combatEffects.push({
    type: "line",
    ttl: 130,
    x1: player.x,
    y1: player.y,
    x2: target.x,
    y2: target.y,
    color: crit ? "#ffe982" : "#9dc4ff",
  });
  if (player.lifesteal > 0) {
    player.hp = Math.min(player.maxHp, player.hp + dmg * player.lifesteal);
  }

  const hasSplash = activeSynergies.some((synergy) => synergy.id === "boom-brigade");
  if (hasSplash) {
    for (const enemy of enemies) {
      if (enemy.id === target.id) continue;
      const d = distance(enemy.x, enemy.y, target.x, target.y);
      if (d < 72) {
        damageEnemy(enemy, dmg * 0.35, "Splash");
      }
    }
  }
}

function resolveDonutAttack(dtMs) {
  player.donutTimerMs -= dtMs;
  if (player.donutTimerMs > 0) {
    return;
  }
  if (enemies.length === 0) {
    return;
  }

  const bonusRate = runState.currentEventMods.donutRateBonus;
  const activeRoyal = activeSynergies.some((synergy) => synergy.id === "royal-broadcast") ? 0.25 : 0;
  const cadence = Math.max(320, player.donutAttackMs * (1 - bonusRate - activeRoyal));
  player.donutTimerMs = cadence;

  const target = chooseRandom(enemies);
  const damage = player.donutPower + runState.currentEventMods.donutPowerBonus;
  damageEnemy(target, damage, "Donut");
  combatEffects.push({
    type: "line",
    ttl: 170,
    x1: player.x + Math.cos(runState.elapsedMs / 190) * 24,
    y1: player.y + Math.sin(runState.elapsedMs / 190) * 24,
    x2: target.x,
    y2: target.y,
    color: "#ff8de2",
  });
}

function applyDamageToPlayer(amount) {
  if (Math.random() < player.dodgeChance) {
    combatEffects.push({
      type: "text",
      x: player.x,
      y: player.y - 22,
      ttl: 500,
      text: "Dodged",
      color: "#8cffec",
    });
    return;
  }
  const armor = player.armor + runState.currentEventMods.armorBonus;
  const reduced = Math.max(1, Math.round(amount * runState.currentEventMods.enemyDamageMult - armor * 0.35));
  player.hp -= reduced;
  combatEffects.push({
    type: "text",
    x: player.x + randomBetween(-8, 8),
    y: player.y - 16,
    ttl: 620,
    text: `-${reduced}`,
    color: "#ff8787",
  });
  if (player.hp <= 0 && !runState.ended) {
    player.hp = 0;
    runState.ended = true;
    runState.won = false;
    addLog("Carl has fallen. The dungeon audience is disappointed.", "story");
  }
}

function updateEnemies(dtMs) {
  const delta = dtMs / 16.666;
  for (const enemy of enemies) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    enemy.x += (dx / dist) * enemy.speed * delta;
    enemy.y += (dy / dist) * enemy.speed * delta;
    enemy.attackTimerMs -= dtMs;

    if (dist <= enemy.maxContactRange && enemy.attackTimerMs <= 0) {
      enemy.attackTimerMs = enemy.isBoss ? 820 : 1100;
      applyDamageToPlayer(enemy.damage);
    }
  }
}

function updateEffects(dtMs) {
  for (const effect of combatEffects) {
    effect.ttl -= dtMs;
    if (effect.type === "text") {
      effect.y -= 0.025 * dtMs;
    }
  }
  combatEffects = combatEffects.filter((effect) => effect.ttl > 0);
}

function maybeTriggerEvent(dtMs) {
  if (runState.ended) {
    return;
  }
  if (runState.activeEvent) {
    runState.activeEventTimerMs -= dtMs;
    if (runState.activeEventTimerMs <= 0) {
      addLog(`Event ended: ${runState.activeEvent.name}.`, "event");
      runState.activeEvent = null;
      runState.currentEventMods = defaultEventMods();
      runState.pendingEventMs = randomBetween(16000, 26000);
      uiState.rerenderObjective = true;
    }
    return;
  }

  runState.pendingEventMs -= dtMs;
  if (runState.pendingEventMs <= 0) {
    const eventDef = chooseRandom(EVENT_DEFS);
    runState.activeEvent = eventDef;
    runState.activeEventTimerMs = eventDef.durationMs;
    runState.currentEventMods = defaultEventMods();
    eventDef.apply(runState.currentEventMods);
    addLog(`${eventDef.name}: ${eventDef.description}`, "event");
    uiState.rerenderObjective = true;
  }
}

function updateObjectivePanel() {
  if (!uiState.rerenderObjective) return;
  let text = "";
  if (runState.ended && runState.won) {
    text = `Floor ${runState.floor} clear!\nYou beat the floor boss.\nStairs to Floor 2 discovered.\n(Demo currently ends here.)`;
  } else if (runState.ended) {
    text = "Run failed. Restart and experiment with stronger item synergies.";
  } else if (runState.neighborhoodIndex < FLOOR_DATA.neighborhoods.length) {
    const n = currentNeighborhood();
    if (runState.neighborhoodBossActive) {
      text = `${n.name}\nDefeat the neighborhood boss to unlock the next zone.`;
    } else {
      const remaining = Math.max(0, n.targetKills - runState.neighborhoodKills);
      text = `${n.name}\nKill ${remaining} more monsters to draw out the neighborhood boss.`;
    }
  } else if (runState.floorBossActive) {
    text = `Floor Boss active.\nDefeat ${FLOOR_DATA.floorBoss.name}.`;
  } else {
    text = "The floor boss is preparing to appear.";
  }

  if (runState.activeEvent) {
    const remain = Math.ceil(runState.activeEventTimerMs / 1000);
    text += `\n\nActive Event: ${runState.activeEvent.name} (${remain}s)`;
  }

  objectivePanelEl.textContent = text;
  uiState.rerenderObjective = false;
}

function updateStatsPanel() {
  if (!uiState.rerenderStats) return;
  const statRows = STAT_META.map(([key, label]) => `<div>${label}: <strong>${player.stats[key]}</strong></div>`).join("");
  playerCoreStatsEl.innerHTML = statRows;

  const hpPct = (player.hp / player.maxHp) * 100;
  resourceStatsEl.innerHTML = `
    <div>HP: <strong>${Math.round(player.hp)} / ${player.maxHp}</strong></div>
    <div>XP: <strong>${Math.round(player.xp)} / ${player.xpToNext}</strong></div>
    <div>Level: <strong>${player.level}</strong></div>
    <div>Skill Pts: <strong>${player.skillPoints}</strong></div>
    <div>Atk: <strong>${player.attack}</strong></div>
    <div>Armor: <strong>${player.armor.toFixed(1)}</strong></div>
    <div>Crit: <strong>${(Math.min(0.95, player.crit + runState.currentEventMods.critBonus) * 100).toFixed(1)}%</strong></div>
    <div>Move: <strong>${(player.moveSpeed * runState.currentEventMods.playerMoveMult).toFixed(2)}</strong></div>
    <div>Lifesteal: <strong>${(player.lifesteal * 100).toFixed(1)}%</strong></div>
    <div>Loot Bonus: <strong>${(player.lootBonus * 100).toFixed(1)}%</strong></div>
    <div>HP Bar: <strong>${hpPct.toFixed(0)}%</strong></div>
    <div>Kills: <strong>${runState.totalKills}</strong></div>
  `;
  skillPointInfoEl.textContent = `Skill points: ${player.skillPoints}`;

  levelButtonsEl.innerHTML = "";
  for (const [key, label] of STAT_META) {
    const button = document.createElement("button");
    button.textContent = `+1 ${label}`;
    button.disabled = player.skillPoints <= 0 || runState.ended;
    button.addEventListener("click", () => applyLevelPoint(key));
    levelButtonsEl.appendChild(button);
  }

  uiState.rerenderStats = false;
}

function renderStatDelta(stats) {
  const keysOfInterest = ["flatAttack", "armor", "maxHp", "moveSpeed", "attackSpeed", "crit", "lifesteal", "lootBonus", "donutPower"];
  const parts = [];
  for (const [key, value] of Object.entries(stats)) {
    if (Math.abs(value) < 0.001) continue;
    const map = {
      strength: "STR",
      dexterity: "DEX",
      constitution: "CON",
      intelligence: "INT",
      charisma: "CHA",
      luck: "LUK",
      flatAttack: "ATK",
      armor: "ARM",
      maxHp: "HP",
      moveSpeed: "MOVE",
      attackSpeed: "ASPD",
      crit: "CRIT",
      lifesteal: "LIFESTEAL",
      lootBonus: "LOOT",
      donutPower: "DONUT",
      dodgeChance: "DODGE",
    };
    const isPct = keysOfInterest.includes(key) && !["flatAttack", "armor", "maxHp", "donutPower"].includes(key);
    const valueText = isPct ? `${(value * 100).toFixed(1)}%` : `${value > 0 ? "+" : ""}${value}`;
    parts.push(`${map[key] || key}: ${valueText}`);
  }
  return parts.join(", ");
}

function updateInventoryPanel() {
  if (!uiState.rerenderInventory) return;
  inventoryPanelEl.innerHTML = "";
  const sorted = [...inventory].sort((a, b) => {
    const order = ["common", "rare", "ultra-rare", "legendary", "celestial"];
    return order.indexOf(b.rarity) - order.indexOf(a.rarity);
  });

  if (sorted.length === 0) {
    inventoryPanelEl.textContent = "No unequipped items.";
  } else {
    for (const item of sorted) {
      const card = document.createElement("div");
      card.className = `inventory-card rarity-${item.rarity}`;
      const labelSlot = item.slot === "charm" ? "Charm" : item.slot;
      card.innerHTML = `
        <p><strong>${item.name}</strong></p>
        <p>${item.rarityLabel} • Slot: ${labelSlot}</p>
        <p>${renderStatDelta(item.stats)}</p>
        <p>${item.flavor}</p>
      `;
      const equipBtn = document.createElement("button");
      equipBtn.textContent = "Equip";
      equipBtn.disabled = runState.ended;
      equipBtn.addEventListener("click", () => equipItem(item.id));
      card.appendChild(equipBtn);
      inventoryPanelEl.appendChild(card);
    }
  }
  uiState.rerenderInventory = false;
}

function updateEquipmentPanel() {
  if (!uiState.rerenderEquipment) return;
  equipmentPanelEl.innerHTML = "";
  for (const [slot, label] of EQUIP_SLOT_META) {
    const equipped = equipment[slot];
    const row = document.createElement("div");
    row.className = "equip-row";
    if (!equipped) {
      row.innerHTML = `<strong>${label}:</strong> (empty)`;
    } else {
      row.innerHTML = `<strong>${label}:</strong> ${equipped.name} <span class="rarity-${equipped.rarity}">(${equipped.rarityLabel})</span>`;
      const btn = document.createElement("button");
      btn.textContent = "Unequip";
      btn.disabled = runState.ended;
      btn.addEventListener("click", () => unequipSlot(slot));
      row.appendChild(document.createTextNode(" "));
      row.appendChild(btn);
    }
    equipmentPanelEl.appendChild(row);
  }
  uiState.rerenderEquipment = false;
}

function updateSynergyPanel() {
  if (!uiState.rerenderSynergy) return;
  synergyPanelEl.innerHTML = "";
  if (activeSynergies.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No synergies active. Try pairing thematic items.";
    synergyPanelEl.appendChild(li);
  } else {
    for (const synergy of activeSynergies) {
      const li = document.createElement("li");
      li.textContent = `${synergy.name} - ${synergy.description}`;
      synergyPanelEl.appendChild(li);
    }
  }
  uiState.rerenderSynergy = false;
}

function updateLogPanel() {
  if (!uiState.rerenderLogs) return;
  logPanelEl.innerHTML = logs.map((line) => `<div class="log-line">${line}</div>`).join("");
  uiState.rerenderLogs = false;
}

function updateHud() {
  const n = currentNeighborhood();
  const neighborhoodText =
    runState.neighborhoodIndex < FLOOR_DATA.neighborhoods.length
      ? `${runState.neighborhoodIndex + 1}/${FLOOR_DATA.neighborhoods.length} ${n.name}`
      : "Floor Boss Arena";
  hudEl.textContent = `Floor ${runState.floor} | Zone: ${neighborhoodText} | Threat x${getThreatScale().toFixed(2)}`;
}

function drawBackground() {
  const n = currentNeighborhood();
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#090d1a");
  gradient.addColorStop(1, n.ambience || "#181f3d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(170, 186, 255, 0.08)";
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawPlayerAndDonut() {
  const donutX = player.x + Math.cos(runState.elapsedMs / 260) * 24;
  const donutY = player.y + Math.sin(runState.elapsedMs / 260) * 24;

  ctx.fillStyle = "#65a8ff";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff95df";
  ctx.beginPath();
  ctx.arc(donutX, donutY, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f4f6ff";
  ctx.font = "12px Arial";
  ctx.fillText("Carl", player.x - 12, player.y - 22);
  ctx.fillText("Donut", donutX - 14, donutY - 14);
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.isBoss) {
      ctx.strokeStyle = "#ffe778";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = "#272b3b";
    ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, enemy.radius * 2, 4);
    ctx.fillStyle = enemy.isBoss ? "#ff7e94" : "#74f1b1";
    ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, enemy.radius * 2 * hpPct, 4);

    ctx.fillStyle = "#f7f8ff";
    ctx.font = "11px Arial";
    ctx.fillText(enemy.name, enemy.x - enemy.radius, enemy.y + enemy.radius + 14);
  }
}

function drawEffects() {
  for (const effect of combatEffects) {
    if (effect.type === "line") {
      ctx.strokeStyle = effect.color;
      ctx.globalAlpha = Math.max(0.2, effect.ttl / 170);
      ctx.beginPath();
      ctx.moveTo(effect.x1, effect.y1);
      ctx.lineTo(effect.x2, effect.y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (effect.type === "text") {
      ctx.fillStyle = effect.color;
      ctx.font = "13px Arial";
      ctx.fillText(effect.text, effect.x, effect.y);
    }
  }
}

function drawOverlay() {
  if (!runState.ended) return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = runState.won ? "#9cffd2" : "#ff9797";
  ctx.font = "30px Arial";
  const title = runState.won ? "Floor 1 Cleared" : "Run Failed";
  ctx.fillText(title, canvas.width * 0.5 - 110, canvas.height * 0.5 - 18);
  ctx.fillStyle = "#edf1ff";
  ctx.font = "16px Arial";
  const subtitle = runState.won
    ? "You reached the stairwell to Floor 2."
    : "Rebuild your loadout and aim for stronger synergies.";
  ctx.fillText(subtitle, canvas.width * 0.5 - 170, canvas.height * 0.5 + 12);
}

function render() {
  drawBackground();
  drawPlayerAndDonut();
  drawEnemies();
  drawEffects();
  drawOverlay();
}

function update(dtMs) {
  if (runState.ended) {
    updateEffects(dtMs);
    return;
  }

  runState.elapsedMs += dtMs;
  updatePlayerMovement(dtMs);
  maybeSpawnEnemies(dtMs);
  resolveCarlAttack(dtMs);
  resolveDonutAttack(dtMs);
  updateEnemies(dtMs);
  updateEffects(dtMs);
  maybeTriggerEvent(dtMs);

  uiState.rerenderStats = true;
}

function syncUi() {
  updateHud();
  updateStatsPanel();
  updateInventoryPanel();
  updateEquipmentPanel();
  updateSynergyPanel();
  updateLogPanel();
  updateObjectivePanel();
}

let lastFrameTime = performance.now();
function gameLoop(now) {
  const dtMs = Math.min(50, now - lastFrameTime);
  lastFrameTime = now;
  update(dtMs);
  render();
  syncUi();
  requestAnimationFrame(gameLoop);
}

resetRun();
requestAnimationFrame(gameLoop);
