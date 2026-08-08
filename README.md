<div align="center">

<img src="docs/assets/load-saathi-logo.svg" alt="LoadSaathi Logo" width="160" />

# LoadSaathi

**India's AI-Powered Shared Freight Marketplace**

Connecting shippers and truckers for PTL / LTL loads across East India — with AI matching, real-time GPS tracking, and digital credit scores.

</div>

---

## Table of Contents

- [What is LoadSaathi?](#what-is-loadsaathi)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Project Status](#project-status)
- [License](#license)

---

## What is LoadSaathi?

LoadSaathi is India's AI-powered shared freight marketplace connecting shippers
and truckers for PTL (Partial Truckload) and LTL (Less Than Truckload) loads
across East India. The platform uses AI matching, real-time GPS tracking,
digital credit scores, and escrow-backed payments to eliminate empty return
trips and reduce freight costs by up to 40%.

Founded by **Sanjaya Sahu** (FTBI alumnus, NIT Rourkela) after seeing truckers
return empty and shippers struggle to find reliable carriers, LoadSaathi brings
transparency, trust, and intelligence to Indian freight.

### Who It's For

- **Shippers** — SMEs and enterprises in Odisha, Jharkhand, and West Bengal moving goods on the Rourkela–Ranchi–Burdwan corridor and beyond.
- **Truckers & Fleet Owners** — Independent truckers and fleet operators looking to fill empty capacity, find return loads, and build a digital reputation.

### Key Service Areas

Rourkela, Ranchi, Bhubaneswar, Kolkata, Jamshedpur, and 50+ cities across
Odisha, Jharkhand, and West Bengal — with 25+ active freight corridors
including Rourkela–Ranchi–Burdwan, Rourkela–Kolkata, and Bhubaneswar–Kolkata.

---

## Features

- **AI-Powered Matching** — A multi-factor scoring engine (route, capacity, price, reliability) that matches shippers with truckers in seconds.
- **Real-Time GPS Tracking** — Live location sharing with ETAs, route visualization, and geofence alerts.
- **Digital Freight Credit Score** — 300–900 score for every participant based on completion rates, on-time performance, and reviews.
- **AI Price Prediction** — Market-aligned pricing suggestions based on route, demand, fuel costs, and historical data.
- **Escrow Payments** — Secure milestone-based payment releases with dispute resolution.
- **Bidirectional Reviews** — Both shippers and truckers rate each other after every completed trip.
- **In-App Chat & Negotiation** — Real-time messaging between matched parties.
- **Smart Route Optimization** — OSRM-powered routing, distance, and duration estimation.
- **Templates & Reusable Loads** — Save frequent shipments/trips as templates.
- **Admin Command Center** — Live map monitoring, user management, and moderation tools.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript (strict) |
| Build Tool | Vite 6 |
| UI Library | shadcn/ui + Radix UI |
| Styling | Tailwind CSS 3.4 |
| State/Data | TanStack React Query 5 |
| Auth | Clerk 5 |
| Database | Supabase (PostgreSQL + RLS + Realtime) |
| Maps | Leaflet + React-Leaflet |
| Charts | Recharts 3 |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Analytics | PostHog, Vercel Analytics, GA |
| Routing | React Router DOM 7 |
| Mobile | Capacitor 8 (Android) |
| Hosting | Vercel |

### Key Services

- **Clerk** — Authentication, user management, JWT issuance
- **Supabase** — PostgreSQL database, Realtime subscriptions, Edge Functions
- **OSRM** — Open Source Routing Machine for truck route calculation
- **Nominatim** — OpenStreetMap geocoding
- **Gemini** — Google AI for natural-language freight search parsing

---

## Repository Layout

```
.
├── src/                  # React application source
│   ├── components/       # Shared UI components (shadcn/ui)
│   ├── pages/            # Route-level pages
│   │   ├── public/       # Marketing pages (PublicLayout)
│   │   ├── trucker/      # Trucker dashboard pages
│   │   ├── shipper/      # Shipper dashboard pages
│   │   ├── admin/        # Admin-only pages
│   │   ├── blog/         # Blog system
│   │   └── screens/      # Marketing app previews
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React context providers (Auth, Theme)
│   ├── data/             # Static data (routes, blog, locations)
│   ├── lib/              # Utilities (cn, logger, gemini)
│   ├── utils/            # Business logic (matching, osrm, geocode)
│   ├── types/            # TypeScript type definitions
│   └── test/             # Test files
├── supabase/             # Database + Edge Functions
│   ├── functions/        # Deno Edge Functions (Gemini proxy, price predict, etc.)
│   └── migrations/       # SQL migration files
├── android/              # Capacitor Android project
├── public/               # Static assets (served as-is)
├── docs/                 # Project documentation
├── scripts/              # Utility scripts
├── index.html            # SPA entry point (JSON-LD schemas)
└── vercel.json           # Vercel deployment config
```

---

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 9
- A Clerk application
- A Supabase project

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp .env.example .env
# Fill in your Clerk and Supabase keys

# 3. Start the dev server
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest tests |

---

## Documentation

Detailed documentation lives in [`docs/`](docs/README.md):

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System architecture deep-dive |
| [Getting Started](docs/getting-started.md) | Full local setup guide |
| [Data Models](docs/data-models.md) | Database schema reference |
| [Authentication](docs/authentication.md) | Clerk ↔ Supabase auth flow |
| [Matching Algorithm](docs/matching.md) | AI smart-matching scoring |
| [Realtime](docs/realtime.md) | Supabase Realtime subscriptions |
| [Edge Functions](docs/edge-functions.md) | Supabase Edge Functions reference |
| [Deployment](docs/deployment.md) | Vercel + Capacitor deployment |
| [Mobile (Android)](docs/mobile-android.md) | Android build guide |
| [SEO / GEO](docs/seo/README.md) | SEO & AI-engine optimization |
| [Analytics](docs/analytics/posthog-setup.md) | Analytics instrumentation |

---

## Project Status

**Status:** Active development & pre-launch / early launch

- **Product:** Web app (Vercel) + Android app (Capacitor)
- **Auth:** Live with Clerk
- **Database:** Live with Supabase
- **Analytics:** PostHog, Vercel Analytics, GA instrumented

See [CHANGELOG.md](CHANGELOG.md) for version history and the
[Roadmap](docs/roadmap.md) for planned work.

---

## Contributing

We welcome contributions. Please read:

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

---

## License

This project is **proprietary**. See [LICENSE](LICENSE) for details.
All rights reserved. © 2026 LoadSaathi.

---

<div align="center">

**LoadSaathi** · [loadsaathi.in](https://loadsaathi.in) · [support@loadsaathi.in](mailto:support@loadsaathi.in)

</div>
