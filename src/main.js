const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  healthBar: document.querySelector("#healthBar"),
  healthText: document.querySelector("#healthText"),
  xpBar: document.querySelector("#xpBar"),
  xpText: document.querySelector("#xpText"),
  statList: document.querySelector("#statList"),
  roomText: document.querySelector("#roomText"),
  floorText: document.querySelector("#floorText"),
  threatPill: document.querySelector("#threatPill"),
  rarityPill: document.querySelector("#rarityPill"),
  objectiveText: document.querySelector("#objectiveText"),
  companionText: document.querySelector("#companionText"),
  toast: document.querySelector("#toast"),
  runLog: document.querySelector("#runLog"),
  inventoryModal: document.querySelector("#inventoryModal"),
  inventoryList: document.querySelector("#inventoryList"),
  equipmentGrid: document.querySelector("#equipmentGrid"),
  synergyList: document.querySelector("#synergyList"),
  levelModal: document.querySelector("#levelModal"),
  levelChoices: document.querySelector("#levelChoices"),
  inventoryButton: document.querySelector("#inventoryButton"),
  closeInventoryButton: document.querySelector("#closeInventoryButton"),
  restartButton: document.querySelector("#restartButton"),
};

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const ROOM_COUNT = 6;
const SLOT_ORDER = [
  "head",
  "chest",
  "hands",
  "legs",
  "boots",
  "necklace",
  "charm 1",
  "charm 2",
  "right hand",
  "left hand",
];

const RARITIES = [
  { id: "common", label: "Common", weight: 62, color: "#d9d9d9" },
  { id: "rare", label: "Rare", weight: 25, color: "#4db2ff" },
  { id: "ultra-rare", label: "Ultra Rare", weight: 9, color: "#b86cff" },
  { id: "legendary", label: "Legendary", weight: 3.5, color: "#ff9f1c" },
  { id: "celestial", label: "Celestial", weight: 0.5, color: "#89fff3" },
];

const STAT_DESCRIPTIONS = {
  Strength: "Raises melee damage and knockback.",
  Dexterity: "Raises move speed and dash recovery.",
  Constitution: "Raises maximum health.",
  Intelligence: "Improves cooldowns and gadget effects.",
  Wisdom: "Improves companion attacks and XP gains.",
  Charisma: "Improves event outcomes and companion morale.",
  Luck: "Improves loot rarity and critical chance.",
};

const ITEM_POOL = [
  {
    name: "Cardboard Crown",
    slot: "head",
    rarity: "common",
    stats: { Charisma: 1 },
    tags: ["cardboard", "royal"],
    description: "A damp crown that makes the audience weirdly supportive.",
  },
  {
    name: "Appliance Box Breastplate",
    slot: "chest",
    rarity: "common",
    stats: { Constitution: 1 },
    tags: ["cardboard"],
    description: "Mostly tape, bravado, and improbable structural integrity.",
  },
  {
    name: "Coupon-Clipped Greaves",
    slot: "legs",
    rarity: "common",
    stats: { Dexterity: 1 },
    tags: ["coupon"],
    description: "Every step makes a perforated tearing noise.",
  },
  {
    name: "Garage Sale Boots",
    slot: "boots",
    rarity: "common",
    stats: { Dexterity: 1 },
    tags: ["scrappy"],
    description: "They squeak before danger arrives.",
  },
  {
    name: "Laundry Hook",
    slot: "right hand",
    rarity: "common",
    stats: { Strength: 1 },
    damage: 4,
    tags: ["hook"],
    description: "A hooked pole with ambitions above its station.",
  },
  {
    name: "Trash Can Lid",
    slot: "left hand",
    rarity: "common",
    stats: { Constitution: 1 },
    defense: 2,
    tags: ["shield", "trash"],
    description: "A defensive classic with fresh dents.",
  },
  {
    name: "Glitter Bomb Gloves",
    slot: "hands",
    rarity: "rare",
    stats: { Strength: 1, Charisma: 1 },
    tags: ["glitter", "explosive"],
    description: "Critical hits spray distracting sparkles.",
  },
  {
    name: "Royal Bell Collar",
    slot: "necklace",
    rarity: "rare",
    stats: { Wisdom: 1, Charisma: 1 },
    tags: ["royal", "companion"],
    description: "Your companion's attacks chime with judgment.",
  },
  {
    name: "Emergency Nacho Charm",
    slot: "charm 1",
    rarity: "rare",
    stats: { Constitution: 1, Luck: 1 },
    tags: ["food", "charm"],
    description: "Drops a healing snack after every boss phase.",
  },
  {
    name: "Static-Spitting Wrench",
    slot: "right hand",
    rarity: "ultra-rare",
    stats: { Strength: 2, Intelligence: 1 },
    damage: 8,
    tags: ["electric", "tool"],
    description: "Chains bonus lightning into nearby enemies.",
  },
  {
    name: "Tabloid Trousers",
    slot: "legs",
    rarity: "ultra-rare",
    stats: { Dexterity: 2, Charisma: 1 },
    tags: ["audience", "gossip"],
    description: "Dodges become dramatic enough to earn reruns.",
  },
  {
    name: "Velvet Diva Cape",
    slot: "chest",
    rarity: "legendary",
    stats: { Charisma: 3, Wisdom: 1 },
    tags: ["royal", "companion", "audience"],
    description: "Your companion refuses to admit how good it looks.",
  },
  {
    name: "Meteoric Kettle",
    slot: "left hand",
    rarity: "legendary",
    stats: { Strength: 2, Intelligence: 2 },
    damage: 10,
    tags: ["electric", "kitchen"],
    description: "Blocks hits, then whistles hot plasma at offenders.",
  },
  {
    name: "Barefoot Prophecy Anklet",
    slot: "charm 2",
    rarity: "celestial",
    stats: { Luck: 4, Dexterity: 2 },
    tags: ["barefoot", "prophecy"],
    description: "The dungeon wants you to make unsafe footwear choices.",
  },
  {
    name: "Audience Favorite Tiara",
    slot: "head",
    rarity: "celestial",
    stats: { Charisma: 4, Wisdom: 2 },
    tags: ["royal", "audience", "companion"],
    description: "A sparkling contract with the cheering void.",
  },
];

