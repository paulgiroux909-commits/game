(() => {
  // src/core/config.js
  var CONFIG = {
    VIEW_W: 960,
    VIEW_H: 600,
    TILE: 48,
    PLAYER_RADIUS: 16,
    DONUT_RADIUS: 11,
    // base movement
    PLAYER_SPEED: 210,
    // px / sec
    DONUT_SPEED: 240,
    // combat
    BASE_ATTACK_COOLDOWN: 0.42,
    // seconds
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
    FLOOR_DMG_SCALE: 1.4
  };
  var KEYBIND = {
    up: ["w", "arrowup"],
    down: ["s", "arrowdown"],
    left: ["a", "arrowleft"],
    right: ["d", "arrowright"],
    attack: ["j"],
    donut: ["k"],
    dodge: [" "],
    inventory: ["i", "tab"],
    interact: ["e"],
    escape: ["escape"]
  };

  // src/core/rng.js
  var RNG = class {
    constructor(seed = Date.now() >>> 0) {
      this.seed = seed >>> 0;
      this.state = this.seed;
    }
    // float in [0,1)
    next() {
      let t = this.state += 1831565813;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    // float in [min, max)
    range(min, max) {
      return min + this.next() * (max - min);
    }
    // integer in [min, max] inclusive
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    }
    bool(chance = 0.5) {
      return this.next() < chance;
    }
    pick(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    }
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    // weighted pick: items is array of {weight, ...}
    weighted(items, weightKey = "weight") {
      let total = 0;
      for (const it of items) total += it[weightKey];
      let r = this.next() * total;
      for (const it of items) {
        r -= it[weightKey];
        if (r <= 0) return it;
      }
      return items[items.length - 1];
    }
  };
  var rng = new RNG();

  // src/core/input.js
  var Input = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.keys = /* @__PURE__ */ new Set();
      this.pressed = /* @__PURE__ */ new Set();
      this.mouse = { x: 0, y: 0, down: false, clicked: false };
      this.enabled = true;
      window.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (["tab", " ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
          e.preventDefault();
        }
        if (!this.keys.has(k)) this.pressed.add(k);
        this.keys.add(k);
      });
      window.addEventListener("keyup", (e) => {
        this.keys.delete(e.key.toLowerCase());
      });
      canvas.addEventListener("mousemove", (e) => this._setMouse(e));
      canvas.addEventListener("mousedown", (e) => {
        this._setMouse(e);
        this.mouse.down = true;
        this.mouse.clicked = true;
      });
      window.addEventListener("mouseup", () => {
        this.mouse.down = false;
      });
      canvas.addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        this._setMouseTouch(t);
        this.mouse.down = true;
        this.mouse.clicked = true;
      }, { passive: true });
      canvas.addEventListener("touchmove", (e) => {
        this._setMouseTouch(e.touches[0]);
      }, { passive: true });
      canvas.addEventListener("touchend", () => {
        this.mouse.down = false;
      });
    }
    _setMouse(e) {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) / r.width * this.canvas.width;
      this.mouse.y = (e.clientY - r.top) / r.height * this.canvas.height;
    }
    _setMouseTouch(t) {
      if (!t) return;
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = (t.clientX - r.left) / r.width * this.canvas.width;
      this.mouse.y = (t.clientY - r.top) / r.height * this.canvas.height;
    }
    _anyDown(list) {
      for (const k of list) if (this.keys.has(k)) return true;
      return false;
    }
    _anyPressed(list) {
      for (const k of list) if (this.pressed.has(k)) return true;
      return false;
    }
    // axis input -1..1
    get moveX() {
      return (this._anyDown(KEYBIND.right) ? 1 : 0) - (this._anyDown(KEYBIND.left) ? 1 : 0);
    }
    get moveY() {
      return (this._anyDown(KEYBIND.down) ? 1 : 0) - (this._anyDown(KEYBIND.up) ? 1 : 0);
    }
    action(name) {
      return this._anyDown(KEYBIND[name]);
    }
    actionPressed(name) {
      return this._anyPressed(KEYBIND[name]);
    }
    // call at end of each frame
    endFrame() {
      this.pressed.clear();
      this.mouse.clicked = false;
    }
  };

  // src/core/loop.js
  var Loop = class {
    constructor(update, render) {
      this.update = update;
      this.render = render;
      this.last = 0;
      this.acc = 0;
      this.step = 1 / 60;
      this.running = false;
      this._tick = this._tick.bind(this);
    }
    start() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this._tick);
    }
    stop() {
      this.running = false;
    }
    _tick(now) {
      if (!this.running) return;
      let dt = (now - this.last) / 1e3;
      this.last = now;
      if (dt > 0.25) dt = 0.25;
      this.acc += dt;
      let steps = 0;
      while (this.acc >= this.step && steps < 5) {
        this.update(this.step);
        this.acc -= this.step;
        steps++;
      }
      this.render();
      requestAnimationFrame(this._tick);
    }
  };

  // src/core/util.js
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }
  function normalize(x, y) {
    const l = Math.hypot(x, y) || 1;
    return { x: x / l, y: y / l };
  }
  function angleDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
  }

  // src/data/stats.js
  var ATTRIBUTES = [
    {
      key: "strength",
      name: "Strength",
      abbr: "STR",
      icon: "\u{1F4AA}",
      desc: "Melee damage, carry weight, and the ability to smash through obstacles."
    },
    {
      key: "constitution",
      name: "Constitution",
      abbr: "CON",
      icon: "\u2764\uFE0F",
      desc: "Maximum health and resistance to status effects."
    },
    {
      key: "dexterity",
      name: "Dexterity",
      abbr: "DEX",
      icon: "\u{1F3C3}",
      desc: "Movement & attack speed, dodge chance, and crit chance."
    },
    {
      key: "intelligence",
      name: "Intelligence",
      abbr: "INT",
      icon: "\u{1F9E0}",
      desc: "Spell power and the size of your mana pool."
    },
    {
      key: "wisdom",
      name: "Wisdom",
      abbr: "WIS",
      icon: "\u{1F52E}",
      desc: "Mana regeneration and resistance to mental effects."
    },
    {
      key: "charisma",
      name: "Charisma",
      abbr: "CHA",
      icon: "\u2728",
      desc: "Crowd favor (better loot boxes), prices, and Donut's magic."
    },
    {
      key: "luck",
      name: "Luck",
      abbr: "LCK",
      icon: "\u{1F340}",
      desc: "Loot rarity, crit damage, and the chance weird things go your way."
    }
  ];
  var ATTR_KEYS = ATTRIBUTES.map((a) => a.key);
  function makeAttributeBlock(values = {}) {
    const block = {};
    for (const k of ATTR_KEYS) block[k] = values[k] ?? 1;
    return block;
  }
  function deriveStats(a, level, flat = {}) {
    const g = (k) => flat[k] || 0;
    const maxHp = Math.round(60 + a.constitution * 12 + level * 6 + g("maxHp"));
    const maxStamina = Math.round(40 + a.dexterity * 4 + a.strength * 2 + g("maxStamina"));
    const maxMana = Math.round(10 + a.intelligence * 6 + a.wisdom * 3 + g("maxMana"));
    return {
      maxHp,
      maxStamina,
      maxMana,
      manaRegen: 4 + a.wisdom * 0.6 + g("manaRegen"),
      moveSpeed: 1 + a.dexterity * 0.012 + g("moveSpeedPct") / 100,
      // multiplier
      attackSpeed: 1 + a.dexterity * 0.018 + g("attackSpeedPct") / 100,
      // multiplier
      meleeDamage: 6 + a.strength * 2.4 + g("meleeDamage"),
      spellPower: a.intelligence * 1.8 + g("spellPower"),
      armor: Math.round(a.constitution * 0.8 + g("armor")),
      // flat dmg reduction
      critChance: Math.min(0.75, 0.03 + a.luck * 0.012 + a.dexterity * 4e-3 + g("critChance") / 100),
      critMult: 1.6 + a.luck * 0.03 + g("critMult"),
      dodgeChance: Math.min(0.6, a.dexterity * 6e-3 + g("dodgeChance") / 100),
      lifesteal: g("lifesteal") / 100,
      thorns: g("thorns") || 0,
      // luck shifts loot toward higher rarity
      lootLuck: a.luck + a.charisma * 0.4 + g("lootLuck"),
      goldFind: 1 + a.charisma * 0.03 + g("goldFindPct") / 100
    };
  }

  // src/systems/equipment.js
  var EQUIP_SLOTS = [
    { key: "head", name: "Head", accepts: ["head"] },
    { key: "necklace", name: "Necklace", accepts: ["necklace"] },
    { key: "chest", name: "Chest", accepts: ["chest"] },
    { key: "hands", name: "Hands", accepts: ["hands"] },
    { key: "rightHand", name: "Right Hand", accepts: ["weapon"] },
    { key: "leftHand", name: "Left Hand", accepts: ["offhand", "weapon"] },
    { key: "legs", name: "Legs", accepts: ["legs"] },
    { key: "boots", name: "Boots", accepts: ["boots"] },
    { key: "ring", name: "Ring", accepts: ["ring"] },
    { key: "charm1", name: "Charm I", accepts: ["charm"] },
    { key: "charm2", name: "Charm II", accepts: ["charm"] }
  ];
  function makeEmptyEquipment() {
    const e = {};
    for (const s of EQUIP_SLOTS) e[s.key] = null;
    return e;
  }
  function slotsForItem(item) {
    return EQUIP_SLOTS.filter((s) => s.accepts.includes(item.slot)).map((s) => s.key);
  }
  function preferredSlot(item, equipment) {
    const valid = slotsForItem(item);
    for (const k of valid) if (!equipment[k]) return k;
    return valid[0] || null;
  }

  // src/data/synergies.js
  var SYNERGIES = [
    {
      id: "crawler",
      name: "True Crawler",
      tag: "crawler",
      icon: "\u{1F9B4}",
      desc: "You embrace the starting-gear underdog life. The crowd roots for you.",
      tiers: [
        { count: 2, bonus: { maxHp: 20, goldFindPct: 10 }, text: "+20 HP, +10% Gold Find" },
        { count: 4, bonus: { maxHp: 50, lootLuck: 4, critChance: 5 }, text: "+50 HP, +4 Loot Luck, +5% Crit (the underdog narrative)" }
      ]
    },
    {
      id: "inferno",
      name: "Inferno",
      tag: "fire",
      icon: "\u{1F525}",
      desc: "Everything you touch burns. Attacks apply Burn (damage over time).",
      tiers: [
        { count: 2, bonus: { spellPower: 10, meleeDamage: 6 }, text: "+10 Spell Power, +6 Melee. Attacks apply minor Burn.", proc: "burn1" },
        { count: 4, bonus: { spellPower: 28, critMult: 0.4 }, text: "+28 Spell Power, +0.4 Crit Mult. Burn spreads to nearby foes.", proc: "burn2" }
      ]
    },
    {
      id: "deepfreeze",
      name: "Deep Freeze",
      tag: "ice",
      icon: "\u2744\uFE0F",
      desc: "Your hits chill enemies, slowing them down.",
      tiers: [
        { count: 2, bonus: { attackSpeedPct: 10, critChance: 4 }, text: "+10% Attack Speed, +4% Crit. Hits slow enemies.", proc: "chill" }
      ]
    },
    {
      id: "bloodthirst",
      name: "Bloodthirst",
      tag: "blood",
      icon: "\u{1FA78}",
      desc: "You heal from the carnage you create.",
      tiers: [
        { count: 2, bonus: { lifesteal: 6, meleeDamage: 8 }, text: "+6% Lifesteal, +8 Melee Damage" },
        { count: 3, bonus: { lifesteal: 12, maxHp: 30 }, text: "+12% Lifesteal, +30 HP. Kills briefly boost attack speed.", proc: "frenzy" }
      ]
    },
    {
      id: "arcanist",
      name: "Arcanist",
      tag: "arcane",
      icon: "\u{1F52E}",
      desc: "You bend the System's magic to your will.",
      tiers: [
        { count: 2, bonus: { spellPower: 14, maxMana: 20, manaRegen: 3 }, text: "+14 Spell Power, +20 Mana, +3 Mana Regen" },
        { count: 4, bonus: { spellPower: 40, critChance: 8 }, text: "+40 Spell Power, +8% Crit. Spells cost less." }
      ]
    },
    {
      id: "juggernaut",
      name: "Juggernaut",
      tag: "tank",
      icon: "\u{1F6E1}\uFE0F",
      desc: "Immovable. Unkillable. Mildly inconvenienced.",
      tiers: [
        { count: 2, bonus: { armor: 8, maxHp: 40 }, text: "+8 Armor, +40 HP" },
        { count: 4, bonus: { armor: 20, thorns: 10, maxHp: 90 }, text: "+20 Armor, +10 Thorns, +90 HP" }
      ]
    },
    {
      id: "fortune",
      name: "Fortune's Favorite",
      tag: "luck",
      icon: "\u{1F340}",
      desc: "The dice always seem to land your way. The producers suspect cheating.",
      tiers: [
        { count: 2, bonus: { lootLuck: 8, goldFindPct: 20, critChance: 5 }, text: "+8 Loot Luck, +20% Gold, +5% Crit" },
        { count: 3, bonus: { lootLuck: 18, critChance: 10, critMult: 0.5 }, text: "+18 Loot Luck, +10% Crit, +0.5 Crit Mult" }
      ]
    },
    {
      id: "swift",
      name: "Quicksilver",
      tag: "swift",
      icon: "\u{1F4A8}",
      desc: "Too fast to hit, too fast to catch.",
      tiers: [
        { count: 2, bonus: { moveSpeedPct: 12, dodgeChance: 8, attackSpeedPct: 8 }, text: "+12% Move, +8% Dodge, +8% Attack Speed" },
        { count: 3, bonus: { moveSpeedPct: 25, dodgeChance: 16 }, text: "+25% Move, +16% Dodge. Dodging refunds stamina." }
      ]
    },
    {
      id: "primal",
      name: "Primal Fury",
      tag: "primal",
      icon: "\u{1FA93}",
      desc: "The Primal class path: raw, brutal, and beloved by the bloodthirsty audience.",
      tiers: [
        { count: 2, bonus: { meleeDamage: 12, critChance: 6 }, text: "+12 Melee Damage, +6% Crit" },
        { count: 4, bonus: { meleeDamage: 30, critMult: 0.6, lifesteal: 5 }, text: "+30 Melee, +0.6 Crit Mult, +5% Lifesteal" }
      ]
    },
    {
      id: "showman",
      name: "Crowd Pleaser",
      tag: "showman",
      icon: "\u2728",
      desc: "You play to the cameras. Charisma is a weapon, and the gifts keep coming.",
      tiers: [
        { count: 2, bonus: { goldFindPct: 25, lootLuck: 5 }, text: "+25% Gold, +5 Loot Luck (sponsor gifts)" },
        { count: 3, bonus: { goldFindPct: 50, lootLuck: 12, maxHp: 30 }, text: "+50% Gold, +12 Loot Luck, +30 HP (fan-funded armor)" }
      ]
    },
    {
      id: "feline",
      name: "Feline Bond",
      tag: "feline",
      icon: "\u{1F431}",
      desc: "You and Princess Donut move as one. She fights harder for you.",
      tiers: [
        { count: 1, bonus: { critChance: 5 }, donut: { dmg: 0.5, cdr: 0.25 }, text: "Donut deals +50% damage and acts faster. +5% Crit for you." }
      ]
    },
    {
      id: "glasscannon",
      name: "Glass Cannon",
      tag: "glass",
      icon: "\u{1F4A5}",
      desc: "Live fast, hit like a truck, die in one good sneeze.",
      tiers: [
        { count: 1, bonus: { meleeDamage: 18, spellPower: 14, critMult: 0.5, maxHp: -25 }, text: "+18 Melee, +14 Spell Power, +0.5 Crit Mult, but -25 HP" }
      ]
    }
  ];
  function evaluateSynergies(equippedItems) {
    const tagCounts = {};
    for (const item of equippedItems) {
      if (!item) continue;
      for (const t of item.tags || []) tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
    const results = [];
    for (const syn of SYNERGIES) {
      const have = tagCounts[syn.tag] || 0;
      let activeTier = null;
      let nextTier = null;
      for (const tier of syn.tiers) {
        if (have >= tier.count) activeTier = tier;
        else {
          nextTier = tier;
          break;
        }
      }
      results.push({ synergy: syn, have, activeTier, nextTier });
    }
    return results;
  }

  // src/systems/progression.js
  function xpForLevel(level) {
    return Math.round(CONFIG.XP_BASE * Math.pow(CONFIG.XP_GROWTH, level - 1));
  }

  // src/systems/player.js
  var Player = class {
    constructor() {
      this.baseAttr = makeAttributeBlock({
        strength: 3,
        constitution: 4,
        dexterity: 3,
        intelligence: 2,
        wisdom: 2,
        charisma: 3,
        luck: 3
      });
      this.level = 1;
      this.xp = 0;
      this.xpToNext = xpForLevel(1);
      this.statPoints = 0;
      this.gold = 0;
      this.inventory = [];
      this.equipment = makeEmptyEquipment();
      this.maxHpPenalty = 0;
      this.x = 0;
      this.y = 0;
      this.facing = { x: 1, y: 0 };
      this.attackCd = 0;
      this.dodgeCd = 0;
      this.dodgeTime = 0;
      this.invuln = 0;
      this.attr = {};
      this.stats = {};
      this.synergyState = [];
      this.procs = /* @__PURE__ */ new Set();
      this.donutBonus = { dmg: 0, cdr: 0 };
      this.recompute(true);
      this.hp = this.stats.maxHp;
      this.stamina = this.stats.maxStamina;
      this.mana = this.stats.maxMana;
    }
    equippedItems() {
      return EQUIP_SLOTS.map((s) => this.equipment[s.key]).filter(Boolean);
    }
    recompute(full = false) {
      const attr = {};
      for (const k of ATTR_KEYS) attr[k] = this.baseAttr[k];
      for (const item of this.equippedItems()) {
        for (const [k, v] of Object.entries(item.attrs || {})) attr[k] += v;
      }
      const flat = {};
      const add = (k, v) => {
        flat[k] = (flat[k] || 0) + v;
      };
      for (const item of this.equippedItems()) {
        for (const [k, v] of Object.entries(item.stats || {})) add(k, v);
      }
      this.synergyState = evaluateSynergies(this.equippedItems());
      this.procs = /* @__PURE__ */ new Set();
      this.donutBonus = { dmg: 0, cdr: 0 };
      for (const s of this.synergyState) {
        if (!s.activeTier) continue;
        for (const [k, v] of Object.entries(s.activeTier.bonus || {})) add(k, v);
        if (s.activeTier.proc) this.procs.add(s.activeTier.proc);
        if (s.activeTier.donut) {
          this.donutBonus.dmg += s.activeTier.donut.dmg || 0;
          this.donutBonus.cdr += s.activeTier.donut.cdr || 0;
        }
      }
      add("maxHp", -this.maxHpPenalty);
      this.attr = attr;
      this.stats = deriveStats(attr, this.level, flat);
      if (!full) {
        this.hp = Math.min(this.hp, this.stats.maxHp);
        this.stamina = Math.min(this.stamina, this.stats.maxStamina);
        this.mana = Math.min(this.mana, this.stats.maxMana);
      }
    }
    get speed() {
      return CONFIG.PLAYER_SPEED * this.stats.moveSpeed;
    }
    get attackCooldown() {
      return CONFIG.BASE_ATTACK_COOLDOWN / this.stats.attackSpeed;
    }
    addItem(item) {
      this.inventory.push(item);
    }
    // Equip from inventory; returns previously-equipped item (back to bag) or null.
    equip(item, slotKey) {
      const prev = this.equipment[slotKey];
      this.equipment[slotKey] = item;
      const idx = this.inventory.indexOf(item);
      if (idx >= 0) this.inventory.splice(idx, 1);
      if (prev) this.inventory.push(prev);
      this.recompute();
      return prev;
    }
    unequip(slotKey) {
      const item = this.equipment[slotKey];
      if (!item) return;
      this.equipment[slotKey] = null;
      this.inventory.push(item);
      this.recompute();
    }
    dropFromBag(item) {
      const idx = this.inventory.indexOf(item);
      if (idx >= 0) this.inventory.splice(idx, 1);
    }
    gainXp(amount) {
      this.xp += amount;
      let leveled = 0;
      while (this.xp >= this.xpToNext) {
        this.xp -= this.xpToNext;
        this.level++;
        leveled++;
        this.statPoints += CONFIG.STAT_POINTS_PER_LEVEL;
        this.xpToNext = xpForLevel(this.level);
      }
      if (leveled > 0) {
        this.recompute();
        this.hp = this.stats.maxHp;
        this.stamina = this.stats.maxStamina;
        this.mana = this.stats.maxMana;
      }
      return leveled;
    }
    spendStatPoint(attrKey) {
      if (this.statPoints <= 0) return false;
      this.baseAttr[attrKey]++;
      this.statPoints--;
      this.recompute();
      return true;
    }
  };

  // src/systems/donut.js
  var Donut = class {
    constructor(player) {
      this.player = player;
      this.x = 0;
      this.y = 0;
      this.atkCd = 0;
      this.downed = false;
      this.reviveTimer = 0;
      this.recompute();
      this.hp = this.maxHp;
    }
    recompute() {
      const p = this.player;
      this.maxHp = Math.round(40 + p.attr.charisma * 8 + p.level * 5);
      if (this.hp != null) this.hp = Math.min(this.hp, this.maxHp);
    }
  };

  // src/data/monsters.js
  var MONSTERS = {
    // -------- FLOOR 1 NORMALS --------
    brain_rat: {
      id: "brain_rat",
      name: "Brain Rat",
      tier: "normal",
      behavior: "chaser",
      color: "#a9657a",
      radius: 14,
      hp: 26,
      damage: 7,
      speed: 95,
      xp: 14,
      gold: [2, 6],
      desc: "A rat the size of a dog with a wrinkled, exposed brain. It is smarter than it looks. That is not a compliment."
    },
    cave_goblin: {
      id: "cave_goblin",
      name: "Cave Goblin",
      tier: "normal",
      behavior: "chaser",
      color: "#6aa84f",
      radius: 15,
      hp: 34,
      damage: 9,
      speed: 78,
      xp: 18,
      gold: [4, 9],
      desc: "A snickering green goblin clutching a sharpened spoon. Works in packs and bad puns."
    },
    goo_blob: {
      id: "goo_blob",
      name: "Sentient Goo",
      tier: "normal",
      behavior: "bruiser",
      color: "#7ad1c8",
      radius: 19,
      hp: 60,
      damage: 11,
      speed: 42,
      xp: 22,
      gold: [3, 8],
      desc: "A jiggling blob of biohazard. Slow, but splits your patience and your HP."
    },
    goblin_slinger: {
      id: "goblin_slinger",
      name: "Goblin Slinger",
      tier: "normal",
      behavior: "shooter",
      color: "#9fbf3b",
      radius: 14,
      hp: 24,
      damage: 8,
      speed: 70,
      xp: 20,
      gold: [5, 11],
      projectileSpeed: 230,
      range: 320,
      desc: "A goblin with a slingshot and a grudge. Keeps its distance and your blood pressure high."
    },
    feral_dog: {
      id: "feral_dog",
      name: "Feral Hellhound",
      tier: "normal",
      behavior: "charger",
      color: "#8a5a2b",
      radius: 15,
      hp: 30,
      damage: 12,
      speed: 120,
      xp: 24,
      gold: [4, 10],
      desc: "Once someone's good boy. Now it has too many teeth and a taste for crawlers."
    },
    // -------- FLOOR 1 NEIGHBORHOOD BOSSES (mini-bosses) --------
    goblin_king: {
      id: "goblin_king",
      name: "King Snotsworth III",
      tier: "neighborhood",
      behavior: "bruiser",
      color: "#3c7a1e",
      radius: 26,
      hp: 240,
      damage: 18,
      speed: 60,
      xp: 140,
      gold: [40, 70],
      desc: "Self-crowned ruler of the goblin tunnels. Wields a golden plunger as a scepter and means business."
    },
    the_porter: {
      id: "the_porter",
      name: "The Porter",
      tier: "neighborhood",
      behavior: "charger",
      color: "#b5651d",
      radius: 28,
      hp: 300,
      damage: 22,
      speed: 95,
      xp: 160,
      gold: [50, 90],
      desc: 'A hulking figure that "relocates" crawlers \u2014 usually into a wall. Charges in a straight, devastating line.'
    },
    madame_whiskers: {
      id: "madame_whiskers",
      name: "Madame Whiskers",
      tier: "neighborhood",
      behavior: "shooter",
      color: "#c47ab0",
      radius: 24,
      hp: 210,
      damage: 16,
      speed: 80,
      xp: 150,
      gold: [45, 80],
      projectileSpeed: 250,
      range: 360,
      desc: "A monstrous alley cat the size of a fridge. Donut refuses to acknowledge a rival exists."
    },
    // -------- FLOOR 1 BOSS --------
    the_maw: {
      id: "the_maw",
      name: "The Hungry Maw of Floor One",
      tier: "floor",
      behavior: "bruiser",
      color: "#9b1d2e",
      radius: 40,
      hp: 900,
      damage: 28,
      speed: 55,
      xp: 600,
      gold: [180, 320],
      enrageHp: 0.4,
      desc: "A writhing mass of teeth, doors, and screaming furniture \u2014 the dungeon's own appetite given form. Beat it to descend to Floor 2. The whole galaxy is watching."
    },
    // -------- DEEPER FLOOR NORMALS (for scaling demo beyond floor 1) --------
    iron_construct: {
      id: "iron_construct",
      name: "Rust Construct",
      tier: "normal",
      behavior: "bruiser",
      color: "#9a9a9a",
      radius: 18,
      hp: 70,
      damage: 14,
      speed: 50,
      xp: 30,
      gold: [6, 14],
      desc: "Scrap metal animated by spite and System code."
    },
    shadow_stalker: {
      id: "shadow_stalker",
      name: "Shadow Stalker",
      tier: "normal",
      behavior: "charger",
      color: "#3a2a55",
      radius: 14,
      hp: 40,
      damage: 15,
      speed: 135,
      xp: 32,
      gold: [7, 15],
      desc: "You only see it right before it reaches you. Then it is too late."
    }
  };
  var FLOOR_DEFS = {
    1: {
      name: "Floor 1",
      subtitle: "The Ruined Sublevels",
      theme: { floor: "#171420", wall: "#2a2336", accent: "#3a2f4d" },
      normals: ["brain_rat", "cave_goblin", "goo_blob", "goblin_slinger", "feral_dog"],
      neighborhoodBosses: ["goblin_king", "the_porter", "madame_whiskers"],
      floorBoss: "the_maw"
    },
    2: {
      name: "Floor 2",
      subtitle: "The Bottom of the Stairs",
      theme: { floor: "#101a18", wall: "#1d2e2a", accent: "#2c4a40" },
      normals: ["brain_rat", "goblin_slinger", "feral_dog", "iron_construct", "shadow_stalker"],
      neighborhoodBosses: ["the_porter", "madame_whiskers", "goblin_king"],
      floorBoss: "the_maw"
    }
  };
  function getFloorDef(floor) {
    return FLOOR_DEFS[floor] || {
      ...FLOOR_DEFS[2],
      name: `Floor ${floor}`,
      subtitle: "Deeper into the Dark"
    };
  }

  // src/systems/dungeon.js
  var DIRS = {
    N: { dx: 0, dy: -1, opp: "S" },
    S: { dx: 0, dy: 1, opp: "N" },
    E: { dx: 1, dy: 0, opp: "W" },
    W: { dx: -1, dy: 0, opp: "E" }
  };
  var _roomCounter = 0;
  function makeRoom(type, gx, gy) {
    return {
      id: `room_${_roomCounter++}`,
      type,
      gridX: gx,
      gridY: gy,
      doors: {},
      // combat-style rooms must be cleared before doors unlock; others are open
      cleared: !["combat", "neighborhood", "boss"].includes(type),
      visited: false,
      spawnDefs: [],
      // monster ids to spawn on first entry
      spawned: false,
      locked: type === "boss" || type === "stairs",
      // boss room starts locked
      chest: null,
      eventDone: false
    };
  }
  function connect(a, b) {
    for (const [dir, d] of Object.entries(DIRS)) {
      if (a.gridX + d.dx === b.gridX && a.gridY + d.dy === b.gridY) {
        a.doors[dir] = b.id;
        b.doors[d.opp] = a.id;
        return;
      }
    }
  }
  function generateFloor(floor, rng2) {
    _roomCounter = 0;
    const def = getFloorDef(floor);
    const rooms = /* @__PURE__ */ new Map();
    const reg = (r) => {
      rooms.set(r.id, r);
      return r;
    };
    const nNeighborhoods = Math.min(4, 2 + Math.floor((floor - 1) / 2));
    const start = reg(makeRoom("start", 0, 0));
    const hub = reg(makeRoom("hub", 0, -1));
    const boss = reg(makeRoom("boss", 0, -2));
    connect(start, hub);
    connect(hub, boss);
    const bossPool = rng2.shuffle(def.neighborhoodBosses);
    const neighborhoodBossIds = [];
    const layouts = [
      { col: -1, expand: "W" },
      { col: 1, expand: "E" },
      { col: -2, expand: "W" },
      { col: 2, expand: "E" }
    ];
    for (let i = 0; i < nNeighborhoods; i++) {
      const lay = layouts[i % layouts.length];
      const baseCol = lay.col;
      const row = i < 2 ? 0 : -1;
      const entry = reg(makeRoom("combat", baseCol, row));
      const spine = row === 0 ? start : hub;
      entry.gridX = spine.gridX + (lay.expand === "E" ? 1 : -1);
      entry.gridY = spine.gridY;
      connect(spine, entry);
      const midType = rng2.bool(0.5) ? "loot" : "event";
      const mid = reg(makeRoom(midType, entry.gridX, entry.gridY - 1));
      connect(entry, mid);
      const nb = reg(makeRoom("neighborhood", mid.gridX + (lay.expand === "E" ? 1 : -1), mid.gridY));
      connect(mid, nb);
      const bId = bossPool[i % bossPool.length];
      nb.bossId = bId;
      nb.spawnDefs = [bId];
      const adds = rng2.int(1, 2);
      for (let k = 0; k < adds; k++) nb.spawnDefs.push(rng2.pick(def.normals));
      neighborhoodBossIds.push(nb.id);
      const enemyCount = rng2.int(3, 4) + Math.floor(floor / 2);
      for (let k = 0; k < enemyCount; k++) entry.spawnDefs.push(rng2.pick(def.normals));
      if (midType === "loot") {
        mid.chest = { opened: false };
      }
    }
    boss.bossId = def.floorBoss;
    boss.spawnDefs = [def.floorBoss];
    return {
      floor,
      def,
      rooms,
      startId: start.id,
      hubId: hub.id,
      bossId: boss.id,
      neighborhoodBossIds
    };
  }
  function updateBossLock(dungeon) {
    const boss = dungeon.rooms.get(dungeon.bossId);
    if (!boss.locked) return false;
    const allClear = dungeon.neighborhoodBossIds.every((id) => dungeon.rooms.get(id).cleared);
    if (allClear) {
      boss.locked = false;
      return true;
    }
    return false;
  }

  // src/systems/combat.js
  var ARENA = { left: 70, top: 116, right: 890, bottom: 542 };
  var DOOR_HALF = 52;
  function arenaCenter() {
    return { x: (ARENA.left + ARENA.right) / 2, y: (ARENA.top + ARENA.bottom) / 2 };
  }
  function doorPos(dir) {
    const cx = (ARENA.left + ARENA.right) / 2;
    const cy = (ARENA.top + ARENA.bottom) / 2;
    switch (dir) {
      case "N":
        return { x: cx, y: ARENA.top };
      case "S":
        return { x: cx, y: ARENA.bottom };
      case "E":
        return { x: ARENA.right, y: cy };
      case "W":
        return { x: ARENA.left, y: cy };
    }
  }
  var _eid = 1;
  var World = class {
    constructor(game) {
      this.game = game;
      this.enemies = [];
      this.projectiles = [];
      this.drops = [];
      this.particles = [];
      this.floaters = [];
      this.swings = [];
      this.currentRoom = null;
      this.transitioning = false;
      this.enterCooldown = 0;
      this.shake = 0;
      this.donutSpecialCd = 0;
      this.donutSpecialMax = 8;
    }
    get player() {
      return this.game.player;
    }
    get donut() {
      return this.game.donut;
    }
    get rng() {
      return this.game.rng;
    }
    // ---- room management ----
    enterRoom(roomId, fromDir = null) {
      const dungeon = this.game.dungeon;
      const room = dungeon.rooms.get(roomId);
      this.currentRoom = room;
      room.visited = true;
      this.enemies = [];
      this.projectiles = [];
      this.drops = [];
      this.swings = [];
      this.enterCooldown = 0.35;
      const c = arenaCenter();
      if (fromDir) {
        const dp = doorPos(fromDir);
        const n = normalize(c.x - dp.x, c.y - dp.y);
        this.player.x = dp.x + n.x * 56;
        this.player.y = dp.y + n.y * 56;
      } else {
        this.player.x = c.x;
        this.player.y = c.y;
      }
      this.donut.x = this.player.x - 34;
      this.donut.y = this.player.y + 10;
      if (!room.spawned && room.spawnDefs.length) {
        this.spawnRoomEnemies(room);
        room.spawned = true;
      }
      if (this.enemies.length > 0) room.cleared = false;
      if (room.chest && !room.chest.opened) {
        this.drops.push({
          id: _eid++,
          kind: "chest",
          x: c.x,
          y: c.y - 40,
          r: 18,
          ref: room.chest
        });
      }
      this.game.onRoomEntered?.(room);
    }
    spawnRoomEnemies(room) {
      const floor = this.game.dungeon.floor;
      const level = this.player.level;
      const c = arenaCenter();
      for (const mid of room.spawnDefs) {
        const base = MONSTERS[mid];
        if (!base) continue;
        const isBoss = base.tier !== "normal";
        let x, y;
        if (isBoss) {
          x = c.x;
          y = ARENA.top + 90;
        } else {
          x = this.rng.range(ARENA.left + 60, ARENA.right - 60);
          y = this.rng.range(ARENA.top + 60, ARENA.bottom - 60);
        }
        this.enemies.push(this.makeEnemy(base, x, y, floor, level));
      }
    }
    makeEnemy(base, x, y, floor, level) {
      const hpScale = Math.pow(CONFIG.FLOOR_HP_SCALE, floor - 1) * (1 + 0.06 * (level - 1));
      const dmgScale = Math.pow(CONFIG.FLOOR_DMG_SCALE, floor - 1) * (1 + 0.05 * (level - 1));
      const maxHp = Math.round(base.hp * hpScale);
      return {
        id: _eid++,
        mid: base.id,
        name: base.name,
        tier: base.tier,
        behavior: base.behavior,
        color: base.color,
        r: base.radius,
        x,
        y,
        maxHp,
        hp: maxHp,
        damage: base.damage * dmgScale,
        speed: base.speed,
        xp: Math.round(base.xp * (1 + 0.15 * (floor - 1))),
        gold: base.gold,
        projectileSpeed: base.projectileSpeed || 0,
        range: base.range || 0,
        enrageHp: base.enrageHp || 0,
        // ai state
        atkCd: this.rng.range(0.4, 1.2),
        chargeState: "idle",
        chargeTimer: 0,
        chargeDir: { x: 0, y: 0 },
        hitFlash: 0,
        burn: 0,
        burnTime: 0,
        slow: 0,
        slowTime: 0,
        enraged: false,
        contactCd: 0
      };
    }
    // ---- main update ----
    update(dt) {
      if (this.enterCooldown > 0) this.enterCooldown -= dt;
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 60);
      if (this.donutSpecialCd > 0) this.donutSpecialCd -= dt;
      this.updatePlayer(dt);
      this.updateDonut(dt);
      this.handleDonutSpecial();
      for (const e of this.enemies) this.updateEnemy(e, dt);
      this.updateProjectiles(dt);
      this.updateDrops(dt);
      this.updateParticles(dt);
      this.updateFloaters(dt);
      this.updateSwings(dt);
      if (!this.currentRoom.cleared && this.enemies.length === 0 && this.currentRoom.spawned) {
        this.onRoomCleared();
      }
      this.handleDoors(dt);
      this.handleInteract(dt);
    }
    updatePlayer(dt) {
      const p = this.player;
      const input = this.game.input;
      p.stamina = Math.min(p.stats.maxStamina, p.stamina + CONFIG.STAMINA_REGEN * dt);
      p.mana = Math.min(p.stats.maxMana, p.mana + p.stats.manaRegen * dt);
      if (p.attackCd > 0) p.attackCd -= dt;
      if (p.dodgeCd > 0) p.dodgeCd -= dt;
      if (p.invuln > 0) p.invuln -= dt;
      if (p.frenzyTime > 0) p.frenzyTime -= dt;
      const m = input.mouse;
      let aim = normalize(m.x - p.x, m.y - p.y);
      if (!isFinite(aim.x)) aim = p.facing;
      p.facing = aim;
      let mx = input.moveX, my = input.moveY;
      const mlen = Math.hypot(mx, my);
      if (mlen > 0) {
        mx /= mlen;
        my /= mlen;
      }
      let speed = p.speed;
      if (p.frenzyTime > 0) speed *= 1.12;
      if (p.dodgeTime > 0) {
        p.dodgeTime -= dt;
        speed *= CONFIG.DODGE_SPEED_MULT;
        p.invuln = Math.max(p.invuln, 0.05);
      } else if (input.actionPressed("dodge") && p.dodgeCd <= 0 && p.stamina >= 18 && mlen > 0) {
        p.dodgeTime = CONFIG.DODGE_DURATION;
        p.dodgeCd = CONFIG.DODGE_COOLDOWN;
        p.stamina -= 18;
        p.invuln = CONFIG.DODGE_DURATION + 0.05;
        p.dodgeDir = { x: mx, y: my };
        this.spawnDust(p.x, p.y);
        if (p.procs.has("refund")) p.stamina += 8;
      }
      if (p.dodgeTime > 0 && p.dodgeDir) {
        mx = p.dodgeDir.x;
        my = p.dodgeDir.y;
      }
      p.x += mx * speed * dt;
      p.y += my * speed * dt;
      this.clampToArena(p, CONFIG.PLAYER_RADIUS);
      const wantsAttack = input.action("attack") || input.mouse.down;
      if (wantsAttack && p.attackCd <= 0) {
        this.playerAttack();
        p.attackCd = p.attackCooldown * (p.frenzyTime > 0 ? 0.7 : 1);
      }
    }
    playerAttack() {
      const p = this.player;
      const reach = 70;
      const aimAng = Math.atan2(p.facing.y, p.facing.x);
      this.swings.push({ x: p.x, y: p.y, ang: aimAng, t: 0, dur: 0.18 });
      let hitAny = false;
      for (const e of this.enemies) {
        const d = dist(p.x, p.y, e.x, e.y);
        if (d > reach + e.r) continue;
        const ang = Math.atan2(e.y - p.y, e.x - p.x);
        if (angleDiff(ang, aimAng) > 1.1) continue;
        this.damageEnemy(e, this.computeMeleeDamage(), "melee");
        hitAny = true;
      }
      if (!hitAny) {
      }
    }
    computeMeleeDamage() {
      const p = this.player;
      let dmg = p.stats.meleeDamage;
      let crit = false;
      if (this.rng.next() < p.stats.critChance) {
        dmg *= p.stats.critMult;
        crit = true;
      }
      return { amount: dmg, crit, lifesteal: p.stats.lifesteal, source: "player" };
    }
    damageEnemy(e, dmgObj, type) {
      let amount = dmgObj.amount;
      e.hp -= amount;
      e.hitFlash = 0.12;
      this.shake = Math.min(8, this.shake + (dmgObj.crit ? 4 : 1.5));
      this.spawnFloater(e.x, e.y - e.r, Math.round(amount), dmgObj.crit ? "crit" : type === "donut" ? "donut" : "dmg");
      this.spawnHitParticles(e.x, e.y, e.color);
      if (dmgObj.source === "player") {
        const p = this.player;
        if (p.procs.has("burn1") || p.procs.has("burn2")) {
          e.burn = Math.max(e.burn, p.stats.spellPower * 0.25 + 2);
          e.burnTime = 3;
        }
        if (p.procs.has("chill")) {
          e.slow = 0.45;
          e.slowTime = 2;
        }
        if (dmgObj.lifesteal > 0) {
          const heal = amount * dmgObj.lifesteal;
          this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + heal);
        }
      }
      if (e.hp <= 0) this.killEnemy(e);
    }
    killEnemy(e) {
      const idx = this.enemies.indexOf(e);
      if (idx < 0) return;
      this.enemies.splice(idx, 1);
      this.spawnDeathBurst(e.x, e.y, e.color);
      const p = this.player;
      if (p.procs.has("frenzy")) p.frenzyTime = 2.5;
      if (p.procs.has("refund")) {
      }
      const leveled = p.gainXp(e.xp);
      const gold = this.game.rollGoldFor(e.gold);
      p.gold += gold;
      this.game.log(`Slain: ${e.name}  (+${e.xp} XP, +${gold}g)`, "good");
      let dropChance = e.tier === "normal" ? 0.32 : 1;
      if (this.rng.next() < dropChance) {
        const minTier = e.tier === "floor" ? 4 : e.tier === "neighborhood" ? 2 : 0;
        this.game.dropLootAt(e.x, e.y, minTier);
      }
      if (e.tier !== "normal") {
        this.drops.push({ id: _eid++, kind: "gold", x: e.x + 18, y: e.y, r: 12, amount: this.game.rollGoldFor(e.gold) });
        if (e.tier === "floor") {
          this.game.dropLootAt(e.x - 26, e.y, 3);
          this.game.dropLootAt(e.x + 26, e.y, 3);
        }
        this.game.onBossKilled?.(e);
      }
      if (leveled > 0) this.game.onLevelUp?.(leveled);
    }
    // ---- Donut companion ----
    updateDonut(dt) {
      const d = this.donut;
      const p = this.player;
      if (d.downed) {
        d.reviveTimer -= dt;
        if (d.reviveTimer <= 0) {
          d.downed = false;
          d.hp = d.maxHp * 0.5;
          this.game.log('Princess Donut struts back into the fight. "Miss me?"', "good");
        }
        return;
      }
      d.hp = Math.min(d.maxHp, d.hp + dt * 2.5);
      if (d.atkCd > 0) d.atkCd -= dt;
      const followX = p.x - p.facing.x * 40 - 20;
      const followY = p.y - p.facing.y * 40 + 16;
      const dd = dist(d.x, d.y, followX, followY);
      if (dd > 6) {
        const n = normalize(followX - d.x, followY - d.y);
        const sp = CONFIG.DONUT_SPEED * (dd > 120 ? 1.6 : 1);
        d.x += n.x * sp * dt;
        d.y += n.y * sp * dt;
      }
      this.clampToArena(d, CONFIG.DONUT_RADIUS);
      if (this.enemies.length && d.atkCd <= 0) {
        let nearest = null, nd = Infinity;
        for (const e of this.enemies) {
          const ed = dist(d.x, d.y, e.x, e.y);
          if (ed < nd) {
            nd = ed;
            nearest = e;
          }
        }
        if (nearest && nd < 420) {
          const dmgMult = 1 + (p.donutBonus.dmg || 0) + (this.game.run.donutMorale || 0) * 0.15;
          const base = 6 + p.attr.charisma * 1.6 + p.level * 0.8;
          const n = normalize(nearest.x - d.x, nearest.y - d.y);
          this.projectiles.push({
            id: _eid++,
            friendly: true,
            kind: "donut",
            x: d.x,
            y: d.y,
            vx: n.x * 360,
            vy: n.y * 360,
            r: 6,
            dmg: base * dmgMult,
            life: 1.6,
            color: "#ff8ad8"
          });
          const cdr = 1 - clamp(p.donutBonus.cdr || 0, 0, 0.6);
          d.atkCd = 1.15 * cdr;
        }
      }
    }
    // K ability: Donut's "High-Pitched Yowl" — radial burst that damages & chills.
    handleDonutSpecial() {
      if (!this.game.input.actionPressed("donut")) return;
      if (this.donutSpecialCd > 0 || this.donut.downed) {
        if (this.donut.downed) this.game.toast("Donut is downed and unavailable!");
        return;
      }
      this.donutSpecialCd = this.donutSpecialMax;
      const d = this.donut;
      const p = this.player;
      const dmgMult = 1 + (p.donutBonus.dmg || 0);
      const base = (14 + p.attr.charisma * 3 + p.level * 1.5) * dmgMult;
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        this.projectiles.push({
          id: _eid++,
          friendly: true,
          kind: "donut",
          x: d.x,
          y: d.y,
          vx: Math.cos(a) * 300,
          vy: Math.sin(a) * 300,
          r: 6,
          dmg: base,
          life: 0.9,
          color: "#ffb3ec"
        });
      }
      for (const e of this.enemies) {
        if (dist(e.x, e.y, d.x, d.y) < 220) {
          e.slow = 0.5;
          e.slowTime = 2.5;
        }
      }
      this.spawnDeathBurst(d.x, d.y, "#ff8ad8");
      this.shake = 6;
      this.game.log("Princess Donut unleashes a galaxy-shattering YOWL!", "good");
    }
    hurtDonut(amount) {
      const d = this.donut;
      if (d.downed) return;
      d.hp -= amount;
      this.spawnFloater(d.x, d.y - 14, Math.round(amount), "dmg");
      if (d.hp <= 0) {
        d.hp = 0;
        d.downed = true;
        d.reviveTimer = 9;
        this.game.log("Princess Donut has been downed! She retreats to her box, furious.", "danger");
      }
    }
    // ---- Enemy AI ----
    updateEnemy(e, dt) {
      const p = this.player;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.contactCd > 0) e.contactCd -= dt;
      if (e.burnTime > 0) {
        e.burnTime -= dt;
        e.hp -= e.burn * dt;
        if (this.rng.next() < dt * 6) this.spawnEmber(e.x, e.y);
        if (e.hp <= 0) {
          this.killEnemy(e);
          return;
        }
      }
      let speedMult = 1;
      if (e.slowTime > 0) {
        e.slowTime -= dt;
        speedMult *= 1 - e.slow;
      }
      if (e.enrageHp && !e.enraged && e.hp / e.maxHp <= e.enrageHp) {
        e.enraged = true;
        e.speed *= 1.4;
        e.damage *= 1.3;
        this.game.log(`${e.name} ENRAGES!`, "danger");
        this.shake = 10;
      }
      const toP = { x: p.x - e.x, y: p.y - e.y };
      const dP = Math.hypot(toP.x, toP.y) || 1;
      const dir = { x: toP.x / dP, y: toP.y / dP };
      if (e.behavior === "chaser" || e.behavior === "bruiser") {
        const sp = e.speed * speedMult * (e.behavior === "bruiser" ? 1 : 1);
        e.x += dir.x * sp * dt;
        e.y += dir.y * sp * dt;
        this.tryContactDamage(e, dP);
      } else if (e.behavior === "shooter") {
        const ideal = e.range * 0.7;
        if (dP < ideal - 40) {
          e.x -= dir.x * e.speed * speedMult * dt;
          e.y -= dir.y * e.speed * speedMult * dt;
        } else if (dP > ideal + 40) {
          e.x += dir.x * e.speed * 0.7 * speedMult * dt;
          e.y += dir.y * e.speed * 0.7 * speedMult * dt;
        }
        e.atkCd -= dt;
        if (e.atkCd <= 0 && dP < e.range) {
          e.atkCd = this.rng.range(1.1, 1.9);
          const target = !this.donut.downed && this.rng.bool(0.3) ? this.donut : p;
          const n = normalize(target.x - e.x, target.y - e.y);
          this.projectiles.push({
            id: _eid++,
            friendly: false,
            kind: "enemy",
            x: e.x,
            y: e.y,
            vx: n.x * e.projectileSpeed,
            vy: n.y * e.projectileSpeed,
            r: 7,
            dmg: e.damage,
            life: 3,
            color: "#ff5a3c"
          });
        }
        this.tryContactDamage(e, dP);
      } else if (e.behavior === "charger") {
        if (e.chargeState === "idle") {
          if (dP > 220) {
            e.x += dir.x * e.speed * 0.6 * speedMult * dt;
            e.y += dir.y * e.speed * 0.6 * speedMult * dt;
          } else {
            e.chargeState = "windup";
            e.chargeTimer = 0.5;
            e.chargeDir = dir;
          }
        } else if (e.chargeState === "windup") {
          e.chargeTimer -= dt;
          e.chargeDir = dir;
          if (e.chargeTimer <= 0) {
            e.chargeState = "charge";
            e.chargeTimer = 0.45;
          }
        } else if (e.chargeState === "charge") {
          e.chargeTimer -= dt;
          e.x += e.chargeDir.x * e.speed * 2.4 * dt;
          e.y += e.chargeDir.y * e.speed * 2.4 * dt;
          this.tryContactDamage(e, dP, 1.5);
          const hitWall = this.clampToArena(e, e.r);
          if (e.chargeTimer <= 0 || hitWall) {
            e.chargeState = "rest";
            e.chargeTimer = 0.7;
          }
        } else if (e.chargeState === "rest") {
          e.chargeTimer -= dt;
          if (e.chargeTimer <= 0) e.chargeState = "idle";
        }
      }
      this.clampToArena(e, e.r);
    }
    tryContactDamage(e, dP, mult = 1) {
      const p = this.player;
      if (dP <= e.r + CONFIG.PLAYER_RADIUS && e.contactCd <= 0) {
        this.hitPlayer(e.damage * mult);
        e.contactCd = 0.7;
      }
      if (!this.donut.downed) {
        const dd = dist(e.x, e.y, this.donut.x, this.donut.y);
        if (dd <= e.r + CONFIG.DONUT_RADIUS && e.contactCd <= 0) {
          this.hurtDonut(e.damage * 0.5 * mult);
          e.contactCd = 0.7;
        }
      }
    }
    hitPlayer(rawDamage) {
      const p = this.player;
      if (p.invuln > 0) return;
      if (this.rng.next() < p.stats.dodgeChance) {
        this.spawnFloater(p.x, p.y - 24, "DODGE", "dodge");
        return;
      }
      let dmg = Math.max(1, rawDamage - p.stats.armor);
      p.hp -= dmg;
      p.invuln = 0.35;
      this.spawnFloater(p.x, p.y - 24, Math.round(dmg), "playerhit");
      this.shake = 9;
      if (p.stats.thorns > 0) {
        for (const e of this.enemies) {
          if (dist(e.x, e.y, p.x, p.y) < e.r + CONFIG.PLAYER_RADIUS + 6) {
            this.damageEnemy(e, { amount: p.stats.thorns, crit: false, source: "thorns" }, "thorns");
          }
        }
      }
      if (p.hp <= 0) {
        p.hp = 0;
        this.game.onPlayerDeath?.();
      }
    }
    // ---- projectiles ----
    updateProjectiles(dt) {
      const p = this.player;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;
        pr.life -= dt;
        let dead = pr.life <= 0;
        if (pr.x < ARENA.left || pr.x > ARENA.right || pr.y < ARENA.top || pr.y > ARENA.bottom) dead = true;
        if (!dead && pr.friendly) {
          for (const e of this.enemies) {
            if (dist(pr.x, pr.y, e.x, e.y) <= e.r + pr.r) {
              let dmg = pr.dmg;
              let crit = false;
              if (this.rng.next() < p.stats.critChance * 0.6) {
                dmg *= p.stats.critMult;
                crit = true;
              }
              this.damageEnemy(e, { amount: dmg, crit, source: pr.kind === "donut" ? "donut" : "player", lifesteal: 0 }, pr.kind === "donut" ? "donut" : "spell");
              dead = true;
              break;
            }
          }
        } else if (!dead && !pr.friendly) {
          if (p.invuln <= 0 && dist(pr.x, pr.y, p.x, p.y) <= CONFIG.PLAYER_RADIUS + pr.r) {
            this.hitPlayer(pr.dmg);
            dead = true;
          } else if (!this.donut.downed && dist(pr.x, pr.y, this.donut.x, this.donut.y) <= CONFIG.DONUT_RADIUS + pr.r) {
            this.hurtDonut(pr.dmg * 0.6);
            dead = true;
          }
        }
        if (dead) {
          this.spawnHitParticles(pr.x, pr.y, pr.color);
          this.projectiles.splice(i, 1);
        }
      }
    }
    // ---- drops & pickups ----
    updateDrops(dt) {
      const p = this.player;
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        if (d.kind === "chest") continue;
        const dd = dist(d.x, d.y, p.x, p.y);
        if (dd < 120) {
          const n = normalize(p.x - d.x, p.y - d.y);
          d.x += n.x * 180 * dt;
          d.y += n.y * 180 * dt;
        }
        if (dd < CONFIG.PLAYER_RADIUS + d.r) {
          if (d.kind === "gold") {
            p.gold += d.amount;
            this.spawnFloater(p.x, p.y - 30, `+${d.amount}g`, "gold");
          } else if (d.kind === "item") {
            this.game.pickupItem(d.item);
          }
          this.drops.splice(i, 1);
        }
      }
    }
    handleInteract(dt) {
      if (this.enterCooldown > 0) return;
      const p = this.player;
      for (const d of this.drops) {
        if (d.kind !== "chest" || d.ref.opened) continue;
        if (dist(d.x, d.y, p.x, p.y) < CONFIG.PLAYER_RADIUS + d.r + 14) {
          if (this.game.input.actionPressed("interact")) {
            d.ref.opened = true;
            this.game.openChest(d.x, d.y);
            d._remove = true;
          }
        }
      }
      this.drops = this.drops.filter((d) => !d._remove);
    }
    // ---- doors / transitions ----
    handleDoors(dt) {
      if (this.enterCooldown > 0 || this.transitioning) return;
      const room = this.currentRoom;
      if (!room.cleared) return;
      const p = this.player;
      for (const [dir, targetId] of Object.entries(room.doors)) {
        const dp = doorPos(dir);
        const target = this.game.dungeon.rooms.get(targetId);
        if (dist(p.x, p.y, dp.x, dp.y) < DOOR_HALF - 6) {
          if (target.locked) {
            this.game.toast("\u{1F512} Sealed. Clear all neighborhood bosses first.");
            const c = arenaCenter();
            const n = normalize(c.x - p.x, c.y - p.y);
            p.x += n.x * 30;
            p.y += n.y * 30;
            this.enterCooldown = 0.4;
            return;
          }
          this.enterRoom(targetId, DIRS[dir].opp);
          return;
        }
      }
    }
    onRoomCleared() {
      const room = this.currentRoom;
      room.cleared = true;
      this.game.onRoomCleared?.(room);
    }
    clampToArena(o, r) {
      let hit = false;
      if (o.x < ARENA.left + r) {
        o.x = ARENA.left + r;
        hit = true;
      }
      if (o.x > ARENA.right - r) {
        o.x = ARENA.right - r;
        hit = true;
      }
      if (o.y < ARENA.top + r) {
        o.y = ARENA.top + r;
        hit = true;
      }
      if (o.y > ARENA.bottom - r) {
        o.y = ARENA.bottom - r;
        hit = true;
      }
      return hit;
    }
    // ---- particles / fx ----
    spawnHitParticles(x, y, color) {
      for (let i = 0; i < 5; i++) {
        const a = this.rng.range(0, Math.PI * 2), s = this.rng.range(40, 140);
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3, max: 0.3, color, r: this.rng.range(2, 4) });
      }
    }
    spawnDeathBurst(x, y, color) {
      for (let i = 0; i < 16; i++) {
        const a = this.rng.range(0, Math.PI * 2), s = this.rng.range(60, 220);
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, max: 0.5, color, r: this.rng.range(2, 5) });
      }
    }
    spawnEmber(x, y) {
      this.particles.push({ x: x + this.rng.range(-8, 8), y: y + this.rng.range(-8, 8), vx: this.rng.range(-10, 10), vy: -this.rng.range(20, 50), life: 0.4, max: 0.4, color: "#ff8a3c", r: this.rng.range(1.5, 3) });
    }
    spawnDust(x, y) {
      for (let i = 0; i < 8; i++) {
        const a = this.rng.range(0, Math.PI * 2), s = this.rng.range(20, 80);
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3, max: 0.3, color: "#cfcfe0", r: this.rng.range(1, 3) });
      }
    }
    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }
    spawnFloater(x, y, text, kind) {
      this.floaters.push({ x: x + this.rng.range(-6, 6), y, text: String(text), kind, life: 0.85, max: 0.85 });
    }
    updateFloaters(dt) {
      for (let i = this.floaters.length - 1; i >= 0; i--) {
        const f = this.floaters[i];
        f.y -= 36 * dt;
        f.life -= dt;
        if (f.life <= 0) this.floaters.splice(i, 1);
      }
    }
    updateSwings(dt) {
      for (let i = this.swings.length - 1; i >= 0; i--) {
        this.swings[i].t += dt;
        if (this.swings[i].t >= this.swings[i].dur) this.swings.splice(i, 1);
      }
    }
  };

  // src/data/rarities.js
  var RARITIES = [
    { key: "common", name: "Common", weight: 1e3, mult: 1, tier: 0, color: "#b8b8b8" },
    { key: "uncommon", name: "Uncommon", weight: 420, mult: 1.35, tier: 1, color: "#5cd65c" },
    { key: "rare", name: "Rare", weight: 165, mult: 1.8, tier: 2, color: "#3da5ff" },
    { key: "epic", name: "Epic", weight: 62, mult: 2.4, tier: 3, color: "#b65cff" },
    { key: "legendary", name: "Legendary", weight: 20, mult: 3.2, tier: 4, color: "#ff9d2e" },
    { key: "mythic", name: "Mythic", weight: 5, mult: 4.3, tier: 5, color: "#ff4f8b" },
    { key: "celestial", name: "Celestial", weight: 1, mult: 6, tier: 6, color: "#ffe14d" }
  ];
  var RARITY_MAP = Object.fromEntries(RARITIES.map((r) => [r.key, r]));
  function rollRarity(rng2, lootLuck = 0, floor = 1) {
    const adjusted = RARITIES.map((r) => {
      const luckBoost = 1 + (lootLuck * 0.02 + (floor - 1) * 0.06) * r.tier;
      return { key: r.key, weight: r.weight * luckBoost };
    });
    return rng2.weighted(adjusted).key;
  }
  function rarityColor(key) {
    return RARITY_MAP[key]?.color || "#fff";
  }

  // src/data/items.js
  var SCALE_KEYS = /* @__PURE__ */ new Set([
    "maxHp",
    "maxStamina",
    "maxMana",
    "manaRegen",
    "moveSpeedPct",
    "attackSpeedPct",
    "meleeDamage",
    "spellPower",
    "armor",
    "critChance",
    "critMult",
    "dodgeChance",
    "lifesteal",
    "thorns",
    "lootLuck",
    "goldFindPct"
  ]);
  var PREFIX = {
    common: ["Dented", "Plain", "Salvaged", "Standard-Issue"],
    uncommon: ["Sturdy", "Polished", "Reinforced", "Tuned"],
    rare: ["Gleaming", "Superior", "Pristine", "Veteran"],
    epic: ["Heroic", "Resonant", "Ascendant", "Overclocked"],
    legendary: ["Mythbreaking", "Worldscar", "Legendary", "Sovereign"],
    mythic: ["Apocryphal", "Cataclysmic", "Mythic", "Unmaker's"],
    celestial: ["Celestial", "Star-Forged", "Apotheotic", "Borant-Recalled"]
  };
  var ITEM_TEMPLATES = [
    // ---------- WEAPONS (right hand) ----------
    {
      id: "crowbar",
      name: "Trusty Crowbar",
      slot: "weapon",
      minFloor: 1,
      base: { meleeDamage: 7, critChance: 4 },
      synergy: ["blunt", "crawler"],
      flavor: `"Every crawler's first friend. Pry, smash, repeat." \u2014 it just feels right in your hand.`
    },
    {
      id: "rusty_machete",
      name: "Rusty Machete",
      slot: "weapon",
      minFloor: 1,
      base: { meleeDamage: 9, lifesteal: 3 },
      synergy: ["blade", "blood"],
      flavor: "Tetanus is the least of your worries down here."
    },
    {
      id: "flame_kebab",
      name: "Flaming Skewer",
      slot: "weapon",
      minFloor: 1,
      base: { meleeDamage: 6, spellPower: 5 },
      synergy: ["blade", "fire"],
      flavor: "Cooks the goblin AND seasons it. The crowd loves a multitasker."
    },
    {
      id: "frost_pick",
      name: "Frostbite Ice Pick",
      slot: "weapon",
      minFloor: 1,
      base: { meleeDamage: 7, attackSpeedPct: 6 },
      synergy: ["blade", "ice"],
      flavor: "Slows whatever it stabs. Also great for impromptu snow cones."
    },
    {
      id: "foam_finger",
      name: "Foam Finger of Doom",
      slot: "weapon",
      minFloor: 1,
      base: { meleeDamage: 4, critMult: 0.2 },
      attrs: { charisma: 1 },
      synergy: ["blunt", "showman"],
      flavor: "A sponsored weapon. Smacking monsters with it boosts your viewer numbers."
    },
    {
      id: "goblin_cleaver",
      name: "Goblin Bonecleaver",
      slot: "weapon",
      minFloor: 1,
      base: { meleeDamage: 11 },
      attrs: { strength: 1 },
      synergy: ["blade", "primal"],
      flavor: "Took it off a goblin. The goblin no longer needs it."
    },
    // ---------- OFFHAND (left hand) ----------
    {
      id: "trash_lid",
      name: "Trash Can Lid",
      slot: "offhand",
      minFloor: 1,
      base: { armor: 4, maxHp: 12 },
      synergy: ["shield", "crawler"],
      flavor: "Surprisingly heroic. Smells of last week's leftovers."
    },
    {
      id: "parry_dagger",
      name: "Parrying Shiv",
      slot: "offhand",
      minFloor: 1,
      base: { critChance: 5, dodgeChance: 4 },
      synergy: ["blade"],
      flavor: 'For when "the best defense is a stabbier offense."'
    },
    {
      id: "spell_tome",
      name: "Soggy Spellbook",
      slot: "offhand",
      minFloor: 1,
      base: { spellPower: 7, maxMana: 10 },
      attrs: { intelligence: 1 },
      synergy: ["arcane"],
      flavor: "Half the pages are stuck together. The fireball page, thankfully, is not."
    },
    {
      id: "lucky_horseshoe",
      name: "Off-Hand Horseshoe",
      slot: "offhand",
      minFloor: 1,
      base: { lootLuck: 3 },
      attrs: { luck: 1 },
      synergy: ["luck"],
      flavor: "You found it in a stable that no longer exists. The horse, you assume, also does not."
    },
    // ---------- HEAD ----------
    {
      id: "bike_helmet",
      name: "Cracked Bike Helmet",
      slot: "head",
      minFloor: 1,
      base: { armor: 3, maxHp: 8 },
      synergy: ["crawler"],
      flavor: "Safety first, even during the apocalypse."
    },
    {
      id: "goblin_crown",
      name: "Tiny Goblin Crown",
      slot: "head",
      minFloor: 1,
      base: { goldFindPct: 8 },
      attrs: { charisma: 1 },
      synergy: ["showman", "royal"],
      flavor: "Fits a goblin perfectly. On you it looks like a ring."
    },
    {
      id: "tin_foil_hat",
      name: "Tinfoil Thinking Cap",
      slot: "head",
      minFloor: 1,
      base: { maxMana: 12, spellPower: 4 },
      attrs: { intelligence: 1 },
      synergy: ["arcane", "tech"],
      flavor: "Blocks the alien mind-reading. Probably. The System is laughing."
    },
    {
      id: "night_goggles",
      name: "Scavenged Night-Vision",
      slot: "head",
      minFloor: 1,
      base: { critChance: 5, dodgeChance: 3 },
      attrs: { dexterity: 1 },
      synergy: ["tech"],
      flavor: "See the monster before it sees you. Battery not included."
    },
    // ---------- CHEST ----------
    {
      id: "bathrobe",
      name: "Borant Bathrobe",
      slot: "chest",
      minFloor: 1,
      base: { maxHp: 10, maxMana: 8 },
      synergy: ["crawler", "showman"],
      flavor: "Your starting fit. Comfy, breezy, surprisingly resilient. The fans adore it."
    },
    {
      id: "flak_vest",
      name: "Salvaged Flak Vest",
      slot: "chest",
      minFloor: 1,
      base: { armor: 6, maxHp: 18 },
      attrs: { constitution: 1 },
      synergy: ["tech", "tank"],
      flavor: "Heavy, hot, and the only reason your torso is still attached."
    },
    {
      id: "spiked_jacket",
      name: "Spiked Leather Jacket",
      slot: "chest",
      minFloor: 1,
      base: { thorns: 4, armor: 3 },
      attrs: { strength: 1 },
      synergy: ["primal", "blood"],
      flavor: "Hug a monster, hurt a monster."
    },
    {
      id: "mage_robe",
      name: "Moth-Eaten Mage Robe",
      slot: "chest",
      minFloor: 1,
      base: { spellPower: 6, maxMana: 14 },
      attrs: { intelligence: 1 },
      synergy: ["arcane"],
      flavor: "It billows dramatically. The drama is the point."
    },
    // ---------- HANDS ----------
    {
      id: "work_gloves",
      name: "Leather Work Gloves",
      slot: "hands",
      minFloor: 1,
      base: { meleeDamage: 4, attackSpeedPct: 5 },
      synergy: ["crawler"],
      flavor: "For honest work, like beating up sewer monsters."
    },
    {
      id: "brass_knuckles",
      name: "Heirloom Brass Knuckles",
      slot: "hands",
      minFloor: 1,
      base: { meleeDamage: 6, critChance: 4 },
      attrs: { strength: 1 },
      synergy: ["blunt", "primal"],
      flavor: "Grandpa's. He'd be so proud, and a little concerned."
    },
    {
      id: "oven_mitts",
      name: "Enchanted Oven Mitts",
      slot: "hands",
      minFloor: 1,
      base: { spellPower: 4, maxMana: 8 },
      synergy: ["fire", "arcane"],
      flavor: "Hold the fireball without burning yourself. Mostly."
    },
    {
      id: "pickpocket_gloves",
      name: "Cutpurse's Gloves",
      slot: "hands",
      minFloor: 1,
      base: { goldFindPct: 10, lootLuck: 2 },
      attrs: { dexterity: 1 },
      synergy: ["luck"],
      flavor: "The dead don't need their pocket change."
    },
    // ---------- LEGS ----------
    {
      id: "cargo_shorts",
      name: "Tactical Cargo Shorts",
      slot: "legs",
      minFloor: 1,
      base: { maxStamina: 12, moveSpeedPct: 4 },
      synergy: ["crawler"],
      flavor: "So many pockets. None of them have anything useful in them."
    },
    {
      id: "greaves",
      name: "Dented Steel Greaves",
      slot: "legs",
      minFloor: 1,
      base: { armor: 5, maxHp: 12 },
      attrs: { constitution: 1 },
      synergy: ["tank"],
      flavor: "Clank. Clank. Clank. Stealth is not your strong suit."
    },
    {
      id: "runner_tights",
      name: "Sprinter's Tights",
      slot: "legs",
      minFloor: 1,
      base: { moveSpeedPct: 9, dodgeChance: 4 },
      attrs: { dexterity: 1 },
      synergy: ["swift"],
      flavor: "Run away faster, or toward danger faster. Your call."
    },
    // ---------- BOOTS ----------
    {
      id: "flip_flops",
      name: "Lucky Flip-Flops",
      slot: "boots",
      minFloor: 1,
      base: { moveSpeedPct: 5, lootLuck: 2 },
      attrs: { luck: 1 },
      synergy: ["crawler", "luck"],
      flavor: "The flip-flops you descended in. They've been through everything with you."
    },
    {
      id: "steel_toe",
      name: "Steel-Toed Boots",
      slot: "boots",
      minFloor: 1,
      base: { meleeDamage: 3, armor: 3 },
      synergy: ["blunt", "tank"],
      flavor: "A kick from these has ended more than one monster."
    },
    {
      id: "sneakers",
      name: "Pump-Up Sneakers",
      slot: "boots",
      minFloor: 1,
      base: { moveSpeedPct: 8, attackSpeedPct: 4 },
      attrs: { dexterity: 1 },
      synergy: ["swift"],
      flavor: "They light up when you run. Subtlety is dead anyway."
    },
    {
      id: "ember_boots",
      name: "Ember-Soled Boots",
      slot: "boots",
      minFloor: 1,
      base: { spellPower: 3, moveSpeedPct: 4 },
      synergy: ["fire"],
      flavor: "Leave a trail of tiny scorch marks. The cleanup crew hates you."
    },
    // ---------- NECKLACE ----------
    {
      id: "dog_tags",
      name: "Soldier's Dog Tags",
      slot: "necklace",
      minFloor: 1,
      base: { maxHp: 14, armor: 2 },
      attrs: { constitution: 1 },
      synergy: ["tank"],
      flavor: "They belonged to someone braver than you. For now."
    },
    {
      id: "fang_pendant",
      name: "Monster Fang Pendant",
      slot: "necklace",
      minFloor: 1,
      base: { meleeDamage: 5, lifesteal: 2 },
      attrs: { strength: 1 },
      synergy: ["primal", "blood"],
      flavor: "Wear your enemies. It's a whole vibe."
    },
    {
      id: "crystal_amulet",
      name: "Humming Crystal Amulet",
      slot: "necklace",
      minFloor: 1,
      base: { spellPower: 6, manaRegen: 2 },
      attrs: { intelligence: 1 },
      synergy: ["arcane"],
      flavor: "It hums a tune you almost recognize. The aliens find it catchy."
    },
    {
      id: "rabbit_foot",
      name: "Rabbit's Foot Charm",
      slot: "necklace",
      minFloor: 1,
      base: { lootLuck: 4, critChance: 3 },
      attrs: { luck: 1 },
      synergy: ["luck"],
      flavor: "Unlucky for the rabbit. Lucky for you."
    },
    // ---------- RING ----------
    {
      id: "signet",
      name: "Cracked Signet Ring",
      slot: "ring",
      minFloor: 1,
      base: { goldFindPct: 6 },
      attrs: { charisma: 1 },
      synergy: ["royal"],
      flavor: "Hints at noble blood. The blood is mostly yours, currently."
    },
    {
      id: "iron_band",
      name: "Iron Band",
      slot: "ring",
      minFloor: 1,
      base: { meleeDamage: 4, armor: 2 },
      synergy: ["tank", "primal"],
      flavor: "Plain, heavy, dependable. Like a good friend."
    },
    {
      id: "spark_ring",
      name: "Ring of Sparks",
      slot: "ring",
      minFloor: 1,
      base: { spellPower: 5, critChance: 3 },
      synergy: ["arcane", "fire"],
      flavor: "Zaps you a little when you put it on. Worth it."
    },
    // ---------- CHARM ----------
    {
      id: "cat_toy",
      name: "Donut's Favorite Cat Toy",
      slot: "charm",
      minFloor: 1,
      base: { critChance: 4 },
      attrs: { charisma: 1 },
      synergy: ["feline", "showman"],
      flavor: "Donut allows you to carry it. She has not forgotten it is hers."
    },
    {
      id: "gold_coin",
      name: "Mysterious Gold Coin",
      slot: "charm",
      minFloor: 1,
      base: { goldFindPct: 12, lootLuck: 3 },
      synergy: ["luck"],
      flavor: "It always lands on heads. You're not sure that's a good thing."
    },
    {
      id: "phoenix_feather",
      name: "Singed Phoenix Feather",
      slot: "charm",
      minFloor: 1,
      base: { spellPower: 4, maxHp: 10 },
      synergy: ["fire", "holy"],
      flavor: "Warm to the touch. Whispers of second chances."
    },
    {
      id: "glass_eye",
      name: "Glass Eye of the Glasscannon",
      slot: "charm",
      minFloor: 1,
      base: { meleeDamage: 8, spellPower: 6, maxHp: -8 },
      synergy: ["glass"],
      flavor: "Big damage, brittle ego. High risk, high reward, high ratings."
    },
    {
      id: "pocket_sand",
      name: "Pouch of Pocket Sand",
      slot: "charm",
      minFloor: 1,
      base: { dodgeChance: 6 },
      attrs: { dexterity: 1 },
      synergy: ["swift"],
      flavor: '"POCKET SAND!" Works embarrassingly often.'
    }
  ];
  var _instanceCounter = 1;
  function buildItem(template, rarityKey, floor, rng2) {
    const rarity = RARITY_MAP[rarityKey];
    const floorScale = 1 + (floor - 1) * 0.12;
    const mult = rarity.mult * floorScale;
    const stats = {};
    for (const [k, v] of Object.entries(template.base || {})) {
      if (!SCALE_KEYS.has(k)) continue;
      let val = v * mult;
      val = k === "critMult" ? Math.round(val * 100) / 100 : Math.round(val);
      if (val !== 0) stats[k] = val;
    }
    const attrs = {};
    for (const [k, v] of Object.entries(template.attrs || {})) {
      if (!ATTR_KEYS.includes(k)) continue;
      const val = Math.max(1, Math.round(v * (1 + rarity.tier * 0.6) * floorScale));
      attrs[k] = val;
    }
    if (rarity.tier >= 3 && rng2) {
      const affixPool = ["critChance", "critMult", "moveSpeedPct", "lifesteal", "lootLuck", "armor"];
      const k = rng2.pick(affixPool);
      const amt = k === "critMult" ? Math.round(0.15 * rarity.tier * 100) / 100 : Math.round((2 + rarity.tier) * floorScale);
      stats[k] = (stats[k] || 0) + amt;
    }
    const prefixList = PREFIX[rarityKey];
    const prefix = prefixList ? rng2 ? rng2.pick(prefixList) : prefixList[0] : "";
    const name = rarity.tier === 0 ? template.name : `${prefix} ${template.name}`;
    return {
      uid: `it_${_instanceCounter++}`,
      templateId: template.id,
      name,
      slot: template.slot,
      rarity: rarityKey,
      rarityTier: rarity.tier,
      stats,
      attrs,
      tags: (template.synergy || []).slice(),
      flavor: template.flavor
    };
  }
  function templatesForFloor(floor) {
    return ITEM_TEMPLATES.filter((t) => (t.minFloor || 1) <= floor);
  }

  // src/systems/loot.js
  var TEMPLATE_BY_ID = Object.fromEntries(ITEM_TEMPLATES.map((t) => [t.id, t]));
  function rollItem(rng2, floor, lootLuck = 0, opts = {}) {
    let pool = templatesForFloor(floor);
    if (opts.slot) pool = pool.filter((t) => t.slot === opts.slot);
    if (pool.length === 0) pool = templatesForFloor(floor);
    const template = rng2.pick(pool);
    const rarityKey = rollRarity(rng2, lootLuck, floor);
    return buildItem(template, rarityKey, floor, rng2);
  }
  function makeItemById(templateId, rng2, floor = 1, rarityKey) {
    const t = TEMPLATE_BY_ID[templateId];
    if (!t) return rollItem(rng2, floor);
    const r = rarityKey || rollRarity(rng2, 0, floor);
    return buildItem(t, r, floor, rng2);
  }
  function rollItemMinRarity(rng2, floor, lootLuck, minTier) {
    const tiersOrder = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "celestial"];
    let item = rollItem(rng2, floor, lootLuck);
    if (item.rarityTier < minTier) {
      const t = TEMPLATE_BY_ID[item.templateId];
      item = buildItem(t, tiersOrder[minTier], floor, rng2);
    }
    return item;
  }
  function rollGold(rng2, range, goldFind = 1) {
    const [a, b] = range;
    return Math.max(1, Math.round(rng2.int(a, b) * goldFind));
  }

  // src/render/renderer.js
  var Renderer = class {
    constructor(canvas, game) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.game = game;
      this.minimap = document.getElementById("minimap");
      this.mmCtx = this.minimap.getContext("2d");
    }
    render() {
      const ctx = this.ctx;
      const w = this.world;
      const game = this.game;
      ctx.clearRect(0, 0, CONFIG.VIEW_W, CONFIG.VIEW_H);
      if (!game.world || !game.world.currentRoom) return;
      const world = game.world;
      const theme = game.dungeon.def.theme;
      ctx.save();
      if (world.shake > 0) {
        ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
      }
      this.drawRoom(ctx, theme, world);
      this.drawDrops(ctx, world);
      this.drawShadow(ctx, world.donut.x, world.donut.y, CONFIG.DONUT_RADIUS);
      this.drawShadow(ctx, game.player.x, game.player.y, CONFIG.PLAYER_RADIUS);
      for (const e of world.enemies) this.drawShadow(ctx, e.x, e.y, e.r);
      const ents = [
        ...world.enemies.map((e) => ({ y: e.y, draw: () => this.drawEnemy(ctx, e) })),
        { y: world.donut.y, draw: () => this.drawDonut(ctx, world.donut) },
        { y: game.player.y, draw: () => this.drawPlayer(ctx, game.player, world) }
      ].sort((a, b) => a.y - b.y);
      for (const e of ents) e.draw();
      this.drawSwings(ctx, world);
      this.drawProjectiles(ctx, world);
      this.drawParticles(ctx, world);
      this.drawFloaters(ctx, world);
      this.drawReticle(ctx, game);
      ctx.restore();
      this.drawRoomBanner(ctx, world);
      this.drawMinimap(game);
    }
    get world() {
      return this.game.world;
    }
    drawRoom(ctx, theme, world) {
      const room = world.currentRoom;
      ctx.fillStyle = theme.floor;
      ctx.fillRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let x = ARENA.left; x <= ARENA.right; x += CONFIG.TILE) {
        ctx.beginPath();
        ctx.moveTo(x, ARENA.top);
        ctx.lineTo(x, ARENA.bottom);
        ctx.stroke();
      }
      for (let y = ARENA.top; y <= ARENA.bottom; y += CONFIG.TILE) {
        ctx.beginPath();
        ctx.moveTo(ARENA.left, y);
        ctx.lineTo(ARENA.right, y);
        ctx.stroke();
      }
      const t = 16;
      ctx.fillStyle = theme.wall;
      this.wallWithDoor(ctx, theme, "N", room, t);
      this.wallWithDoor(ctx, theme, "S", room, t);
      this.wallWithDoor(ctx, theme, "W", room, t);
      this.wallWithDoor(ctx, theme, "E", room, t);
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(ARENA.left + 1, ARENA.top + 1, ARENA.right - ARENA.left - 2, ARENA.bottom - ARENA.top - 2);
    }
    wallWithDoor(ctx, theme, dir, room, t) {
      const horizontal = dir === "N" || dir === "S";
      const hasDoor = !!room.doors[dir];
      const target = hasDoor ? this.game.dungeon.rooms.get(room.doors[dir]) : null;
      const locked = target && target.locked;
      ctx.fillStyle = theme.wall;
      if (horizontal) {
        const y = dir === "N" ? ARENA.top - t : ARENA.bottom;
        const dp = doorPos(dir);
        if (hasDoor) {
          ctx.fillRect(ARENA.left - t, y, dp.x - DOOR_HALF - (ARENA.left - t), t);
          ctx.fillRect(dp.x + DOOR_HALF, y, ARENA.right + t - (dp.x + DOOR_HALF), t);
          this.drawDoor(ctx, dp.x, dir === "N" ? ARENA.top : ARENA.bottom, horizontal, locked, room.cleared);
        } else {
          ctx.fillRect(ARENA.left - t, y, ARENA.right + t - (ARENA.left - t), t);
        }
      } else {
        const x = dir === "W" ? ARENA.left - t : ARENA.right;
        const dp = doorPos(dir);
        if (hasDoor) {
          ctx.fillRect(x, ARENA.top - t, t, dp.y - DOOR_HALF - (ARENA.top - t));
          ctx.fillRect(x, dp.y + DOOR_HALF, t, ARENA.bottom + t - (dp.y + DOOR_HALF));
          this.drawDoor(ctx, dir === "W" ? ARENA.left : ARENA.right, dp.y, horizontal, locked, room.cleared);
        } else {
          ctx.fillRect(x, ARENA.top - t, t, ARENA.bottom + t - (ARENA.top - t));
        }
      }
    }
    drawDoor(ctx, x, y, horizontal, locked, cleared) {
      ctx.save();
      const col = locked ? "#7a2230" : cleared ? "#4caf50" : "#a07a2a";
      ctx.fillStyle = locked ? "#3a1820" : "#241c14";
      const len = DOOR_HALF * 2 - 8;
      if (horizontal) ctx.fillRect(x - len / 2, y - 7, len, 14);
      else ctx.fillRect(x - 7, y - len / 2, 14, len);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      if (horizontal) ctx.strokeRect(x - len / 2, y - 7, len, 14);
      else ctx.strokeRect(x - 7, y - len / 2, 14, len);
      if (locked) {
        ctx.fillStyle = "#ff6b7a";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\u{1F512}", x, y);
      }
      ctx.restore();
    }
    drawShadow(ctx, x, y, r) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.7, r * 0.9, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawPlayer(ctx, p, world) {
      const r = CONFIG.PLAYER_RADIUS;
      ctx.save();
      if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#caa15a";
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8a6a30";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = "#6b4f22";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x - r, p.y + 2);
      ctx.lineTo(p.x + r, p.y + 2);
      ctx.stroke();
      ctx.fillStyle = "#f0c89a";
      ctx.beginPath();
      ctx.arc(p.x, p.y - r * 0.5, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      const fx = p.facing.x, fy = p.facing.y;
      ctx.fillStyle = "#1a1a22";
      ctx.beginPath();
      ctx.arc(p.x + fx * 5 - fy * 3, p.y - r * 0.5 + fy * 5 + fx * 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x + fx * 5 + fy * 3, p.y - r * 0.5 + fy * 5 - fx * 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d8d8e0";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.x + fx * r, p.y + fy * r);
      ctx.lineTo(p.x + fx * (r + 12), p.y + fy * (r + 12));
      ctx.stroke();
      ctx.restore();
    }
    drawDonut(ctx, d) {
      if (d.downed) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ff8ad8";
        ctx.fillText("\u{1F63E}\u{1F4A4}", d.x, d.y);
        ctx.restore();
        return;
      }
      const r = CONFIG.DONUT_RADIUS;
      ctx.save();
      ctx.fillStyle = "#f4f0ff";
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f4f0ff";
      ctx.beginPath();
      ctx.moveTo(d.x - r * 0.6, d.y - r * 0.5);
      ctx.lineTo(d.x - r * 0.9, d.y - r * 1.3);
      ctx.lineTo(d.x - r * 0.1, d.y - r * 0.8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(d.x + r * 0.6, d.y - r * 0.5);
      ctx.lineTo(d.x + r * 0.9, d.y - r * 1.3);
      ctx.lineTo(d.x + r * 0.1, d.y - r * 0.8);
      ctx.fill();
      ctx.fillStyle = "#ffd54f";
      ctx.beginPath();
      ctx.moveTo(d.x - 5, d.y - r * 0.9);
      ctx.lineTo(d.x, d.y - r * 1.5);
      ctx.lineTo(d.x + 5, d.y - r * 0.9);
      ctx.fill();
      ctx.fillStyle = "#2a7a4a";
      ctx.beginPath();
      ctx.arc(d.x - 3.5, d.y - 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(d.x + 3.5, d.y - 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawEnemy(ctx, e) {
      ctx.save();
      const flash = e.hitFlash > 0;
      ctx.fillStyle = flash ? "#ffffff" : e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#1a1a22";
      const ex = 0.4 * e.r;
      ctx.beginPath();
      ctx.arc(e.x - ex, e.y - 2, e.r * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e.x + ex, e.y - 2, e.r * 0.13, 0, Math.PI * 2);
      ctx.fill();
      if (e.behavior === "charger" && e.chargeState === "windup") {
        ctx.strokeStyle = "#ff5a3c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r + 4 + Math.sin(performance.now() / 60) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (e.burnTime > 0) {
        ctx.fillStyle = "rgba(255,138,60,0.35)";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r + 2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (e.slowTime > 0) {
        ctx.strokeStyle = "rgba(110,180,255,0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      const isBoss = e.tier !== "normal";
      const bw = isBoss ? e.r * 2.2 : e.r * 1.8;
      const by = e.y - e.r - (isBoss ? 14 : 8);
      ctx.fillStyle = "#000000aa";
      ctx.fillRect(e.x - bw / 2, by, bw, isBoss ? 6 : 4);
      ctx.fillStyle = isBoss ? "#ff4f6b" : "#e05050";
      ctx.fillRect(e.x - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), isBoss ? 6 : 4);
      if (isBoss) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Trebuchet MS";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(e.name, e.x, by - 4);
        ctx.fillText(e.name, e.x, by - 4);
      }
      ctx.restore();
    }
    drawSwings(ctx, world) {
      for (const s of world.swings) {
        const prog = s.t / s.dur;
        ctx.save();
        ctx.globalAlpha = (1 - prog) * 0.6;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.ang);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        const a0 = -0.9 + prog * 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, 50, a0 - 0.5, a0 + 0.5);
        ctx.stroke();
        ctx.restore();
      }
    }
    drawProjectiles(ctx, world) {
      for (const pr of world.projectiles) {
        ctx.save();
        ctx.fillStyle = pr.color;
        ctx.shadowColor = pr.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    drawParticles(ctx, world) {
      for (const p of world.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    drawFloaters(ctx, world) {
      ctx.save();
      ctx.textAlign = "center";
      for (const f of world.floaters) {
        const a = Math.min(1, f.life / f.max);
        ctx.globalAlpha = a;
        let color = "#fff", size = 14, weight = "bold";
        if (f.kind === "crit") {
          color = "#ffd54f";
          size = 20;
        } else if (f.kind === "dmg") {
          color = "#ffffff";
        } else if (f.kind === "donut") {
          color = "#ff8ad8";
        } else if (f.kind === "playerhit") {
          color = "#ff6b6b";
          size = 16;
        } else if (f.kind === "gold") {
          color = "#ffd54f";
        } else if (f.kind === "dodge") {
          color = "#7bdcff";
        }
        ctx.font = `${weight} ${size}px Trebuchet MS`;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = color;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.restore();
    }
    drawDrops(ctx, world) {
      for (const d of world.drops) {
        ctx.save();
        if (d.kind === "chest") {
          ctx.fillStyle = "#8a5a2b";
          ctx.fillRect(d.x - 16, d.y - 12, 32, 22);
          ctx.fillStyle = "#caa15a";
          ctx.fillRect(d.x - 16, d.y - 12, 32, 7);
          ctx.fillStyle = "#ffd54f";
          ctx.fillRect(d.x - 3, d.y - 4, 6, 6);
          ctx.fillStyle = "#fff";
          ctx.font = "bold 12px Trebuchet MS";
          ctx.textAlign = "center";
          ctx.fillText("[E] Open", d.x, d.y - 20);
        } else if (d.kind === "gold") {
          ctx.fillStyle = "#ffd54f";
          ctx.shadowColor = "#ffd54f";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (d.kind === "item") {
          const c = rarityColor(d.item.rarity);
          const bob = Math.sin(performance.now() / 300 + d.id) * 3;
          ctx.fillStyle = c;
          ctx.shadowColor = c;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y - 9 + bob);
          ctx.lineTo(d.x + 9, d.y + bob);
          ctx.lineTo(d.x, d.y + 9 + bob);
          ctx.lineTo(d.x - 9, d.y + bob);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }
    drawReticle(ctx, game) {
      const m = game.input.mouse;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(m.x - 12, m.y);
      ctx.lineTo(m.x - 4, m.y);
      ctx.moveTo(m.x + 4, m.y);
      ctx.lineTo(m.x + 12, m.y);
      ctx.moveTo(m.x, m.y - 12);
      ctx.lineTo(m.x, m.y - 4);
      ctx.moveTo(m.x, m.y + 4);
      ctx.lineTo(m.x, m.y + 12);
      ctx.stroke();
      ctx.restore();
    }
    drawRoomBanner(ctx, world) {
      const room = world.currentRoom;
      let label = "";
      if (room.type === "neighborhood") label = "NEIGHBORHOOD BOSS";
      else if (room.type === "boss") label = "\u26A0 FLOOR BOSS \u26A0";
      else if (room.type === "loot") label = "TREASURE ROOM";
      else if (room.type === "event") label = "???";
      else if (room.type === "combat" && !room.cleared) label = "HOSTILES";
      else if (room.cleared && room.type === "combat") label = "CLEARED";
      if (!label) return;
      ctx.save();
      ctx.font = "bold 13px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillStyle = room.type === "boss" ? "#ff5a3c" : "#ffd54f";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.strokeText(label, CONFIG.VIEW_W / 2, ARENA.top - 24);
      ctx.fillText(label, CONFIG.VIEW_W / 2, ARENA.top - 24);
      ctx.restore();
    }
    drawMinimap(game) {
      const ctx = this.mmCtx;
      const W = this.minimap.width, H = this.minimap.height;
      ctx.clearRect(0, 0, W, H);
      const dungeon = game.dungeon;
      const rooms = [...dungeon.rooms.values()];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const r of rooms) {
        minX = Math.min(minX, r.gridX);
        maxX = Math.max(maxX, r.gridX);
        minY = Math.min(minY, r.gridY);
        maxY = Math.max(maxY, r.gridY);
      }
      const cols = maxX - minX + 1, rowsN = maxY - minY + 1;
      const pad = 14;
      const cell = Math.min((W - pad * 2) / cols, (H - pad * 2) / rowsN);
      const box = cell * 0.66;
      const ox = (W - cols * cell) / 2;
      const oy = (H - rowsN * cell) / 2;
      const cur = game.world?.currentRoom;
      ctx.strokeStyle = "#44445a";
      ctx.lineWidth = 2;
      for (const r of rooms) {
        for (const tid of Object.values(r.doors)) {
          const t = dungeon.rooms.get(tid);
          const ax = ox + (r.gridX - minX) * cell + cell / 2;
          const ay = oy + (r.gridY - minY) * cell + cell / 2;
          const bx = ox + (t.gridX - minX) * cell + cell / 2;
          const by = oy + (t.gridY - minY) * cell + cell / 2;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
      for (const r of rooms) {
        const x = ox + (r.gridX - minX) * cell + (cell - box) / 2;
        const y = oy + (r.gridY - minY) * cell + (cell - box) / 2;
        let col = "#2c2c40";
        if (r.visited) col = r.cleared ? "#3a5a3a" : "#5a3a3a";
        if (r.type === "boss") col = r.cleared ? "#3a5a3a" : r.locked ? "#4a2030" : "#7a2230";
        if (r.type === "neighborhood" && !r.cleared) col = "#6a4a20";
        ctx.fillStyle = col;
        ctx.fillRect(x, y, box, box);
        ctx.fillStyle = "#fff";
        ctx.font = `${box * 0.6}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let icon = "";
        if (r.type === "boss") icon = "\u2620";
        else if (r.type === "neighborhood") icon = "\u2605";
        else if (r.type === "loot") icon = r.chest && r.chest.opened ? "" : "\u25C6";
        else if (r.type === "event") icon = "?";
        else if (r.type === "start") icon = "\u2302";
        if (r.visited || r.type === "boss") ctx.fillText(icon, x + box / 2, y + box / 2 + 1);
        if (cur && r.id === cur.id) {
          ctx.strokeStyle = "#ffd54f";
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 1, y - 1, box + 2, box + 2);
        }
      }
    }
  };

  // src/ui/hud.js
  var HUD = class {
    constructor(game) {
      this.game = game;
      this.el = {
        hud: document.getElementById("hud"),
        hpFill: document.getElementById("hp-fill"),
        hpLabel: document.getElementById("hp-label"),
        stamFill: document.getElementById("stam-fill"),
        stamLabel: document.getElementById("stam-label"),
        manaFill: document.getElementById("mana-fill"),
        manaLabel: document.getElementById("mana-label"),
        xpFill: document.getElementById("xp-fill"),
        xpLabel: document.getElementById("xp-label"),
        donutHpFill: document.getElementById("donut-hp-fill"),
        donutHpLabel: document.getElementById("donut-hp-label"),
        floorName: document.getElementById("floor-name"),
        floorSub: document.getElementById("floor-sub"),
        gold: document.getElementById("gold"),
        levelBadge: document.getElementById("level-badge"),
        abilityBar: document.getElementById("ability-bar")
      };
      this._buildAbilities();
    }
    show() {
      this.el.hud.classList.remove("hidden");
    }
    _buildAbilities() {
      this.el.abilityBar.innerHTML = `
      <div class="ability" data-ab="attack"><span class="key">J</span><span class="icon">\u{1F5E1}\uFE0F</span><div class="cd hidden"></div></div>
      <div class="ability" data-ab="dodge"><span class="key">SPC</span><span class="icon">\u{1F4A8}</span><div class="cd hidden"></div></div>
      <div class="ability" data-ab="donut"><span class="key">K</span><span class="icon">\u{1F431}</span><div class="cd hidden"></div></div>
    `;
    }
    _cd(ab, frac) {
      const el = this.el.abilityBar.querySelector(`[data-ab="${ab}"] .cd`);
      if (!el) return;
      if (frac <= 0) {
        el.classList.add("hidden");
      } else {
        el.classList.remove("hidden");
        el.textContent = frac.toFixed(1);
      }
    }
    update() {
      const game = this.game;
      const p = game.player;
      const d = game.donut;
      const s = p.stats;
      const set = (fill, label, cur, max, suffix = "") => {
        fill.style.width = `${Math.max(0, Math.min(100, cur / max * 100))}%`;
        label.textContent = `${Math.ceil(cur)} / ${Math.round(max)}${suffix}`;
      };
      set(this.el.hpFill, this.el.hpLabel, p.hp, s.maxHp);
      set(this.el.stamFill, this.el.stamLabel, p.stamina, s.maxStamina);
      set(this.el.manaFill, this.el.manaLabel, p.mana, s.maxMana);
      this.el.xpFill.style.width = `${Math.min(100, p.xp / p.xpToNext * 100)}%`;
      this.el.xpLabel.textContent = `XP ${Math.round(p.xp)} / ${p.xpToNext}`;
      if (d.downed) {
        this.el.donutHpFill.style.width = `0%`;
        this.el.donutHpLabel.textContent = `DOWNED (${Math.ceil(d.reviveTimer)}s)`;
      } else {
        set(this.el.donutHpFill, this.el.donutHpLabel, d.hp, d.maxHp);
      }
      this.el.gold.textContent = `\u26C0 ${p.gold} gold`;
      this.el.levelBadge.textContent = `LVL ${p.level}${p.statPoints > 0 ? " \u25CF" : ""}`;
      this.el.floorName.textContent = game.dungeon.def.name;
      this.el.floorSub.textContent = game.dungeon.def.subtitle;
      this._cd("dodge", p.dodgeCd);
      this._cd("donut", game.world ? game.world.donutSpecialCd : 0);
    }
  };

  // src/ui/format.js
  var ATTR_NAME = Object.fromEntries(ATTRIBUTES.map((a) => [a.key, a.abbr]));
  var STAT_LABELS = {
    maxHp: "Max HP",
    maxStamina: "Max Stamina",
    maxMana: "Max Mana",
    manaRegen: "Mana Regen",
    moveSpeedPct: "Move Speed",
    attackSpeedPct: "Attack Speed",
    meleeDamage: "Melee Dmg",
    spellPower: "Spell Power",
    armor: "Armor",
    critChance: "Crit Chance",
    critMult: "Crit Mult",
    dodgeChance: "Dodge",
    lifesteal: "Lifesteal",
    thorns: "Thorns",
    lootLuck: "Loot Luck",
    goldFindPct: "Gold Find"
  };
  var PERCENT_KEYS = /* @__PURE__ */ new Set(["moveSpeedPct", "attackSpeedPct", "critChance", "dodgeChance", "lifesteal", "goldFindPct"]);
  function fmtStat(key, val) {
    const label = STAT_LABELS[key] || key;
    let v = val;
    let str;
    if (key === "critMult") str = `+${v}x`;
    else if (PERCENT_KEYS.has(key)) str = `${v > 0 ? "+" : ""}${v}%`;
    else str = `${v > 0 ? "+" : ""}${v}`;
    return `${str} ${label}`;
  }
  function rarityClass(rarity) {
    return `r-${rarity}`;
  }
  function rarityBorderClass(rarity) {
    return `b-${rarity}`;
  }
  function rarityName(rarity) {
    return RARITY_MAP[rarity]?.name || rarity;
  }
  function itemTooltipHTML(item) {
    let html = `<h4 class="${rarityClass(item.rarity)}">${item.name}</h4>`;
    html += `<div class="tt-rarity ${rarityClass(item.rarity)}">${rarityName(item.rarity)} \xB7 ${item.slot}</div>`;
    for (const [k, v] of Object.entries(item.attrs || {})) {
      html += `<div class="tt-stat">+${v} ${ATTR_NAME[k] || k}</div>`;
    }
    for (const [k, v] of Object.entries(item.stats || {})) {
      html += `<div class="tt-stat ${v < 0 ? "neg" : ""}">${fmtStat(k, v)}</div>`;
    }
    if (item.tags && item.tags.length) {
      html += `<div>` + item.tags.map((t) => `<span class="tt-tag">${t}</span>`).join("") + `</div>`;
    }
    if (item.flavor) html += `<div class="tt-flavor">${item.flavor}</div>`;
    return html;
  }

  // src/ui/menu.js
  var Menu = class {
    constructor(game) {
      this.game = game;
      this.screen = document.getElementById("menu-screen");
      this.tooltip = document.getElementById("item-tooltip");
      this.activeTab = "equip";
      this.open = false;
      this.panels = {
        equip: document.getElementById("tab-equip"),
        bag: document.getElementById("tab-bag"),
        char: document.getElementById("tab-char"),
        synergy: document.getElementById("tab-synergy")
      };
      document.querySelectorAll(".menu-tabs .tab").forEach((btn) => {
        btn.addEventListener("click", () => this.setTab(btn.dataset.tab));
      });
      document.getElementById("menu-close").addEventListener("click", () => this.close());
      this.screen.addEventListener("mousemove", (e) => this._moveTooltip(e));
    }
    toggle() {
      this.open ? this.close() : this.openMenu();
    }
    openMenu() {
      this.open = true;
      this.game.paused = true;
      this.screen.classList.remove("hidden");
      this.render();
    }
    close() {
      this.open = false;
      this.game.paused = false;
      this.screen.classList.add("hidden");
      this._hideTooltip();
    }
    setTab(tab) {
      this.activeTab = tab;
      document.querySelectorAll(".menu-tabs .tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
      Object.entries(this.panels).forEach(([k, el]) => el.classList.toggle("active", k === tab));
      this.render();
    }
    render() {
      if (!this.open) return;
      this.renderEquip();
      this.renderBag();
      this.renderChar();
      this.renderSynergy();
    }
    // ---------- Equipment tab ----------
    renderEquip() {
      const p = this.game.player;
      const slotsHtml = EQUIP_SLOTS.map((s) => {
        const it = p.equipment[s.key];
        if (it) {
          return `<div class="slot ${rarityBorderClass(it.rarity)}" data-slot="${s.key}" style="border-left:4px solid ${this._rc(it.rarity)}">
          <div class="slot-name">${s.name}</div>
          <div class="slot-item ${rarityClass(it.rarity)}">${it.name}</div>
        </div>`;
        }
        return `<div class="slot empty" data-slot="${s.key}">
        <div class="slot-name">${s.name}</div>
        <div class="slot-item">\u2014 empty \u2014</div>
      </div>`;
      }).join("");
      this.panels.equip.innerHTML = `
      <div class="equip-grid">
        <div>
          <h3 style="margin-bottom:8px">Equipment</h3>
          <div class="slots">${slotsHtml}</div>
          <p style="color:#9a9ab0;font-size:12px;margin-top:10px">Click a slot to unequip. Click an inventory item to equip it.</p>
        </div>
        <div>
          <h3 style="margin-bottom:8px">Combat Summary</h3>
          ${this._charSummaryHtml()}
        </div>
      </div>`;
      this.panels.equip.querySelectorAll(".slot").forEach((el) => {
        const key = el.dataset.slot;
        el.addEventListener("click", () => {
          p.unequip(key);
          this._afterChange();
        });
        el.addEventListener("mouseenter", (e) => {
          const it = p.equipment[key];
          if (it) this._showTooltip(itemTooltipHTML(it), e);
        });
        el.addEventListener("mouseleave", () => this._hideTooltip());
      });
    }
    _charSummaryHtml() {
      const s = this.game.player.stats;
      const rows = [
        ["Max HP", Math.round(s.maxHp)],
        ["Melee Damage", Math.round(s.meleeDamage)],
        ["Spell Power", Math.round(s.spellPower)],
        ["Armor", Math.round(s.armor)],
        ["Crit Chance", `${(s.critChance * 100).toFixed(0)}%`],
        ["Crit Mult", `${s.critMult.toFixed(2)}x`],
        ["Dodge", `${(s.dodgeChance * 100).toFixed(0)}%`],
        ["Move Speed", `${Math.round(s.moveSpeed * 100)}%`],
        ["Attack Speed", `${Math.round(s.attackSpeed * 100)}%`],
        ["Lifesteal", `${(s.lifesteal * 100).toFixed(0)}%`],
        ["Thorns", Math.round(s.thorns)],
        ["Loot Luck", s.lootLuck.toFixed(1)],
        ["Gold Find", `${Math.round(s.goldFind * 100)}%`]
      ];
      return `<div class="char-summary">${rows.map((r) => `<div class="stat-row"><span>${r[0]}</span><span class="sv">${r[1]}</span></div>`).join("")}</div>`;
    }
    // ---------- Inventory tab ----------
    renderBag() {
      const p = this.game.player;
      if (p.inventory.length === 0) {
        this.panels.bag.innerHTML = `<p class="empty-note">Your bag is empty. Kill things. Take their stuff.</p>`;
        return;
      }
      const items = [...p.inventory].sort((a, b) => b.rarityTier - a.rarityTier);
      const html = items.map((it) => `
      <div class="bag-item ${rarityBorderClass(it.rarity)}" data-uid="${it.uid}" style="border-left-color:${this._rc(it.rarity)}">
        <div class="bi-name ${rarityClass(it.rarity)}">${it.name}</div>
        <div class="bi-slot">${it.slot}</div>
        <div class="bi-rarity ${rarityClass(it.rarity)}">${rarityName(it.rarity)}</div>
      </div>`).join("");
      this.panels.bag.innerHTML = `
      <div style="margin-bottom:10px;color:#9a9ab0;font-size:12px">Click an item to equip. Right-click to drop. (${p.inventory.length} items)</div>
      <div class="bag-grid">${html}</div>`;
      this.panels.bag.querySelectorAll(".bag-item").forEach((el) => {
        const it = p.inventory.find((i) => i.uid === el.dataset.uid);
        el.addEventListener("click", () => {
          const slot = preferredSlot(it, p.equipment);
          if (slot) {
            p.equip(it, slot);
            this._afterChange();
          }
        });
        el.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          p.dropFromBag(it);
          this._afterChange();
          this.game.toast(`Dropped ${it.name}.`);
        });
        el.addEventListener("mouseenter", (e) => this._showTooltip(itemTooltipHTML(it), e));
        el.addEventListener("mouseleave", () => this._hideTooltip());
      });
    }
    // ---------- Character tab ----------
    renderChar() {
      const p = this.game.player;
      const attrRows = ATTRIBUTES.map((a) => {
        const base = p.baseAttr[a.key];
        const total = p.attr[a.key];
        const bonus = total - base;
        const plus = p.statPoints > 0 ? `<button class="plus" data-attr="${a.key}">+</button>` : "";
        return `<div class="lvl-stat">
        <span>${a.icon} <b>${a.name}</b> <span style="color:#9a9ab0">(${a.abbr})</span></span>
        <span>${total}${bonus > 0 ? ` <span class="stat-bonus">(${base}+${bonus})</span>` : ""} ${plus}</span>
      </div>`;
      }).join("");
      this.panels.char.innerHTML = `
      <h3>CARL \u2014 Level ${p.level} Primal</h3>
      <p style="color:#9a9ab0;font-size:12px;margin:4px 0 12px">
        ${p.statPoints > 0 ? `<b style="color:#ff7043">${p.statPoints} stat point(s) to spend!</b>` : "No unspent stat points."}
        &nbsp;\xB7&nbsp; Gold: <span style="color:#ffd54f">${p.gold}</span>
      </p>
      <div id="char-attrs" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${attrRows}</div>
      <div style="margin-top:16px">
        ${ATTRIBUTES.map((a) => `<div style="font-size:12px;color:#9a9ab0;margin:3px 0">${a.icon} <b>${a.abbr}</b> \u2014 ${a.desc}</div>`).join("")}
      </div>`;
      this.panels.char.querySelectorAll(".plus").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (this.game.player.spendStatPoint(btn.dataset.attr)) {
            this.game.donut.recompute();
            this._afterChange();
          }
        });
      });
    }
    // ---------- Synergy tab ----------
    renderSynergy() {
      const states = this.game.player.synergyState;
      const byId = Object.fromEntries(states.map((s) => [s.synergy.id, s]));
      const html = SYNERGIES.map((syn) => {
        const st = byId[syn.id];
        const active = st && st.activeTier;
        const tiers = syn.tiers.map((t) => {
          const has = st && st.have >= t.count;
          return `<div style="margin:3px 0;color:${has ? "#ffe14d" : "#9a9ab0"}">
          ${has ? "\u2713" : "\u25CB"} <b>${t.count}+ pieces:</b> ${t.text}</div>`;
        }).join("");
        return `<div class="synergy-card ${active ? "active" : "inactive"}">
        <h4>${syn.icon} ${syn.name} <span class="sc-prog">\u2014 ${st ? st.have : 0} matching item(s) equipped</span></h4>
        <div style="color:#cfcfe0;font-size:12px;margin:4px 0">${syn.desc}</div>
        ${tiers}
      </div>`;
      }).join("");
      this.panels.synergy.innerHTML = `
      <p style="color:#9a9ab0;font-size:12px;margin-bottom:10px">Equip items sharing a tag to unlock build-defining synergies. Mixing tags spreads you thin \u2014 commit to a theme.</p>
      ${html}`;
    }
    _afterChange() {
      this.game.donut.recompute();
      this.render();
      this.game.hud.update();
    }
    _rc(rarity) {
      return getComputedStyle(document.documentElement).getPropertyValue(`--r-${rarity}`).trim() || "#fff";
    }
    // ---------- tooltip ----------
    _showTooltip(html, e) {
      this.tooltip.innerHTML = html;
      this.tooltip.classList.remove("hidden");
      this._moveTooltip(e);
    }
    _moveTooltip(e) {
      if (this.tooltip.classList.contains("hidden")) return;
      const pad = 16;
      let x = e.clientX + pad, y = e.clientY + pad;
      const r = this.tooltip.getBoundingClientRect();
      if (x + r.width > window.innerWidth) x = e.clientX - r.width - pad;
      if (y + r.height > window.innerHeight) y = window.innerHeight - r.height - pad;
      this.tooltip.style.left = `${x}px`;
      this.tooltip.style.top = `${y}px`;
    }
    _hideTooltip() {
      this.tooltip.classList.add("hidden");
    }
  };

  // src/data/lore.js
  var INTRO_PAGES = [
    `It started, as these things do, with an argument about a cat.

Your ex left. She took the furniture, the dignity, and \u2014 somehow \u2014 left behind her grand-champion Persian show cat, PRINCESS DONUT.

You went outside in your boxers and a bathrobe to chase the little monster down.

Lucky you. Everyone still inside was not so lucky.`,
    `In an instant, every building on Earth simply... ceased.

Where the city stood, there is now a hole. A staircase. A doorway down into the DUNGEON.

A voice \u2014 vast, smug, and broadcast directly into your skull \u2014 welcomes you.

"CONGRATULATIONS, SURVIVOR. YOU ARE NOW A CRAWLER. THE CRAWL IS THE GALAXY'S MOST-WATCHED ENTERTAINMENT. PLEASE DIE INTERESTINGLY."`,
    `There are rules. There is loot. There are stats, and levels, and an absurd number of ways to be killed for someone else's amusement.

Princess Donut, against all reason, can talk now. She is NOT happy about the box she's being kept in, and she is even less happy about you.

But she's all you've got. And you're all she's got.

FLOOR ONE awaits. Try to make it to the stairs. Try to put on a good show.`
  ];
  var FLOOR_INTROS = {
    1: `FLOOR 1 \u2014 THE RUINED SUBLEVELS

The first floor is a maze of collapsed basements, sewers, and parking garages stitched together by the System into "neighborhoods."

Each neighborhood has a boss. Clear them, find the floor boss, and earn your way down.

The producers have notes. The producers always have notes.`,
    2: `FLOOR 2 \u2014 THE BOTTOM OF THE STAIRS

You survived Floor 1. Trillions cheered. Or jeered. It's hard to tell through the screaming.

The dungeon grows hungrier and meaner the deeper you go. Your gear from up top won't cut it for long.

Donut reminds you, repeatedly, that this is all your fault.`
  };
  function getFloorIntro(floor) {
    return FLOOR_INTROS[floor] || `FLOOR ${floor}

The dark presses closer. The monsters hit harder. Keep finding synergies, Crawler \u2014 raw stats alone won't save you now.`;
  }
  var SYSTEM_BARKS = [
    "The audience reaction is... mixed.",
    "A sponsor is considering you. Don't mess this up.",
    "Somewhere, a betting market just shifted.",
    "That kill was rated 7.8/10 by the highlight reel.",
    "Princess Donut demands you do better.",
    "A viewer has gifted you their thoughts and prayers. Useless, but appreciated.",
    "The Borant Corporation reminds you to smile for the cameras."
  ];

  // src/ui/overlays.js
  var Overlays = class {
    constructor(game) {
      this.game = game;
      this.logEl = document.getElementById("log");
      this.toastEl = document.getElementById("toast");
      this.levelupScreen = document.getElementById("levelup-screen");
      this.levelupStats = document.getElementById("levelup-stats");
      this.levelupPoints = document.getElementById("levelup-points");
      document.getElementById("levelup-done").addEventListener("click", () => this.closeLevelup());
      this.eventScreen = document.getElementById("event-screen");
      this.fcScreen = document.getElementById("floor-clear-screen");
      document.getElementById("fc-next").addEventListener("click", () => {
        this.fcScreen.classList.add("hidden");
        this.game.descend();
      });
      this.deathScreen = document.getElementById("death-screen");
      document.getElementById("death-restart").addEventListener("click", () => {
        this.deathScreen.classList.add("hidden");
        this.game.restart();
      });
      this.storyScreen = document.getElementById("story-screen");
      this.storyText = document.getElementById("story-text");
      this.storyNext = document.getElementById("story-next");
    }
    // ---------- message log ----------
    log(msg, kind = "") {
      const line = document.createElement("div");
      line.className = `log-line ${kind}`;
      line.textContent = msg;
      this.logEl.prepend(line);
      while (this.logEl.children.length > 7) this.logEl.lastChild.remove();
    }
    toast(msg, kind = "") {
      const t = document.createElement("div");
      t.className = `toast-item ${kind}`;
      t.textContent = msg;
      this.toastEl.appendChild(t);
      while (this.toastEl.children.length > 5) this.toastEl.firstChild.remove();
      setTimeout(() => {
        t.style.transition = "opacity 0.4s";
        t.style.opacity = "0";
        setTimeout(() => t.remove(), 400);
      }, 2200);
    }
    // ---------- story crawl ----------
    showStory(pages, onDone) {
      let i = 0;
      const render = () => {
        this.storyText.textContent = pages[i];
      };
      this.storyScreen.classList.remove("hidden");
      render();
      const handler = () => {
        i++;
        if (i >= pages.length) {
          this.storyScreen.classList.add("hidden");
          this.storyNext.removeEventListener("click", handler);
          onDone?.();
        } else render();
      };
      this.storyNext.removeEventListener("click", this._storyHandler || (() => {
      }));
      this._storyHandler = handler;
      this.storyNext.addEventListener("click", handler);
    }
    // ---------- level up ----------
    showLevelup(levels) {
      this.game.paused = true;
      this.levelupScreen.classList.remove("hidden");
      document.getElementById("levelup-sub").textContent = `Carl reached level ${this.game.player.level}! Allocate stat points to survive what's coming.`;
      this.renderLevelup();
    }
    renderLevelup() {
      const p = this.game.player;
      this.levelupPoints.textContent = `Stat Points Remaining: ${p.statPoints}`;
      this.levelupStats.innerHTML = ATTRIBUTES.map((a) => `
      <div class="lvl-stat">
        <span>${a.icon} <b>${a.abbr}</b> <span style="color:#9a9ab0">${a.name}</span></span>
        <span><b>${p.baseAttr[a.key]}</b> <button class="plus" data-attr="${a.key}" ${p.statPoints <= 0 ? "disabled" : ""}>+</button></span>
      </div>`).join("");
      this.levelupStats.querySelectorAll(".plus").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (p.spendStatPoint(btn.dataset.attr)) {
            this.game.donut.recompute();
            this.renderLevelup();
            this.game.hud.update();
          }
        });
      });
    }
    closeLevelup() {
      this.levelupScreen.classList.add("hidden");
      this.game.paused = false;
    }
    // ---------- whacky event ----------
    showEvent(event, ctx) {
      this.game.paused = true;
      this.eventScreen.classList.remove("hidden");
      document.getElementById("event-icon").textContent = event.icon || "\u2757";
      document.getElementById("event-title").textContent = event.title;
      document.getElementById("event-body").textContent = event.body;
      const choicesEl = document.getElementById("event-choices");
      choicesEl.innerHTML = "";
      event.choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.className = "event-choice";
        btn.innerHTML = `${choice.text}<span class="ec-hint">${choice.hint || ""}</span>`;
        btn.addEventListener("click", () => {
          try {
            choice.apply(ctx);
          } catch (e) {
            console.error(e);
          }
          this.eventScreen.classList.add("hidden");
          this.game.paused = false;
          this.game.hud.update();
          ctx.onResolved?.();
        });
        choicesEl.appendChild(btn);
      });
    }
    // ---------- floor clear ----------
    showFloorClear(floor, summaryHtml) {
      this.game.paused = true;
      this.fcScreen.classList.remove("hidden");
      document.getElementById("fc-title").textContent = `FLOOR ${floor} CLEARED!`;
      document.getElementById("fc-body").innerHTML = summaryHtml;
    }
    // ---------- death ----------
    showDeath(summaryHtml) {
      this.game.paused = true;
      this.deathScreen.classList.remove("hidden");
      document.getElementById("death-body").innerHTML = summaryHtml;
    }
  };

  // src/data/events-data.js
  var EVENTS = [
    {
      id: "bopca_deal",
      icon: "\u{1F9D1}\u200D\u2708\uFE0F",
      title: "A Bopca Security Guard",
      body: `A tiny, furious alien janitor in a security vest blocks your path. "BRIBE," it demands, brandishing a mop. "Bribe the Bopca, and the Bopca forgets it saw you cheating. Which you weren't. Yet."`,
      choices: [
        {
          text: "Pay the bribe (50 gold)",
          hint: "Lose gold, gain its goodwill (and a small charm).",
          apply: (c) => {
            if (c.player.gold >= 50) {
              c.helpers.addGold(-50);
              c.helpers.grantItem("gold_coin");
              c.helpers.toast("The Bopca winks. Disturbingly.");
            } else c.helpers.toast("You can't afford it. The Bopca sneers.");
          }
        },
        {
          text: "Refuse and shove past",
          hint: "Risk a mop to the shins.",
          apply: (c) => {
            if (c.rng.bool(0.5)) {
              c.helpers.damage(18);
              c.helpers.log("The Bopca mops the floor with you. Literally.", "danger");
            } else c.helpers.log("You slip past. The Bopca files a complaint with the universe.", "good");
          }
        },
        {
          text: "Offer it a job reference",
          hint: "Pure Charisma gamble.",
          apply: (c) => {
            if (c.rng.bool(0.4 + c.player.attr.charisma * 0.03)) {
              c.helpers.buffAttr("charisma", 1);
              c.helpers.log("The Bopca is moved to tears. +1 Charisma.", "good");
            } else c.helpers.toast('It does not understand "LinkedIn."');
          }
        }
      ]
    },
    {
      id: "vending",
      icon: "\u{1F964}",
      title: "A Humming Vending Machine",
      body: "A pristine vending machine stands in the rubble, glowing invitingly. The buttons are in a language made of screams. There is a coin slot.",
      choices: [
        {
          text: "Insert gold and pick a random row (20 gold)",
          hint: "Gamble for a snack buff or junk.",
          apply: (c) => {
            if (c.player.gold < 20) {
              c.helpers.toast("Insufficient funds. The machine judges you.");
              return;
            }
            c.helpers.addGold(-20);
            const roll = c.rng.next();
            if (roll < 0.45) {
              c.helpers.heal(40);
              c.helpers.log("A glowing energy drink! You feel restored. (+40 HP)", "good");
            } else if (roll < 0.7) {
              c.helpers.buffAttr("constitution", 1);
              c.helpers.log("Protein bar of the gods. +1 Constitution.", "good");
            } else if (roll < 0.9) {
              c.helpers.grantItem();
              c.helpers.log("Clunk. An item rolls out!", "loot");
            } else {
              c.helpers.damage(12);
              c.helpers.log("It dispenses a live wire. Ow. (-12 HP)", "danger");
            }
          }
        },
        {
          text: "Tip it over for free stuff",
          hint: "Classic move. Classic consequences.",
          apply: (c) => {
            if (c.rng.bool(0.45)) {
              c.helpers.addGold(35);
              c.helpers.log("Coins rain down! +35 gold.", "loot");
            } else {
              c.helpers.damage(25);
              c.helpers.log("It lands on you. The cameras LOVE it. (-25 HP)", "danger");
            }
          }
        },
        {
          text: "Leave it. This is obviously a trap.",
          hint: "Sensible. Boring, but sensible.",
          apply: (c) => c.helpers.toast("The audience boos your cowardice.")
        }
      ]
    },
    {
      id: "donut_tribute",
      icon: "\u{1F431}",
      title: "Princess Donut Demands Tribute",
      body: '"I have decided," announces Princess Donut from her box, "that I am underappreciated. You will give me something shiny, or I will withhold my considerable talents." She is, technically, your only ally.',
      choices: [
        {
          text: "Hand over 30 gold",
          hint: "Appease the queen. She fights harder.",
          apply: (c) => {
            if (c.player.gold >= 30) {
              c.helpers.addGold(-30);
              c.run.donutMorale = (c.run.donutMorale || 0) + 1;
              c.helpers.log("Donut purrs. She will now deign to help more enthusiastically.", "good");
            } else c.helpers.toast("Donut notes your poverty with disdain.");
          }
        },
        {
          text: "Give her a heartfelt compliment",
          hint: "Free. Charisma helps.",
          apply: (c) => {
            if (c.rng.bool(0.35 + c.player.attr.charisma * 0.04)) {
              c.helpers.buffAttr("charisma", 1);
              c.helpers.log('"Finally, some respect." +1 Charisma.', "good");
            } else c.helpers.toast('"Flattery. How predictable." She is unmoved.');
          }
        },
        {
          text: "Tell her to earn her keep",
          hint: "Bold. She remembers everything.",
          apply: (c) => {
            c.run.donutMorale = (c.run.donutMorale || 0) - 1;
            c.helpers.log("Donut is OFFENDED. The crowd gasps. This will come back to bite you.", "danger");
          }
        }
      ]
    },
    {
      id: "loot_goblin",
      icon: "\u{1F4B0}",
      title: "A Loot Goblin Sprints Past!",
      body: "A glittering goblin stuffed with treasure zips across the room, cackling. It drops coins as it runs. You have seconds.",
      choices: [
        {
          text: "Chase it down! (Dexterity check)",
          hint: "High risk, high shiny.",
          apply: (c) => {
            if (c.rng.bool(0.35 + c.player.attr.dexterity * 0.05)) {
              c.helpers.addGold(60);
              c.helpers.grantItem();
              c.helpers.log("You tackle it! Gold AND an item spill out!", "loot");
            } else {
              c.helpers.damage(10);
              c.helpers.toast("It escapes, kicking dust in your face.");
            }
          }
        },
        {
          text: "Grab the dropped coins",
          hint: "Safe, modest payout.",
          apply: (c) => {
            c.helpers.addGold(25);
            c.helpers.log("+25 gold from the trail.", "loot");
          }
        }
      ]
    },
    {
      id: "mysterious_box",
      icon: "\u{1F381}",
      title: "An Unattended Loot Box",
      body: "A bronze loot box sits on a pedestal, ticking faintly. The System loves a good loot box. The System also loves a good explosion.",
      choices: [
        {
          text: "Open it",
          hint: "Probably loot. Possibly regret.",
          apply: (c) => {
            if (c.rng.bool(0.78)) {
              c.helpers.grantItem();
              c.helpers.addGold(15);
              c.helpers.log("Loot box pops! An item and some gold!", "loot");
            } else {
              c.helpers.damage(20);
              c.helpers.log("Mimic! It bites your hand. (-20 HP)", "danger");
            }
          }
        },
        {
          text: "Kick it from a safe distance",
          hint: "Reduce risk, reduce reward.",
          apply: (c) => {
            if (c.rng.bool(0.9)) {
              c.helpers.addGold(20);
              c.helpers.log("It cracks open safely. +20 gold.", "loot");
            } else c.helpers.toast("It rolls away down a hole. Gone forever.");
          }
        }
      ]
    },
    {
      id: "fan_gift",
      icon: "\u{1F4E6}",
      title: "A Gift From a Fan",
      body: 'The System chimes: "A VIEWER ENJOYS YOUR WORK." A care package thuds down from above. Attached is a note covered in alien hearts.',
      choices: [
        {
          text: "Accept graciously (wave at camera)",
          hint: "Charisma builds. Free loot.",
          apply: (c) => {
            c.helpers.grantItem();
            c.helpers.buffAttr("charisma", 1);
            c.helpers.log("You blow a kiss to the void. +item, +1 Charisma.", "good");
          }
        },
        {
          text: "Tear it open immediately",
          hint: "Just the loot, thanks.",
          apply: (c) => {
            c.helpers.grantItem();
            if (c.rng.bool(0.5)) c.helpers.grantItem();
            c.helpers.log("You rip it open. Possibly two items!", "loot");
          }
        }
      ]
    },
    {
      id: "training_dummy",
      icon: "\u{1F94B}",
      title: "A Glitched Training Room",
      body: `You stumble into a half-rendered training room. A punching dummy flickers in and out of existence. Mordecai's voice crackles through a busted speaker: "Eh, good enough. Hit the thing. Learn something."`,
      choices: [
        {
          text: "Train your body",
          hint: "+1 Strength.",
          apply: (c) => {
            c.helpers.buffAttr("strength", 1);
            c.helpers.log("You drill combos until your arms ache. +1 Strength.", "good");
          }
        },
        {
          text: "Train your reflexes",
          hint: "+1 Dexterity.",
          apply: (c) => {
            c.helpers.buffAttr("dexterity", 1);
            c.helpers.log("You weave and dodge. +1 Dexterity.", "good");
          }
        },
        {
          text: "Meditate weirdly",
          hint: "+1 Wisdom.",
          apply: (c) => {
            c.helpers.buffAttr("wisdom", 1);
            c.helpers.log("You sit very still and feel the System hum. +1 Wisdom.", "good");
          }
        }
      ]
    },
    {
      id: "cursed_shrine",
      icon: "\u{1F5FF}",
      title: "A Cursed Shrine",
      body: "A leering stone idol offers a deal carved in glowing runes: POWER, FOR A PRICE. There is a slot for blood. There is always a slot for blood.",
      choices: [
        {
          text: "Offer blood for power",
          hint: "Lose max HP, gain a Luck and a stat point.",
          apply: (c) => {
            c.helpers.addMaxHpPenalty(15);
            c.helpers.buffAttr("luck", 1);
            c.helpers.addStatPoint(1);
            c.helpers.log("The idol drinks deep. -15 max HP, +1 Luck, +1 stat point.", "danger");
          }
        },
        {
          text: "Smash the creepy thing",
          hint: "No deal. Small chance of loot.",
          apply: (c) => {
            if (c.rng.bool(0.4)) {
              c.helpers.grantItem();
              c.helpers.log("It shatters, dropping something! The curse... probably didn't transfer.", "loot");
            } else c.helpers.toast("It crumbles to dust. Anticlimactic.");
          }
        }
      ]
    }
  ];

  // src/main.js
  var Game = class {
    constructor() {
      this.canvas = document.getElementById("game");
      this.input = new Input(this.canvas);
      this.renderer = new Renderer(this.canvas, this);
      this.hud = new HUD(this);
      this.menu = new Menu(this);
      this.overlays = new Overlays(this);
      this.paused = false;
      this.started = false;
      this.barkTimer = 0;
      this.loop = new Loop((dt) => this.update(dt), () => this.render());
      document.getElementById("start-btn").addEventListener("click", () => this.onStartPressed());
    }
    // ---------- lifecycle ----------
    onStartPressed() {
      document.getElementById("title-screen").classList.add("hidden");
      this.overlays.showStory(INTRO_PAGES, () => this.startRun(true));
    }
    startRun(firstTime = false) {
      this.seed = Date.now() >>> 0;
      this.rng = new RNG(this.seed);
      this.run = { kills: 0, itemsFound: 0, donutMorale: 0, floor: 1, startTime: performance.now() };
      this.player = new Player();
      this.donut = new Donut(this.player);
      this.setupFloor(1);
      this.hud.show();
      this.hud.update();
      this.started = true;
      this.loop.start();
      const hint = document.getElementById("controls-hint");
      if (hint) {
        hint.style.transition = "opacity 1s";
        clearTimeout(this._hintTimer);
        hint.style.opacity = "1";
        this._hintTimer = setTimeout(() => {
          hint.style.opacity = "0";
        }, 15e3);
      }
      this.overlays.showStory([getFloorIntro(1)], () => {
        this.paused = false;
      });
      this.paused = true;
    }
    restart() {
      this.startRun(false);
    }
    setupFloor(floor) {
      this.run.floor = floor;
      this.dungeon = generateFloor(floor, this.rng);
      this.world = new World(this);
      this.world.enterRoom(this.dungeon.startId, null);
      this.hud.update();
    }
    descend() {
      const next = this.dungeon.floor + 1;
      this.setupFloor(next);
      this.overlays.showStory([getFloorIntro(next)], () => {
        this.paused = false;
      });
      this.paused = true;
    }
    // ---------- main loop ----------
    update(dt) {
      if (this.started && this.input.actionPressed("inventory") && !this.anyBlockingOverlay()) {
        this.menu.toggle();
      }
      if (this.input.actionPressed("escape") && this.menu.open) this.menu.close();
      if (this.started && !this.paused) {
        this.world.update(dt);
        this.barkTimer -= dt;
        if (this.barkTimer <= 0) {
          this.barkTimer = 26 + this.rng.range(0, 18);
          if (this.world.enemies.length === 0) this.toast(this.rng.pick(SYSTEM_BARKS));
        }
        this.hud.update();
      }
      this.input.endFrame();
    }
    render() {
      this.renderer.render();
    }
    anyBlockingOverlay() {
      return [
        "levelup-screen",
        "event-screen",
        "floor-clear-screen",
        "death-screen",
        "story-screen",
        "title-screen"
      ].some((id) => !document.getElementById(id).classList.contains("hidden"));
    }
    // ---------- callbacks used by World ----------
    log(msg, kind) {
      this.overlays.log(msg, kind);
    }
    toast(msg, kind) {
      this.overlays.toast(msg, kind);
    }
    rollGoldFor(range) {
      return rollGold(this.rng, range, this.player.stats.goldFind);
    }
    dropLootAt(x, y, minTier = 0) {
      const lootLuck = this.player.stats.lootLuck;
      const item = minTier > 0 ? rollItemMinRarity(this.rng, this.dungeon.floor, lootLuck, minTier) : rollItem(this.rng, this.dungeon.floor, lootLuck);
      this.world.drops.push({
        id: Math.random(),
        kind: "item",
        x: x + this.rng.range(-12, 12),
        y: y + this.rng.range(-12, 12),
        r: 11,
        item
      });
    }
    pickupItem(item) {
      this.run.itemsFound++;
      const slot = preferredSlot(item, this.player.equipment);
      if (slot && !this.player.equipment[slot]) {
        this.player.equip(item, slot);
        this.donut.recompute();
        this.log(`Equipped ${item.name} (${rarityName(item.rarity)})`, "loot");
        this.toastLoot(item, "Equipped");
      } else {
        this.player.addItem(item);
        this.log(`Looted ${item.name} (${rarityName(item.rarity)}) \u2014 sent to bag`, "loot");
        this.toastLoot(item, "Looted");
      }
      if (item.rarityTier >= 4) this.toast(`\u2728 The crowd ROARS for your ${rarityName(item.rarity)} find!`);
      this.hud.update();
      if (this.menu.open) this.menu.render();
    }
    toastLoot(item, verb) {
      const color = getComputedStyle(document.documentElement).getPropertyValue(`--r-${item.rarity}`).trim();
      const t = document.createElement("div");
      t.className = "toast-item";
      t.style.borderLeftColor = color;
      t.innerHTML = `${verb}: <span style="color:${color}">${item.name}</span>`;
      const wrap = document.getElementById("toast");
      wrap.appendChild(t);
      while (wrap.children.length > 5) wrap.firstChild.remove();
      setTimeout(() => {
        t.style.transition = "opacity .4s";
        t.style.opacity = "0";
        setTimeout(() => t.remove(), 400);
      }, 2200);
    }
    openChest(x, y) {
      const n = this.rng.int(1, 2);
      for (let i = 0; i < n; i++) this.dropLootAt(x + this.rng.range(-30, 30), y + this.rng.range(-20, 20), 1);
      this.world.drops.push({ id: Math.random(), kind: "gold", x, y, r: 12, amount: this.rollGoldFor([10, 25]) });
      this.log("You crack open the chest!", "loot");
    }
    onRoomEntered(room) {
      updateBossLock(this.dungeon);
      if (room.type === "event" && !room.eventDone) {
        room.eventDone = true;
        setTimeout(() => this.triggerEvent(() => {
        }), 350);
      }
      if (room.type === "boss" && !room.cleared) {
        this.toast("\u26A0 The Floor Boss awakens. The galaxy holds its breath.");
      }
    }
    onRoomCleared(room) {
      updateBossLock(this.dungeon);
      if (room.type === "neighborhood") {
        this.toast("\u2605 Neighborhood Boss defeated!");
        const unlocked = updateBossLock(this.dungeon);
        if (unlocked) this.toast("The path to the FLOOR BOSS is now open.");
      } else if (room.type === "boss") {
        this.onFloorBossDefeated();
      } else if (room.type === "combat") {
        this.log("Room cleared. Doors unlocked.", "system");
      }
    }
    onBossKilled(e) {
      this.run.kills++;
    }
    onLevelUp(levels) {
      this.donut.recompute();
      this.overlays.showLevelup(levels);
    }
    onFloorBossDefeated() {
      const floor = this.dungeon.floor;
      const summary = `
      <p>You slew <b>${this.dungeon.def.name}</b>'s floor boss. The audience is on its feet. Sponsors are calling.</p>
      <div style="margin-top:12px;display:flex;gap:18px;justify-content:center;color:#ffd54f">
        <div>Level ${this.player.level}</div>
        <div>${this.player.gold} gold</div>
        <div>${this.run.itemsFound} items found</div>
      </div>
      <p style="margin-top:12px;color:#9a9ab0">The stairs to Floor ${floor + 1} grind open. It will be harder down there.</p>`;
      this.overlays.showFloorClear(floor, summary);
    }
    onPlayerDeath() {
      if (this.deadHandled) return;
      this.deadHandled = true;
      setTimeout(() => {
        this.deadHandled = false;
      }, 100);
      const t = ((performance.now() - this.run.startTime) / 1e3).toFixed(0);
      const summary = `
      <p>Carl has died on Floor ${this.dungeon.floor}. Somewhere, trillions of viewers groan in disappointment. Princess Donut is already auditioning a replacement.</p>
      <div style="margin-top:12px;color:#ffd54f">Reached Level ${this.player.level} \xB7 ${this.player.gold} gold \xB7 ${this.run.itemsFound} items \xB7 ${t}s survived</div>
      <p style="margin-top:10px;color:#9a9ab0">Tip: lean into a synergy. Raw stats won't carry you down the dark.</p>`;
      this.overlays.showDeath(summary);
    }
    // ---------- whacky events ----------
    triggerEvent(onResolved) {
      const event = this.rng.pick(EVENTS);
      const ctx = {
        player: this.player,
        run: this.run,
        rng: this.rng,
        onResolved,
        helpers: {
          heal: (n) => {
            this.player.hp = clamp(this.player.hp + n, 0, this.player.stats.maxHp);
          },
          damage: (n) => {
            this.player.hp -= n;
            if (this.player.hp <= 0) {
              this.player.hp = 0;
              this.onPlayerDeath();
            }
          },
          addGold: (n) => {
            this.player.gold = Math.max(0, this.player.gold + n);
          },
          grantItem: (templateId) => {
            const item = templateId ? makeItemById(templateId, this.rng, this.dungeon.floor) : rollItem(this.rng, this.dungeon.floor, this.player.stats.lootLuck);
            this.pickupItem(item);
          },
          addStatPoint: (n) => {
            this.player.statPoints += n;
          },
          buffAttr: (key, n) => {
            this.player.baseAttr[key] += n;
            this.player.recompute();
            this.donut.recompute();
          },
          addMaxHpPenalty: (n) => {
            this.player.maxHpPenalty += n;
            this.player.recompute();
            this.player.hp = Math.min(this.player.hp, this.player.stats.maxHp);
          },
          toast: (m) => this.toast(m),
          log: (m, k) => this.log(m, k)
        }
      };
      this.overlays.showEvent(event, ctx);
    }
  };
  window.addEventListener("DOMContentLoaded", () => {
    window.__game = new Game();
  });
})();
