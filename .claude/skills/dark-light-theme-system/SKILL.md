---
name: dark-light-theme-system
description: >-
  Dark/light theme system with system preference detection, localStorage persistence,
  and Tailwind CSS custom properties. Use when adding dark mode, theming, or
  system preference detection to React apps. Triggers: dark mode react, theme system,
  system preference theme, tailwind dark mode, theme provider.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Dark / Light Theme System

## What This Skill Captures

This skill documents LoadSaathi's complete theming stack: React context provider,
Tailwind CSS custom properties, system-preference detection, and localStorage
persistence. It avoids theme flash on load by reading storage synchronously during
state initialization. It is designed to work with React 19 and Vite's hydration
model.

## Key Files and Paths

- `src/theme/theme.tsx` — `ThemeProvider` and `useTheme()` hook.
- `src/globals.css` — CSS custom properties for `:root` and `.dark`.
- `src/components/ThemeToggle.tsx` — Sun / moon toggle button.
- `tailwind.config.ts` — Tailwind `darkMode` configuration.

## Core Patterns

### ThemeProvider Context

`ThemeProvider` wraps the application and exposes `useTheme()`:

```tsx
const { isDark, theme, toggleTheme, setTheme } = useTheme();
```

- `isDark`: boolean for conditional rendering.
- `theme`: `'light' | 'dark' | 'system'`.
- `toggleTheme()`: cycles between light and dark.
- `setTheme('dark')`: forces a specific theme.

### System Preference Detection

On first visit, the theme is resolved from `window.matchMedia('(prefers-color-scheme: dark)')`.
This value is stored in localStorage under the key `loadsaathi-theme` so subsequent
visits are consistent.

### Persistence

```tsx
const [theme, setTheme] = useState(() => {
  const stored = localStorage.getItem('loadsaathi-theme');
  return stored ?? 'system';
});
```

Reading localStorage inside `useState` initializer (not `useEffect`) prevents the
React hydration flash where the wrong theme appears briefly.

### CSS Custom Properties

`globals.css` defines color tokens in both `:root` and `.dark`:

```css
:root { --background: #ffffff; --foreground: #0a0a0a; }
.dark { --background: #0a0a0a; --foreground: #fafafa; }
```

Components consume tokens via `bg-background`, `text-foreground`, etc.

### Tailwind Integration

Tailwind uses the `dark` class strategy. The `.dark` class is toggled on the root
element by `ThemeProvider`. All Tailwind `dark:` variants work automatically once
the class is present.

### SSR and Hydration

In Vite SPAs, the server renders a static shell. The theme class is applied on
the client after mount. To avoid layout shift, default to `system` theme until
the client resolves the stored preference.

## Best Practices

- Always wrap the app in `ThemeProvider` at the root level.
- Use semantic color tokens (`background`, `foreground`, `primary`, `secondary`)
  instead of hard-coded Tailwind colors.
- Do not use inline `style` attributes for theme-dependent colors.
- Test dark mode on both system preference changes and manual toggle.
- Ensure `noscript` blocks reflect a usable theme if JavaScript is disabled.

## Trigger Phrases

- "dark mode react"
- "theme system"
- "system preference theme"
- "tailwind dark mode"
- "theme provider"