const SYNERGIES = [
  {
    name: "Cardboard Crusader",
    requires: ["cardboard", "cardboard"],
    effect: "Cardboard gear grants +18 max health and +2 damage.",
    apply(mods) {
      mods.maxHealth += 18;
      mods.damage += 2;
    },
  },
  {
    name: "Royal Encore",
    requires: ["royal", "companion"],
    effect: "Companion attacks happen faster and heal you for 1.",
    apply(mods) {
      mods.companionRate += 0.55;
      mods.companionHeal += 1;
    },
  },
  {
    name: "Shock Kitchen",
    requires: ["electric", "kitchen"],
    effect: "Attacks arc lightning for bonus area damage.",
    apply(mods) {
      mods.chainLightning = true;
      mods.damage += 3;
    },
  },
  {
    name: "Unsafe Legend",
    requires: ["barefoot"],
    effect: "No boots equipped converts danger into speed and crit chance.",
    condition() {
      return !player.equipment.boots;
    },
    apply(mods) {
      mods.speed += 1.1;
      mods.crit += 0.12;
    },
  },
  {
    name: "Glitter Detonation",
    requires: ["glitter", "explosive"],
    effect: "Critical hits create a small sparkle blast.",
    apply(mods) {
      mods.sparkleBlast = true;
      mods.crit += 0.08;
    },
  },
];

const ROOMS = [
  {
    name: "Residential Ruin",
    story: "The first floor opens in a warped apartment block where the walls clap when someone gets hurt.",
    enemies: [
      { type: "moldCorgi", count: 3 },
      { type: "trashGoblin", count: 2 },
    ],
  },
  {
    name: "Laundry Court",
    story: "A vending machine heckles you about fabric softener while wet footprints circle the room.",
    enemies: [
      { type: "laundrySlime", count: 4 },
      { type: "couponMimic", count: 1 },
    ],
    event: "mysteryMachine",
  },
  {
    name: "Neighborhood Boss: HOA Minotaur",
    story: "A horned clipboard tyrant stamps violations into the floor and charges.",
    enemies: [{ type: "hoaMinotaur", count: 1, boss: "neighborhood" }],
  },
  {
    name: "Snack Shrine",
    story: "The dungeon offers refreshments with a statistically suspicious smile.",
    enemies: [
      { type: "snackKobold", count: 4 },
      { type: "moldCorgi", count: 2 },
    ],
    event: "fanMail",
  },
  {
    name: "Service Hall of Tiny Lawsuits",
    story: "Every tile claims you owe it damages. The monsters brought witnesses.",
    enemies: [
      { type: "couponMimic", count: 2 },
      { type: "laundrySlime", count: 3 },
      { type: "trashGoblin", count: 2 },
    ],
  },
  {
    name: "Floor Boss: The Leasing Office",
    story: "The office detaches from the building, grows too many legs, and demands a security deposit.",
    enemies: [{ type: "leasingOffice", count: 1, boss: "floor" }],
  },
];

const ENEMY_TYPES = {
  moldCorgi: {
    name: "Mold Corgi",
    hp: 28,
    speed: 1.35,
    damage: 8,
    radius: 16,
    xp: 16,
    color: "#71d35b",
    behavior: "swarm",
  },
  trashGoblin: {
    name: "Trash Goblin",
    hp: 36,
    speed: 1.05,
    damage: 11,
    radius: 18,
    xp: 20,
    color: "#a47b45",
    behavior: "zigzag",
  },
  laundrySlime: {
    name: "Laundry Slime",
    hp: 46,
    speed: 0.82,
    damage: 13,
    radius: 22,
    xp: 24,
    color: "#5cc8ff",
    behavior: "ooze",
  },
  couponMimic: {
    name: "Coupon Mimic",
    hp: 52,
    speed: 1.18,
    damage: 15,
    radius: 20,
    xp: 30,
    color: "#f0d56b",
    behavior: "ambush",
  },
  snackKobold: {
    name: "Snack Machine Kobold",
    hp: 34,
    speed: 1.5,
    damage: 10,
    radius: 15,
    xp: 21,
    color: "#ff8bd1",
    behavior: "swarm",
  },
  hoaMinotaur: {
    name: "HOA Minotaur",
    hp: 220,
    speed: 0.95,
    damage: 22,
    radius: 34,
    xp: 105,
    color: "#ff684f",
    behavior: "charge",
  },
  leasingOffice: {
    name: "The Leasing Office",
    hp: 420,
    speed: 0.7,
    damage: 28,
    radius: 48,
    xp: 260,
    color: "#d957ff",
    behavior: "boss",
  },
};

const keys = new Set();
const mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };
let toastTimer = 0;
let lastFrame = performance.now();

let player;
let state;

function defaultEquipment() {
  return SLOT_ORDER.reduce((equipment, slot) => {
    equipment[slot] = null;
    return equipment;
  }, {});
}

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function createPlayer() {
  return {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: 18,
    hp: 110,
    level: 1,
    xp: 0,
    xpToNext: 100,
    statPoints: 0,
    stats: {
      Strength: 3,
      Dexterity: 3,
      Constitution: 3,
      Intelligence: 2,
      Wisdom: 2,
      Charisma: 2,
      Luck: 1,
    },
    equipment: defaultEquipment(),
    inventory: [],
    attackCooldown: 0,
    dashCooldown: 0,
    invulnerable: 0,
    companionCooldown: 0,
    companionAngle: 0,
  };
}

