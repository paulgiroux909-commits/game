# Dungeon Crawler Carl — Floor 1 Demo

A browser-based rogue-lite H5 game inspired by the **Dungeon Crawler Carl** series. Play as Carl with your companion Princess Donut, crawl through procedurally generated dungeon floors, collect loot, build synergies, and fight your way to the Floor Boss.

## Play

Serve the project root with any static file server, then open `index.html`:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Features (Floor 1 Demo)

- **Story-driven intro** following the book's premise — Carl and Donut enter the Tutorial Labyrinth
- **Procedural dungeon** with rooms, corridors, monsters, chests, and events
- **DCC stat system** — Strength, Constitution, Dexterity, Intelligence, Wisdom, Charisma, Luck, Explorer
- **Equipment slots** — Head, Chest, Hands, Legs, Boots, Necklace, Main/Off Hand, 3 Charms
- **8-tier loot rarity** — Common → Celestial with weighted drop rates
- **Item synergies** — Exterminator Kit, Donut's Entourage, Rat Slayer, Lucky Streak, and more
- **Boss types** — Neighborhood Boss (Rat King) and Floor Boss (Tutorial Warden)
- **Whacky events** — Sponsor breaks, suspicious fountains, gambling machines, rat merchants
- **Level-up system** — Allocate stat points on level up
- **Princess Donut** — Companion with Charm Offensive heal and Royal Hiss in combat
- **Inventory / Character / Codex menus**

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| E / Space | Interact / Attack |
| I | Inventory |
| C | Character sheet |
| L | Level up (when points available) |
| Esc | Close menus |

## Goal

Explore the Tutorial Labyrinth, defeat the **Rat King** (Neighborhood Boss), then defeat the **Tutorial Warden** (Floor Boss) to clear Floor 1.

## Tech

Vanilla HTML5 / CSS / JavaScript (ES modules). No build step required.
