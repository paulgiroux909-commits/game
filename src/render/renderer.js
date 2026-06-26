import { CONFIG } from '../core/config.js';
import { ARENA, DOOR_HALF, doorPos } from '../systems/combat.js';
import { rarityColor } from '../data/rarities.js';

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.minimap = document.getElementById('minimap');
    this.mmCtx = this.minimap.getContext('2d');
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
    // shadows + entities sorted by y
    this.drawShadow(ctx, world.donut.x, world.donut.y, CONFIG.DONUT_RADIUS);
    this.drawShadow(ctx, game.player.x, game.player.y, CONFIG.PLAYER_RADIUS);
    for (const e of world.enemies) this.drawShadow(ctx, e.x, e.y, e.r);

    const ents = [
      ...world.enemies.map(e => ({ y: e.y, draw: () => this.drawEnemy(ctx, e) })),
      { y: world.donut.y, draw: () => this.drawDonut(ctx, world.donut) },
      { y: game.player.y, draw: () => this.drawPlayer(ctx, game.player, world) },
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

  get world() { return this.game.world; }

  drawRoom(ctx, theme, world) {
    const room = world.currentRoom;
    // floor
    ctx.fillStyle = theme.floor;
    ctx.fillRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);

    // subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = ARENA.left; x <= ARENA.right; x += CONFIG.TILE) {
      ctx.beginPath(); ctx.moveTo(x, ARENA.top); ctx.lineTo(x, ARENA.bottom); ctx.stroke();
    }
    for (let y = ARENA.top; y <= ARENA.bottom; y += CONFIG.TILE) {
      ctx.beginPath(); ctx.moveTo(ARENA.left, y); ctx.lineTo(ARENA.right, y); ctx.stroke();
    }

    // walls (thick) with door gaps
    const t = 16;
    ctx.fillStyle = theme.wall;
    // top & bottom
    this.wallWithDoor(ctx, theme, 'N', room, t);
    this.wallWithDoor(ctx, theme, 'S', room, t);
    this.wallWithDoor(ctx, theme, 'W', room, t);
    this.wallWithDoor(ctx, theme, 'E', room, t);

    // accent inner border
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(ARENA.left + 1, ARENA.top + 1, ARENA.right - ARENA.left - 2, ARENA.bottom - ARENA.top - 2);
  }

  wallWithDoor(ctx, theme, dir, room, t) {
    const horizontal = dir === 'N' || dir === 'S';
    const hasDoor = !!room.doors[dir];
    const target = hasDoor ? this.game.dungeon.rooms.get(room.doors[dir]) : null;
    const locked = target && target.locked;
    ctx.fillStyle = theme.wall;
    if (horizontal) {
      const y = dir === 'N' ? ARENA.top - t : ARENA.bottom;
      const dp = doorPos(dir);
      if (hasDoor) {
        ctx.fillRect(ARENA.left - t, y, (dp.x - DOOR_HALF) - (ARENA.left - t), t);
        ctx.fillRect(dp.x + DOOR_HALF, y, (ARENA.right + t) - (dp.x + DOOR_HALF), t);
        this.drawDoor(ctx, dp.x, dir === 'N' ? ARENA.top : ARENA.bottom, horizontal, locked, room.cleared);
      } else {
        ctx.fillRect(ARENA.left - t, y, (ARENA.right + t) - (ARENA.left - t), t);
      }
    } else {
      const x = dir === 'W' ? ARENA.left - t : ARENA.right;
      const dp = doorPos(dir);
      if (hasDoor) {
        ctx.fillRect(x, ARENA.top - t, t, (dp.y - DOOR_HALF) - (ARENA.top - t));
        ctx.fillRect(x, dp.y + DOOR_HALF, t, (ARENA.bottom + t) - (dp.y + DOOR_HALF));
        this.drawDoor(ctx, dir === 'W' ? ARENA.left : ARENA.right, dp.y, horizontal, locked, room.cleared);
      } else {
        ctx.fillRect(x, ARENA.top - t, t, (ARENA.bottom + t) - (ARENA.top - t));
      }
    }
  }

  drawDoor(ctx, x, y, horizontal, locked, cleared) {
    ctx.save();
    const col = locked ? '#7a2230' : (cleared ? '#4caf50' : '#a07a2a');
    ctx.fillStyle = locked ? '#3a1820' : '#241c14';
    const len = DOOR_HALF * 2 - 8;
    if (horizontal) ctx.fillRect(x - len / 2, y - 7, len, 14);
    else ctx.fillRect(x - 7, y - len / 2, 14, len);
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    if (horizontal) ctx.strokeRect(x - len / 2, y - 7, len, 14);
    else ctx.strokeRect(x - 7, y - len / 2, 14, len);
    if (locked) {
      ctx.fillStyle = '#ff6b7a';
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🔒', x, y);
    }
    ctx.restore();
  }

  drawShadow(ctx, x, y, r) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.7, r * 0.9, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPlayer(ctx, p, world) {
    const r = CONFIG.PLAYER_RADIUS;
    ctx.save();
    if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) ctx.globalAlpha = 0.5;
    // bathrobe body
    ctx.fillStyle = '#caa15a';
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 3; ctx.stroke();
    // robe belt
    ctx.strokeStyle = '#6b4f22'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(p.x - r, p.y + 2); ctx.lineTo(p.x + r, p.y + 2); ctx.stroke();
    // head
    ctx.fillStyle = '#f0c89a';
    ctx.beginPath(); ctx.arc(p.x, p.y - r * 0.5, r * 0.55, 0, Math.PI * 2); ctx.fill();
    // facing eyes
    const fx = p.facing.x, fy = p.facing.y;
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath(); ctx.arc(p.x + fx * 5 - fy * 3, p.y - r * 0.5 + fy * 5 + fx * 3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + fx * 5 + fy * 3, p.y - r * 0.5 + fy * 5 - fx * 3, 2, 0, Math.PI * 2); ctx.fill();
    // weapon nub in facing dir
    ctx.strokeStyle = '#d8d8e0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x + fx * r, p.y + fy * r); ctx.lineTo(p.x + fx * (r + 12), p.y + fy * (r + 12)); ctx.stroke();
    ctx.restore();
  }

  drawDonut(ctx, d) {
    if (d.downed) {
      ctx.save(); ctx.globalAlpha = 0.25;
      ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ff8ad8';
      ctx.fillText('😾💤', d.x, d.y);
      ctx.restore();
      return;
    }
    const r = CONFIG.DONUT_RADIUS;
    ctx.save();
    // fluffy white cat body
    ctx.fillStyle = '#f4f0ff';
    ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); ctx.fill();
    // ears
    ctx.fillStyle = '#f4f0ff';
    ctx.beginPath(); ctx.moveTo(d.x - r * 0.6, d.y - r * 0.5); ctx.lineTo(d.x - r * 0.9, d.y - r * 1.3); ctx.lineTo(d.x - r * 0.1, d.y - r * 0.8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(d.x + r * 0.6, d.y - r * 0.5); ctx.lineTo(d.x + r * 0.9, d.y - r * 1.3); ctx.lineTo(d.x + r * 0.1, d.y - r * 0.8); ctx.fill();
    // tiara
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.moveTo(d.x - 5, d.y - r * 0.9); ctx.lineTo(d.x, d.y - r * 1.5); ctx.lineTo(d.x + 5, d.y - r * 0.9); ctx.fill();
    // eyes
    ctx.fillStyle = '#2a7a4a';
    ctx.beginPath(); ctx.arc(d.x - 3.5, d.y - 1, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(d.x + 3.5, d.y - 1, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawEnemy(ctx, e) {
    ctx.save();
    const flash = e.hitFlash > 0;
    ctx.fillStyle = flash ? '#ffffff' : e.color;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.stroke();

    // simple features
    ctx.fillStyle = '#1a1a22';
    const ex = 0.4 * e.r;
    ctx.beginPath(); ctx.arc(e.x - ex, e.y - 2, e.r * 0.13, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x + ex, e.y - 2, e.r * 0.13, 0, Math.PI * 2); ctx.fill();

    if (e.behavior === 'charger' && e.chargeState === 'windup') {
      ctx.strokeStyle = '#ff5a3c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4 + Math.sin(performance.now() / 60) * 2, 0, Math.PI * 2); ctx.stroke();
    }
    if (e.burnTime > 0) {
      ctx.fillStyle = 'rgba(255,138,60,0.35)';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, Math.PI * 2); ctx.fill();
    }
    if (e.slowTime > 0) {
      ctx.strokeStyle = 'rgba(110,180,255,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 3, 0, Math.PI * 2); ctx.stroke();
    }

    // hp bar
    const isBoss = e.tier !== 'normal';
    const bw = isBoss ? e.r * 2.2 : e.r * 1.8;
    const by = e.y - e.r - (isBoss ? 14 : 8);
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(e.x - bw / 2, by, bw, isBoss ? 6 : 4);
    ctx.fillStyle = isBoss ? '#ff4f6b' : '#e05050';
    ctx.fillRect(e.x - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), isBoss ? 6 : 4);

    if (isBoss) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Trebuchet MS';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
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
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6; ctx.lineCap = 'round';
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
      ctx.shadowColor = pr.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  drawParticles(ctx, world) {
    for (const p of world.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  drawFloaters(ctx, world) {
    ctx.save();
    ctx.textAlign = 'center';
    for (const f of world.floaters) {
      const a = Math.min(1, f.life / f.max);
      ctx.globalAlpha = a;
      let color = '#fff', size = 14, weight = 'bold';
      if (f.kind === 'crit') { color = '#ffd54f'; size = 20; }
      else if (f.kind === 'dmg') { color = '#ffffff'; }
      else if (f.kind === 'donut') { color = '#ff8ad8'; }
      else if (f.kind === 'playerhit') { color = '#ff6b6b'; size = 16; }
      else if (f.kind === 'gold') { color = '#ffd54f'; }
      else if (f.kind === 'dodge') { color = '#7bdcff'; }
      ctx.font = `${weight} ${size}px Trebuchet MS`;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  drawDrops(ctx, world) {
    for (const d of world.drops) {
      ctx.save();
      if (d.kind === 'chest') {
        ctx.fillStyle = '#8a5a2b';
        ctx.fillRect(d.x - 16, d.y - 12, 32, 22);
        ctx.fillStyle = '#caa15a';
        ctx.fillRect(d.x - 16, d.y - 12, 32, 7);
        ctx.fillStyle = '#ffd54f';
        ctx.fillRect(d.x - 3, d.y - 4, 6, 6);
        // prompt
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Trebuchet MS'; ctx.textAlign = 'center';
        ctx.fillText('[E] Open', d.x, d.y - 20);
      } else if (d.kind === 'gold') {
        ctx.fillStyle = '#ffd54f'; ctx.shadowColor = '#ffd54f'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
      } else if (d.kind === 'item') {
        const c = rarityColor(d.item.rarity);
        const bob = Math.sin(performance.now() / 300 + d.id) * 3;
        ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - 9 + bob); ctx.lineTo(d.x + 9, d.y + bob);
        ctx.lineTo(d.x, d.y + 9 + bob); ctx.lineTo(d.x - 9, d.y + bob);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  drawReticle(ctx, game) {
    const m = game.input.mouse;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m.x - 12, m.y); ctx.lineTo(m.x - 4, m.y);
    ctx.moveTo(m.x + 4, m.y); ctx.lineTo(m.x + 12, m.y);
    ctx.moveTo(m.x, m.y - 12); ctx.lineTo(m.x, m.y - 4);
    ctx.moveTo(m.x, m.y + 4); ctx.lineTo(m.x, m.y + 12);
    ctx.stroke();
    ctx.restore();
  }

  drawRoomBanner(ctx, world) {
    const room = world.currentRoom;
    let label = '';
    if (room.type === 'neighborhood') label = 'NEIGHBORHOOD BOSS';
    else if (room.type === 'boss') label = '⚠ FLOOR BOSS ⚠';
    else if (room.type === 'loot') label = 'TREASURE ROOM';
    else if (room.type === 'event') label = '???';
    else if (room.type === 'combat' && !room.cleared) label = 'HOSTILES';
    else if (room.cleared && room.type === 'combat') label = 'CLEARED';
    if (!label) return;
    ctx.save();
    ctx.font = 'bold 13px Trebuchet MS'; ctx.textAlign = 'center';
    ctx.fillStyle = room.type === 'boss' ? '#ff5a3c' : '#ffd54f';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
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
      minX = Math.min(minX, r.gridX); maxX = Math.max(maxX, r.gridX);
      minY = Math.min(minY, r.gridY); maxY = Math.max(maxY, r.gridY);
    }
    const cols = maxX - minX + 1, rowsN = maxY - minY + 1;
    const pad = 14;
    const cell = Math.min((W - pad * 2) / cols, (H - pad * 2) / rowsN);
    const box = cell * 0.66;
    const ox = (W - cols * cell) / 2;
    const oy = (H - rowsN * cell) / 2;

    const cur = game.world?.currentRoom;
    // connections
    ctx.strokeStyle = '#44445a'; ctx.lineWidth = 2;
    for (const r of rooms) {
      for (const tid of Object.values(r.doors)) {
        const t = dungeon.rooms.get(tid);
        const ax = ox + (r.gridX - minX) * cell + cell / 2;
        const ay = oy + (r.gridY - minY) * cell + cell / 2;
        const bx = ox + (t.gridX - minX) * cell + cell / 2;
        const by = oy + (t.gridY - minY) * cell + cell / 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
    }
    for (const r of rooms) {
      const x = ox + (r.gridX - minX) * cell + (cell - box) / 2;
      const y = oy + (r.gridY - minY) * cell + (cell - box) / 2;
      let col = '#2c2c40';
      if (r.visited) col = r.cleared ? '#3a5a3a' : '#5a3a3a';
      if (r.type === 'boss') col = r.cleared ? '#3a5a3a' : (r.locked ? '#4a2030' : '#7a2230');
      if (r.type === 'neighborhood' && !r.cleared) col = '#6a4a20';
      ctx.fillStyle = col;
      ctx.fillRect(x, y, box, box);
      // icons
      ctx.fillStyle = '#fff'; ctx.font = `${box * 0.6}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      let icon = '';
      if (r.type === 'boss') icon = '☠';
      else if (r.type === 'neighborhood') icon = '★';
      else if (r.type === 'loot') icon = r.chest && r.chest.opened ? '' : '◆';
      else if (r.type === 'event') icon = '?';
      else if (r.type === 'start') icon = '⌂';
      if (r.visited || r.type === 'boss') ctx.fillText(icon, x + box / 2, y + box / 2 + 1);

      if (cur && r.id === cur.id) {
        ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, box + 2, box + 2);
      }
    }
  }
}
