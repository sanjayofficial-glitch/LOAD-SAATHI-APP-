# Plan & To-Do: Lead Conversion Fix (LoadSaathi)

> Status: **Phase A–C done** · 2026-10-19: fixed the silent lead leak in QuoteLeadCard (submit/WhatsApp never wrote to `leads` — table had 0 rows since 2026-10-09) + mounted on Freight Rate & Transport Cost calculators + TrustStrip added. Manual outbound is now the critical path.
> Last updated: 2026-10-19

---

## 1. Context

### Problem
Lead leakage in the LoadSaathi funnel:
1. Users are never asked for a phone number (no OTP, no capture) → no way to follow up.
2. Phone numbers that DO exist are invisible in the admin command center.
3. Users don't know how much setup remains → onboarding drop-off.
4. The floating WhatsApp button opens a generic share link, not a direct line to the owner → no lead record is created.

### Decisions (confirmed with user)
| Topic | Decision |
|---|---|
| Phone capture | **Soft gate + nudge**, plain 10-digit entry, **no OTP at all** |
| WhatsApp | Direct to owner: `wa.me/918328998031` (from `Contact.tsx`: `+91-83289-98031`) |
| Guide board | Dashboard embed **+** standalone `/guide` route |
| Scope | All three phases (A/B/C) together |
| Constraints | (1) App must not break. (2) Phone must appear in admin command center. (3) Floating bot = location-aware + animated (framer-motion). (4) Progress bar shows onboarding is short. |
| Avatars | `bible-strong-avatar-lab` is **AGPL-3.0** → blocked (Issue #8 unanswered, do NOT `pnpm add`). Local `freddy-avatar/` supplied as alternative — inspected, **not wired in this release**. |

### Key environment facts
- Stack: React 19.2.3 · Vite 6.3.4 · pnpm 9.12.3 · TS 5.5 · Tailwind 3.4 · framer-motion · Clerk · Supabase · Capacitor + Vercel.
- Source root: `supabase/src/`; alias `@` → `supabase/src` (vite.config.ts).
- Tests: `supabase/src/test/` — run with `pnpm vitest run <path>`.
- No `grep` in shell (PowerShell) — use the Grep tool.
- No generated Supabase DB types — hand-written types in `supabase/src/types/index.ts`.
- `public.is_admin()` exists (`final-schema.sql:277`).
- Supabase grants anon ALL on new `public` tables by default → new `leads` migration must **REVOKE then GRANT INSERT only** (guarded `DO $$` pattern from `20260918_revoke_anon_dml_all_tables.sql`).
- Migrations live in `supabase/migrations/`, header-comment convention (`-- Migration: / Purpose / Background / Safety / Date / Applied`).

---

## 2. To-Do List

### Phase A — Phone capture + admin visibility

- [x] **A1** `supabase/src/utils/phone.ts` — `stripDigits`, `normalizeIndianPhone`, `isValidIndianMobile`, `formatIndianPhone`, `toE164India`, `toTelHref`, `toWhatsAppHref` + `supabase/src/test/phone.test.ts` (**16/16 passing**)
- [ ] **A2** `supabase/migrations/<date>_create_leads_table.sql`:
  - columns: `id`, `name`, `phone`, `source`, `page_path`, `user_id` (nullable), `message`, `created_at`
  - RLS on; guarded `REVOKE` + `GRANT INSERT TO anon`; `SELECT` only via `public.is_admin()`
  - add `Lead` interface to `supabase/src/types/index.ts`
- [ ] **A3** Admin phone surfaces:
  - [ ] `pages/admin/UserManagement.tsx` — phone filter + column
  - [ ] `pages/admin/UserDetailDrawer.tsx` — phone display
  - [ ] `pages/admin/CommandCenterLive.tsx` — phone on cards

### Phase B — Onboarding phone capture (soft gate)

- [ ] **B1** `pages/auth/OnboardingFlow.tsx` — phone required for contactability + **"Do later"** skip (soft gate, no OTP)
- [ ] **B2** `pages/account/Profile.tsx` — validate/normalize phone in `handleUpdate`
- [ ] **B3** Nudge surfaces:
  - [ ] `components/PhoneNudgeBanner.tsx` (new) — mount in `components/Layout.tsx`
  - [ ] `components/OnboardingChecklist.tsx` — non-dismissible phone item

### Phase C — Progress + guide bot + WhatsApp funnel

- [ ] **C1** `hooks/useProfileProgress` + `ProfileProgressBar` — progress bar on dashboards (`pages/shipper/Dashboard.tsx`, `pages/trucker/Dashboard.tsx`)
- [ ] **C2** `components/GuideBotFab` (new) — framer-motion animated, **location-aware** guide bot
  - must coexist: `DockNav.tsx` (fixed bottom-3 z-[100]), `FloatingWhatsAppButton.tsx` (bottom-6 right-6 z-50), `MobileTabBar.tsx`, `VoiceGuide.tsx` (driver.js, once via localStorage)
  - source copy from `pages/public/HowItWorks.tsx` → `data/howItWorks.ts`
  - add `/guide` route in `routes.tsx`
- [ ] **C3** WhatsApp → real funnel:
  - [ ] `config/env.ts` (Zod) + `.env.example` — add `VITE_OWNER_WHATSAPP=918328998031`
  - [ ] `utils/whatsapp.ts` — add `generateOwnerWhatsAppLink()` (keep existing share helpers)
  - [ ] `utils/analytics.ts` — add events: `whatsapp_lead_started`, `phone_added`, `phone_skipped`, `phone_nudge_clicked`
  - [ ] `components/FloatingWhatsAppButton.tsx` — owner link + best-effort `leads` insert + `trackEvent('whatsapp_lead_started')`
  - [ ] `pages/public/Contact.tsx` — submit into `leads` table

### Verify

- [ ] `pnpm typecheck`
- [ ] `pnpm vitest run`
- [ ] `pnpm build`

---

## 3. Avatar side-task (deferred, findings recorded)

Inspected `freddy-avatar/` (4 files) + `avatar-studio-project.json`:

- ✅ Fully self-contained: imports only React + local siblings; **no network deps**, no fetch/CDN/three/lottie.
- ✅ `freddy.avatar.ts` `"version":1` matches `AVATAR_RUNTIME_VERSION = 1`.
- ✅ API: `Freddy` (forwardRef), `AvatarHandle` (`play/pause/stop`), default animation `"sleeping"`, `size=240`.
- ⚠️ **Problem**: `avatar-runtime.ts` loads its engine via **Blob URL + dynamic `import()`**. `vercel.json` CSP `script-src` has **no `blob:`** → will be blocked (currently *Report-Only*, so not breaking today, but broken the moment CSP is enforced; risky in Capacitor WebView too).
- ⚠️ `avatar-studio-project.json` is a studio export format — not directly importable.
- **Decision needed from user (Issue #8):** A) static avatar pilot with CSP `blob:` added to `script-src`, or B) full bible-strong SDK after AGPL clearance. Not part of this release.

---

## 4. File map (touch list)

| Phase | File | Action |
|---|---|---|
| A1 | `supabase/src/utils/phone.ts` | ✅ created |
| A1 | `supabase/src/test/phone.test.ts` | ✅ created (16 tests) |
| A2 | `supabase/migrations/<date>_create_leads_table.sql` | create |
| A2 | `supabase/src/types/index.ts` | add `Lead` |
| A3 | `pages/admin/UserManagement.tsx`, `UserDetailDrawer.tsx`, `CommandCenterLive.tsx` | edit |
| B1 | `pages/auth/OnboardingFlow.tsx` | edit |
| B2 | `pages/account/Profile.tsx` | edit |
| B3 | `components/PhoneNudgeBanner.tsx` | create |
| B3 | `components/Layout.tsx`, `components/OnboardingChecklist.tsx` | edit |
| C1 | `hooks/useProfileProgress`, `ProfileProgressBar`, both `Dashboard.tsx` | create/edit |
| C2 | `components/GuideBotFab.tsx`, `routes.tsx`, `data/howItWorks.ts` | create/edit |
| C3 | `config/env.ts`, `.env.example`, `utils/whatsapp.ts`, `utils/analytics.ts` | edit |
| C3 | `components/FloatingWhatsAppButton.tsx`, `pages/public/Contact.tsx` | edit |
| — | `components/FloatingCTA.tsx`, `DockNav.tsx`, `MobileTabBar.tsx`, `VoiceGuide.tsx` | coordinate z-index only |
