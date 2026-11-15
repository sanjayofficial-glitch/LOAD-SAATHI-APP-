# Resource Manifest — LoadSaathi UI assets

Drop assets here with a manifest entry; the intake gates (G1–G8 in
`docs/ui-redesign-preparation.md`) run before any component wiring.

## Accepted formats

| Type | Format | Max | Notes |
|---|---|---|---|
| Vector illustration | Inline SVG (viewBox, currentColor) | 30KB gz (hero), 15KB (other) | 2D flat, ≤2 depth planes, mechanism-first |
| Icon | Inline SVG, 24px grid, stroke 1.5–2px | 3KB | One stroke weight across system |
| Raster | webp / avif | 120KB | Hero/OG only; no stock-photo clichés |
| Animation | CSS keyframes / framer-motion / Lottie | 1 loop, ≤600ms | transform/opacity only; reduced-motion fallback |

## Manifest entry template

```json
{
  "id": "hero-shared-truck-illustration",
  "type": "illustration",
  "role": "hero",
  "file": "public/resources/hero-shared-truck.svg",
  "gates": { "G1": "pass", "G2": "pass", "G3": "pass", "G4": "pass", "G5": "n/a", "G6": "pass", "G7": "pass", "G8": "pass" },
  "rules": ["VX-02", "VX-03", "VX-05", "EM-02"],
  "date": "2026-11-15"
}
```

## Current known assets

| Asset | Where | Status |
|---|---|---|
| hero-bg.webp | public/ | Pending replacement (photo → isometric mechanism illustration) |
| og-image.png | public/ | Pending update with savings promise |
| logo.svg / logo-*.webp/png | public/ | Kept (brand) |
| Lucide icons | dependency | Kept as system icon base (VX-06) |
| DrawKit 0039 3D social icons | `0039-3d-social-media-icons/` | Pending intake: license verify (G8) → select Front View → webp convert → footer `socialLinks` wiring |
| SharedTruckVisualizer redesign (user-built) | `supabase/src/features/home/components/truck/` | **Integrated 2026-11-15** — replaced old SVG visualizer; tokens + keyframes ported; hero rewired. Derived brand tokens added to tailwind config (documented deviation) |
