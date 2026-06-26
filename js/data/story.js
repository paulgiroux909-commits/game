export const FLOOR1_STORY = [
  {
    speaker: 'system',
    text: 'WELCOME, CRAWLER CARL, TO THE DUNGEON WORLD TOURNAMENT!',
  },
  {
    speaker: 'system',
    text: 'You have been selected — along with your "companion," Princess Donut — to compete in the most deadly reality show in the multiverse.',
  },
  {
    speaker: 'carl',
    text: 'Wait, what? I was just trying to get to my exterminator van. And Donut is a cat. She\'s not a "companion," she\'s a princess.',
  },
  {
    speaker: 'donut',
    text: '*demands belly rubs while the world ends*',
  },
  {
    speaker: 'system',
    text: 'FLOOR 1: THE TUTORIAL LABYRINTH has been assigned. Survive, loot, level up, and proceed to Floor 2. Or die. The audience is watching!',
  },
  {
    speaker: 'carl',
    text: 'Great. A tutorial for how to die. At least I know how to kill rats.',
  },
  {
    speaker: 'system',
    text: 'Your starting stats have been assigned based on your mundane human existence. Class: EXTERMINATOR. Race: HUMAN. Good luck, Crawler!',
  },
];

export const STORY_BEATS = {
  first_kill: {
    speaker: 'carl',
    text: 'One down. About ten billion to go. Donut, try not to get eaten.',
  },
  first_loot: {
    speaker: 'system',
    text: 'ITEM ACQUIRED! Remember: equipment synergies can mean the difference between crawling and dying.',
  },
  neighborhood_boss_found: {
    speaker: 'system',
    text: 'NEIGHBORHOOD BOSS DETECTED: The Rat King controls this section of the warrens. Defeat it to unlock safer passage.',
  },
  neighborhood_boss_defeated: {
    speaker: 'carl',
    text: 'That was... a lot of rats. Donut looks traumatized. Let\'s never speak of this.',
  },
  floor_boss_found: {
    speaker: 'system',
    text: 'FLOOR BOSS APPROACHING: The Tutorial Warden awaits. Demonstrate your combat aptitude to proceed to Floor 2.',
  },
  floor_boss_defeated: {
    speaker: 'system',
    text: 'CONGRATULATIONS, CRAWLER CARL! Floor 1 COMPLETE. Floor 2: The Goblin Market awaits... (Coming in full release!)',
  },
  level_up: {
    speaker: 'donut',
    text: '*purrs approvingly as Carl grows stronger*',
  },
  donut_save: {
    speaker: 'carl',
    text: 'Thanks, Donut. I owe you extra treats for that one.',
  },
  low_hp: {
    speaker: 'carl',
    text: 'This is fine. Everything is fine. I\'ve been in worse crawlspaces.',
  },
};

export const QUESTS = [
  { id: 'explore', text: 'Explore the Tutorial Labyrinth', completed: false },
  { id: 'loot', text: 'Find your first piece of equipment', completed: false },
  { id: 'neighborhood_boss', text: 'Defeat the Rat King (Neighborhood Boss)', completed: false },
  { id: 'floor_boss', text: 'Defeat the Tutorial Warden (Floor Boss)', completed: false },
  { id: 'survive', text: 'Clear Floor 1', completed: false },
];
