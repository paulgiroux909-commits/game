# Dungeon Crawler Carl — *The Crawl* (H5 Roguelite Demo)

A browser-based (HTML5) action **roguelite** inspired by the **Dungeon Crawler Carl** book series
by Matt Dinniman. Play as **Carl** (in a bathrobe and flip-flops) alongside his companion
**Princess Donut**, descending floor by floor through a deadly, livestreamed alien dungeon —
fighting unique monsters, collecting loot with deep rarity & synergy systems, leveling up,
and surviving whacky System events.

> Unofficial, non-commercial fan homage. All names/events are an original parody tribute.

This is a **playable Floor 1 demo** with all the core systems requested wired up end-to-end.

---

## ▶️ How to run

The game uses native ES modules, so it must be served over HTTP (opening `index.html`
directly via `file://` won't load the modules).

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Any static file server works (e.g. `npx serve`, VS Code Live Server, nginx). No build step,
no dependencies, no bundler — pure HTML/CSS/JS.

---

## 🎮 Controls

| Action | Keys |
| --- | --- |
| Move | `W` `A` `S` `D` or Arrow Keys |
| Attack (aims at cursor) | `J` or **Left Click** |
| Dodge roll (i-frames, costs stamina) | `Space` |
| Princess Donut Special (AoE yowl) | `K` |
| Open Inventory / Character menu | `I` or `Tab` |
| Interact (open chests) | `E` |

Aim is toward your mouse cursor. Touch is partially supported (tap to attack/aim).

---

## 🧩 Systems implemented

### Roguelite floor progression
- Each **floor** is a procedurally generated map of connected rooms shown on a live **minimap**.
- Floors are divided into **neighborhoods**, each ending in a **Neighborhood Boss** (mini-boss).
- Clear **all** neighborhood bosses to unlock the **Floor Boss** room.
- Defeat the Floor Boss to take the stairs down to the next, harder floor.
- Combat rooms **lock their doors** until cleared — no skipping the fights.

### Difficulty scaling
- Enemy HP and damage scale **per floor** (and mildly with your level), so raw stats alone
  won't carry you. You must find **meaningful, synergistic gear** to keep descending.

### Loot & rarity
- 7 rarity tiers with drop chance **inversely proportional to rarity**:
  **Common → Uncommon → Rare → Epic → Legendary → Mythic → Celestial**.
- **Luck** and **Charisma** bias drops toward higher rarities; deeper floors raise the floor.
- Higher rarities scale item magnitudes and roll **bonus affixes**.

### Equipment slots
Full paper-doll with: **Head, Necklace, Chest, Hands, Right Hand, Left Hand, Legs, Boots,
Ring, Charm I, Charm II**. Weapons go in hands, off-hands/shields in the left hand, etc.

### Item synergies (build-defining)
Items carry **tags** (`fire`, `ice`, `blood`, `arcane`, `tank`, `luck`, `primal`, `crawler`,
`feline`, `swift`, `glass`, `showman`, …). Equipping multiple items of the same tag unlocks
tiered **synergies** with real mechanical payoffs and procs, e.g.:
- **Inferno** 🔥 — attacks apply *Burn* damage-over-time.
- **Deep Freeze** ❄️ — hits *chill/slow* enemies.
- **Bloodthirst** 🩸 — lifesteal + kill-frenzy.
- **Juggernaut** 🛡️ — armor, HP, thorns.
- **Quicksilver** 💨 — move/dodge/attack speed.
- **Feline Bond** 🐱 — Princess Donut hits harder and acts faster.
- **Glass Cannon** 💥 — huge damage, fragile HP.
- ...and more. Mixing tags spreads you thin — **commit to a theme.**

### Stats & leveling (DCC attributes)
Seven core attributes: **Strength, Constitution, Dexterity, Intelligence, Wisdom, Charisma,
Luck**, each feeding derived combat stats (HP, melee/spell damage, armor, crit, dodge, speed,
loot luck, gold find, etc.). On **level up** you choose which attributes to raise.

### Princess Donut companion
Donut follows Carl, auto-attacks enemies, has her own health bar, can be **downed** and
revives over time, and has a commandable **special**. Synergies and events affect her power
and morale.

### Whacky events
Random System events with branching choices in the spirit of the books — bribing a Bopca
security guard, suspicious vending machines, loot goblins, cursed shrines, fan care-packages,
glitched training rooms, and Donut demanding tribute.

### Story
An opening crawl and per-floor intros echo the premise of the series (original prose), plus
ambient "System" barks during play.

### UI / Menu
- Live **HUD**: HP / Stamina / Mana / XP bars, Donut's health, floor info, gold, level badge,
  ability cooldowns, message log, minimap.
- **Menu** (`I`/`Tab`) with four tabs:
  - **Equipment** — paper-doll + live combat summary.
  - **Inventory** — click to equip, right-click to drop, hover for tooltips.
  - **Character** — attributes, descriptions, spend stat points.
  - **Synergies** — see every set, what's active, and what's next.

---

## 🗂️ Project structure

```
index.html              # shell, HUD/overlay DOM
styles/main.css         # all styling
src/
  core/                 # rng, input, loop, event bus, config, math utils
  data/                 # stats, rarities, items, monsters, floors, synergies, events, lore
  systems/              # player, donut, equipment, loot, progression, dungeon gen, combat/world
  render/               # canvas renderer (procedural sprites, particles, minimap)
  ui/                   # hud, inventory/character menu, overlays, formatting
  main.js               # Game orchestrator that wires it all together
```

All graphics are drawn procedurally on `<canvas>` — no image assets required.

---

## 🧪 Verified

Booted and exercised in a headless Chrome smoke test (see notes below): boot, story flow,
combat, room clearing, neighborhood-boss → floor-boss gating, floor descent, level-up,
inventory/equip/synergy, whacky events, and the loot rarity distribution — **with zero
runtime/console errors**.

---

## 🗺️ Roadmap / next steps

This demo intentionally focuses on Floor 1 with the full systems in place. Natural extensions:
- More monsters, neighborhood bosses, and unique floor bosses per book/floor.
- Safe-room hub (the "Desperado Club"), shops, and crafting.
- Classes/professions, skill trees, and active abilities/spells.
- More item templates, set bonuses, and cursed/blessed affixes.
- Save/continue, run seeds, and meta-progression between deaths.
- Audio, juicier VFX, and mobile virtual joystick controls.