function createState() {
  return {
    roomIndex: 0,
    enemies: [],
    pickups: [],
    particles: [],
    floatingText: [],
    floorCleared: false,
    gameOver: false,
    paused: false,
    awaitingLevelChoice: false,
    roomCleared: false,
    exitPulse: 0,
    bestRaritySeen: "common",
  };
}

function resetGame() {
  player = createPlayer();
  state = createState();
  spawnRoom(0);
  addStarterLoot();
  log("You enter Floor 1 with a dangerous lack of planning and one judgmental companion.");
  showToast("Survive the first floor. Press I to inspect gear.");
  refreshUi();
}

function addStarterLoot() {
  const starter = makeItem(ITEM_POOL.find((item) => item.name === "Laundry Hook"));
  player.inventory.push(starter);
  equipItem(starter.id, false);
}

function spawnRoom(roomIndex) {
  state.roomIndex = roomIndex;
  state.enemies = [];
  state.pickups = [];
  state.particles = [];
  state.floatingText = [];
  state.roomCleared = false;
  state.floorCleared = false;
  player.x = WIDTH / 2;
  player.y = HEIGHT - 92;

  const room = ROOMS[roomIndex];
  for (const pack of room.enemies) {
    for (let i = 0; i < pack.count; i += 1) {
      state.enemies.push(createEnemy(pack.type, roomIndex, pack.boss));
    }
  }

  if (room.event) {
    triggerEvent(room.event);
  }

  log(room.story);
  showToast(room.name);
  refreshUi();
}

function createEnemy(type, roomIndex, bossType) {
  const base = ENEMY_TYPES[type];
  const scale = 1 + roomIndex * 0.18 + (bossType === "floor" ? 0.35 : 0);
  const angle = Math.random() * Math.PI * 2;
  const distance = 150 + Math.random() * 190;
  return {
    id: makeId(),
    type,
    bossType,
    name: base.name,
    x: clamp(WIDTH / 2 + Math.cos(angle) * distance, 70, WIDTH - 70),
    y: clamp(HEIGHT / 2 + Math.sin(angle) * distance, 70, HEIGHT - 120),
    vx: 0,
    vy: 0,
    hp: Math.round(base.hp * scale),
    maxHp: Math.round(base.hp * scale),
    speed: base.speed * (1 + roomIndex * 0.04),
    damage: Math.round(base.damage * scale),
    radius: base.radius,
    xp: Math.round(base.xp * scale),
    color: base.color,
    behavior: base.behavior,
    hitCooldown: 0,
    chargeCooldown: 1.5 + Math.random(),
    stunned: 0,
    phase: 0,
  };
}

function makeItem(template) {
  return {
    ...template,
    id: makeId(),
    stats: { ...(template.stats ?? {}) },
  };
}

function weightedRarity() {
  const mods = getDerivedStats();
  const luck = player.stats.Luck + mods.statBonus.Luck;
  const adjusted = RARITIES.map((rarity, index) => ({
    ...rarity,
    weight: rarity.weight * (1 + Math.max(0, index - 1) * luck * 0.18),
  }));
  const total = adjusted.reduce((sum, rarity) => sum + rarity.weight, 0);
  let roll = Math.random() * total;
  for (const rarity of adjusted) {
    roll -= rarity.weight;
    if (roll <= 0) {
      return rarity.id;
    }
  }
  return "common";
}

function randomLoot(bonusRarity = false) {
  let rarity = weightedRarity();
  if (bonusRarity && Math.random() < 0.45) {
    const index = Math.min(RARITIES.findIndex((item) => item.id === rarity) + 1, RARITIES.length - 1);
    rarity = RARITIES[index].id;
  }
  const choices = ITEM_POOL.filter((item) => item.rarity === rarity);
  return makeItem(choices[Math.floor(Math.random() * choices.length)] ?? ITEM_POOL[0]);
}

function dropLoot(x, y, bonusRarity = false) {
  const item = randomLoot(bonusRarity);
  state.pickups.push({
    id: makeId(),
    kind: "item",
    item,
    x,
    y,
    radius: 16,
    bob: Math.random() * Math.PI * 2,
  });
  const seenIndex = RARITIES.findIndex((rarity) => rarity.id === state.bestRaritySeen);
  const itemIndex = RARITIES.findIndex((rarity) => rarity.id === item.rarity);
  if (itemIndex > seenIndex) {
    state.bestRaritySeen = item.rarity;
  }
  ui.rarityPill.textContent = `Loot: ${rarityLabel(state.bestRaritySeen)}`;
}

function dropHealth(x, y, amount = 18) {
  state.pickups.push({
    id: makeId(),
    kind: "health",
    amount,
    x,
    y,
    radius: 14,
    bob: Math.random() * Math.PI * 2,
  });
}

function triggerEvent(eventName) {
  const charisma = player.stats.Charisma + getDerivedStats().statBonus.Charisma;
  const luck = player.stats.Luck + getDerivedStats().statBonus.Luck;
  if (eventName === "mysteryMachine") {
    if (Math.random() < 0.45 + charisma * 0.035) {
      dropLoot(WIDTH / 2 + 80, HEIGHT / 2, true);
      log("Whacky Event: the vending machine declares you 'marketable' and spits out loot.");
    } else {
      player.hp = Math.max(1, player.hp - 12);
      log("Whacky Event: the vending machine dispenses a carbonated insult. You lose 12 HP.");
    }
  }
  if (eventName === "fanMail") {
    if (Math.random() < 0.38 + luck * 0.04) {
      dropHealth(WIDTH / 2 - 70, HEIGHT / 2, 30);
      log("Whacky Event: fan mail arrives with suspiciously warm snacks.");
    } else {
      state.enemies.push(createEnemy("snackKobold", state.roomIndex));
      log("Whacky Event: fan mail was three kobolds in a trench coat.");
    }
  }
}

