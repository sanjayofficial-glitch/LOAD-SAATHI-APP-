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

# Dark/Light Theme System

Complete theme system with CSS custom properties, system preference detection, localStorage persistence, and Tailwind integration.

## Key Files

- `src/theme/theme.tsx` — ThemeProvider with `useTheme()` hook
- `src/globals.css` — CSS custom properties for light/dark modes
- `src/components/ThemeToggle.tsx` — Toggle component with sun/moon icons

## Pattern

### ThemeProvider
```tsx
const { isDark, theme, toggleTheme, setTheme } = useTheme();
```
- Wraps entire app in `App.tsx`
- `theme` values: `'light'`, `'dark'`, or `'system'`
- `isDark` is the resolved boolean

### System Preference
```ts
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```
Checked on first visit when no localStorage value exists.

### Persistence
```ts
localStorage.setItem('loadsaathi-theme', theme);
```
Key: `loadsaathi-theme`

### CSS Custom Properties
`globals.css` defines:
- `:root` — light mode tokens
- `.dark` — dark mode tokens
- Colors, backgrounds, borders, shadows all use CSS variables

### Tailwind Integration
Use `dark:` classes throughout components:
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

## Best Practices

- Read localStorage in `useState` initializer, NOT in `useEffect`, to avoid theme flash on load
- ThemeToggle should reflect current `isDark` state
- All colors should use CSS custom properties, not hardcoded values
- Respect `prefers-color-scheme` media query for system default
