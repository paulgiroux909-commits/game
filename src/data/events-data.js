// Whacky events in the spirit of the DCC series. Each event has choices.
// A choice's `apply(ctx)` runs an effect. ctx = { player, run, ui, rng, helpers }
// helpers: { heal, damage, addGold, grantItem, addStatPoint, buffAttr, toast, log }

export const EVENTS = [
  {
    id: 'bopca_deal', icon: '🧑‍✈️', title: 'A Bopca Security Guard',
    body: 'A tiny, furious alien janitor in a security vest blocks your path. "BRIBE," it demands, brandishing a mop. "Bribe the Bopca, and the Bopca forgets it saw you cheating. Which you weren\'t. Yet."',
    choices: [
      { text: 'Pay the bribe (50 gold)', hint: 'Lose gold, gain its goodwill (and a small charm).',
        apply: (c) => {
          if (c.player.gold >= 50) { c.helpers.addGold(-50); c.helpers.grantItem('gold_coin'); c.helpers.toast('The Bopca winks. Disturbingly.'); }
          else c.helpers.toast('You can\'t afford it. The Bopca sneers.');
        } },
      { text: 'Refuse and shove past', hint: 'Risk a mop to the shins.',
        apply: (c) => {
          if (c.rng.bool(0.5)) { c.helpers.damage(18); c.helpers.log('The Bopca mops the floor with you. Literally.', 'danger'); }
          else c.helpers.log('You slip past. The Bopca files a complaint with the universe.', 'good');
        } },
      { text: 'Offer it a job reference', hint: 'Pure Charisma gamble.',
        apply: (c) => {
          if (c.rng.bool(0.4 + c.player.attr.charisma * 0.03)) { c.helpers.buffAttr('charisma', 1); c.helpers.log('The Bopca is moved to tears. +1 Charisma.', 'good'); }
          else c.helpers.toast('It does not understand "LinkedIn."');
        } },
    ],
  },
  {
    id: 'vending', icon: '🥤', title: 'A Humming Vending Machine',
    body: 'A pristine vending machine stands in the rubble, glowing invitingly. The buttons are in a language made of screams. There is a coin slot.',
    choices: [
      { text: 'Insert gold and pick a random row (20 gold)', hint: 'Gamble for a snack buff or junk.',
        apply: (c) => {
          if (c.player.gold < 20) { c.helpers.toast('Insufficient funds. The machine judges you.'); return; }
          c.helpers.addGold(-20);
          const roll = c.rng.next();
          if (roll < 0.45) { c.helpers.heal(40); c.helpers.log('A glowing energy drink! You feel restored. (+40 HP)', 'good'); }
          else if (roll < 0.7) { c.helpers.buffAttr('constitution', 1); c.helpers.log('Protein bar of the gods. +1 Constitution.', 'good'); }
          else if (roll < 0.9) { c.helpers.grantItem(); c.helpers.log('Clunk. An item rolls out!', 'loot'); }
          else { c.helpers.damage(12); c.helpers.log('It dispenses a live wire. Ow. (-12 HP)', 'danger'); }
        } },
      { text: 'Tip it over for free stuff', hint: 'Classic move. Classic consequences.',
        apply: (c) => {
          if (c.rng.bool(0.45)) { c.helpers.addGold(35); c.helpers.log('Coins rain down! +35 gold.', 'loot'); }
          else { c.helpers.damage(25); c.helpers.log('It lands on you. The cameras LOVE it. (-25 HP)', 'danger'); }
        } },
      { text: 'Leave it. This is obviously a trap.', hint: 'Sensible. Boring, but sensible.',
        apply: (c) => c.helpers.toast('The audience boos your cowardice.') },
    ],
  },
  {
    id: 'donut_tribute', icon: '🐱', title: 'Princess Donut Demands Tribute',
    body: '"I have decided," announces Princess Donut from her box, "that I am underappreciated. You will give me something shiny, or I will withhold my considerable talents." She is, technically, your only ally.',
    choices: [
      { text: 'Hand over 30 gold', hint: 'Appease the queen. She fights harder.',
        apply: (c) => {
          if (c.player.gold >= 30) { c.helpers.addGold(-30); c.run.donutMorale = (c.run.donutMorale || 0) + 1; c.helpers.log('Donut purrs. She will now deign to help more enthusiastically.', 'good'); }
          else c.helpers.toast('Donut notes your poverty with disdain.');
        } },
      { text: 'Give her a heartfelt compliment', hint: 'Free. Charisma helps.',
        apply: (c) => {
          if (c.rng.bool(0.35 + c.player.attr.charisma * 0.04)) { c.helpers.buffAttr('charisma', 1); c.helpers.log('"Finally, some respect." +1 Charisma.', 'good'); }
          else c.helpers.toast('"Flattery. How predictable." She is unmoved.');
        } },
      { text: 'Tell her to earn her keep', hint: 'Bold. She remembers everything.',
        apply: (c) => { c.run.donutMorale = (c.run.donutMorale || 0) - 1; c.helpers.log('Donut is OFFENDED. The crowd gasps. This will come back to bite you.', 'danger'); } },
    ],
  },
  {
    id: 'loot_goblin', icon: '💰', title: 'A Loot Goblin Sprints Past!',
    body: 'A glittering goblin stuffed with treasure zips across the room, cackling. It drops coins as it runs. You have seconds.',
    choices: [
      { text: 'Chase it down! (Dexterity check)', hint: 'High risk, high shiny.',
        apply: (c) => {
          if (c.rng.bool(0.35 + c.player.attr.dexterity * 0.05)) { c.helpers.addGold(60); c.helpers.grantItem(); c.helpers.log('You tackle it! Gold AND an item spill out!', 'loot'); }
          else { c.helpers.damage(10); c.helpers.toast('It escapes, kicking dust in your face.'); }
        } },
      { text: 'Grab the dropped coins', hint: 'Safe, modest payout.',
        apply: (c) => { c.helpers.addGold(25); c.helpers.log('+25 gold from the trail.', 'loot'); } },
    ],
  },
  {
    id: 'mysterious_box', icon: '🎁', title: 'An Unattended Loot Box',
    body: 'A bronze loot box sits on a pedestal, ticking faintly. The System loves a good loot box. The System also loves a good explosion.',
    choices: [
      { text: 'Open it', hint: 'Probably loot. Possibly regret.',
        apply: (c) => {
          if (c.rng.bool(0.78)) { c.helpers.grantItem(); c.helpers.addGold(15); c.helpers.log('Loot box pops! An item and some gold!', 'loot'); }
          else { c.helpers.damage(20); c.helpers.log('Mimic! It bites your hand. (-20 HP)', 'danger'); }
        } },
      { text: 'Kick it from a safe distance', hint: 'Reduce risk, reduce reward.',
        apply: (c) => {
          if (c.rng.bool(0.9)) { c.helpers.addGold(20); c.helpers.log('It cracks open safely. +20 gold.', 'loot'); }
          else c.helpers.toast('It rolls away down a hole. Gone forever.');
        } },
    ],
  },
  {
    id: 'fan_gift', icon: '📦', title: 'A Gift From a Fan',
    body: 'The System chimes: "A VIEWER ENJOYS YOUR WORK." A care package thuds down from above. Attached is a note covered in alien hearts.',
    choices: [
      { text: 'Accept graciously (wave at camera)', hint: 'Charisma builds. Free loot.',
        apply: (c) => { c.helpers.grantItem(); c.helpers.buffAttr('charisma', 1); c.helpers.log('You blow a kiss to the void. +item, +1 Charisma.', 'good'); } },
      { text: 'Tear it open immediately', hint: 'Just the loot, thanks.',
        apply: (c) => { c.helpers.grantItem(); if (c.rng.bool(0.5)) c.helpers.grantItem(); c.helpers.log('You rip it open. Possibly two items!', 'loot'); } },
    ],
  },
  {
    id: 'training_dummy', icon: '🥋', title: 'A Glitched Training Room',
    body: 'You stumble into a half-rendered training room. A punching dummy flickers in and out of existence. Mordecai\'s voice crackles through a busted speaker: "Eh, good enough. Hit the thing. Learn something."',
    choices: [
      { text: 'Train your body', hint: '+1 Strength.',
        apply: (c) => { c.helpers.buffAttr('strength', 1); c.helpers.log('You drill combos until your arms ache. +1 Strength.', 'good'); } },
      { text: 'Train your reflexes', hint: '+1 Dexterity.',
        apply: (c) => { c.helpers.buffAttr('dexterity', 1); c.helpers.log('You weave and dodge. +1 Dexterity.', 'good'); } },
      { text: 'Meditate weirdly', hint: '+1 Wisdom.',
        apply: (c) => { c.helpers.buffAttr('wisdom', 1); c.helpers.log('You sit very still and feel the System hum. +1 Wisdom.', 'good'); } },
    ],
  },
  {
    id: 'cursed_shrine', icon: '🗿', title: 'A Cursed Shrine',
    body: 'A leering stone idol offers a deal carved in glowing runes: POWER, FOR A PRICE. There is a slot for blood. There is always a slot for blood.',
    choices: [
      { text: 'Offer blood for power', hint: 'Lose max HP, gain a Luck and a stat point.',
        apply: (c) => { c.helpers.addMaxHpPenalty(15); c.helpers.buffAttr('luck', 1); c.helpers.addStatPoint(1); c.helpers.log('The idol drinks deep. -15 max HP, +1 Luck, +1 stat point.', 'danger'); } },
      { text: 'Smash the creepy thing', hint: 'No deal. Small chance of loot.',
        apply: (c) => { if (c.rng.bool(0.4)) { c.helpers.grantItem(); c.helpers.log('It shatters, dropping something! The curse... probably didn\'t transfer.', 'loot'); } else c.helpers.toast('It crumbles to dust. Anticlimactic.'); } },
    ],
  },
];
