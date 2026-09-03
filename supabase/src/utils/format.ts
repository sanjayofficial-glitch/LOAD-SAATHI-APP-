/**
 * Format an estimated duration in minutes into a human-readable string.
 *
 * Examples:
 *   45   → "~45m"
 *   60   → "~1h"
 *   90   → "~1h 30m"
 *   1440 → "~24h"
 */
export function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `~${hrs}h${mins ? ` ${mins}m` : ''}`;
  }
  return `~${mins}m`;
}
