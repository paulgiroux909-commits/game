import { CONFIG } from '../core/config.js';
import { MONSTERS } from '../data/monsters.js';
import { DIRS } from './dungeon.js';
import { dist, normalize, clamp, angleDiff } from '../core/util.js';

export const ARENA = { left: 70, top: 116, right: 890, bottom: 542 };
export const DOOR_HALF = 52;

function arenaCenter() {
  return { x: (ARENA.left + ARENA.right) / 2, y: (ARENA.top + ARENA.bottom) / 2 };
}

// Door gap center on a given wall side.
export function doorPos(dir) {
  const cx = (ARENA.left + ARENA.right) / 2;
  const cy = (ARENA.top + ARENA.bottom) / 2;
  switch (dir) {
    case 'N': return { x: cx, y: ARENA.top };
    case 'S': return { x: cx, y: ARENA.bottom };
    case 'E': return { x: ARENA.right, y: cy };
    case 'W': return { x: ARENA.left, y: cy };
  }
}

let _eid = 1;

export class World {
  constructor(game) {
    this.game = game; // holds player, donut, dungeon, rng, callbacks
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];        // items/gold on ground
    this.particles = [];
    this.floaters = [];     // floating combat text
    this.swings = [];       // melee swing visuals
    this.currentRoom = null;
    this.transitioning = false;
    this.enterCooldown = 0; // prevents instant re-trigger of doors/events
    this.shake = 0;
    this.donutSpecialCd = 0;
    this.donutSpecialMax = 8;
  }

  get player() { return this.game.player; }
  get donut() { return this.game.donut; }
  get rng() { return this.game.rng; }

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

    // position player near the door we came through (opposite side), else center
    const c = arenaCenter();
    if (fromDir) {
      const dp = doorPos(fromDir);
      const n = normalize(c.x - dp.x, c.y - dp.y);
      this.player.x = dp.x + n.x * 56;
      this.player.y = dp.y + n.y * 56;
    } else {
      this.player.x = c.x; this.player.y = c.y;
    }
    // place donut beside carl
    this.donut.x = this.player.x - 34;
    this.donut.y = this.player.y + 10;

    // spawn enemies on first entry
    if (!room.spawned && room.spawnDefs.length) {
      this.spawnRoomEnemies(room);
      room.spawned = true;
    }
    if (this.enemies.length > 0) room.cleared = false;

    // place chest
    if (room.chest && !room.chest.opened) {
      this.drops.push({
        id: _eid++, kind: 'chest', x: c.x, y: c.y - 40, r: 18, ref: room.chest,
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
      const isBoss = base.tier !== 'normal';
      // spread enemies around, bosses near center-top
      let x, y;
      if (isBoss) { x = c.x; y = ARENA.top + 90; }
      else {
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
      x, y,
      maxHp, hp: maxHp,
      damage: base.damage * dmgScale,
      speed: base.speed,
      xp: Math.round(base.xp * (1 + 0.15 * (floor - 1))),
      gold: base.gold,
      projectileSpeed: base.projectileSpeed || 0,
      range: base.range || 0,
      enrageHp: base.enrageHp || 0,
      // ai state
      atkCd: this.rng.range(0.4, 1.2),
      chargeState: 'idle',
      chargeTimer: 0,
      chargeDir: { x: 0, y: 0 },
      hitFlash: 0,
      burn: 0, burnTime: 0,
      slow: 0, slowTime: 0,
      enraged: false,
      contactCd: 0,
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

    // remove dead enemies (handled on death), check clear
    if (!this.currentRoom.cleared && this.enemies.length === 0 && this.currentRoom.spawned) {
      this.onRoomCleared();
    }

    this.handleDoors(dt);
    this.handleInteract(dt);
  }

  updatePlayer(dt) {
    const p = this.player;
    const input = this.game.input;

    // regen
    p.stamina = Math.min(p.stats.maxStamina, p.stamina + CONFIG.STAMINA_REGEN * dt);
    p.mana = Math.min(p.stats.maxMana, p.mana + p.stats.manaRegen * dt);

    if (p.attackCd > 0) p.attackCd -= dt;
    if (p.dodgeCd > 0) p.dodgeCd -= dt;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.frenzyTime > 0) p.frenzyTime -= dt;

    // aim toward mouse
    const m = input.mouse;
    let aim = normalize(m.x - p.x, m.y - p.y);
    if (!isFinite(aim.x)) aim = p.facing;
    p.facing = aim;

    // movement
    let mx = input.moveX, my = input.moveY;
    const mlen = Math.hypot(mx, my);
    if (mlen > 0) { mx /= mlen; my /= mlen; }

    let speed = p.speed;
    // frenzy buff
    if (p.frenzyTime > 0) speed *= 1.12;

    // dodge
    if (p.dodgeTime > 0) {
      p.dodgeTime -= dt;
      speed *= CONFIG.DODGE_SPEED_MULT;
      p.invuln = Math.max(p.invuln, 0.05);
    } else if (input.actionPressed('dodge') && p.dodgeCd <= 0 && p.stamina >= 18 && mlen > 0) {
      p.dodgeTime = CONFIG.DODGE_DURATION;
      p.dodgeCd = CONFIG.DODGE_COOLDOWN;
      p.stamina -= 18;
      p.invuln = CONFIG.DODGE_DURATION + 0.05;
      p.dodgeDir = { x: mx, y: my };
      this.spawnDust(p.x, p.y);
      // quicksilver refund
      if (p.procs.has('refund')) p.stamina += 8;
    }
    if (p.dodgeTime > 0 && p.dodgeDir) { mx = p.dodgeDir.x; my = p.dodgeDir.y; }

    p.x += mx * speed * dt;
    p.y += my * speed * dt;
    this.clampToArena(p, CONFIG.PLAYER_RADIUS);

    // attack
    const wantsAttack = input.action('attack') || input.mouse.down;
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
      if (angleDiff(ang, aimAng) > 1.1) continue; // ~126° cone
      this.damageEnemy(e, this.computeMeleeDamage(), 'melee');
      hitAny = true;
    }
    if (!hitAny) {
      // small whiff stamina cost discouraged; keep free
    }
  }

  computeMeleeDamage() {
    const p = this.player;
    let dmg = p.stats.meleeDamage;
    let crit = false;
    if (this.rng.next() < p.stats.critChance) { dmg *= p.stats.critMult; crit = true; }
    return { amount: dmg, crit, lifesteal: p.stats.lifesteal, source: 'player' };
  }

  damageEnemy(e, dmgObj, type) {
    let amount = dmgObj.amount;
    e.hp -= amount;
    e.hitFlash = 0.12;
    this.shake = Math.min(8, this.shake + (dmgObj.crit ? 4 : 1.5));
    this.spawnFloater(e.x, e.y - e.r, Math.round(amount), dmgObj.crit ? 'crit' : (type === 'donut' ? 'donut' : 'dmg'));
    this.spawnHitParticles(e.x, e.y, e.color);

    // synergy procs from player melee
    if (dmgObj.source === 'player') {
      const p = this.player;
      if (p.procs.has('burn1') || p.procs.has('burn2')) {
        e.burn = Math.max(e.burn, p.stats.spellPower * 0.25 + 2);
        e.burnTime = 3;
      }
      if (p.procs.has('chill')) { e.slow = 0.45; e.slowTime = 2; }
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
    // frenzy proc
    if (p.procs.has('frenzy')) p.frenzyTime = 2.5;
    if (p.procs.has('refund')) {} // handled on dodge

    // rewards
    const leveled = p.gainXp(e.xp);
    const gold = this.game.rollGoldFor(e.gold);
    p.gold += gold;
    this.game.log(`Slain: ${e.name}  (+${e.xp} XP, +${gold}g)`, 'good');

    // loot drop chance scales with tier
    let dropChance = e.tier === 'normal' ? 0.32 : 1.0;
    if (this.rng.next() < dropChance) {
      const minTier = e.tier === 'floor' ? 4 : e.tier === 'neighborhood' ? 2 : 0;
      this.game.dropLootAt(e.x, e.y, minTier);
    }
    // bosses drop extra gold pickup + sometimes a second item
    if (e.tier !== 'normal') {
      this.drops.push({ id: _eid++, kind: 'gold', x: e.x + 18, y: e.y, r: 12, amount: this.game.rollGoldFor(e.gold) });
      if (e.tier === 'floor') {
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
      if (d.reviveTimer <= 0) { d.downed = false; d.hp = d.maxHp * 0.5; this.game.log('Princess Donut struts back into the fight. "Miss me?"', 'good'); }
      return;
    }

    d.hp = Math.min(d.maxHp, d.hp + dt * 2.5); // slow passive regen
    if (d.atkCd > 0) d.atkCd -= dt;

    // follow carl, keep a little distance
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

    // attack nearest enemy
    if (this.enemies.length && d.atkCd <= 0) {
      let nearest = null, nd = Infinity;
      for (const e of this.enemies) {
        const ed = dist(d.x, d.y, e.x, e.y);
        if (ed < nd) { nd = ed; nearest = e; }
      }
      if (nearest && nd < 420) {
        const dmgMult = 1 + (p.donutBonus.dmg || 0) + (this.game.run.donutMorale || 0) * 0.15;
        const base = 6 + p.attr.charisma * 1.6 + p.level * 0.8;
        const n = normalize(nearest.x - d.x, nearest.y - d.y);
        this.projectiles.push({
          id: _eid++, friendly: true, kind: 'donut',
          x: d.x, y: d.y, vx: n.x * 360, vy: n.y * 360, r: 6,
          dmg: base * dmgMult, life: 1.6, color: '#ff8ad8',
        });
        const cdr = 1 - clamp(p.donutBonus.cdr || 0, 0, 0.6);
        d.atkCd = 1.15 * cdr;
      }
    }
  }

  // K ability: Donut's "High-Pitched Yowl" — radial burst that damages & chills.
  handleDonutSpecial() {
    if (!this.game.input.actionPressed('donut')) return;
    if (this.donutSpecialCd > 0 || this.donut.downed) {
      if (this.donut.downed) this.game.toast('Donut is downed and unavailable!');
      return;
    }
    this.donutSpecialCd = this.donutSpecialMax;
    const d = this.donut;
    const p = this.player;
    const dmgMult = 1 + (p.donutBonus.dmg || 0);
    const base = (14 + p.attr.charisma * 3 + p.level * 1.5) * dmgMult;
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.projectiles.push({
        id: _eid++, friendly: true, kind: 'donut',
        x: d.x, y: d.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, r: 6,
        dmg: base, life: 0.9, color: '#ffb3ec',
      });
    }
    // chill all nearby
    for (const e of this.enemies) {
      if (dist(e.x, e.y, d.x, d.y) < 220) { e.slow = 0.5; e.slowTime = 2.5; }
    }
    this.spawnDeathBurst(d.x, d.y, '#ff8ad8');
    this.shake = 6;
    this.game.log('Princess Donut unleashes a galaxy-shattering YOWL!', 'good');
  }

  hurtDonut(amount) {
    const d = this.donut;
    if (d.downed) return;
    d.hp -= amount;
    this.spawnFloater(d.x, d.y - 14, Math.round(amount), 'dmg');
    if (d.hp <= 0) {
      d.hp = 0; d.downed = true; d.reviveTimer = 9;
      this.game.log('Princess Donut has been downed! She retreats to her box, furious.', 'danger');
    }
  }

  // ---- Enemy AI ----
  updateEnemy(e, dt) {
    const p = this.player;
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.contactCd > 0) e.contactCd -= dt;

    // status effects
    if (e.burnTime > 0) {
      e.burnTime -= dt;
      e.hp -= e.burn * dt;
      if (this.rng.next() < dt * 6) this.spawnEmber(e.x, e.y);
      if (e.hp <= 0) { this.killEnemy(e); return; }
    }
    let speedMult = 1;
    if (e.slowTime > 0) { e.slowTime -= dt; speedMult *= (1 - e.slow); }

    // enrage
    if (e.enrageHp && !e.enraged && e.hp / e.maxHp <= e.enrageHp) {
      e.enraged = true; e.speed *= 1.4; e.damage *= 1.3;
      this.game.log(`${e.name} ENRAGES!`, 'danger');
      this.shake = 10;
    }

    const toP = { x: p.x - e.x, y: p.y - e.y };
    const dP = Math.hypot(toP.x, toP.y) || 1;
    const dir = { x: toP.x / dP, y: toP.y / dP };

    if (e.behavior === 'chaser' || e.behavior === 'bruiser') {
      const sp = e.speed * speedMult * (e.behavior === 'bruiser' ? 1 : 1);
      e.x += dir.x * sp * dt;
      e.y += dir.y * sp * dt;
      this.tryContactDamage(e, dP);
    } else if (e.behavior === 'shooter') {
      // keep distance, shoot
      const ideal = e.range * 0.7;
      if (dP < ideal - 40) { e.x -= dir.x * e.speed * speedMult * dt; e.y -= dir.y * e.speed * speedMult * dt; }
      else if (dP > ideal + 40) { e.x += dir.x * e.speed * 0.7 * speedMult * dt; e.y += dir.y * e.speed * 0.7 * speedMult * dt; }
      e.atkCd -= dt;
      if (e.atkCd <= 0 && dP < e.range) {
        e.atkCd = this.rng.range(1.1, 1.9);
        // target either carl or donut
        const target = (!this.donut.downed && this.rng.bool(0.3)) ? this.donut : p;
        const n = normalize(target.x - e.x, target.y - e.y);
        this.projectiles.push({
          id: _eid++, friendly: false, kind: 'enemy',
          x: e.x, y: e.y, vx: n.x * e.projectileSpeed, vy: n.y * e.projectileSpeed,
          r: 7, dmg: e.damage, life: 3, color: '#ff5a3c',
        });
      }
      this.tryContactDamage(e, dP);
    } else if (e.behavior === 'charger') {
      if (e.chargeState === 'idle') {
        // approach until in range, then wind up
        if (dP > 220) { e.x += dir.x * e.speed * 0.6 * speedMult * dt; e.y += dir.y * e.speed * 0.6 * speedMult * dt; }
        else { e.chargeState = 'windup'; e.chargeTimer = 0.5; e.chargeDir = dir; }
      } else if (e.chargeState === 'windup') {
        e.chargeTimer -= dt;
        e.chargeDir = dir; // track a bit
        if (e.chargeTimer <= 0) { e.chargeState = 'charge'; e.chargeTimer = 0.45; }
      } else if (e.chargeState === 'charge') {
        e.chargeTimer -= dt;
        e.x += e.chargeDir.x * e.speed * 2.4 * dt;
        e.y += e.chargeDir.y * e.speed * 2.4 * dt;
        this.tryContactDamage(e, dP, 1.5);
        const hitWall = this.clampToArena(e, e.r);
        if (e.chargeTimer <= 0 || hitWall) { e.chargeState = 'rest'; e.chargeTimer = 0.7; }
      } else if (e.chargeState === 'rest') {
        e.chargeTimer -= dt;
        if (e.chargeTimer <= 0) e.chargeState = 'idle';
      }
    }

    this.clampToArena(e, e.r);

    // separate overlapping enemies a little
    // (kept light for perf)
  }

  tryContactDamage(e, dP, mult = 1) {
    const p = this.player;
    if (dP <= e.r + CONFIG.PLAYER_RADIUS && e.contactCd <= 0) {
      this.hitPlayer(e.damage * mult);
      e.contactCd = 0.7;
    }
    // donut contact
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
      this.spawnFloater(p.x, p.y - 24, 'DODGE', 'dodge');
      return;
    }
    let dmg = Math.max(1, rawDamage - p.stats.armor);
    p.hp -= dmg;
    p.invuln = 0.35;
    this.spawnFloater(p.x, p.y - 24, Math.round(dmg), 'playerhit');
    this.shake = 9;
    // thorns
    if (p.stats.thorns > 0) {
      for (const e of this.enemies) {
        if (dist(e.x, e.y, p.x, p.y) < e.r + CONFIG.PLAYER_RADIUS + 6) {
          this.damageEnemy(e, { amount: p.stats.thorns, crit: false, source: 'thorns' }, 'thorns');
        }
      }
    }
    if (p.hp <= 0) { p.hp = 0; this.game.onPlayerDeath?.(); }
  }

  // ---- projectiles ----
  updateProjectiles(dt) {
    const p = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      pr.life -= dt;
      let dead = pr.life <= 0;
      if (pr.x < ARENA.left || pr.x > ARENA.right || pr.y < ARENA.top || pr.y > ARENA.bottom) dead = true;

      if (!dead && pr.friendly) {
        for (const e of this.enemies) {
          if (dist(pr.x, pr.y, e.x, e.y) <= e.r + pr.r) {
            let dmg = pr.dmg;
            let crit = false;
            if (this.rng.next() < p.stats.critChance * 0.6) { dmg *= p.stats.critMult; crit = true; }
            this.damageEnemy(e, { amount: dmg, crit, source: pr.kind === 'donut' ? 'donut' : 'player', lifesteal: 0 }, pr.kind === 'donut' ? 'donut' : 'spell');
            dead = true; break;
          }
        }
      } else if (!dead && !pr.friendly) {
        if (p.invuln <= 0 && dist(pr.x, pr.y, p.x, p.y) <= CONFIG.PLAYER_RADIUS + pr.r) {
          this.hitPlayer(pr.dmg); dead = true;
        } else if (!this.donut.downed && dist(pr.x, pr.y, this.donut.x, this.donut.y) <= CONFIG.DONUT_RADIUS + pr.r) {
          this.hurtDonut(pr.dmg * 0.6); dead = true;
        }
      }
      if (dead) { this.spawnHitParticles(pr.x, pr.y, pr.color); this.projectiles.splice(i, 1); }
    }
  }

  // ---- drops & pickups ----
  updateDrops(dt) {
    const p = this.player;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (d.kind === 'chest') continue; // opened via interact
      // magnet pickups toward player
      const dd = dist(d.x, d.y, p.x, p.y);
      if (dd < 120) {
        const n = normalize(p.x - d.x, p.y - d.y);
        d.x += n.x * 180 * dt; d.y += n.y * 180 * dt;
      }
      if (dd < CONFIG.PLAYER_RADIUS + d.r) {
        if (d.kind === 'gold') {
          p.gold += d.amount;
          this.spawnFloater(p.x, p.y - 30, `+${d.amount}g`, 'gold');
        } else if (d.kind === 'item') {
          this.game.pickupItem(d.item);
        }
        this.drops.splice(i, 1);
      }
    }
  }

  handleInteract(dt) {
    if (this.enterCooldown > 0) return;
    const p = this.player;
    // chest interaction
    for (const d of this.drops) {
      if (d.kind !== 'chest' || d.ref.opened) continue;
      if (dist(d.x, d.y, p.x, p.y) < CONFIG.PLAYER_RADIUS + d.r + 14) {
        if (this.game.input.actionPressed('interact')) {
          d.ref.opened = true;
          this.game.openChest(d.x, d.y);
          d._remove = true;
        }
      }
    }
    this.drops = this.drops.filter(d => !d._remove);
  }

  // ---- doors / transitions ----
  handleDoors(dt) {
    if (this.enterCooldown > 0 || this.transitioning) return;
    const room = this.currentRoom;
    if (!room.cleared) return; // locked in until cleared
    const p = this.player;
    for (const [dir, targetId] of Object.entries(room.doors)) {
      const dp = doorPos(dir);
      const target = this.game.dungeon.rooms.get(targetId);
      if (dist(p.x, p.y, dp.x, dp.y) < DOOR_HALF - 6) {
        if (target.locked) {
          this.game.toast('🔒 Sealed. Clear all neighborhood bosses first.');
          // nudge player back inward
          const c = arenaCenter();
          const n = normalize(c.x - p.x, c.y - p.y);
          p.x += n.x * 30; p.y += n.y * 30;
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
    if (o.x < ARENA.left + r) { o.x = ARENA.left + r; hit = true; }
    if (o.x > ARENA.right - r) { o.x = ARENA.right - r; hit = true; }
    if (o.y < ARENA.top + r) { o.y = ARENA.top + r; hit = true; }
    if (o.y > ARENA.bottom - r) { o.y = ARENA.bottom - r; hit = true; }
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
    this.particles.push({ x: x + this.rng.range(-8, 8), y: y + this.rng.range(-8, 8), vx: this.rng.range(-10, 10), vy: -this.rng.range(20, 50), life: 0.4, max: 0.4, color: '#ff8a3c', r: this.rng.range(1.5, 3) });
  }
  spawnDust(x, y) {
    for (let i = 0; i < 8; i++) {
      const a = this.rng.range(0, Math.PI * 2), s = this.rng.range(20, 80);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3, max: 0.3, color: '#cfcfe0', r: this.rng.range(1, 3) });
    }
  }
  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.9; p.vy *= 0.9;
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
      f.y -= 36 * dt; f.life -= dt;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
  }
  updateSwings(dt) {
    for (let i = this.swings.length - 1; i >= 0; i--) {
      this.swings[i].t += dt;
      if (this.swings[i].t >= this.swings[i].dur) this.swings.splice(i, 1);
    }
  }
}
