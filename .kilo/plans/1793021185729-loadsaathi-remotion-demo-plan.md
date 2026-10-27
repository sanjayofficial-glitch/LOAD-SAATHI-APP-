# LoadSaathi Remotion Product Demo — YC W2027 (Option 2: Real UI Porting)

**Goal:** Render a 60-second, 1920×1080, 30fps product demo video showing one shipment (LS-DEMO-1028) moving shipper → trucker → shared tracking, using LoadSaathi's actual production UI components (shadcn/ui, Tailwind, orange brand) instead of generic rebuilt components.

**Constraint:** This agent is plan-only / read-only. All file creation, package installation, and rendering require an implementation-capable agent.

---

## Context (from codebase review)

- LoadSaathi = India AI-powered PTL/LTL freight marketplace, East India corridor (Rourkela–Ranchi–Burdwan).
- Stack: React 19 + TypeScript + Vite + Tailwind + Clerk + Supabase + OSRM + Gemini, hosted on Vercel.
- Source lives in `supabase/src/` with production UI at `supabase/src/components/ui/` (shadcn primitives) and pages at `supabase/src/pages/shipper/`, `supabase/src/pages/trucker/`.
- Brand: orange primary `#F97316` (`--primary: 25 100% 55%` in `globals.css`), dark mode support, `--radius` CSS variables.
- Tailwind config lives in `supabase/`; `globals.css` at `supabase/src/globals.css` (884 lines with all custom utilities: `.press`, `.elevate`, `.glass-panel`, etc.).
- UI primitives exported: `Button`, `Card`/`CardHeader`/`CardContent`/`CardTitle`, `Input`, `Label`, `Badge`, `Skeleton`, `Select`*, `Dialog`*, `Tooltip`*, `Tabs`* — all use `cn()` from `supabase/src/lib/utils.ts` and Radix UI.
- Types at `supabase/src/types/index.ts`: `Shipment`, `Trip`, `User`, `Request`, `ShipmentRequest`.
- Truth policy: all demo prices/scores/profiles/match%/ETA/map movement are synthetic and labeled `(demo)` / illustrative; no live GPS claims; no claim of actual payment release; escrow not shown as shipped.

---

## Skills already installed (confirmed)

- `remotion-dev/skills` — 12 official skills (best-practices, captions, markup, maps, render, studio, etc.)
- `liamrjohnston/remotion-motion-graphics-skill` — 4 skills (motion-graphics, cinematic-camera, etc.)

Do not install overlapping community skills.

---

## Project state (already scaffolded)

`demo-video/` exists with:
- `package.json` (Remotion 4.0.539, React 19.2.3, pnpm)
- `src/Composition.tsx`, `src/Root.tsx`, `src/index.ts`, `remotion.config.ts`
- `node_modules/` installed

## Implementation tasks (ordered, implementation agent executes)

### 1. Install UI dependencies into demo-video
```bash
cd demo-video
pnpm add tailwindcss@3 postcss autoprefixer tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-select @radix-ui/react-dialog
```

### 2. Copy production UI primitives
Copy from `supabase/src/components/ui/` → `demo-video/src/components/ui/`:
- `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `badge.tsx`, `skeleton.tsx`, `select.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `tooltip.tsx`, `tabs.tsx`
- Copy `supabase/src/lib/utils.ts` → `demo-video/src/lib/utils.ts` (the `cn` function)

### 3. Create Tailwind + CSS config
**`demo-video/tailwind.config.ts`:**
```ts
import type { Config } from "tailwindcss"
const config: Config = {
  darkMode: ["class"],
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: {
      border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
      background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
      primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
      secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
      destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
      muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
      accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
      popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
      card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
    },
    borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
  }},
  plugins: [require("tailwindcss-animate")],
}
export default config
```

**`demo-video/postcss.config.js`:**
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

**`demo-video/src/globals.css`** — copy full content from `supabase/src/globals.css` (884 lines). This provides exact brand tokens: `--primary: 25 100% 55%`, `--radius`, transitions, `.press`, `.elevate`, `.glass-panel`, etc.

### 4. Update theme.ts with production brand tokens
**`demo-video/src/theme.ts`:**
```ts
export const theme = {
  primary: '#F97316', primaryDark: '#C2410C', primaryLight: '#FFEDD5',
  ink: '#0F172A', inkLight: '#64748B',
  canvas: '#FFFFFF', surface: '#FFFFFF',
  muted: '#94A3B8', border: '#E2E8F0', borderLight: '#F1F5F9',
  success: '#168A55', successLight: '#ECFDF5',
  warning: '#F97316', warningLight: '#FFF7ED',
  red: '#EF4444', redLight: '#FEF2F2',
  radius: { sm: 6, md: 8, lg: 12, xl: 16 },
  shadow: '0 4px 20px -6px rgba(15, 23, 42, 0.08)',
};
```

