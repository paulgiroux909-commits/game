import { CONFIG } from '../core/config.js';

// XP required to advance FROM the given level to the next.
export function xpForLevel(level) {
  return Math.round(CONFIG.XP_BASE * Math.pow(CONFIG.XP_GROWTH, level - 1));
}
