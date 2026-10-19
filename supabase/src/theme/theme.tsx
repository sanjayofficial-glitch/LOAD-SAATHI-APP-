import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  /** Resolved effective theme — 'system' is already resolved to light/dark. */
  isDark: boolean;
  /** Stored preference; 'system' follows the OS (`prefers-color-scheme`). */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Cycle light → dark → system → light. */
  toggle: () => void;
  /** Convenience setter that forces an explicit light/dark preference. */
  setDark: (v: boolean) => void;
}

const STORAGE_KEY = 'loadsaathi-theme';

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  mode: 'light',
  setMode: () => {},
  toggle: () => {},
  setDark: () => {},
});

const readStoredMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Backward compatible: the old provider only ever wrote 'dark'/'light'.
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // storage may be blocked (private mode / iframe) — fall through to default
  }
  // Light is the app default; 'system' stays opt-in (only when explicitly stored).
  return 'light';
};

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  const isDark = mode === 'system' ? systemDark : mode === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    // Keep native controls (scrollbars, form inputs, select dropdowns) in sync
    root.style.colorScheme = isDark ? 'dark' : 'light';
    // Update the browser/mobile status-bar chrome color
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute('content', isDark ? '#050816' : '#ea580c');
    }
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [isDark, mode]);

  // Follow OS theme changes whenever the preference is 'system'.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    // Modern API everywhere modern; legacy listener covers older iOS Safari.
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    mediaQuery.addListener(handler as unknown as (e: MediaQueryListEvent) => void);
    return () => mediaQuery.removeListener(handler as unknown as (e: MediaQueryListEvent) => void);
  }, []);

  const toggle = useCallback(() => {
    setMode(prev => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'));
  }, []);

  const setDark = useCallback((v: boolean) => setMode(v ? 'dark' : 'light'), []);

  const value = useMemo(
    () => ({ isDark, mode, setMode, toggle, setDark }),
    [isDark, mode, setMode, toggle, setDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