function update(delta) {
  if (state.paused || state.gameOver || state.awaitingLevelChoice) {
    return;
  }

  updateTimers(delta);
  movePlayer(delta);
  updateEnemies(delta);
  updateCompanion(delta);
  updatePickups(delta);
  updateParticles(delta);
  checkRoomClear();
}

function updateTimers(delta) {
  player.attackCooldown = Math.max(0, player.attackCooldown - delta);
  player.dashCooldown = Math.max(0, player.dashCooldown - delta);
  player.invulnerable = Math.max(0, player.invulnerable - delta);
  player.companionCooldown = Math.max(0, player.companionCooldown - delta);
  toastTimer = Math.max(0, toastTimer - delta);
  if (toastTimer === 0) {
    ui.toast.classList.remove("visible");
  }
}

function movePlayer(delta) {
  const mods = getDerivedStats();
  let x = 0;
  let y = 0;
  if (keys.has("arrowup") || keys.has("w")) y -= 1;
  if (keys.has("arrowdown") || keys.has("s")) y += 1;
  if (keys.has("arrowleft") || keys.has("a")) x -= 1;
  if (keys.has("arrowright") || keys.has("d")) x += 1;

  const magnitude = Math.hypot(x, y) || 1;
  const dashMultiplier = player.invulnerable > 0 && player.dashCooldown > 0.55 ? 2.1 : 1;
  const speed = (3.25 + player.stats.Dexterity * 0.18 + mods.speed) * dashMultiplier;
  player.x = clamp(player.x + (x / magnitude) * speed * delta * 60, player.radius, WIDTH - player.radius);
  player.y = clamp(player.y + (y / magnitude) * speed * delta * 60, player.radius + 35, HEIGHT - player.radius);
  player.companionAngle += delta * (1.8 + mods.companionRate * 0.2);
}

function updateEnemies(delta) {
  const mods = getDerivedStats();
  for (const enemy of state.enemies) {
    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - delta);
    enemy.stunned = Math.max(0, enemy.stunned - delta);
    enemy.chargeCooldown = Math.max(0, enemy.chargeCooldown - delta);

    if (enemy.stunned <= 0) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      let speed = enemy.speed;

      if (enemy.behavior === "zigzag") {
        enemy.phase += delta * 5;
        enemy.vx = (dx / distance) * speed + Math.cos(enemy.phase) * 0.7;
        enemy.vy = (dy / distance) * speed + Math.sin(enemy.phase) * 0.7;
      } else if (enemy.behavior === "charge" && enemy.chargeCooldown <= 0) {
        enemy.vx = (dx / distance) * speed * 5.4;
        enemy.vy = (dy / distance) * speed * 5.4;
        enemy.chargeCooldown = 3.5;
        enemy.stunned = 0.15;
        addParticle(enemy.x, enemy.y, "#ffbc42", 22);
      } else if (enemy.behavior === "boss") {
        enemy.phase += delta;
        speed += Math.sin(enemy.phase * 3) * 0.25;
        enemy.vx = (dx / distance) * speed + Math.cos(enemy.phase * 2.4) * 0.35;
        enemy.vy = (dy / distance) * speed + Math.sin(enemy.phase * 2.4) * 0.35;
        if (enemy.chargeCooldown <= 0) {
          spawnBossAdds(enemy);
          enemy.chargeCooldown = 5;
        }
      } else {
        enemy.vx = (dx / distance) * speed;
        enemy.vy = (dy / distance) * speed;
      }

      enemy.x = clamp(enemy.x + enemy.vx * delta * 60, enemy.radius, WIDTH - enemy.radius);
      enemy.y = clamp(enemy.y + enemy.vy * delta * 60, enemy.radius + 35, HEIGHT - enemy.radius);
    }

    if (circleCollision(player, enemy) && enemy.hitCooldown <= 0 && player.invulnerable <= 0) {
      const damage = Math.max(2, enemy.damage - mods.defense);
      player.hp = Math.max(0, player.hp - damage);
      enemy.hitCooldown = 0.85;
      player.invulnerable = 0.38;
      addFloatingText(`-${damage}`, player.x, player.y - 24, "#ff4d6d");
      addParticle(player.x, player.y, "#ff4d6d", 12);
      if (player.hp <= 0) {
        endRun(false);
      }
    }
  }
}

function spawnBossAdds(enemy) {
  const addCount = enemy.hp < enemy.maxHp * 0.5 ? 2 : 1;
  for (let i = 0; i < addCount; i += 1) {
    const add = createEnemy(i % 2 === 0 ? "snackKobold" : "trashGoblin", state.roomIndex);
    add.x = clamp(enemy.x + (Math.random() - 0.5) * 130, 50, WIDTH - 50);
    add.y = clamp(enemy.y + (Math.random() - 0.5) * 130, 70, HEIGHT - 70);
    state.enemies.push(add);
  }
  log(`${enemy.name} calls in terrible little reinforcements.`);
}

function updateCompanion(delta) {
  const mods = getDerivedStats();
  const target = nearestEnemy();
  if (!target || player.companionCooldown > 0) {
    return;
  }

  const damage = Math.round(5 + player.stats.Wisdom * 1.8 + mods.companionDamage);
  damageEnemy(target, damage, "companion");
  player.companionCooldown = Math.max(0.32, 1.25 - mods.companionRate * 0.14);
  if (mods.companionHeal) {
    healPlayer(mods.companionHeal);
  }
  addParticle(target.x, target.y, "#ff8bd1", 7);
}

function updatePickups(delta) {
  for (const pickup of state.pickups) {
    pickup.bob += delta * 3;
    if (distance(player, pickup) <= player.radius + pickup.radius + 8) {
      collectPickup(pickup.id);
    }
  }
}

