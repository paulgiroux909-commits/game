import { getFloorDef } from '../data/monsters.js';

export const DIRS = {
  N: { dx: 0, dy: -1, opp: 'S' },
  S: { dx: 0, dy: 1, opp: 'N' },
  E: { dx: 1, dy: 0, opp: 'W' },
  W: { dx: -1, dy: 0, opp: 'E' },
};

let _roomCounter = 0;
function makeRoom(type, gx, gy) {
  return {
    id: `room_${_roomCounter++}`,
    type, gridX: gx, gridY: gy,
    doors: {},
    // combat-style rooms must be cleared before doors unlock; others are open
    cleared: !['combat', 'neighborhood', 'boss'].includes(type),
    visited: false,
    spawnDefs: [],   // monster ids to spawn on first entry
    spawned: false,
    locked: type === 'boss' || type === 'stairs',  // boss room starts locked
    chest: null,
    eventDone: false,
  };
}

function connect(a, b) {
  // determine direction from a to b
  for (const [dir, d] of Object.entries(DIRS)) {
    if (a.gridX + d.dx === b.gridX && a.gridY + d.dy === b.gridY) {
      a.doors[dir] = b.id;
      b.doors[d.opp] = a.id;
      return;
    }
  }
}

// Generate a floor. Layout: a central spine (start -> hub -> boss) flanked by
// neighborhoods, each a short path ending in a neighborhood (mini) boss.
export function generateFloor(floor, rng) {
  _roomCounter = 0;
  const def = getFloorDef(floor);
  const rooms = new Map();
  const reg = (r) => { rooms.set(r.id, r); return r; };

  // how many neighborhoods (2 on floor 1, +1 every couple floors)
  const nNeighborhoods = Math.min(4, 2 + Math.floor((floor - 1) / 2));

  const start = reg(makeRoom('start', 0, 0));
  const hub = reg(makeRoom('hub', 0, -1));
  const boss = reg(makeRoom('boss', 0, -2));
  connect(start, hub);
  connect(hub, boss);

  // pick neighborhood bosses (unique where possible)
  const bossPool = rng.shuffle(def.neighborhoodBosses);
  const neighborhoodBossIds = [];

  // place neighborhoods alternating left/right then up
  const layouts = [
    { col: -1, expand: 'W' },
    { col: 1, expand: 'E' },
    { col: -2, expand: 'W' },
    { col: 2, expand: 'E' },
  ];

  for (let i = 0; i < nNeighborhoods; i++) {
    const lay = layouts[i % layouts.length];
    const baseCol = lay.col;
    // entrance combat room adjacent to start (row 0) for first two, row -1 for extras
    const row = i < 2 ? 0 : -1;
    const entry = reg(makeRoom('combat', baseCol, row));
    // connect entry to spine (start or hub) if adjacent, else build a connector
    const spine = row === 0 ? start : hub;
    // ensure adjacency: place entry at col +/-1 of spine col(0)
    entry.gridX = spine.gridX + (lay.expand === 'E' ? 1 : -1);
    entry.gridY = spine.gridY;
    connect(spine, entry);

    // a second room (loot or event) further out / up
    const midType = rng.bool(0.5) ? 'loot' : 'event';
    const mid = reg(makeRoom(midType, entry.gridX, entry.gridY - 1));
    connect(entry, mid);

    // neighborhood boss beyond the mid room
    const nb = reg(makeRoom('neighborhood', mid.gridX + (lay.expand === 'E' ? 1 : -1), mid.gridY));
    connect(mid, nb);
    const bId = bossPool[i % bossPool.length];
    nb.bossId = bId;
    nb.spawnDefs = [bId];
    // a couple of adds with the mini-boss
    const adds = rng.int(1, 2);
    for (let k = 0; k < adds; k++) nb.spawnDefs.push(rng.pick(def.normals));
    neighborhoodBossIds.push(nb.id);

    // fill combat / loot / event rooms
    const enemyCount = rng.int(3, 4) + Math.floor(floor / 2);
    for (let k = 0; k < enemyCount; k++) entry.spawnDefs.push(rng.pick(def.normals));
    if (midType === 'loot') {
      mid.chest = { opened: false };
    }
  }

  // floor boss
  boss.bossId = def.floorBoss;
  boss.spawnDefs = [def.floorBoss];

  return {
    floor,
    def,
    rooms,
    startId: start.id,
    hubId: hub.id,
    bossId: boss.id,
    neighborhoodBossIds,
  };
}

// Boss room unlocks once every neighborhood boss room is cleared.
export function updateBossLock(dungeon) {
  const boss = dungeon.rooms.get(dungeon.bossId);
  if (!boss.locked) return false;
  const allClear = dungeon.neighborhoodBossIds.every(id => dungeon.rooms.get(id).cleared);
  if (allClear) { boss.locked = false; return true; }
  return false;
}

export function floorProgress(dungeon) {
  let cleared = 0, total = 0;
  for (const r of dungeon.rooms.values()) {
    if (r.type === 'combat' || r.type === 'neighborhood' || r.type === 'boss') {
      total++;
      if (r.cleared) cleared++;
    }
  }
  return { cleared, total };
}
