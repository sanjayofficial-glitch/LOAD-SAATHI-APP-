/**
 * LoadSaathi brand theme — extends the neutral Astryx theme with the
 * LoadSaathi orange accent chain (light + dark).
 *
 * Managed via the Astryx CLI:
 *   pnpm exec astryx theme build ./src/themes/loadsaathi/loadsaathi.ts
 *   pnpm exec astryx theme add loadsaathi
 *   pnpm exec astryx theme use loadsaathi
 */
import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

export const loadsaathiTheme = defineTheme({
  name: 'loadsaathi',
  extends: neutralTheme,
  tokens: {
    // Brand accent chain (LoadSaathi orange).
    '--color-accent': ['#EA580C', '#FB923C'],
    '--color-accent-muted': ['#FFEDD5', '#7C2D12'],
    '--color-text-accent': ['#C2410C', '#FDBA74'],
    '--color-icon-accent': ['#EA580C', '#FB923C'],
    '--color-on-accent': ['#FFFFFF', '#431407'],
  },
});