### 5. Create mock data (no Clerk/Supabase calls)
**`demo-video/src/data/demoData.ts`:** Define `demoShipment` (id `LS-DEMO-1028`, Rourkela→Ranchi, 2400kg, PTL, 28 Oct) and `demoCarriers` (3 synthetic profiles with scores/quotes labeled illustrative). All values synthetic.

### 6. Create frame-driven screen components using REAL UI primitives
All components import from `@/components/ui/*` (the copied shadcn primitives) and drive animation from `useCurrentFrame()` + `interpolate`/`spring` — no CSS transitions, no wall-clock time, no random values.

**`src/screens/ShipperPostShipment.tsx`** (Scene 1, frames 0–419):
- Real `Button`, `Card`, `CardContent`, `CardTitle`, `Input`, `Label`
- Fields fill sequentially: Pickup → Delivery → Cargo → Weight → Pickup date → Truck space
- Price guidance card springs in
- Cursor glides to "Find truckers" button, button press animation
- Label: "Illustrative price estimate · not a live quote"

**`src/screens/ShipperMatching.tsx`** (Scene 2, frames 420–869):
- Real `Card`, `Badge` components
- 3 carrier match cards stagger in; first card highlighted
- Match percentages animate 0→shown value
- Cursor clicks "Request booking" → "Request sent"
- Label: "Demo profiles and quotes"

**`src/screens/TruckerLoadRequest.tsx`** (Scene 3, frames 870–1349):
- Real `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, `Badge`
- Trucker dashboard header with account chip
- Load request card with route, cargo, weight, pickup date
- Capacity bar, indicative payout counter
- "Accept request" button → confirmation sheet → "Booking confirmed"
- Cursor movement between buttons

**`src/screens/SharedTracking.tsx`** (Scene 4, frames 1350–1799):
- Real `Card`, `CardContent`, `CardTitle`, `Badge`
- SVG corridor map with route line draw + moving truck marker (labeled "Demo route · not live GPS")
- Shipment timeline: Booking confirmed → Picked up → In transit → Delivered
- Payment protection status card (labeled "demo flow")
- Role toggle: Shipper view | Trucker view

### 7. Create shared components
**`src/components/Cursor.tsx`** — 8×8px animated cursor dot.

### 8. Wire composition
**`src/compositions/LoadSaathiDemo.tsx`:**
- FPS=30, DURATION=1800 frames, 1920×1080
- Master composition with scene crossfades at boundaries: `0–419`, `420–869`, `870–1349`, `1350–1799`
- End card: LoadSaathi logo + "Every truck should move full." + "Demo — illustrative UI and synthetic data"

**`src/Root.tsx`:** Render `LoadSaathiDemo`.

---

## Truth guardrails (must hold in final video)

- Same shipment ID `LS-DEMO-1028` persists across all four scenes.
- All prices, scores, profiles, match percentages, ETA, map movement labeled `(demo)` / illustrative.
- Route marker labeled "Demo route · not live GPS".
- No claim of actual payment release; status shows "payment release initiated (demo flow)".
- Escrow not shown as shipped.
- No live API calls to Clerk/Supabase/OSRM/Gemini.

---

## Validation / acceptance criteria

- `pnpm run lint` (eslint + tsc) passes clean in `demo-video/`.
- `npx remotion render LoadSaathiDemo out/demo.mp4` completes all 1800 frames.
- Video is exactly 60s, 1920×1080, 30fps.
- Scene boundaries match `0–419 / 420–869 / 870–1349 / 1350–1799`.
- Both roles visible with account chips; same shipment ID across all scenes.
- Demo disclaimers visible wherever synthetic data could be mistaken for real.
- No live GPS / payment-release claims.
- Text legible at full resolution; content inside safe margins.
- Still thumbnail rendered: `npx remotion still LoadSaathiDemo out/thumbnail.jpg --frame=100`.

---

## Open decisions (confirm before implementation)

1. Voiceover source: human recording vs AI TTS; music track source/license.
2. Brand token replacement: actual LoadSaathi hex colors/fonts vs provisional `theme.ts` palette acceptable for YC submission.

---

## Risks

- Read-only agent cannot execute any implementation; hand off to code agent.
- Overlapping community Remotion skills could conflict — only official set + liamrjohnston motion-graphics installed.
- Provisional brand tokens must be validated against production before claiming visuals match production UI.
- Supabase/Clerk/OSRM/Gemini are external services — demo must not call live APIs or imply real transactions.
