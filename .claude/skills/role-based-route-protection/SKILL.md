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

Route guards for multi-role apps that check user_type and redirect unauthorized users.

## Key Files

- `src/components/RoleProtectedRoute.tsx` — Wrapper component for role checks
- `src/routes.tsx` / `src/App.tsx` — Route definitions with role guards
- `src/contexts/AuthContext.tsx` — Auth state with `userProfile.user_type`

## Pattern

### RoleProtectedRoute Component
```tsx
<RoleProtectedRoute allowedRoles={['trucker']} redirectTo="/trucker/dashboard">
  <TruckerDashboard />
</RoleProtectedRoute>
```
Props:
- `allowedRoles: UserType[]` — allowed user types
- `redirectTo: string` — where to send unauthorized users
- `children` — protected component

### User Types
- `shipper` — posts shipments, browses trucks
- `trucker` — posts trips, browses shipments
- `admin` — admin dashboard, user management

### Route Structure
```tsx
// Public routes (no auth)
<Route path="/" element={<PublicLayout />}>
  <Route path="login" element={<Login />} />
  <Route path="register" element={<Register />} />
</Route>

// Protected routes (auth required)
<Route path="/" element={<Layout />}>
  <Route path="trucker/dashboard" element={
    <RoleProtectedRoute allowedRoles={['trucker']}>
      <TruckerDashboard />
    </RoleProtectedRoute>
  } />
</Route>
```

## Best Practices

- Always wrap role-restricted pages in `RoleProtectedRoute`
- Use `Layout` wrapper for all authenticated routes
- Use `PublicLayout` for marketing/auth pages
- Lazy load route components with `React.lazy()` + `Suspense`
- Redirect to role-appropriate dashboard, not just login