function updateParticles(delta) {
  state.particles = state.particles.filter((particle) => {
    particle.life -= delta;
    particle.x += particle.vx * delta * 60;
    particle.y += particle.vy * delta * 60;
    return particle.life > 0;
  });
  state.floatingText = state.floatingText.filter((text) => {
    text.life -= delta;
    text.y -= delta * 32;
    return text.life > 0;
  });
}

function checkRoomClear() {
  if (state.enemies.length > 0 || state.roomCleared) {
    return;
  }

  state.roomCleared = true;
  const bossRoom = ROOMS[state.roomIndex].enemies.some((pack) => pack.boss);
  dropLoot(WIDTH / 2, HEIGHT / 2, bossRoom);
  if (bossRoom) {
    dropHealth(WIDTH / 2 + 44, HEIGHT / 2 + 18, 26);
  }

  if (state.roomIndex === ROOM_COUNT - 1) {
    endRun(true);
    return;
  }

  log("Room cleared. Walk through the glowing exit to descend deeper into the first floor.");
  showToast("Room cleared! Move to the glowing exit.");
}

function collectPickup(id) {
  const index = state.pickups.findIndex((pickup) => pickup.id === id);
  if (index === -1) {
    return;
  }
  const [pickup] = state.pickups.splice(index, 1);
  if (pickup.kind === "health") {
    healPlayer(pickup.amount);
    showToast(`Healed ${pickup.amount} HP`);
    return;
  }

  player.inventory.push(pickup.item);
  log(`Loot acquired: ${pickup.item.name} (${rarityLabel(pickup.item.rarity)} ${pickup.item.slot}).`);
  showToast(`Picked up ${pickup.item.name}. Press I to equip.`);
  refreshInventory();
}

function healPlayer(amount) {
  const maxHealth = getMaxHealth();
  player.hp = Math.min(maxHealth, player.hp + amount);
  refreshUi();
}

function tryExitRoom() {
  if (!state.roomCleared || state.roomIndex >= ROOM_COUNT - 1) {
    return;
  }
  const exit = { x: WIDTH / 2, y: 58, radius: 42 };
  if (distance(player, exit) < player.radius + exit.radius) {
    spawnRoom(state.roomIndex + 1);
  } else {
    showToast("Clear path found. Stand on the glowing exit circle.");
  }
}

function attack() {
  if (state.paused || state.gameOver || state.awaitingLevelChoice || player.attackCooldown > 0) {
    return;
  }

  const mods = getDerivedStats();
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const range = 78 + player.stats.Strength * 2;
  const baseDamage = Math.round(12 + player.stats.Strength * 3 + mods.damage);
  const crit = Math.random() < 0.06 + player.stats.Luck * 0.015 + mods.crit;
  const damage = Math.round(baseDamage * (crit ? 1.8 : 1));
  let hit = false;

  for (const enemy of [...state.enemies]) {
    const enemyAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    const angleDiff = Math.abs(normalizeAngle(angle - enemyAngle));
    const enemyDistance = distance(player, enemy);
    if (enemyDistance <= range + enemy.radius && angleDiff < 0.82) {
      hit = true;
      damageEnemy(enemy, damage, crit ? "crit" : "attack");
      const knockback = 11 + player.stats.Strength * 1.8;
      enemy.x += Math.cos(enemyAngle) * knockback;
      enemy.y += Math.sin(enemyAngle) * knockback;

      if (mods.chainLightning) {
        chainLightning(enemy, Math.round(damage * 0.42));
      }
      if (mods.sparkleBlast && crit) {
        sparkleBlast(enemy, Math.round(damage * 0.36));
      }
    }
  }

  addSlash(angle, hit ? "#ffbc42" : "#b9abc7");
  player.attackCooldown = Math.max(0.2, 0.58 - player.stats.Intelligence * 0.025 - mods.cooldown);
}

function damageEnemy(enemy, amount, source) {
  enemy.hp -= amount;
  enemy.stunned = Math.max(enemy.stunned, 0.08);
  addFloatingText(`${source === "crit" ? "CRIT " : ""}-${amount}`, enemy.x, enemy.y - enemy.radius, source === "companion" ? "#ff8bd1" : "#ffbc42");
  addParticle(enemy.x, enemy.y, source === "crit" ? "#89fff3" : enemy.color, source === "crit" ? 16 : 8);
  if (enemy.hp <= 0) {
    defeatEnemy(enemy);
  }
}

function defeatEnemy(enemy) {
  state.enemies = state.enemies.filter((item) => item.id !== enemy.id);
  gainXp(enemy.xp);
  const dropChance = enemy.bossType ? 1 : 0.2 + player.stats.Luck * 0.015;
  if (Math.random() < dropChance) {
    dropLoot(enemy.x, enemy.y, Boolean(enemy.bossType));
  } else if (Math.random() < 0.18) {
    dropHealth(enemy.x, enemy.y, 12);
  }
  log(`${enemy.name} defeated. +${enemy.xp} XP.`);
}

function chainLightning(origin, amount) {
  const targets = state.enemies
    .filter((enemy) => enemy.id !== origin.id && distance(origin, enemy) < 160)
    .slice(0, 3);
  for (const target of targets) {
    damageEnemy(target, amount, "attack");
    addParticle((origin.x + target.x) / 2, (origin.y + target.y) / 2, "#65d6ff", 10);
  }
}

function sparkleBlast(origin, amount) {
  for (const enemy of [...state.enemies]) {
    if (distance(origin, enemy) < 110) {
      damageEnemy(enemy, amount, "crit");
    }
  }
}

