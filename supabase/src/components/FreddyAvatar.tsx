// Re-export the Freddy procedural avatar for use as the Disha mascot.
// Sized to fit inside the 48px mascot ring (size prop in px; the avatar
// renders at width×height = size, so we pass a value slightly smaller
// than the button diameter to leave room for the orange ring).
import { Freddy, type AnimationName } from '../../../freddy-avatar/Freddy';
import type { DishaMood } from './DishaMascot';

export { Freddy };
export type { AnimationName };

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
} as const satisfies Record<string, AnimationName>;
