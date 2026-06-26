// Story beats echoing the opening of the DCC series (original prose homage).
export const INTRO_PAGES = [
  `It started, as these things do, with an argument about a cat.

Your ex left. She took the furniture, the dignity, and — somehow — left behind her grand-champion Persian show cat, PRINCESS DONUT.

You went outside in your boxers and a bathrobe to chase the little monster down.

Lucky you. Everyone still inside was not so lucky.`,

  `In an instant, every building on Earth simply... ceased.

Where the city stood, there is now a hole. A staircase. A doorway down into the DUNGEON.

A voice — vast, smug, and broadcast directly into your skull — welcomes you.

"CONGRATULATIONS, SURVIVOR. YOU ARE NOW A CRAWLER. THE CRAWL IS THE GALAXY'S MOST-WATCHED ENTERTAINMENT. PLEASE DIE INTERESTINGLY."`,

  `There are rules. There is loot. There are stats, and levels, and an absurd number of ways to be killed for someone else's amusement.

Princess Donut, against all reason, can talk now. She is NOT happy about the box she's being kept in, and she is even less happy about you.

But she's all you've got. And you're all she's got.

FLOOR ONE awaits. Try to make it to the stairs. Try to put on a good show.`,
];

export const FLOOR_INTROS = {
  1: `FLOOR 1 — THE RUINED SUBLEVELS

The first floor is a maze of collapsed basements, sewers, and parking garages stitched together by the System into "neighborhoods."

Each neighborhood has a boss. Clear them, find the floor boss, and earn your way down.

The producers have notes. The producers always have notes.`,

  2: `FLOOR 2 — THE BOTTOM OF THE STAIRS

You survived Floor 1. Trillions cheered. Or jeered. It's hard to tell through the screaming.

The dungeon grows hungrier and meaner the deeper you go. Your gear from up top won't cut it for long.

Donut reminds you, repeatedly, that this is all your fault.`,
};

export function getFloorIntro(floor) {
  return FLOOR_INTROS[floor] ||
    `FLOOR ${floor}\n\nThe dark presses closer. The monsters hit harder. Keep finding synergies, Crawler — raw stats alone won't save you now.`;
}

// Short System "barks" shown as toasts during play.
export const SYSTEM_BARKS = [
  'The audience reaction is... mixed.',
  'A sponsor is considering you. Don\'t mess this up.',
  'Somewhere, a betting market just shifted.',
  'That kill was rated 7.8/10 by the highlight reel.',
  'Princess Donut demands you do better.',
  'A viewer has gifted you their thoughts and prayers. Useless, but appreciated.',
  'The Borant Corporation reminds you to smile for the cameras.',
];
