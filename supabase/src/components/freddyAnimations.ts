// Shared Disha mood → Freddy animation mapping.
import type { AnimationName } from '../../../freddy-avatar/Freddy';
import type { DishaMood } from './DishaMascot';

/**
 * Predefined animation names that map Disha moods to Freddy animations.
 * The freddy.avatar.ts bundle ships these animation ids:
 *   sleeping, waking, idle, listening, thinking, searching, working,
 *   excited, bored, suspicious, angry, drowsy, happy, curious, ...
 */
export const moodToFreddyAnimation: Record<DishaMood, AnimationName> = {
  idle: 'idle',
  blink: 'idle',
  waking: 'waking',
  excited: 'excited',
  playful: 'playful',
  listening: 'listening',
  thinking: 'thinking',
  working: 'working',
  celebrate: 'celebrate',
  confused: 'confused',
  drowsy: 'drowsy',
  sleeping: 'sleeping',
  searching: 'searching',
  curious: 'curious',
  surprised: 'surprised',
  happy: 'happy',
  laughing: 'laughing',
  helpful: 'happy',
} as const satisfies Record<string, AnimationName>;