function gainXp(amount) {
  const mods = getDerivedStats();
  player.xp += Math.round(amount * (1 + player.stats.Wisdom * 0.01 + mods.xpGain));
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.statPoints += 1;
    player.xpToNext = Math.round(player.xpToNext * 1.28 + 35);
    state.awaitingLevelChoice = true;
    openLevelModal();
    log(`Level ${player.level}! Choose a stat upgrade.`);
  }
  refreshUi();
}

function dash() {
  if (player.dashCooldown > 0 || state.paused || state.awaitingLevelChoice) {
    return;
  }
  player.invulnerable = 0.28;
  player.dashCooldown = Math.max(0.72, 1.35 - player.stats.Dexterity * 0.045);
  addParticle(player.x, player.y, "#65d6ff", 18);
}

function getDerivedStats() {
  const mods = {
    damage: 0,
    defense: 0,
    maxHealth: 0,
    speed: 0,
    cooldown: 0,
    crit: 0,
    companionRate: 0,
    companionDamage: 0,
    companionHeal: 0,
    xpGain: 0,
    chainLightning: false,
    sparkleBlast: false,
    statBonus: {
      Strength: 0,
      Dexterity: 0,
      Constitution: 0,
      Intelligence: 0,
      Wisdom: 0,
      Charisma: 0,
      Luck: 0,
    },
    activeSynergies: [],
  };

  const equipped = Object.values(player.equipment).filter(Boolean);
  for (const item of equipped) {
    for (const [stat, value] of Object.entries(item.stats ?? {})) {
      mods.statBonus[stat] += value;
    }
    mods.damage += item.damage ?? 0;
    mods.defense += item.defense ?? 0;
  }

  const tags = equipped.flatMap((item) => item.tags ?? []);
  for (const synergy of SYNERGIES) {
    const tagCounts = tags.reduce((counts, tag) => {
      counts[tag] = (counts[tag] ?? 0) + 1;
      return counts;
    }, {});
    const hasTags = synergy.requires.every((tag) => {
      if (!tagCounts[tag]) {
        return false;
      }
      tagCounts[tag] -= 1;
      return true;
    });
    const conditionMet = !synergy.condition || synergy.condition();
    if (hasTags && conditionMet) {
      synergy.apply(mods);
      mods.activeSynergies.push(synergy);
    }
  }

  mods.maxHealth += (player.stats.Constitution + mods.statBonus.Constitution) * 12;
  mods.damage += mods.statBonus.Strength * 2;
  mods.speed += mods.statBonus.Dexterity * 0.12;
  mods.cooldown += mods.statBonus.Intelligence * 0.015;
  mods.companionDamage += mods.statBonus.Wisdom * 2;
  mods.companionRate += mods.statBonus.Charisma * 0.08;
  mods.crit += mods.statBonus.Luck * 0.015;
  return mods;
}

function getMaxHealth() {
  return 74 + getDerivedStats().maxHealth;
}

function equipItem(itemId, announce = true) {
  const index = player.inventory.findIndex((item) => item.id === itemId);
  if (index === -1) {
    return;
  }
  const [item] = player.inventory.splice(index, 1);
  const existing = player.equipment[item.slot];
  if (existing) {
    player.inventory.push(existing);
  }
  player.equipment[item.slot] = item;
  player.hp = Math.min(player.hp, getMaxHealth());
  if (announce) {
    log(`Equipped ${item.name} in ${item.slot}.`);
    showToast(`Equipped ${item.name}`);
  }
  refreshUi();
  refreshInventory();
}

function rarityLabel(rarityId) {
  return RARITIES.find((rarity) => rarity.id === rarityId)?.label ?? "Common";
}

function rarityColor(rarityId) {
  return RARITIES.find((rarity) => rarity.id === rarityId)?.color ?? "#d9d9d9";
}

function rarityClass(rarityId) {
  return rarityId.replace("ultra-rare", "ultra-rare");
}

function refreshUi() {
  const mods = getDerivedStats();
  const maxHealth = getMaxHealth();
  ui.healthBar.max = maxHealth;
  ui.healthBar.value = player.hp;
  ui.healthText.textContent = `${Math.ceil(player.hp)} / ${maxHealth}`;
  ui.xpBar.max = player.xpToNext;
  ui.xpBar.value = player.xp;
  ui.xpText.textContent = `${player.xp} / ${player.xpToNext}`;
  ui.floorText.textContent = "Floor 1 - Residential Ruin";
  ui.roomText.textContent = `${ROOMS[state.roomIndex].name} (${state.roomIndex + 1} / ${ROOM_COUNT})`;
  ui.threatPill.textContent = `Threat: ${threatLabel()}`;
  ui.rarityPill.textContent = `Loot: ${rarityLabel(state.bestRaritySeen)}`;
  ui.objectiveText.textContent = objectiveText();
  ui.companionText.textContent = `Orbiting and heckling enemies. Damage ${Math.round(5 + player.stats.Wisdom * 1.8 + mods.companionDamage)} every ${Math.max(0.32, 1.25 - mods.companionRate * 0.14).toFixed(1)}s.`;

  ui.statList.innerHTML = "";
  for (const [stat, value] of Object.entries(player.stats)) {
    const total = value + mods.statBonus[stat];
    const dt = document.createElement("dt");
    dt.textContent = stat;
    const dd = document.createElement("dd");
    dd.textContent = total === value ? value : `${total} (${value}+${mods.statBonus[stat]})`;
    ui.statList.append(dt, dd);
  }
}

function objectiveText() {
  if (state.gameOver && state.floorCleared) {
    return "Demo complete. Restart to try another loot path.";
  }
  if (state.gameOver) {
    return "Run failed. Restart and chase stronger synergies.";
  }
  if (state.roomCleared) {
    return "Collect loot, then stand on the glowing exit at the top.";
  }
  const boss = ROOMS[state.roomIndex].enemies.find((pack) => pack.boss);
  if (boss?.boss === "neighborhood") {
    return "Defeat the neighborhood boss to earn boosted loot.";
  }
  if (boss?.boss === "floor") {
    return "Defeat the floor boss to finish the demo.";
  }
  return "Clear the room, grab loot, and look for synergies.";
}

