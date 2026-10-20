import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';

/**
 * The app is locked to light mode (dark mode removed 2026-10-20).
 * Previously a 'dark'/'system' preference persisted in localStorage
 * (`loadsaathi-theme`) and — via the theme toggle or an OS-dark setting —
 * re-applied the `dark` class plus `color-scheme: dark` on <html>, which
 * caused light-on-light text visibility issues. The provider now only
 * normalizes the document to light; no dark state can be produced.
 */
export type ThemeMode = 'light';

interface ThemeContextType {
  /** Effective theme — always false while light mode is locked. */
  isDark: boolean;
  /** Always 'light'; kept for API compatibility. */
  mode: ThemeMode;
  /** No-op — light mode is locked. */
  setMode: (mode: ThemeMode) => void;
  /** No-op — light mode is locked. */
  toggle: () => void;
  /** No-op — light mode is locked. */
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

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Normalize the document to light and purge the legacy theme preference
  // so a stored 'dark'/'system' value can never resurrect dark mode.
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage may be blocked (private mode / iframe) */
    }

    const root = document.documentElement;
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    // Keep native controls (scrollbars, form inputs, select dropdowns) light
    root.style.colorScheme = 'light';
    // Update the browser/mobile status-bar chrome color for light mode
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute('content', '#ea580c');
    }
  }, []);

  // Setters are kept as stubs so the context contract stays stable for
  // existing consumers (e.g. ThemedToaster) — light cannot be changed.
  const setMode = useCallback(() => {}, []);
  const toggle = useCallback(() => {}, []);
  const setDark = useCallback(() => {}, []);

  const value = useMemo(
    () => ({ isDark: false, mode: 'light' as ThemeMode, setMode, toggle, setDark }),
    [setMode, toggle, setDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
