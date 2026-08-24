# Improvements & Roadmap

> Honest assessment of what's weak, what's missing, and how to fix it — categorized by cost.

---

## Current State Assessment

### What's Strong

| Area | Status | Notes |
|------|--------|-------|
| **Core functionality** | Working | Auth, posting, matching, chat, GPS, credit score — all implemented |
| **Tech stack** | Modern | React 19, TS strict, Vite 6, Clerk 5, Supabase — solid choices |
| **Performance** | Good | Lazy loading, deferred chunks, LRU caching, throttled APIs |
| **Security** | Solid | RBAC, HTML sanitization, RLS, SECURITY DEFINER RPC |
| **SEO** | Good | JSON-LD, llms.txt, sitemap, meta tags, Open Graph |
| **Mobile** | Working | Capacitor Android build configured |
| **Analytics** | Instrumented | PostHog + GA + Vercel Analytics |
| **Knowledge graph** | Generated | graphify AST-only run (600 nodes, 31 communities) |

### What's Weak

| Area | Severity | Issue |
|------|----------|-------|
| **Automated tests** | HIGH | Only 3 test files (`utils.test.ts`, `chat.test.ts`, `agentic-readiness.test.ts`). Near-zero coverage. |
| **CI/CD** | HIGH | No `.github/workflows/` directory. No automated quality gates. README badge links to non-existent CI. |
| **CONTEXT.md** | MEDIUM | Directory map is stale — doesn't reflect actual `pages/auth/`, `pages/messaging/`, `pages/public/{commercial,tools,...}` structure. |
| **Code duplication** | MEDIUM | `PostTrip.tsx` and `PostShipments.tsx` share ~70% logic (geocode, OSRM, form validation). Dashboard pages repeat similar patterns. |
| **Chat tech debt** | MEDIUM | `docs/FIREBASE-CHAT-MIGRATION-PLAN.md` exists — indicates chat may need migration from Supabase Realtime to Firebase. |
| **Graphify depth** | LOW | AST-only — no semantic extraction. God nodes are utility functions, not business concepts. |
| **Error monitoring** | LOW | No Sentry/error boundary logging beyond PostHog autocapture. |
| **Type exports** | LOW | `types/index.ts` exists but not all components use exported types consistently. |

---

## Fixes by Cost Tier

### Free ($0)

| Fix | Effort | Impact |
|-----|--------|--------|
| **Update CONTEXT.md** | 1 hour | AI agents get accurate architecture context |
| **Add unit tests** | 2-3 days | Catch regressions, enable refactoring |
| **Set up GitHub Actions CI** | 2-4 hours | Automated lint + typecheck + test on every PR |
| **Extract shared form logic** | 1 day | Reduce PostTrip/PostShipments duplication |
| **Run graphify --deep** | 30 min + tokens | Richer code understanding for AI agents |
| **Add error boundary logging** | 2 hours | Capture React errors in PostHog |
| **Create .env.example** | 30 min | New devs know what env vars are needed |
| **Add Storybook** | 1 day | Component documentation + visual testing |

### Low-Cost ($1-50/month)

| Fix | Cost | Impact |
|-----|------|--------|
| **Sentry (free tier)** | $0 (5K events/mo) | Real-time error tracking + stack traces |
| **GitHub Actions (free tier)** | $0 (2K min/mo) | CI/CD pipeline |
| **Chromatic (free tier)** | $0 (5K snapshots) | Visual regression testing |
| **Supabase Pro** | $25/mo | Higher Realtime limits, priority support |
| **Clerk Pro** | $25/mo | More active users, organization features |

### Paid ($50+/month)

| Fix | Cost | Impact |
|-----|------|--------|
| **Supabase Team** | $599/mo | Multiple environments, SOC2 compliance |
| **Vercel Pro** | $20/mo | Faster builds, analytics, team features |
| **Datadog/New Relic** | $15+/mo | Full-stack observability |
| **GraphHopper (self-hosted)** | $0 (self-host) | Private OSRM alternative with truck profiles |
| **Playwright Cloud** | $30+/mo | E2E testing at scale |

---

## Alternative Methods

