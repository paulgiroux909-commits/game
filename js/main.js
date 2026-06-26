import { createPlayer, createDonut, recalculatePlayer, addXp, equipItem, addToInventory, unequipItem, allocateStat, healPlayer, tickEffects } from './systems/player.js';
import { generateFloor1, movePlayer } from './systems/dungeon.js';
import { getMonster, spawnRandomMonster, scaleMonster } from './data/monsters.js';
import { createCombatState, playerAttack, playerSkill, donutAction, monsterAttack, tickMonsterEffects, tryFlee, bossSpecialAbility } from './systems/combat.js';
import { rollLoot, generateFloorLoot } from './systems/loot.js';
import { getRandomEvent } from './data/events.js';
import { FLOOR1_STORY, STORY_BEATS, QUESTS } from './data/story.js';
import { Renderer } from './systems/renderer.js';
import { UIManager } from './ui/menus.js';
import { getItem } from './data/items.js';

class Game {
  constructor() {
    this.state = 'title';
    this.player = null;
    this.donut = null;
    this.dungeon = null;
    this.combat = null;
    this.quests = [];
    this.storyLines = [];
    this.storyIndex = 0;
    this.pendingLoot = null;
    this.currentEvent = null;
    this.startTime = null;
    this.keys = {};

    this.canvas = document.getElementById('dungeon-canvas');
    this.renderer = new Renderer(this.canvas);
    this.ui = new UIManager(this);

    this.setupInput();
    this.renderer.resize();
    window.addEventListener('resize', () => this.renderer.resize());
    requestAnimationFrame(() => this.gameLoop());
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.handleKey(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  handleKey(key) {
    if (this.state === 'dungeon') {
      if (key === 'i') { this.ui.showMenu(this.player, 'inventory'); this.state = 'menu'; return; }
      if (key === 'c') { this.ui.showMenu(this.player, 'character'); this.state = 'menu'; return; }
      if (key === 'l' && this.player.statPoints > 0) { this.ui.showLevelUp(this.player); this.state = 'levelup'; return; }
      if (key === 'e' || key === ' ') { this.interact(); return; }
      if (key === 'escape') return;

      let dx = 0, dy = 0;
      if (key === 'w' || key === 'arrowup') dy = -1;
      if (key === 's' || key === 'arrowdown') dy = 1;
      if (key === 'a' || key === 'arrowleft') dx = -1;
      if (key === 'd' || key === 'arrowright') dx = 1;
      if (dx || dy) this.movePlayer(dx, dy);
    }

    if (this.state === 'menu' && key === 'escape') this.closeMenu();
    if (this.state === 'levelup' && key === 'escape') { this.state = 'dungeon'; this.ui.hideAllOverlays(); }
  }

  startGame() {
    this.player = createPlayer();
    this.donut = createDonut();
    recalculatePlayer(this.player);
    this.dungeon = generateFloor1();
    this.quests = QUESTS.map(q => ({ ...q }));
    this.storyLines = [...FLOOR1_STORY];
    this.storyIndex = 0;
    this.startTime = Date.now();
    this.state = 'story';
    this.ui.showStory(this.storyLines, 0);
    this.ui.updateHUD(this.player, this.donut, this.quests);
  }

  advanceStory() {
    this.storyIndex++;
    if (this.storyIndex < this.storyLines.length) {
      this.ui.showStory(this.storyLines, this.storyIndex);
    } else {
      this.state = 'dungeon';
      this.ui.hideAllOverlays();
      this.ui.showMessage('Use WASD to move. Press E to interact. Good luck, Crawler!');
    }
  }

  movePlayer(dx, dy) {
    const result = movePlayer(this.dungeon, dx, dy);
    if (!result) return;

    if (!result.moved && result.entity) {
      this.handleEntityEncounter(result.entity, result.nx, result.ny);
      return;
    }

    if (result.moved) {
      const tile = this.dungeon.map[this.dungeon.playerPos.y][this.dungeon.playerPos.x];
      if (tile === 4 || tile === 5 || tile === 6 || tile === 3) {
        const entity = this.dungeon.entities.find(e =>
          e.x === this.dungeon.playerPos.x && e.y === this.dungeon.playerPos.y
        );
        if (entity) this.handleEntityEncounter(entity);
      }
    }
  }

  interact() {
    const { x, y } = this.dungeon.playerPos;
    const neighbors = [[0,0],[0,-1],[0,1],[-1,0],[1,0]];
    for (const [dx, dy] of neighbors) {
      const entity = this.dungeon.entities.find(e =>
        e.x === x + dx && e.y === y + dy && !e.defeated && !e.opened && !e.triggered
      );
      if (entity) {
        this.handleEntityEncounter(entity, entity.x, entity.y);
        return;
      }
    }
    this.ui.showMessage('Nothing to interact with here.');
  }

  handleEntityEncounter(entity) {
    switch (entity.type) {
      case 'monster': {
        const monster = scaleMonster(spawnRandomMonster(), 1 + this.dungeon.floor * 0.1);
        this.startCombat(monster);
        break;
      }
      case 'chest':
        if (!entity.opened) {
          entity.opened = true;
          const item = rollLoot('floor1_chest', this.player.baseStats.luck * 0.05);
          this.pendingLoot = item;
          this.ui.showLoot(item);
          this.state = 'loot';
          this.completeQuest('loot');
          this.triggerStoryBeat('first_loot');
        }
        break;
      case 'event':
        if (!entity.triggered) {
          entity.triggered = true;
          this.currentEvent = getRandomEvent();
          this.state = 'event';
          this.ui.showEvent(this.currentEvent);
        }
        break;
      case 'neighborhood_boss':
        if (!entity.defeated) {
          this.triggerStoryBeat('neighborhood_boss_found');
          const monster = scaleMonster(getMonster(entity.id), 1.1);
          this.startCombat(monster, entity);
        }
        break;
      case 'boss':
        if (!entity.defeated) {
          this.triggerStoryBeat('floor_boss_found');
          const monster = scaleMonster(getMonster(entity.id), 1.2);
          this.startCombat(monster, entity);
        }
        break;
      case 'stairs': {
        const nb = this.dungeon.entities.find(e => e.type === 'neighborhood_boss');
        const fb = this.dungeon.entities.find(e => e.type === 'boss');
        if (nb && !nb.defeated) {
          this.ui.showMessage('The stairs are locked. Defeat the Rat King first.');
        } else if (fb && !fb.defeated) {
          this.ui.showMessage('The stairs are locked. Defeat the Tutorial Warden first.');
        } else {
          this.winGame();
        }
        break;
      }
    }
  }

  startCombat(monster, entity = null) {
    this.combat = createCombatState(this.player, monster);
    this.combat.entity = entity;
    if (monster.intro) {
      this.ui.showMessage(monster.intro, 5000);
    }
    this.state = 'combat';
    this.ui.showCombat(this.combat);
  }

  combatAction(action) {
    if (!this.combat || this.combat.won || this.combat.lost || this.combat.fled) return;

    switch (action) {
      case 'attack': playerAttack(this.combat, this.player); break;
      case 'skill': playerSkill(this.combat, this.player); break;
      case 'donut': donutAction(this.combat, this.player, this.donut); break;
      case 'flee':
        if (tryFlee(this.combat, this.player)) {
          this.endCombat();
          return;
        }
        break;
    }

    this.ui.updateCombatHP(this.combat);
    this.ui.renderCombatLog(this.combat.log);

    if (this.combat.won) {
      setTimeout(() => this.onCombatWin(), 800);
      return;
    }
    if (this.combat.lost) {
      setTimeout(() => this.onCombatLoss(), 800);
      return;
    }

    tickMonsterEffects(this.combat);
    this.ui.updateCombatHP(this.combat);
    this.ui.renderCombatLog(this.combat.log);

    if (this.combat.won) {
      setTimeout(() => this.onCombatWin(), 800);
      return;
    }

    if (this.combat.monster.bossType && Math.random() < 0.4) {
      bossSpecialAbility(this.combat, this.player);
    } else {
      monsterAttack(this.combat, this.player);
    }

    this.ui.updateCombatHP(this.combat);
    this.ui.renderCombatLog(this.combat.log);

    if (this.combat.lost) {
      setTimeout(() => this.onCombatLoss(), 800);
    }
  }

  onCombatWin() {
    const monster = this.combat.monster;
    this.player.kills++;

    const leveled = addXp(this.player, monster.xp);
    if (leveled) {
      this.state = 'levelup';
      this.ui.showLevelUp(this.player);
      this.triggerStoryBeat('level_up');
    }

    if (monster.bossType === 'neighborhood') {
      this.completeQuest('neighborhood_boss');
      this.triggerStoryBeat('neighborhood_boss_defeated');
      if (this.combat.entity) this.combat.entity.defeated = true;
    }
    if (monster.bossType === 'floor') {
      this.completeQuest('floor_boss');
      this.triggerStoryBeat('floor_boss_defeated');
      if (this.combat.entity) this.combat.entity.defeated = true;
      const stairs = this.dungeon.entities.find(e => e.type === 'stairs');
      if (stairs) stairs.locked = false;
    }

    if (this.player.kills === 1) this.triggerStoryBeat('first_kill');
    this.completeQuest('explore');

    const lootChance = monster.bossType ? 1.0 : 0.35 + (this.player.synergyEffects?.bonusLootChance || 0);
    if (Math.random() < lootChance) {
      const item = generateFloorLoot(1, monster.bossType === 'floor', monster.bossType === 'neighborhood');
      if (item) {
        this.pendingLoot = item;
        this.ui.showLoot(item);
        this.state = 'loot';
        this.ui.hideAllOverlays();
        this.ui.showOverlay('loot-screen');
        this.endCombat(false);
        return;
      }
    }

    this.endCombat();
  }

  onCombatLoss() {
    this.player.deaths++;
    this.state = 'gameover';
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    this.ui.showEndScreen(false, this.player, { time: `${mins}m ${secs}s` });
  }

  endCombat(hideOverlay = true) {
    if (hideOverlay) this.ui.hideAllOverlays();
    this.combat = null;
    if (this.state !== 'loot' && this.state !== 'levelup') this.state = 'dungeon';
    this.ui.updateHUD(this.player, this.donut, this.quests);
  }

  takeLoot() {
    if (this.pendingLoot) {
      addToInventory(this.player, this.pendingLoot);
      this.ui.showMessage(`Picked up ${this.pendingLoot.name}!`);
    }
    this.pendingLoot = null;
    this.ui.hideAllOverlays();
    if (this.player.statPoints > 0 && this.state !== 'levelup') {
      // stay in dungeon
    }
    this.state = this.player.statPoints > 0 ? 'levelup' : 'dungeon';
    if (this.state === 'levelup') this.ui.showLevelUp(this.player);
    this.ui.updateHUD(this.player, this.donut, this.quests);
  }

  equipLoot() {
    if (this.pendingLoot) {
      equipItem(this.player, this.pendingLoot);
      this.ui.showMessage(`Equipped ${this.pendingLoot.name}!`);
    }
    this.pendingLoot = null;
    this.ui.hideAllOverlays();
    this.state = this.player.statPoints > 0 ? 'levelup' : 'dungeon';
    if (this.state === 'levelup') this.ui.showLevelUp(this.player);
    this.ui.updateHUD(this.player, this.donut, this.quests);
  }

  leaveLoot() {
    this.pendingLoot = null;
    this.ui.hideAllOverlays();
    this.state = 'dungeon';
  }

  resolveEvent(choiceIndex) {
    const event = this.currentEvent;
    if (!event) return;
    const choice = event.choices[choiceIndex];
    const effect = choice.effect;

    if (effect.hp) {
      if (effect.hp > 0) healPlayer(this.player, effect.hp);
      else this.player.hp = Math.max(1, this.player.hp + effect.hp);
    }
    for (const stat of ['strength', 'constitution', 'dexterity', 'intelligence', 'wisdom', 'charisma', 'luck', 'explorer']) {
      if (effect[stat]) this.player.baseStats[stat] += effect[stat];
    }
    if (effect.loot) {
      const item = rollLoot(effect.loot);
      if (item) {
        this.pendingLoot = item;
        recalculatePlayer(this.player);
        this.ui.hideAllOverlays();
        this.ui.showLoot(item);
        this.state = 'loot';
        return;
      }
    }
    if (effect.spawnMonster) {
      const monster = spawnRandomMonster();
      this.ui.hideAllOverlays();
      this.startCombat(scaleMonster(monster));
      return;
    }
    if (effect.gamble) {
      if (Math.random() < 0.5) {
        const good = effect.gamble.good;
        if (good.hp) healPlayer(this.player, good.hp);
        for (const stat of Object.keys(good)) {
          if (stat !== 'hp' && good[stat]) this.player.baseStats[stat] += good[stat];
        }
        this.ui.showMessage('Fortune smiles upon you!');
      } else {
        const bad = effect.gamble.bad;
        if (bad.hp) this.player.hp = Math.max(1, this.player.hp + bad.hp);
        if (bad.effect === 'poison') {
          this.player.effects.push({ type: 'poison', damage: bad.damage, turns: bad.turns });
        }
        for (const stat of Object.keys(bad)) {
          if (!['hp', 'effect', 'damage', 'turns'].includes(stat) && bad[stat]) {
            this.player.baseStats[stat] += bad[stat];
          }
        }
        this.ui.showMessage('That didn\'t go well...');
      }
    }
    if (effect.luckGamble) {
      const roll = Math.random() + this.player.baseStats.luck * 0.02;
      if (roll > 0.8) {
        const item = rollLoot('floor1_boss', 2);
        this.pendingLoot = item;
        recalculatePlayer(this.player);
        this.ui.hideAllOverlays();
        this.ui.showLoot(item);
        this.state = 'loot';
        return;
      } else if (roll > 0.5) {
        healPlayer(this.player, 20);
        this.ui.showMessage('You win 20 HP!');
      } else {
        this.player.hp = Math.max(1, this.player.hp - 10);
        this.ui.showMessage('JACKSHIT! You lose 10 HP.');
      }
    }

    recalculatePlayer(this.player);
    this.currentEvent = null;
    this.ui.hideAllOverlays();
    this.state = 'dungeon';
    this.ui.updateHUD(this.player, this.donut, this.quests);
  }

  confirmLevelUp() {
    const pending = this.ui.getPendingStats();
    for (const [stat, amount] of Object.entries(pending)) {
      if (amount > 0) allocateStat(this.player, stat, amount);
    }
    this.ui.hideAllOverlays();
    this.state = 'dungeon';
    this.ui.updateHUD(this.player, this.donut, this.quests);
    this.ui.showMessage('Stats upgraded! You feel stronger.');
  }

  closeMenu() {
    this.ui.hideAllOverlays();
    this.state = 'dungeon';
  }

  equipFromInventory(item) {
    equipItem(this.player, item);
    this.ui.renderInventory(this.player);
    this.ui.renderEquipment(this.player);
    this.ui.updateHUD(this.player, this.donut, this.quests);
    this.ui.showMessage(`Equipped ${item.name}`);
  }

  unequipFromSlot(slot) {
    unequipItem(this.player, slot);
    this.ui.renderInventory(this.player);
    this.ui.renderEquipment(this.player);
    this.ui.updateHUD(this.player, this.donut, this.quests);
  }

  completeQuest(id) {
    const q = this.quests.find(q => q.id === id);
    if (q) q.completed = true;
  }

  triggerStoryBeat(beatId) {
    const beat = STORY_BEATS[beatId];
    if (beat) this.ui.showMessage(beat.text, 4000);
  }

  winGame() {
    this.completeQuest('survive');
    this.state = 'victory';
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    this.ui.showEndScreen(true, this.player, { time: `${mins}m ${secs}s` });
  }

  restart() {
    this.state = 'title';
    this.ui.showOverlay('title-screen');
    this.player = null;
    this.donut = null;
    this.dungeon = null;
    this.combat = null;
  }

  gameLoop() {
    if (this.state === 'dungeon' && this.dungeon) {
      this.renderer.render(this.dungeon, this.player, this.donut);
      if (this.player && this.player.hp / this.player.maxHp < 0.25) {
        if (Math.random() < 0.001) this.triggerStoryBeat('low_hp');
      }
    }
    requestAnimationFrame(() => this.gameLoop());
  }
}

function bootGame() {
  window.DCCGame = new Game();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
