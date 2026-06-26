import { MAP_WIDTH, MAP_HEIGHT, TILES } from '../config.js';

export function generateFloor1() {
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
      if (room.x - 1 < other.x + other.w + 1 && room.x + room.w + 1 > other.x - 1 &&
          room.y - 1 < other.y + other.h + 1 && room.y + room.h + 1 > other.y - 1) {
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
    type: 'boss', id: 'tutorial_warden',
    x: bossRoom.cx, y: bossRoom.cy, defeated: false,
  });

  const neighborhoodRoom = rooms[Math.floor(rooms.length / 2)];
  map[neighborhoodRoom.cy][neighborhoodRoom.cx] = TILES.BOSS;
  entities.push({
    type: 'neighborhood_boss', id: 'rat_king',
    x: neighborhoodRoom.cx, y: neighborhoodRoom.cy, defeated: false,
  });

  const usedPositions = new Set([
    `${playerStart.x},${playerStart.y}`,
    `${bossRoom.cx},${bossRoom.cy}`,
    `${neighborhoodRoom.cx},${neighborhoodRoom.cy}`,
  ]);

  for (let i = 1; i < rooms.length - 1; i++) {
    const room = rooms[i];
    if (room === neighborhoodRoom) continue;

    if (Math.random() < 0.6) {
      const pos = findFreeTile(map, room, usedPositions);
      if (pos) {
        entities.push({ type: 'monster', x: pos.x, y: pos.y, defeated: false });
        usedPositions.add(`${pos.x},${pos.y}`);
      }
    }

    if (Math.random() < 0.35) {
      const pos = findFreeTile(map, room, usedPositions);
      if (pos) {
        map[pos.y][pos.x] = TILES.CHEST;
        entities.push({ type: 'chest', x: pos.x, y: pos.y, opened: false });
        usedPositions.add(`${pos.x},${pos.y}`);
      }
    }

    if (Math.random() < 0.2) {
      const pos = findFreeTile(map, room, usedPositions);
      if (pos) {
        map[pos.y][pos.x] = TILES.EVENT;
        entities.push({ type: 'event', x: pos.x, y: pos.y, triggered: false });
        usedPositions.add(`${pos.x},${pos.y}`);
      }
    }
  }

  const stairsRoom = rooms[rooms.length - 2] || bossRoom;
  const stairsPos = findFreeTile(map, stairsRoom, usedPositions);
  if (stairsPos) {
    map[stairsPos.y][stairsPos.x] = TILES.STAIRS;
    entities.push({ type: 'stairs', x: stairsPos.x, y: stairsPos.y, locked: true });
  }

  return {
    map,
    rooms,
    entities,
    playerPos: playerStart,
    explored: new Set([`${playerStart.x},${playerStart.y}`]),
    floor: 1,
    name: 'The Tutorial Labyrinth',
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

export function isWalkable(map, x, y) {
  if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return false;
  const tile = map[y][x];
  return tile === TILES.FLOOR || tile === TILES.DOOR || tile === TILES.ENTRANCE ||
         tile === TILES.STAIRS || tile === TILES.CHEST || tile === TILES.EVENT ||
         tile === TILES.BOSS;
}

export function getEntityAt(entities, x, y) {
  return entities.find(e => e.x === x && e.y === y && !e.defeated && !e.opened && !e.triggered);
}

export function getVisibleTiles(map, px, py, radius = 6) {
  const visible = new Set();
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = px + dx, y = py + dy;
      if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) continue;
      if (dx * dx + dy * dy > radius * radius) continue;
      if (hasLineOfSight(map, px, py, x, y)) {
        visible.add(`${x},${y}`);
      }
    }
  }
  return visible;
}

function hasLineOfSight(map, x0, y0, x1, y1) {
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    if (map[y0][x0] === TILES.WALL && (x0 !== x1 || y0 !== y1)) return false;
    if (x0 === x1 && y0 === y1) return true;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}

export function movePlayer(dungeon, dx, dy) {
  const nx = dungeon.playerPos.x + dx;
  const ny = dungeon.playerPos.y + dy;
  if (!isWalkable(dungeon.map, nx, ny)) return null;

  const entity = getEntityAt(dungeon.entities, nx, ny);
  if (entity) return { moved: false, entity, nx, ny };

  dungeon.playerPos = { x: nx, y: ny };
  dungeon.explored.add(`${nx},${ny}`);
  return { moved: true, entity: null };
}
