# Fix Plan — TypeScript Errors, Runtime Error, and Freddy Avatar Integration

> **Status:** Ready to apply
> **TypeScript errors:** 22 across 7 files
> **Runtime error:** `userPhone is not defined` (OnboardingChecklist.tsx)
> **Feature:** Integrate Freddy procedural SVG avatar into the dashboard user dropdown

---

## 1. OnboardingChecklist.tsx — runtime + TS fix (HIGHEST PRIORITY)

**File:** `supabase/src/components/OnboardingChecklist.tsx`

The interface declares `userPhone` (line 17), and the field is used at line 31, but it is never destructured — causing the `userPhone is not defined` runtime error. `ArrowRight` is also used at line 106 but missing from the lucide-react import.

### Fix A — line 4 (imports)

```tsx
// FROM
import { CheckCircle2, Circle, X, Phone } from 'lucide-react';

// TO
import { CheckCircle2, Circle, X, Phone, ArrowRight } from 'lucide-react';
```

### Fix B — line 20 (destructure `userPhone`)

```tsx
// FROM
const OnboardingChecklist = ({ accent, userId, items }: OnboardingChecklistProps) => {

// TO
const OnboardingChecklist = ({ accent, userId, items, userPhone }: OnboardingChecklistProps) => {
```

---

## 2. Freddy Avatar — new engine + React wrapper

### 2a. Copy the engine

- **Source:** `freddy-avatar/avatar.js` (minified standalone procedural SVG engine; exports a Node-style module with `createAvatar(target, options)` → `mountAvatar`, which does `host.replaceChildren(svg)` — so a plain DOM element works as the mount target).
- **Destination:** `supabase/src/components/avatar/FreddyAvatarEngine.js` (new file, verbatim copy).

### 2b. Create React wrapper

**File:** `supabase/src/components/avatar/FreddyAvatar.tsx` (new)

```tsx
import { useEffect, useRef } from 'react';
import { createAvatar } from './FreddyAvatarEngine';

interface FreddyAvatarProps {
  user: { full_name: string };
  size?: number;
}

export const FreddyAvatar = ({ user, size = 32 }: FreddyAvatarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      createAvatar(containerRef.current, { name: user.full_name, size });
    }
  }, [user.full_name, size]);

  return <div ref={containerRef} style={{ width: size, height: size }} />;
};
```

> Notes: engine calls `host.replaceChildren(svg)`, so the div is a valid mount target; re-run on `full_name`/`size` change.

---

## 3. Layout.tsx — replace initials avatar in user dropdown

**File:** `supabase/src/components/Layout.tsx`

- **Location:** user dropdown at `Button id="layout-account-menu"`, lines ~457–460 — currently a `initials-in-gradient-circle` div.
- **Import** (add with other imports): `import { FreddyAvatar } from '@/components/avatar';`
  - Requires a barrel `supabase/src/components/avatar/index.ts` exporting `FreddyAvatar` (or import directly from `./avatar/FreddyAvatar`).
- **Replace** the initials div with:

```tsx
<FreddyAvatar user={userProfile} size={32} />
```

- `userProfile` is already in scope; use `userProfile.full_name`.

---

## 4. Remaining TypeScript errors (20 across 6 files)

| File | Errors | Notes |
|---|---|---|
| `supabase/src/pages/public/GuidePage.tsx` | 6 | Analyze & fix |
| `supabase/src/components/Disha.tsx` | 4 | Analyze & fix |
| `supabase/src/pages/auth/OnboardingFlow.tsx` | 3 | Analyze & fix |
| `supabase/src/components/FloatingWhatsAppButton.tsx` | 3 | Analyze & fix |
| `supabase/src/data/howItWorks.ts` | 2 | **False positives** — verify then fix/ignore |
| `supabase/src/hooks/useProfileProgress.ts` | 1 | Analyze & fix |

Action: read each file, correct types per compiler output, keep to repo conventions (TS strict, no `any`, Tailwind only, React Query for data).

---

## 5. Verification

1. Apply fixes 1–4 (use the `write` tool directly — **Bash file writes are blocked** with permission denied; reads work).
2. Run `pnpm run typecheck` (blocked until files are written) — expect **0 errors**.
3. Manual smoke: Onboarding checklist renders without `userPhone` crash; user dropdown shows animated Freddy avatar.

---

## Execution order

1. `OnboardingChecklist.tsx` (2 line edits) — fixes runtime crash
2. Create `avatar/FreddyAvatarEngine.js` (copy)
3. Create `avatar/FreddyAvatar.tsx` (+ `index.ts` barrel)
4. Edit `Layout.tsx` (import + swap div for `<FreddyAvatar>`)
5. Fix remaining 6 files (20 TS errors)
6. `pnpm run typecheck`

**Constraints:** Bash is read-only for file ops (writes → permission denied); plan/read-only mode was active in prior turns — use the `write`/`edit` tools for all file changes.
