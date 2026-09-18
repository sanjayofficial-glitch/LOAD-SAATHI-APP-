---
name: onboarding-checklist
description: >-
  Onboarding checklist with progress bar. Use when building getting-started
  checklists, onboarding flows, or progress tracking. Triggers: onboarding checklist,
  getting started checklist, progress bar onboarding.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Onboarding Checklist with Progress

Dismissible checklist component with progress bar, linked actions, localStorage persistence, and accent color variants.

## Key Files

- `src/components/OnboardingChecklist.tsx` — Main checklist component

## Pattern

### Component Props
```tsx
<OnboardingChecklist
  accent="orange" // or "blue"
  userId={userId}
  items={[
    { label: "Post your first trip", done: false, to: "/trucker/post-trip" },
    { label: "Complete profile", done: true },
  ]}
/>
```
- `accent` — color variant for progress bar and highlights
- `userId` — for localStorage dismissal key
- `items` — checklist items with optional `to` link for actionable items

### Features
- Progress bar showing `X of Y steps done`
- Dismissible with X button
- Linked items navigate to relevant pages
- Completed items show checkmark with strikethrough
- Animated entry (`animate-fade-in-up`)
- localStorage persistence: `loadsaathi-checklist-dismissed-${userId}`

### Styling
- Accent variants: orange (`#f97316`) or blue (`#3b82f6`)
- Progress bar: 1.5px height, rounded, animated width transition
- Hover states for actionable items
- Shake animation on progress update

## Best Practices

- Hide when all items complete or dismissed
- Use `to` prop for actionable unfinished items
- Keep progress bar smooth with CSS transitions
- Provide dismiss option to avoid annoyance
- Use semantic colors matching app theme
