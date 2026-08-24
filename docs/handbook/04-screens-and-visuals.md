# Screenshots & Visual Assets

> Inventory of all visual assets: app screenshots, marketing previews, brand assets, and diagram exports.

---

## App Screenshots (6)

Located in `docs/assets/screenshots/`:

| Screenshot | File | What It Shows |
|-----------|------|--------------|
| Homepage Hero | `home-hero.png` | Landing page hero section with call-to-action |
| Dashboard | `dashboard.png` | Trucker/shipper dashboard with key metrics |
| AI Matching | `matching.png` | Smart-matching results with match percentages |
| In-App Chat | `chat.png` | Real-time messaging between shipper and trucker |
| Credit Score | `credit-score.png` | Digital credit score display (300-900) with factors |
| Reviews | `reviews.png` | Bidirectional review system after trip completion |

**Usage in README.md:**
```markdown
<img src="docs/assets/screenshots/dashboard.png" alt="Dashboard" width="420" />
```

---

## Marketing Preview Screens (6)

React components in `src/features/marketing/screens/` — these render live UI previews on the marketing site:

| Component | Route | What It Previews |
|-----------|-------|-----------------|
| `DashboardPreview.tsx` | `/screens/dashboard` | Dashboard layout and widgets |
| `MatchingPreview.tsx` | `/screens/matching` | AI matching interface |
| `ChatPreview.tsx` | `/screens/chat` | Chat UI with message bubbles |
| `CreditScorePreview.tsx` | `/screens/credit-score` | Credit score card and chart |
| `ReviewsPreview.tsx` | `/screens/reviews` | Review cards and ratings |
| `AdminPreview.tsx` | `/screens/admin` | Admin command center |

---

## Brand Assets

| Asset | Path | Format | Size Variants |
|-------|------|--------|--------------|
| Logo (primary) | `public/logo.svg` | SVG | Vector |
| Logo (docs) | `docs/assets/load-saathi-logo.svg` | SVG | Vector |
| Logo (raster) | `docs/assets/load-saathi-logo.webp` | WebP | — |
| Favicon set | `public/logo-{32,64,128,192,512}.{webp,png}` | WebP/PNG | 5 sizes |
| OG image | `public/og-image.png` | PNG | 1200x630 |
| Hero background | `public/hero-bg.webp` | WebP | — |
| Placeholder | `public/placeholder.svg` | SVG | Vector |
| Lottie loader | `public/loader.lottie` | Lottie JSON | Animated |
| PWA icon | `public/icons/icon-512.png` | PNG | 512x512 |

---

## Team Photos

| Person | Path | Format |
|--------|------|--------|
| Sanjaya Sahu (Founder/CEO) | `docs/assets/team/sanjaya-sahu.{png,webp}` | PNG + WebP |
| Prince Mallik | `docs/assets/team/prince-mallik.{png,webp}` | PNG + WebP |
| Jaydev Suna | `docs/assets/team/jaydev-suna.webp` | WebP |

Public copies in `public/team/*.webp`.

---

## Blog OG Social Cards (52)

Located in `public/blog/og/` — auto-generated SVG social share images for each blog post. Examples:

- `ai-freight-matching.svg`
- `trucker-earnings-odisha-2026.svg`
- `steel-transport-rourkela.svg`
- `ptl-vs-ftl-difference.svg`
- `gst-for-transporters-complete-guide.svg`
- `cargo-insurance-india.svg`
- (47 more — named after blog topics)

---

## Android Assets

Located in `android/app/src/main/res/`:

| Asset | Densities | Purpose |
|-------|-----------|---------|
| `mipmap-*/ic_launcher.png` | hdpi, mdpi, xhdpi, xxhdpi, xxxhdpi | App launcher icon |
| `mipmap-*/ic_launcher_foreground.png` | same 5 | Foreground art |
| `mipmap-*/ic_launcher_round.png` | same 5 | Round icon variant |
| `drawable-*/splash.png` | port/land, multiple | Splash screens |

---

## Knowledge Graph Visuals

| Artifact | Path | How to View |
|----------|------|-------------|
| Interactive HTML graph | `graphify-out/graph.html` | Open in any browser — zoom, click nodes, explore communities |
| Graph data (JSON) | `graphify-out/graph.json` | Load in graph visualization tools (Gephi, D3, etc.) |
| SVG export | `graphify-out/graph.svg` (if generated) | `graphify . --svg` to create |

---

## How to Generate New Diagrams

**Mermaid → PNG/SVG (free):**
```bash
# Install Mermaid CLI
npx @mermaid-js/mermaid-cli

# Generate PNG from a Mermaid file
mmdc -i flow.mmd -o flow.png -t dark -w 1200

# Generate SVG
mmdc -i flow.mmd -o flow.svg
```

**Graphify code graph → SVG:**
```bash
# Generate SVG of the code knowledge graph
graphify . --svg
# Output: graphify-out/graph.svg
```

**Graphify → GraphML (for Gephi/Cytoscape):**
```bash
graphify . --graphml
# Output: graphify-out/graph.graphml
```

---

*Last verified: 2026-08-24*
