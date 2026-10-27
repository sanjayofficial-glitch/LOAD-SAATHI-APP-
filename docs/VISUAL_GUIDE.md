# LoadSaathi Visual Guide

**Understand the whole app in diagrams — without reading everything.**
Every diagram below renders natively on GitHub. For deeper per-topic diagrams, see the [Diagram Directory](DIAGRAMS.md).

---

## 1. What is LoadSaathi?

```mermaid
mindmap
  root((LoadSaathi))
    The problem
      Empty return trips waste fuel
      PTL freight is expensive for MSMEs
      Phone-call booking is slow and opaque
    The solution
      Shared freight marketplace
      AI smart matching
      Live GPS tracking
      Digital credit scores
    Who uses it
      Shippers and MSMEs
      Truckers and fleet owners
      Admin and ops team
    Where it runs
      Web at loadsaathi.in
      Android via Capacitor
      East India corridor network
    The outcome
      Up to 40 percent freight savings
      Fewer empty miles
      Lower emissions
```

> **One sentence:** LoadSaathi is India's AI-powered shared freight marketplace connecting shippers and truckers for PTL/LTL loads across East India — AI matching, real-time GPS tracking, and digital credit scores eliminate empty return trips and cut freight costs by up to 40%.

---

## 2. How a load moves (the core marketplace loop)

```mermaid
flowchart LR
    S["Shipper posts a load"] --> M["AI smart matching scores truck trips"]
    M --> T["Trucker accepts and books"]
    T --> G["Live GPS tracking + chat"]
    G --> D["Delivery with proof"]
    D --> P["Escrow-backed payment"]
    P --> R["Reviews feed the credit score"]
    R -.->|"reputation improves next match"| M
```

---

## 3. System architecture at a glance

```mermaid
flowchart TB
    subgraph CLIENTS["Clients"]
        WEB["Web SPA — React 19, Vite, Tailwind, shadcn/ui"]
        AND["Android — Capacitor build of the same SPA"]
    end

    subgraph VERCEL["Vercel — serverless api/"]
        SSR["agent.js — SSR SEO + route HTML"]
        LQ["lead-quote.js — lead capture"]
        CRON["cron — diesel prices, daily jobs"]
    end

    subgraph SUPA["Supabase"]
        DB[("Postgres + RLS + Storage")]
        RT["Realtime channels"]
        EF["15 Edge Functions — Deno: matching, price-predict, lead-alert, fraud-detect, gemini-proxy…"]
    end

    subgraph EXTERNAL["External services"]
        CL["Clerk — authentication"]
        OSRM["OSRM — route + distance"]
        NOM["Nominatim — geocoding"]
        GM["Gemini — NL search parsing"]
        PH["PostHog + GA4 + GTM — analytics"]
    end

    WEB --> VERCEL
    AND --> VERCEL
    WEB --> SUPA
    WEB --> EXTERNAL
    VERCEL --> SUPA
    EF --> DB
```

---

## 4. Feature map

```mermaid
mindmap
  root((Features))
    Marketplace
      Post shipment
      Smart matching
      Browse live trips
      Return loads
    Pricing tools
      Fare calculator
      Freight rate calculator
      Toll and fuel
      GST calculator
      PTL vs FTL
      Trip profit and waiting cost
    Trust and money
      KYC verification
      Credit score
      Escrow payments
      Reviews
    AI layer
      Freddy avatar guide
      Gemini natural-language search
      Price prediction
    Logistics ops
      Live GPS tracking
      Emissions tracking
      Load securing checklist
      WhatsApp deep links
    Admin
      Moderation
      Verification queue
      Team manager
      Audit log
    Content
      Blog articles
      Hinglish pages
      SEO and GEO landing pages
```

---

## 5. Two user journeys

```mermaid
flowchart LR
    subgraph SHIP["Shipper journey"]
        S1["Register — Clerk"] --> S2["Post shipment — route, cargo, dates"]
        S2 --> S3["Receive AI matches and quotes"]
        S3 --> S4["Book + track live"]
        S4 --> S5["Deliver, pay, review"]
    end
```

```mermaid
flowchart LR
    subgraph TRK["Trucker journey"]
        T1["Register + KYC"] --> T2["List truck and trips"]
        T2 --> T3["Get matched to return loads"]
        T3 --> T4["Fill empty miles"]
        T4 --> T5["Earn + build credit score"]
    end
```

---

## 6. Where everything lives (repository map)

```mermaid
flowchart TB
    ROOT["LoadSaathi repository"] --> SRC["supabase/src — the React app: pages, components, hooks, utils, theme"]
    ROOT --> API["api — Vercel serverless functions"]
    ROOT --> SB["supabase — Edge Functions, migrations, RLS schema"]
    ROOT --> AND["android — Capacitor project"]
    ROOT --> PUB["public — prerendered pages, PWA assets, icons"]
    ROOT --> SCR["scripts — build, prerender, smoke, graphify helpers"]
    ROOT --> DOCS["docs — documentation hub"]
    ROOT --> PLANS["plans — numbered implementation plans"]
    ROOT --> BLG["Blogs — article drafts"]
    ROOT --> MEM[".memory — agent memory + graphify-out — knowledge graph"]

    DOCS --> D1["VISUAL_GUIDE.md — this page"]
    DOCS --> D2["DIAGRAMS.md — full diagram index"]
    DOCS --> D3["handbook/ — 9 audience-routed guides"]
    DOCS --> D4["CONTEXT.md — definitive codebase context"]
    DOCS --> D5["architecture, data-models, deployment…"]
    DOCS --> D6["seo/ — SEO strategy + plans"]
```

**Root stays minimal by design:** only `README.md`, `CHANGELOG.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `AI_RULES.md` and config files.

---

## 7. Recent change history

```mermaid
timeline
    title Recent repository history
    2026-10-19 : Graphify knowledge graph rebuilt — 1234 nodes
              : Light becomes the default theme for new visitors
    2026-10-20 : Dark mode removed — app locked to light permanently
              : ThemeToggle deleted, legacy theme preference cleared
              : Typecheck + 151 tests + production build verified
    2026-10-21 : Documentation reorganized folder-wise
              : Visual Guide added for diagram-first understanding
```

---

## 8. What to read next

| If you want to… | Read | Depth |
| --- | --- | --- |
| See every diagram in one place | [DIAGRAMS.md](DIAGRAMS.md) | Index |
| Understand the product non-technically | [handbook/01-overview-non-technical.md](handbook/01-overview-non-technical.md) | Short |
| Learn the flows in detail | [handbook/03-core-flows.md](handbook/03-core-flows.md) | Deep — 11 diagrams |
| Understand the code structure | [CONTEXT.md](CONTEXT.md) | Deep |
| Work on the architecture | [architecture.md](architecture.md) | Deep |
| Run the project locally | [getting-started.md](getting-started.md) | Practical |
| Deploy it | [deployment.md](deployment.md) | Practical |
| Contribute code | [../CONTRIBUTING.md](../CONTRIBUTING.md) | Short |