function threatLabel() {
  const room = state.roomIndex + 1;
  if (room <= 2) return "Low";
  if (room <= 4) return "Spicy";
  if (room === 5) return "Cruel";
  return "Boss";
}

function refreshInventory() {
  const mods = getDerivedStats();
  ui.equipmentGrid.innerHTML = "";
  for (const slot of SLOT_ORDER) {
    const item = player.equipment[slot];
    const card = document.createElement("div");
    card.className = "slot";
    const label = document.createElement("span");
    label.textContent = slot;
    const name = document.createElement("strong");
    name.textContent = item ? item.name : "Empty";
    if (item) {
      name.className = rarityClass(item.rarity);
    }
    const desc = document.createElement("p");
    desc.textContent = item ? itemSummary(item) : "No item equipped.";
    card.append(label, name, desc);
    ui.equipmentGrid.append(card);
  }

  ui.inventoryList.innerHTML = "";
  if (player.inventory.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Backpack empty. Make something regret existing.";
    ui.inventoryList.append(empty);
  }
  for (const item of player.inventory) {
    const card = document.createElement("article");
    card.className = "item-card";
    const rarity = document.createElement("span");
    rarity.className = rarityClass(item.rarity);
    rarity.textContent = `${rarityLabel(item.rarity)} ${item.slot}`;
    const name = document.createElement("strong");
    name.textContent = item.name;
    const desc = document.createElement("p");
    desc.textContent = itemSummary(item);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Equip";
    button.addEventListener("click", () => equipItem(item.id));
    card.append(rarity, name, desc, button);
    ui.inventoryList.append(card);
  }

  ui.synergyList.innerHTML = "";
  if (mods.activeSynergies.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No active synergies yet. Match item tags for big power jumps.";
    ui.synergyList.append(item);
  }
  for (const synergy of mods.activeSynergies) {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${synergy.name}</strong><br>${synergy.effect}`;
    ui.synergyList.append(item);
  }
}

function itemSummary(item) {
  const statText = Object.entries(item.stats ?? {})
    .map(([stat, value]) => `+${value} ${stat}`)
    .join(", ");
  const damage = item.damage ? `, +${item.damage} damage` : "";
  const defense = item.defense ? `, +${item.defense} defense` : "";
  return `${item.description} ${statText ? `(${statText}${damage}${defense})` : ""}`;
}

function openInventory() {
  state.paused = true;
  refreshInventory();
  ui.inventoryModal.classList.remove("hidden");
}

function closeInventory() {
  state.paused = false;
  ui.inventoryModal.classList.add("hidden");
}

function openLevelModal() {
  state.paused = true;
  ui.levelChoices.innerHTML = "";
  for (const [stat, description] of Object.entries(STAT_DESCRIPTIONS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-choice";
    button.innerHTML = `<strong>${stat}</strong>${description}`;
    button.addEventListener("click", () => chooseStat(stat));
    ui.levelChoices.append(button);
  }
  ui.levelModal.classList.remove("hidden");
}

function chooseStat(stat) {
  if (player.statPoints <= 0) {
    return;
  }
  player.stats[stat] += 1;
  player.statPoints -= 1;
  if (stat === "Constitution") {
    player.hp += 12;
  }
  state.awaitingLevelChoice = player.statPoints > 0;
  state.paused = false;
  ui.levelModal.classList.toggle("hidden", !state.awaitingLevelChoice);
  log(`Stat upgraded: ${stat}.`);
  refreshUi();
}

function endRun(victory) {
  state.gameOver = true;
  state.floorCleared = victory;
  if (victory) {
    log("Floor boss defeated. Demo complete: the elevator opens with deeply untrustworthy applause.");
    showToast("Demo complete! You cleared Floor 1.");
  } else {
    log("Run ended. The dungeon files your death under avoidable content.");
    showToast("Run failed. Restart for another loot path.");
  }
  refreshUi();
}

function draw() {
  drawRoom();
  drawExit();
  drawPickups();
  drawEnemies();
  drawPlayer();
  drawCompanion();
  drawParticles();
  drawFloatingText();
  drawOverlayText();
}

function drawRoom() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#15101d");
  gradient.addColorStop(1, "#09070d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  for (let x = 40; x < WIDTH; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 40; y < HEIGHT; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,188,66,0.08)";
  ctx.fillRect(0, 0, WIDTH, 38);
  ctx.fillStyle = "#ffbc42";
  ctx.font = "700 15px system-ui";
  ctx.fillText(`Room feed: ${ROOMS[state.roomIndex].story}`, 18, 24);
}

function drawExit() {
  if (!state.roomCleared || state.gameOver) {
    return;
  }
  state.exitPulse += 0.05;
  const radius = 38 + Math.sin(state.exitPulse) * 4;
  ctx.beginPath();
  ctx.arc(WIDTH / 2, 58, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(101,214,255,0.22)";
  ctx.fill();
  ctx.strokeStyle = "#65d6ff";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#f8efff";
  ctx.font = "800 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("EXIT", WIDTH / 2, 63);
  ctx.textAlign = "left";
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.invulnerable > 0 ? "#89fff3" : "#ffbc42";
  ctx.fill();
  ctx.strokeStyle = "#2a1c00";
  ctx.lineWidth = 4;
  ctx.stroke();

  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  ctx.rotate(angle);
  ctx.fillStyle = "#f8efff";
  ctx.fillRect(10, -4, 22, 8);
  ctx.restore();
}

function drawCompanion() {
  const companionX = player.x + Math.cos(player.companionAngle) * 42;
  const companionY = player.y + Math.sin(player.companionAngle) * 32;
  ctx.beginPath();
  ctx.ellipse(companionX, companionY, 14, 11, Math.sin(player.companionAngle) * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "#ff8bd1";
  ctx.fill();
  ctx.strokeStyle = "#f8efff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#21172f";
  ctx.fillRect(companionX - 7, companionY - 4, 4, 4);
  ctx.fillRect(companionX + 3, companionY - 4, 4, 4);
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fillStyle = enemy.color;
    ctx.fill();
    ctx.strokeStyle = enemy.bossType ? "#ffbc42" : "rgba(0,0,0,0.5)";
    ctx.lineWidth = enemy.bossType ? 5 : 3;
    ctx.stroke();

    const barWidth = enemy.radius * 2.4;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 15, barWidth, 5);
    ctx.fillStyle = enemy.bossType ? "#ff4d6d" : "#5cff9d";
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 15, barWidth * Math.max(0, enemy.hp / enemy.maxHp), 5);

    ctx.fillStyle = "#f8efff";
    ctx.font = `${enemy.bossType ? "800 13px" : "700 11px"} system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(enemy.name, enemy.x, enemy.y + enemy.radius + 17);
    ctx.textAlign = "left";
  }
}

