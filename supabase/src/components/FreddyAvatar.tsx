// Re-export the Freddy procedural avatar for use as the Disha mascot.
// Sized to fit inside the 48px mascot ring (size prop in px; the avatar
// renders at width×height = size, so we pass a value slightly smaller
// than the button diameter to leave room for the orange ring).
import { Freddy, type AnimationName } from '../../../freddy-avatar/Freddy';

export { Freddy };
export type { AnimationName };
