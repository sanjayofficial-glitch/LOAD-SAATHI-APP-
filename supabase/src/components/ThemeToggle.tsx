import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/theme/theme';

/**
 * Theme switcher with three states: Light → Dark → System → Light.
 * - Light: sun icon
 * - Dark: moon icon
 * - System: monitor icon (follows the OS `prefers-color-scheme`)
 */
const ThemeToggle = React.memo(() => {
  const { isDark, mode, toggle } = useTheme();

  const label =
    mode === 'system'
      ? `System theme (${isDark ? 'dark' : 'light'})`
      : mode === 'dark'
        ? 'Dark theme'
        : 'Light theme';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="h-11 w-11 text-gray-600 dark:text-gray-400"
      aria-label={`Theme: ${label}. Click to change.`}
      title={`${label} — click to change`}
    >
      <span key={mode} className="inline-flex animate-materialize" aria-hidden="true">
            {mode === 'light' ? (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : mode === 'dark' ? (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </span>
    </Button>
  );
});

export default ThemeToggle;
