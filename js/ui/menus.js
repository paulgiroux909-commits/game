import { STAT_LABELS, SLOT_LABELS } from '../config.js';
import { formatItemDetail, formatItemStats } from '../systems/loot.js';
import { allocateStat } from '../systems/player.js';
import { ITEMS } from '../data/items.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.selectedItem = null;
    this.pendingStats = {};
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('btn-start').addEventListener('click', () => this.game.startGame());
    document.getElementById('btn-story-continue').addEventListener('click', () => this.game.advanceStory());
    document.getElementById('btn-levelup-confirm').addEventListener('click', () => this.game.confirmLevelUp());
    document.getElementById('btn-menu-close').addEventListener('click', () => this.game.closeMenu());
    document.getElementById('btn-restart').addEventListener('click', () => this.game.restart());
    document.getElementById('btn-loot-take').addEventListener('click', () => this.game.takeLoot());
    document.getElementById('btn-loot-equip').addEventListener('click', () => this.game.equipLoot());
    document.getElementById('btn-loot-leave').addEventListener('click', () => this.game.leaveLoot());

    document.querySelectorAll('.btn-combat').forEach(btn => {
      btn.addEventListener('click', () => this.game.combatAction(btn.dataset.action));
    });

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tabName}`));
  }

  showOverlay(id) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  hideAllOverlays() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
  }

  showStory(lines, index = 0) {
    this.showOverlay('story-screen');
    const textEl = document.getElementById('story-text');
    const line = lines[index];
    const speakerClass = line.speaker === 'system' ? 'system' : 'speaker';
    const speakerName = line.speaker === 'system' ? 'SYSTEM' :
      line.speaker === 'carl' ? 'Carl' :
      line.speaker === 'donut' ? 'Princess Donut' : line.speaker;
    textEl.innerHTML = `<span class="${speakerClass}">${speakerName}:</span> ${line.text}`;
  }

  updateHUD(player, donut, quests) {
    document.getElementById('hp-display').textContent = `HP: ${player.hp}/${player.maxHp}`;
    document.getElementById('level-display').textContent = `Lv ${player.level}`;

    const statsMini = document.getElementById('stats-mini');
    const stats = player.baseStats;
    statsMini.innerHTML = Object.entries(stats)
      .map(([k, v]) => `<div>${STAT_LABELS[k]?.slice(0, 3) || k}: <span style="color:var(--gold)">${v}</span></div>`)
      .join('');

    const donutStatus = document.getElementById('donut-status');
    donutStatus.innerHTML = `
      <div>🐱 ${donut.name}</div>
      <div>Loyalty: ${donut.loyalty}%</div>
      <div style="color:#ff88cc;font-size:10px">Charm: ${player.donutCooldown > 0 ? `CD ${player.donutCooldown}` : 'Ready'}</div>
    `;

    const synergyList = document.getElementById('synergy-list');
    if (player.activeSynergies?.length) {
      synergyList.innerHTML = player.activeSynergies
        .map(s => `<div class="synergy-tag" title="${s.description}">${s.name}</div>`)
        .join('');
    } else {
      synergyList.innerHTML = '<div style="color:var(--text-dim)">None active</div>';
    }

    const questLog = document.getElementById('quest-log');
    questLog.innerHTML = quests
      .map(q => `<div class="${q.completed ? '' : 'active-quest'}">${q.completed ? '✓' : '○'} ${q.text}</div>`)
      .join('');
  }

  showMessage(text, duration = 3000) {
    const el = document.getElementById('message-log');
    el.textContent = text;
    el.style.opacity = '1';
    clearTimeout(this.messageTimeout);
    this.messageTimeout = setTimeout(() => { el.style.opacity = '0'; }, duration);
  }

  showCombat(combat) {
    this.showOverlay('combat-screen');
    const monster = combat.monster;
    document.getElementById('combat-enemy-name').textContent = monster.sprite
      ? `${monster.sprite} ${monster.name}` : monster.name;
    this.updateCombatHP(combat);
    this.renderCombatLog(combat.log);
  }

  updateCombatHP(combat) {
    const player = combat.player;
    const monster = combat.monster;
    const pPct = (player.hp / player.maxHp) * 100;
    const mPct = (monster.currentHp / monster.maxHp) * 100;
    document.getElementById('combat-player-hp').style.width = `${pPct}%`;
    document.getElementById('combat-enemy-hp').style.width = `${mPct}%`;
    document.getElementById('combat-player-hp-text').textContent = `${player.hp}/${player.maxHp}`;
    document.getElementById('combat-enemy-hp-text').textContent = `${monster.currentHp}/${monster.maxHp}`;
  }

  renderCombatLog(log) {
    const el = document.getElementById('combat-log');
    el.innerHTML = log.slice(-8).map(l =>
      `<div class="${l.class || ''}">${l.text}</div>`
    ).join('');
    el.scrollTop = el.scrollHeight;
  }

  showEvent(event) {
    this.showOverlay('event-screen');
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-description').textContent = event.description;
    const choicesEl = document.getElementById('event-choices');
    choicesEl.innerHTML = event.choices.map((c, i) =>
      `<button class="event-choice" data-choice="${i}">${c.text}</button>`
    ).join('');
    choicesEl.querySelectorAll('.event-choice').forEach(btn => {
      btn.addEventListener('click', () => this.game.resolveEvent(parseInt(btn.dataset.choice)));
    });
  }

  showLevelUp(player) {
    this.showOverlay('levelup-screen');
    this.pendingStats = {};
    const points = player.statPoints;
    document.getElementById('points-remaining').textContent = points;
    this.renderStatAllocation(player, points);
  }

  renderStatAllocation(player, remaining) {
    const el = document.getElementById('stat-allocation');
    el.innerHTML = Object.entries(STAT_LABELS).map(([key, label]) => {
      const pending = this.pendingStats[key] || 0;
      const current = player.baseStats[key] + pending;
      return `<div class="stat-row">
        <span class="stat-name">${label}</span>
        <button class="stat-btn" data-stat="${key}" data-dir="-1" ${pending <= 0 ? 'disabled' : ''}>−</button>
        <span class="stat-value">${current}</span>
        <button class="stat-btn" data-stat="${key}" data-dir="1" ${remaining <= 0 ? 'disabled' : ''}>+</button>
      </div>`;
    }).join('');

    el.querySelectorAll('.stat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const stat = btn.dataset.stat;
        const dir = parseInt(btn.dataset.dir);
        if (dir > 0 && remaining > 0) {
          this.pendingStats[stat] = (this.pendingStats[stat] || 0) + 1;
          remaining--;
        } else if (dir < 0 && (this.pendingStats[stat] || 0) > 0) {
          this.pendingStats[stat]--;
          remaining++;
        }
        document.getElementById('points-remaining').textContent = remaining;
        document.getElementById('btn-levelup-confirm').disabled = remaining === player.statPoints;
        this.renderStatAllocation(player, remaining);
      });
    });

    document.getElementById('btn-levelup-confirm').disabled = remaining === player.statPoints;
  }

  getPendingStats() {
    return { ...this.pendingStats };
  }

  showMenu(player, tab = 'inventory') {
    this.showOverlay('menu-screen');
    this.switchTab(tab);
    this.renderInventory(player);
    this.renderEquipment(player);
    this.renderCharacterSheet(player);
    this.renderCodex(player);
  }

  renderInventory(player) {
    const grid = document.getElementById('inventory-grid');
    if (player.inventory.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-dim)">No items in inventory.</div>';
      return;
    }
    grid.innerHTML = player.inventory.map(item => {
      const equipped = Object.values(player.equipment).some(e => e?.uid === item.uid);
      return `<div class="item-card rarity-${item.rarity} ${equipped ? 'equipped' : ''}" data-uid="${item.uid}">
        <div class="item-name">${item.name}</div>
        <div class="item-slot">${SLOT_LABELS[item.slot] || item.slot}</div>
        <div class="item-stats">${formatItemStats(item)}</div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => {
        grid.querySelectorAll('.item-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const item = player.inventory.find(i => i.uid === card.dataset.uid);
        this.selectedItem = item;
        document.getElementById('item-detail').innerHTML = formatItemDetail(item) +
          `<br><button class="btn-primary" style="margin-top:8px" id="btn-equip-selected">Equip</button>`;
        document.getElementById('btn-equip-selected')?.addEventListener('click', () => {
          this.game.equipFromInventory(item);
        });
      });
    });
  }

  renderEquipment(player) {
    const layout = document.getElementById('equipment-layout');
    const slots = ['head', 'necklace', 'chest', 'mainHand', 'offHand', 'hands', 'legs', 'boots'];
    let html = slots.map(slot => {
      const item = player.equipment[slot];
      return `<div class="equip-slot ${slot} ${item ? 'filled' : ''} rarity-${item?.rarity || ''}" data-slot="${slot}">
        <div class="equip-slot-label">${SLOT_LABELS[slot]}</div>
        <div>${item ? item.name : '—'}</div>
      </div>`;
    }).join('');

    html += '<div class="charms-row">';
    for (const slot of ['charm1', 'charm2', 'charm3']) {
      const item = player.equipment[slot];
      html += `<div class="equip-slot ${item ? 'filled' : ''} rarity-${item?.rarity || ''}" data-slot="${slot}" style="flex:1">
        <div class="equip-slot-label">${SLOT_LABELS[slot]}</div>
        <div>${item ? item.name : '—'}</div>
      </div>`;
    }
    html += '</div>';

    layout.innerHTML = html;
    layout.querySelectorAll('.equip-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const s = slot.dataset.slot;
        const item = player.equipment[s];
        if (item) {
          this.game.unequipFromSlot(s);
        }
      });
    });
  }

  renderCharacterSheet(player) {
    const el = document.getElementById('character-sheet');
    const stats = player.baseStats;
    let html = `<h4 style="margin-bottom:8px">${player.name} — ${player.class} (${player.race})</h4>`;
    html += `<div>Level ${player.level} | XP: ${player.xp}/${player.xpToNext}</div>`;
    html += '<div class="stat-grid" style="margin-top:12px">';
    for (const [key, label] of Object.entries(STAT_LABELS)) {
      html += `<div class="stat-block"><span class="label">${label}</span><span class="value">${stats[key]}</span></div>`;
    }
    html += '</div>';
    html += `<div class="derived-stats">
      <div class="stat-block"><span class="label">Attack</span><span class="value">${player.attack}</span></div>
      <div class="stat-block"><span class="label">Defense</span><span class="value">${player.defense}</span></div>
      <div class="stat-block"><span class="label">Crit Chance</span><span class="value">${(player.critChance * 100).toFixed(1)}%</span></div>
      <div class="stat-block"><span class="label">Dodge</span><span class="value">${(player.dodgeChance * 100).toFixed(1)}%</span></div>
      <div class="stat-block"><span class="label">Kills</span><span class="value">${player.kills}</span></div>
      <div class="stat-block"><span class="label">Items Found</span><span class="value">${player.itemsFound}</span></div>
    </div>`;
    el.innerHTML = html;
  }

  renderCodex(player) {
    const el = document.getElementById('codex-content');
    const discovered = new Set();
    for (const item of [...player.inventory, ...Object.values(player.equipment)]) {
      if (item) discovered.add(item.id);
    }

    el.innerHTML = Object.values(ITEMS).map(item => {
      const found = discovered.has(item.id);
      return `<div class="codex-entry">
        <div class="name rarity-${item.rarity}" style="color:${found ? '' : 'var(--text-dim)'}">
          ${found ? item.name : '???'}
        </div>
        <div class="desc">${found ? item.description : 'Not yet discovered.'}</div>
      </div>`;
    }).join('');
  }

  showLoot(item) {
    this.showOverlay('loot-screen');
    document.getElementById('loot-item-display').innerHTML = formatItemDetail(item);
  }

  showEndScreen(won, player, stats) {
    this.showOverlay('end-screen');
    document.getElementById('end-title').textContent = won ? 'Floor 1 Cleared!' : 'You Died';
    document.getElementById('end-message').textContent = won
      ? 'Carl and Princess Donut survive to crawl another day. Floor 2 awaits...'
      : 'The dungeon claims another crawler. The audience boos. Donut demands a rematch.';
    document.getElementById('end-stats').innerHTML = `
      <div>Level: ${player.level}</div>
      <div>Kills: ${player.kills}</div>
      <div>Items Found: ${player.itemsFound}</div>
      <div>Time: ${stats.time}</div>
    `;
  }
}