### Routing (Currently: OSRM Public)

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **OSRM Public** (current) | Free | No setup, good enough | Rate limits, no truck profiles |
| **OSRM Self-Hosted** | Free (server cost) | Full control, custom profiles | Need to maintain server |
| **GraphHopper** | Free tier / $30+/mo | Truck profiles, better routing | Commercial license for production |
| **Google Directions API** | $5/1000 requests | Best accuracy, traffic data | Expensive at scale |
| **Mapbox** | Free tier / $0.50/1K | Beautiful maps, good routing | Vendor lock-in |

### Database (Currently: Supabase)

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **Supabase** (current) | Free / $25+/mo | Realtime built-in, Edge Functions, RLS | Vendor dependency |
| **Firebase** | Free tier / $25+/mo | Better Realtime, more mature | No SQL, vendor lock-in |
| **PlanetScale** | Free tier / $39+/mo | MySQL, branching, good DX | No Realtime built-in |
| **Neon** | Free tier / $19+/mo | PostgreSQL, serverless | No Realtime built-in |
| **Self-hosted Postgres** | Free (server cost) | Full control | Need to manage everything |

### Auth (Currently: Clerk)

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **Clerk** (current) | Free / $25+/mo | Beautiful UI, organizations, JWT templates | Vendor dependency |
| **Auth0** | Free tier / $23+/mo | Enterprise-grade, SSO | Complex setup |
| **Supabase Auth** | Free (included) | Already have Supabase | Less features than Clerk |
| **Firebase Auth** | Free tier | Mature, Google-backed | NoSQL ecosystem |
| **Self-hosted ( Lucia)** | Free | Full control | Build everything yourself |

### Analytics (Currently: PostHog + GA + Vercel)

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **PostHog** (current) | Free tier | Product analytics, session replay | Can be heavy |
| **Plausible** | $9+/mo | Privacy-first, lightweight | Less features |
| **Umami** | Free (self-host) | Open source, simple | Limited features |
| **Mixpanel** | Free tier | Great for funnels | Event-based pricing |
| **Amplitude** | Free tier | Best for product analytics | Enterprise pricing |

---

## Future Feature Opportunities

### High Impact (Do First)

| Feature | Why | Effort |
|---------|-----|--------|
| **Escrow payments** | Core value prop, trust building | 2-3 weeks |
| **Push notifications** | Re-engage users, real-time updates | 1 week |
| **Multi-language (Hindi, Odia)** | East India market needs local languages | 1-2 weeks |
| **Template system improvements** | Reduce friction for repeat users | 3-5 days |

### Medium Impact

| Feature | Why | Effort |
|---------|-----|--------|
| **Load consolidation** | Multiple small shipments on one truck | 2-3 weeks |
| **Dynamic pricing** | Real-time market rates | 1-2 weeks |
| **Driver app (separate)** | Dedicated trucker experience | 4-6 weeks |
| **Document upload** | E-way bills, POD, invoices | 1 week |

### Lower Impact (Nice to Have)

| Feature | Why | Effort |
|---------|-----|--------|
| **Carbon footprint tracking** | ESG compliance, green logistics | 3-5 days |
| **Insurance integration** | Cargo insurance marketplace | 2-3 weeks |
| **Toll calculator** | Estimate total trip cost | 3-5 days |
| **Weather integration** | Route weather alerts | 3-5 days |

---

## Priority Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up GitHub Actions CI (lint + typecheck + test)
- [ ] Add unit tests for core utils (matching, geocode, osrm, chat)
- [ ] Fix CONTEXT.md (update directory map)
- [ ] Extract shared form logic (PostTrip/PostShipments)
- [ ] Run graphify --deep for richer code understanding

### Phase 2: Core Features (Weeks 3-4)
- [ ] Implement escrow payments (Supabase Edge Function + payment gateway)
- [ ] Add push notifications (Capacitor Push + Firebase Cloud Messaging)
- [ ] Multi-language support (Hindi, Odia)
- [ ] Error monitoring (Sentry free tier)

### Phase 3: Growth (Weeks 5-8)
- [ ] Load consolidation feature
- [ ] Dynamic pricing engine
- [ ] Driver app (separate Capacitor build)
- [ ] Document upload system

### Phase 4: Scale (Months 3+)
- [ ] Insurance integration
- [ ] Multi-city expansion
- [ ] Enterprise API
- [ ] Advanced analytics dashboard

---

*Last verified: 2026-08-24*
