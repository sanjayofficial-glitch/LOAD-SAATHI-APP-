# LoadSaathi — Repository Handbook

> **Hand this file to any AI agent or new developer.** It is the single source of truth for understanding, restructuring, and improving this codebase.

**Last verified:** 2026-08-24 | **Status:** Active development & pre-launch

---

## What This Is

LoadSaathi is India's AI-powered shared freight marketplace connecting shippers and truckers for PTL (Partial Truckload) and LTL (Less Than Truckload) loads across East India. The platform matches shippers with truckers, tracks shipments via GPS, and builds digital credit scores for all participants.

**Core value proposition:** Eliminate empty return trips and reduce freight costs by up to 40% through AI matching and route optimization.

---

## Quick Reference

| Item | Detail |
|------|--------|
| **Live URL** | [loadsaathi.in](https://loadsaathi.in) |
| **Support** | support@loadsaathi.in |
| **Founder** | Sanjaya Sahu (FTBI alumnus, NIT Rourkela) |
| **Status** | Web (Vercel) + Android (Capacitor), live with Clerk auth + Supabase DB |
| **Core Markets** | Odisha, Jharkhand, West Bengal — 50+ cities, 25+ corridors |

---

## How to Read This Handbook

| File | What it covers |
|------|---------------|
| [`docs/handbook/00-index.md`](docs/handbook/00-index.md) | Handbook index & reading order |
| [`docs/handbook/01-overview-non-technical.md`](docs/handbook/01-overview-non-technical.md) | Plain-language explanation for non-technical readers |
| [`docs/handbook/02-architecture-and-stack.md`](docs/handbook/02-architecture-and-stack.md) | Tech stack, directory map, provider nesting, services |
| [`docs/handbook/03-core-flows.md`](docs/handbook/03-core-flows.md) | Mermaid diagrams for every core flow |
| [`docs/handbook/04-screens-and-visuals.md`](docs/handbook/04-screens-and-visuals.md) | Screenshot inventory, app screens, visual assets |
| [`docs/handbook/05-graphify-and-code-memory.md`](docs/handbook/05-graphify-and-code-memory.md) | How graphify memorizes the code, existing graph artifacts |
| [`docs/handbook/06-improvements-and-roadmap.md`](docs/handbook/06-improvements-and-roadmap.md) | Honest audit + Free/Low-cost/Paid fixes + alternatives |
| [`docs/handbook/07-ai-restructure-brief.md`](docs/handbook/07-ai-restructure-brief.md) | Copy-pasteable brief for an AI agent to restructure the repo |
| [`docs/handbook/08-handover-checklist.md`](docs/handbook/08-handover-checklist.md) | Accounts, env vars, how to run, key files |

---

## Architecture at a Glance

```
┌─────────────────────── Clients ───────────────────────┐
│  Web SPA (Vercel)            Android App (Capacitor)   │
│  React 19 + TS + Vite        Same web build            │
└───────────────────────┬───────────────────────────────┘
                        │  HTTPS
┌───────────────────────▼───────────────────────────────┐
│                      Services                          │
│  ┌───────────┐   ┌──────────────┐   ┌───────────────┐ │
│  │  Clerk    │   │  Supabase    │   │     OSRM      │ │
│  │ Auth+JWT  │──▶│ Postgres+RLS │   │  Routing      │ │
│  │           │   │ Realtime     │   │               │ │
│  │           │   │ Edge Fns     │   │               │ │
│  └───────────┘   └──────┬───────┘   └──────┬────────┘ │
│                         │                  │          │
└─────────────────────────┼──────────────────┼──────────┘
                          ▼                  ▼
                 ┌──────────────┐   ┌─────────────────┐
                 │   Gemini AI  │   │   Nominatim     │
                 │ NL search    │   │   Geocoding     │
                 └──────────────┘   └─────────────────┘
```

---

## Core Flows Summary

| Flow | Trigger | Path | Key Files |
|------|---------|------|-----------|
| **Auth** | Sign-in/sign-up | Clerk → JWT → `createClerkSupabaseClient` → Supabase `users` table | `contexts/AuthContext.tsx`, `lib/supabase.ts` |
| **Post Trip** | Trucker fills form | Geocode → OSRM route → INSERT `trips` | `pages/trucker/PostTrip.tsx`, `utils/osrm.ts`, `utils/geocode.ts` |
| **Post Shipment** | Shipper fills form | Geocode → OSRM route → INSERT `shipments` | `pages/shipper/PostShipments.tsx` |
| **Smart Matching** | Browse shipments/trucks | 7-factor deterministic score + AI Edge Function | `utils/matching.ts`, `hooks/useSmartMatch.ts` |
| **Chat** | Matched parties talk | Supabase Realtime on `messages` table | `utils/chat.ts`, `pages/messaging/Chat.tsx` |
| **GPS Tracking** | Trucker en route | `navigator.geolocation` every 30s → UPDATE `driver_locations` | `components/AutoGpsTracker.tsx` |
| **Credit Score** | User opens profile | Edge Function `credit-score` → factors → score (300–900) | `hooks/useCreditScore.ts` |
| **Price Prediction** | Shipper estimates cost | Edge Function `price-predict` → recommended price | `hooks/usePricePrediction.ts` |
| **Notifications** | Any status change | RPC `create_notification` (SECURITY DEFINER) | `utils/notifications.ts` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 6 |
| UI | shadcn/ui + Radix UI + Tailwind CSS 3.4 |
| State | TanStack React Query 5 (no Redux) |
| Auth | Clerk 5 |
| DB | Supabase (PostgreSQL + RLS + Realtime) |
| Maps | Leaflet + React-Leaflet |
| Charts | Recharts 3 |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Analytics | PostHog + Vercel Analytics + GA |
| Mobile | Capacitor 8 (Android) |
| Hosting | Vercel |
| Routing | React Router DOM 7 |
| SEO | React Helmet Async |

---

## Key Graphify Artifacts

The codebase has already been analyzed by graphify (v0.6.1, AST-only). See [`docs/handbook/05-graphify-and-code-memory.md`](docs/handbook/05-graphify-and-code-memory.md) for details.

| Artifact | Path | Content |
|----------|------|---------|
| Interactive graph | `graphify-out/graph.html` | Open in browser — navigate nodes/edges visually |
| Graph data | `graphify-out/graph.json` | 600 nodes, 552 edges, 31 communities |
| Audit report | `graphify-out/GRAPH_REPORT.md` | God nodes, surprising connections, community list |
| AST cache | `graphify-out/cache/ast/` | Per-file structure extraction (fast incremental updates) |

**To regenerate/enrich:**
- `/graphify . --deep` — adds semantic extraction (costs Claude tokens)
- `/graphify . --update` — incremental update (only changed files)
- `/graphify . --svg` — export code graph as SVG image

---

## AI Restructure Brief

For a detailed, copy-pasteable brief telling an AI agent exactly how to restructure this repo, see [`docs/handbook/07-ai-restructure-brief.md`](docs/handbook/07-ai-restructure-brief.md).

**TL;DR of what an AI agent should do:**

1. Fix `CONTEXT.md` directory map (currently stale)
2. Reorganize pages into cleaner subdirectories
3. Extract duplicated form logic into shared components
4. Add automated tests (currently near-zero)
5. Set up GitHub Actions CI
6. Enrich the graphify graph with `--deep` semantic extraction
7. Create missing type exports

---

## What to Read Next

| If you are... | Read this first |
|---------------|----------------|
| **Non-technical (founder/stakeholder)** | [`01-overview-non-technical.md`](docs/handbook/01-overview-non-technical.md) |
| **Developer (new to repo)** | [`02-architecture-and-stack.md`](docs/handbook/02-architecture-and-stack.md) → [`03-core-flows.md`](docs/handbook/03-core-flows.md) |
| **AI coding agent** | [`07-ai-restructure-brief.md`](docs/handbook/07-ai-restructure-brief.md) (start here) |
| **DevOps/hiring** | [`08-handover-checklist.md`](docs/handbook/08-handover-checklist.md) |
| **Wanting improvements** | [`06-improvements-and-roadmap.md`](docs/handbook/06-improvements-and-roadmap.md) |

---

## License

Proprietary. All rights reserved. © 2026 LoadSaathi.
