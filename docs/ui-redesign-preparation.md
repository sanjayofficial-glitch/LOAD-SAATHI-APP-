# UI Redesign — Preparation Dossier (psych-audit compliant)

> Owner skill: `ui-ux-psychological-conversion-architect`
> Rulebase: `UI_UX_PSYCHOLOGY_BRAIN.md` v1.0.0 (authoritative)
> Status: READY — awaiting asset intake + direction decisions

## 0. Locked direction decisions (user-confirmed 2026-11-15)

| Decision | Choice | Consequences |
|---|---|---|
| Illustration style | **Isometric 2.5D custom** | Keep ≤2 depth planes, one light source, ≤15% brand accent (VX-02/03/05). Code-drawn SVG; heavier but premium. |
| Asset pipeline | **Free resources + MCPs** | Sources: icons8mcp, getillustrations MCP servers; local DrawKit pack (below); all pass intake gates |
| Animation scope | **Micro-interactions + hero visualizer first** | MV-01/04/09; then scroll reveals (MV-10) as phase 2 |
| Icon strategy | **Lucide system + DrawKit 3D social icons** | Lucide stays the UI system (VX-06); DrawKit 0039 reserved for social/brand surfaces (footer) |
| Local resource | `0039-3d-social-media-icons/` (DrawKit 0039) | ~36 networks, Front/Side PNG views; select Front View set for consistency; verify license (G8) |

---

## 1. What "redesign" means here (brain-translated)

| Your intent | Brain constraint | Rule IDs |
|---|---|---|
| Illustrations | Must depict the **mechanism** (shared truck + loads), flat 2D, max 2 depth planes, ≤15% brand accent area, consistent light source | VX-02, VX-03, VX-05 |
| Animations | Only jobs A/B/C/D (guide / confirm / causality / delight); no loops in first viewport; ≤1 attention animation per viewport; transform/opacity only; 60fps; reduced-motion parity | §14 (MV-01…16), EM-04/06, VX-09 |
| Icons | One stroke weight (1.5–2px), one 24px grid, currentColor-driven; icons support, never replace, labels | VX-06, NM-09 |
| New resources | Every asset passes **intake gates** before wiring (see §4); no stock-photo clichés, no fake badges, no grey-market assets | CI-08, EM-01, VX-07 |

## 2. Surface map (what the redesign can touch, in priority order)

| Priority | Surface | Current state | Upgrade candidate |
|---|---|---|---|
| 1 | Hero fold | Copy + CTA + visualizer + quote widget | Replace `hero-bg.webp` photo with a mechanism illustration; upgrade visualizer stat sheets; add one guided attention animation (MV-09) |
| 2 | Visualizer card | Code SVG, no assets | New illustration set / richer vector (still 2D); consistent icon treatment |
| 3 | Trust/bento sections | Neutral cards + lucide icons | Illustration accents (≤1 per fold), icon consistency pass |
| 4 | Nav + sticky bars | Current components | Icon-only touch-ups; ensure ≤1 filled CTA per viewport |
| 5 | Calculators / tools pages | 19 tool pages | Shared illustration/icon system; empty states with mechanism depictions |
| 6 | Marketing pages (features, how-it-works, pricing) | Text-heavy | Mechanism illustrate for 3-step model (NM-06) |

## 3. Deliverable structure (when assets arrive)

1. **Intake** — run each asset through the gates below; reject/exchange failures.
2. **Design tokens** — map asset colors to existing tokens only (no new hues); register image/icon/IL system in one doc.
3. **Component wiring** — introduce assets via existing primitives (Button/Card/Badge) — no bespoke styling (JJ-03).
4. **Motion spec** — every animation gets a rule ID + duration from §14 table; no orphan animations.
5. **Audit** — re-run gates; ship AUDIT REPORT v1 per component.

## 4. Resource intake gates (every new asset must pass)

| Gate | Check | Fail → |
|---|---|---|
| G1 Palette | Hexes ⊆ existing brand tokens (safe ≤ 10% area; neutral ramp via color-mix) | Recolor; no new hue |
| G2 Format | Inline SVG (currentColor, viewBox) for vectors; webp/avif ≤120KB for raster; no 50MB glb | Convert/compress |
| G3 Role | Asset has a named job (illustration/icon/empty-state/hero) — no decorative-only | Delete or reclassify |
| G4 Mechanism | Illustrations teach the model (truck+loads, route, split) — no abstract blobs | Redraw |
| G5 Motion | Animation files ≤1 loop, ≤600ms, transform/opacity, reduced-motion fallback | Fix or reject |
| G6 Trust | No fake logos/seals/metrics in imagery (CI-08) | Reject |
| G7 Accessibility | Decorative → aria-hidden; meaningful → role="img" + <title>; contrast kept | Fix |
| G8 License/consistency | Rights cleared; same stroke/radius/light source as system | Reject/align |

## 4b. Sourcing map (free resources + MCPs)

| Source | What it gives | How to use | Gate notes |
|---|---|---|---|
| **icons8mcp** (MCP) | Icons, animated icons (gif/apng/lottie), illustrations | Search first, fetch by id; prefer SVG when plan allows, else PNG formats | Game/format limits per plan; SVG may need plan (tell user if refused). Animated = G5 review |
| **getillustrations** (MCP) | Single-illustration assets | Fetch by id from search results | Run G1/G4/G7 before import |
| **DrawKit 0039** (local) | 3D social brand icons (PNG) | Front View only; convert→webp/avif ≤120KB; use ONLY on footer/social surfaces (brand glyphs, not UI accent) | G8 license must be verified at drawkit.com before production; G7 alt text; G6 keep brand marks unmodified |
| **Lucide** (dep) | UI icon system | Keep as system base (stroke 1.5–2, 24px grid) | VX-06 |

**DrawKit integration plan (when you approve):**
1. Verify license (G8) — fetch DrawKit license page.
2. Copy needed Front View PNGs → `public/resources/social/` (names sanitized).
3. Convert to webp (~64–96px, ≤120KB) + `loading="lazy"`; keep original PNG as source.
4. Wire into `socialLinks` (footer) replacing lucide glyphs; keep `aria-label` + `rel="noopener noreferrer"`.
5. Color note: brand-colored 3D glyphs are *recognition* assets, exempt from accent ration (they are not UI accent) — but keep total number ≤ 7 in one surface.

## 5. Motion token baseline (already partly in globals.css — will formalize)

- Durations: 100 / 180 / 240 / 320 / 400ms (instant/fast/base/slow/max)
- Easings: `ease-out` (0.16,1,0.3,1) · `ease-in` (0.7,0,0.84,0) · spring CTA (stiffness 320, damping 26)
- Reducing: `prefers-reduced-motion` collapse + per-component `motion-safe:`/`motion-reduce:` variants

## 6. Definition of done for the incoming redesign

- [ ] Every changed surface cites rule IDs (audit table)
- [ ] Exactly one solid brand-fill per viewport
- [ ] All interactive ≥48×48 mobile, ≥8px gaps
- [ ] No looped animation in first viewport
- [ ] All assets pass G1–G8
- [ ] 360/768/1280 parity verified per surface
