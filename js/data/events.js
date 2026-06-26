export const EVENTS = [
  {
    id: 'sponsor_message',
    title: 'Sponsor Break',
    description: 'The dungeon pauses for a word from our sponsors. A holographic ad for "CrawlerBucks™" flickers to life. "Earn points! Spend points! Die less efficiently!"',
    choices: [
      { text: 'Watch the ad (+5 Luck, but lose 5 HP from annoyance)', effect: { luck: 1, hp: -5 } },
      { text: 'Skip ad (Management is displeased)', effect: { spawnMonster: true } },
      { text: 'Yell at the screen (Donut approves, +2 Charisma)', effect: { charisma: 2 } },
    ],
  },
  {
    id: 'mysterious_fountain',
    title: 'Suspicious Fountain',
    description: 'A glowing fountain bubbles in an alcove. The water smells like energy drinks and regret. A sign reads: "DRINK ME — Management assumes no liability."',
    choices: [
      { text: 'Drink the water (50% heal, 50% poison)', effect: { gamble: { good: { hp: 30 }, bad: { effect: 'poison', damage: 5, turns: 3 } } } },
      { text: 'Fill your spray can (+3 INT)', effect: { intelligence: 3 } },
      { text: 'Let Donut drink it (Donut gains a level of sass)', effect: { donutBuff: true, luck: 2 } },
    ],
  },
  {
    id: 'trapped_crawler',
    title: 'Trapped Crawler',
    description: 'You hear whimpering from behind a partially collapsed wall. Another crawler is trapped — a kid in a bathrobe, maybe 19. He looks terrified.',
    choices: [
      { text: 'Help him out (+3 WIS, but attract a monster)', effect: { wisdom: 3, spawnMonster: true } },
      { text: 'Loot his dropped items while he\'s stuck', effect: { loot: 'floor1_chest' } },
      { text: 'Give him advice and move on (Carl\'s specialty)', effect: { explorer: 2, wisdom: 1 } },
    ],
  },
  {
    id: 'donut_demands',
    title: 'Princess Donut\'s Demand',
    description: 'Donut plants herself in the middle of the corridor and refuses to move. She wants something. The Management AI sighs audibly.',
    choices: [
      { text: 'Give her your last ration (+5 Donut loyalty, heal 10 HP)', effect: { hp: 10, luck: 2 } },
      { text: 'Negotiate (CHA check — succeed for buff, fail for sass)', effect: { gamble: { good: { charisma: 3, luck: 2 }, bad: { charisma: -1 } } } },
      { text: 'Pick her up and keep walking (Donut scratches you, -3 HP)', effect: { hp: -3, strength: 1 } },
    ],
  },
  {
    id: 'gambling_machine',
    title: 'Crawler Slots',
    description: 'A slot machine materializes. "JACKPOT OR JACKSHIT!" flashes in neon. It costs nothing to play but your dignity.',
    choices: [
      { text: 'Pull the lever (Luck-based outcome)', effect: { luckGamble: true } },
      { text: 'Examine the machine (find a hidden compartment)', effect: { loot: 'floor1_chest' } },
      { text: 'Walk away like a responsible adult', effect: { wisdom: 2 } },
    ],
  },
  {
    id: 'management_tips',
    title: 'Management Tips',
    description: 'A cheerful hologram of a smiling face appears. "TIP OF THE DAY: Did you know that 73% of crawlers die on Floor 1? Be the 27%!" It winks.',
    choices: [
      { text: 'Listen carefully (+2 WIS, +1 Explorer)', effect: { wisdom: 2, explorer: 1 } },
      { text: 'Ask about the exit (vague non-answer, +1 INT)', effect: { intelligence: 1 } },
      { text: 'Flip it off (Donut high-fives you, +2 LCK)', effect: { luck: 2 } },
    ],
  },
  {
    id: 'rat_merchant',
    title: 'Rat Merchant',
    description: 'A surprisingly well-dressed rat sits behind a tiny counter. "Squeak squeak," it offers. Somehow you understand: it\'s selling goods scavenged from dead crawlers.',
    choices: [
      { text: 'Buy a mystery item (random loot)', effect: { loot: 'floor1_chest' } },
      { text: 'Trade a ration for +2 STR', effect: { strength: 2, hp: -5 } },
      { text: 'Decline politely (the rat respects this, +1 LCK)', effect: { luck: 1 } },
    ],
  },
  {
    id: 'hidden_cache',
    title: 'Hidden Cache',
    description: 'Your exterminator instincts kick in. Something smells wrong about this wall — which means something valuable might be behind it.',
    choices: [
      { text: 'Break through (find loot, but make noise)', effect: { loot: 'floor1_chest', spawnMonster: true } },
      { text: 'Search carefully (smaller loot, no noise)', effect: { loot: 'floor1_common' } },
      { text: 'Mark it and come back later (+Explorer)', effect: { explorer: 3 } },
    ],
  },
];

export function getRandomEvent() {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}
