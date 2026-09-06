---
name: role-based-route-protection
description: >-
  Role-based route guards for multi-role apps (shipper, trucker, admin).
  Use when protecting routes by user type, redirecting unauthorized users,
  or building role-based dashboards. Triggers: role based access, protected routes react,
  user type guard, shipper trucker admin, route guard.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Role-Based Route Protection

## What This Skill Captures

This skill documents LoadSaathi's route protection strategy for a multi-role platform.
It covers the `RoleProtectedRoute` component, route group structure in `App.tsx`,
and how user types (`shipper`, `trucker`, `admin`) gate access to dashboards and
feature areas. It is designed for React Router v7 with lazy-loaded routes.

## Key Files and Paths

- `src/components/RoleProtectedRoute.tsx` — Route guard component.
- `src/App.tsx` — Root router with nested route groups for `Layout` and `PublicLayout`.
- `src/routes.tsx` — Lazy-loaded route definitions.
- `src/components/Layout.tsx` — Authenticated app layout (sidebar + nav).
- `src/components/PublicLayout.tsx` — Marketing page layout (navbar + footer).
- `src/contexts/AuthContext.tsx` — Auth state including `user_type`.

## Core Patterns

### RoleProtectedRoute Component

`RoleProtectedRoute` accepts `allowedRoles` and an optional `redirectTo`:

```tsx
<RoleProtectedRoute allowedRoles={['trucker']} redirectTo="/trucker/dashboard">
  <TruckerHub />
</RoleProtectedRoute>
```

It reads `user_type` from `AuthContext`. If the user is unauthenticated or has
the wrong role, they are redirected to their own dashboard or `/login`.

### Nested Route Groups

`App.tsx` separates public and protected routes:

- **Public routes** — wrapped in `<PublicLayout>`, no auth required.
- **Protected routes** — wrapped in `<Layout>` + role checks.

This separation prevents accidental exposure of authenticated pages.

### User Types

LoadSaathi defines three user types:

- `shipper` — posts shipments, browses trips.
- `trucker` — posts trips, browses shipments.
- `admin` — moderation, user management, monitoring.

### Lazy Loading

Routes are lazy-loaded via `React.lazy()` + `Suspense` in `routes.tsx`. This keeps
the initial bundle small and aligns with LoadSaathi's performance budget.

### Redirect Logic

When a user with the wrong role hits a protected route, `RoleProtectedRoute`
resolves the redirect path based on their `user_type`. This prevents users from
seeing blank pages or generic 403 screens.

### Adding a New Role

To add a new role, update the `UserType` union in `src/types/index.ts`, add the
dashboard route in `src/routes.tsx`, and include the new role in the appropriate
`RoleProtectedRoute` wrappers.

## Best Practices

- Always wrap role-restricted pages in `RoleProtectedRoute`, not just `Layout`.
- Use `redirectTo` to send users to their correct dashboard instead of a generic
  login page.
- Never rely on client-side hiding alone; `RoleProtectedRoute` prevents component
  mount and flashes of protected content.
- Keep route definitions declarative in `routes.tsx`; avoid inline route objects.
- Test each role by logging in as a shipper, trucker, and admin to verify redirects.

## Trigger Phrases

- "role based access"
- "protected routes react"
- "user type guard"
- "shipper trucker admin"
- "route guard"

## Adding a New Role

To add a new role, update the UserType union in src/types/index.ts, add the
dashboard route in src/routes.tsx, and include the new role in the appropriate
RoleProtectedRoute wrappers. Also update the sidebar in Layout.tsx if the role
needs a dedicated nav section.

## Common Pitfalls

- Do not hide routes with CSS alone; RoleProtectedRoute must wrap the component
  to prevent mount-time data leaks.
- Avoid hardcoding role strings in multiple files; use the UserType type as the
  single source of truth.
- Test redirects in incognito mode to ensure no stale auth state masks role issues.
