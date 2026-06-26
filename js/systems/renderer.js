import { TILE_SIZE, TILES, COLORS, MAP_WIDTH, MAP_HEIGHT } from '../config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
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

    ctx.fillStyle = '#080810';
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
            ctx.fillStyle = '#3a3a5a';
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
            ctx.font = '20px serif';
            ctx.fillText('⇡', sx + 6, sy + 24);
            break;
          case TILES.CHEST:
            ctx.fillStyle = COLORS.floor;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.chest;
            ctx.font = '18px serif';
            ctx.fillText('📦', sx + 4, sy + 24);
            break;
          case TILES.EVENT:
            ctx.fillStyle = COLORS.floor;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.event;
            ctx.font = '18px serif';
            ctx.fillText('❓', sx + 4, sy + 24);
            break;
          case TILES.BOSS:
            ctx.fillStyle = '#2a0a0a';
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.boss;
            ctx.font = '18px serif';
            ctx.fillText('💀', sx + 4, sy + 24);
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

      if (entity.type === 'monster') {
        ctx.font = '20px serif';
        ctx.fillText('👹', sx + 4, sy + 24);
      }
    }

    const psx = playerPos.x * TILE_SIZE - this.camera.x;
    const psy = playerPos.y * TILE_SIZE - this.camera.y;

    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(psx + TILE_SIZE / 2, psy + TILE_SIZE / 2, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('C', psx + TILE_SIZE / 2, psy + TILE_SIZE / 2 + 4);
    ctx.textAlign = 'left';

    if (donut?.active) {
      const pulse = Math.sin(this.animFrame * 0.1) * 2;
      ctx.font = `${14 + pulse}px serif`;
      ctx.fillText('🐱', psx + TILE_SIZE - 4, psy - 2);
    }

    this.renderFog(dungeon);
  }

  renderFog(dungeon) {
    const ctx = this.ctx;
    const { map, explored, playerPos } = dungeon;
    const visible = new Set();

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
}