function drawPickups() {
  for (const pickup of state.pickups) {
    const y = pickup.y + Math.sin(pickup.bob) * 5;
    ctx.beginPath();
    ctx.arc(pickup.x, y, pickup.radius, 0, Math.PI * 2);
    ctx.fillStyle = pickup.kind === "health" ? "#5cff9d" : rarityColor(pickup.item.rarity);
    ctx.fill();
    ctx.strokeStyle = "#f8efff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#12091b";
    ctx.font = "900 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(pickup.kind === "health" ? "+" : "?", pickup.x, y + 5);
    ctx.textAlign = "left";
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawFloatingText() {
  for (const text of state.floatingText) {
    ctx.globalAlpha = Math.max(0, text.life / 0.9);
    ctx.fillStyle = text.color;
    ctx.font = "900 16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(text.value, text.x, text.y);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }
}

function drawOverlayText() {
  if (!state.paused && !state.gameOver) {
    return;
  }
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#f8efff";
  ctx.font = "900 44px system-ui";
  ctx.textAlign = "center";
  const text = state.gameOver ? (state.floorCleared ? "FLOOR CLEARED" : "RUN ENDED") : "PAUSED";
  ctx.fillText(text, WIDTH / 2, HEIGHT / 2);
  ctx.font = "700 18px system-ui";
  ctx.fillText(state.gameOver ? "Press Restart to play again" : "Press P or close menus to continue", WIDTH / 2, HEIGHT / 2 + 34);
  ctx.textAlign = "left";
}

function addSlash(angle, color) {
  for (let i = 0; i < 12; i += 1) {
    const spread = (Math.random() - 0.5) * 0.85;
    const distance = 32 + Math.random() * 54;
    addParticle(
      player.x + Math.cos(angle + spread) * distance,
      player.y + Math.sin(angle + spread) * distance,
      color,
      1,
      0.22,
    );
  }
}

function addParticle(x, y, color, count = 1, life = 0.45) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2.4,
      vy: (Math.random() - 0.5) * 2.4,
      radius: 2 + Math.random() * 4,
      color,
      life,
      maxLife: life,
    });
  }
}

function addFloatingText(value, x, y, color) {
  state.floatingText.push({ value, x, y, color, life: 0.9 });
}

function nearestEnemy() {
  let closest = null;
  let closestDistance = Infinity;
  for (const enemy of state.enemies) {
    const currentDistance = distance(player, enemy);
    if (currentDistance < closestDistance) {
      closest = enemy;
      closestDistance = currentDistance;
    }
  }
  return closestDistance < 360 ? closest : null;
}

function circleCollision(a, b) {
  return distance(a, b) < a.radius + b.radius;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function log(message) {
  const item = document.createElement("li");
  item.textContent = message;
  ui.runLog.append(item);
  while (ui.runLog.children.length > 18) {
    ui.runLog.removeChild(ui.runLog.firstElementChild);
  }
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("visible");
  toastTimer = 2.7;
}

function gameLoop(now) {
  const delta = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
  };
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    event.preventDefault();
  }
  if (key === " ") attack();
  if (key === "shift") dash();
  if (key === "e") {
    collectNearbyPickup();
    tryExitRoom();
  }
  if (key === "i") {
    ui.inventoryModal.classList.contains("hidden") ? openInventory() : closeInventory();
  }
  if (key === "l" && player.statPoints > 0) {
    openLevelModal();
  }
  if (key === "p" && ui.inventoryModal.classList.contains("hidden") && ui.levelModal.classList.contains("hidden")) {
    state.paused = !state.paused;
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener("mousemove", (event) => {
  Object.assign(mouse, canvasPoint(event));
});

canvas.addEventListener("mousedown", (event) => {
  Object.assign(mouse, canvasPoint(event));
  mouse.down = true;
  attack();
});

window.addEventListener("mouseup", () => {
  mouse.down = false;
});

canvas.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  if (!touch) return;
  Object.assign(mouse, canvasPoint(touch));
  attack();
});

canvas.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  if (!touch) return;
  Object.assign(mouse, canvasPoint(touch));
});

function collectNearbyPickup() {
  const pickup = state.pickups.find((item) => distance(player, item) <= player.radius + item.radius + 36);
  if (pickup) {
    collectPickup(pickup.id);
  }
}

ui.inventoryButton.addEventListener("click", openInventory);
ui.closeInventoryButton.addEventListener("click", closeInventory);
ui.restartButton.addEventListener("click", resetGame);
ui.inventoryModal.addEventListener("click", (event) => {
  if (event.target === ui.inventoryModal) {
    closeInventory();
  }
});

resetGame();
requestAnimationFrame(gameLoop);
