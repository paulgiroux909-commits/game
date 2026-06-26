# DCC Floor 1 H5 Roguelite Demo

Playable browser demo inspired by a dungeon-crawler run with Carl + Princess Donut.

## Quick start

1. From repo root:
   ```bash
   python3 -m http.server 8080
   ```
2. Open `http://localhost:8080` in a browser.
3. Move with `WASD` (or arrow keys). Carl auto-attacks nearby enemies and Donut assists from range.

## Current demo scope

- **Playable first-floor run** with:
  - 3 themed floor-1 neighborhoods
  - unique monster sets in each neighborhood
  - a **neighborhood boss** per neighborhood
  - a final **floor boss**
- **Loot system** with rarity-weighted drops:
  - Common: **62%**
  - Rare: **22%**
  - Ultra Rare: **10%**
  - Legendary: **5%**
  - Celestial: **1%**
- **Equipment slots**:
  - head, chest, hands, legs, boots, necklace
  - left hand, right hand
  - charm I, charm II
- **Inventory + equip UI** to inspect and manage found items.
- **Synergy system** with multi-item combo bonuses.
- **Level-up/stat allocation** system (Strength, Dexterity, Constitution, Intelligence, Charisma, Luck).
- **Difficulty scaling** based on elapsed time, kills, and player level.
- **Whacky random events** that alter combat and loot behavior during the run.

## Notes

- This is a first-pass vertical slice for Floor 1 intended to prove core game loop and systems.
- Progression to additional floors/story beats can be layered in by extending `FLOOR_DATA`, enemy pools, scripted story scenes, and item catalogs.
