# CONTEXT.md — LoadSaathi App Codebase Context

> **Purpose:** This file provides AI coding agents (Cursor, Claude Engineer, Devin, Windsurf, etc.) with a comprehensive understanding of the LoadSaathi codebase. Read this before making any changes.

---

## 1. SYSTEM ARCHITECTURE & TECH STACK

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React + TypeScript | React 19.2, TS 5.5 | SPA with strict typing |
| Build Tool | Vite | 6.3 | Dev server + production build |
| UI Library | shadcn/ui + Radix UI | Radix latest | Accessible component primitives |
| Styling | Tailwind CSS | 3.4 | Utility-first CSS |
| State/Data | TanStack React Query | 5.56 | Server state caching + mutations |
| Auth | Clerk | 5.61 | Authentication + user management |
| Database | Supabase (PostgreSQL) | 2.99 | Database + Realtime subscriptions |
| Maps | Leaflet + React-Leaflet | 1.9 / 5.0 | Map rendering + GPS tracking |
| Charts | Recharts | 3.9 | Dashboard visualizations |
| Forms | React Hook Form + Zod | 7.53 / 3.23 | Form state + validation |
| Animation | Framer Motion | 12.43 | Page transitions + micro-interactions |
| Analytics | PostHog + Vercel Analytics + GA | — | Event tracking + web vitals |
| Mobile | Capacitor | 8.4 | Android hybrid app wrapper |
| Hosting | Vercel | — | Static hosting + edge functions |
| Routing | React Router DOM | 7.6 | Client-side routing |
| SEO | React Helmet Async | 3.0 | Dynamic meta tags + JSON-LD |

### Key Services
- **Clerk:** Handles sign-up, sign-in, JWT issuance, user profile management
- **Supabase:** PostgreSQL database with Row Level Security (RLS), Realtime subscriptions, Edge Functions
- **OSRM:** Open Source Routing Machine for truck route calculation
- **Nominatim:** OpenStreetMap geocoding for city/state lookups
- **Gemini:** Google AI for natural language freight search parsing
- **PostHog:** Product analytics and session recording
- **Vercel:** Hosting, deployment, and serverless functions

---

## 2. DIRECTORY MAP & FILE TREE

```
LOAD-SAATHI-APP-1-OSRM/
├── src/
│   ├── App.tsx                    # Root component: ALL route definitions + providers
│   ├── main.tsx                   # Entry point (React root)
│   ├── globals.css                # Tailwind directives + CSS custom properties
│   │
│   ├── pages/                     # Route components (lazy-loaded via React.lazy)
│   │   ├── Index.tsx              # Homepage (hero, tabs, corridors, FAQ — ~1039 lines)
│   │   ├── Login.tsx              # Clerk sign-in
│   │   ├── Register.tsx           # Clerk sign-up
│   │   ├── ChooseRole.tsx         # Post-registration role selection (shipper/trucker)
│   │   ├── ForgotPassword.tsx     # Password reset
│   │   ├── Profile.tsx            # User profile page
│   │   ├── TripDetail.tsx         # Public trip detail view
│   │   ├── Favorites.tsx          # Saved trips/shipments
│   │   ├── CreditScore.tsx        # Credit score display page
│   │   ├── Chat.tsx               # Real-time messaging (per request)
│   │   ├── ChatList.tsx           # Conversation list
│   │   ├── NotFound.tsx           # 404 page
│   │   │
│   │   ├── public/                # Marketing/info pages (PublicLayout wrapper)
│   │   │   ├── About.tsx          # Company info + founding story
│   │   │   ├── Contact.tsx        # Contact form + info
│   │   │   ├── FAQ.tsx            # FAQ accordion
│   │   │   ├── FareCalculator.tsx # Price estimation tool
│   │   │   ├── Features.tsx       # Feature showcase (tabs)
│   │   │   ├── Gallery.tsx        # App screenshots gallery
│   │   │   ├── HowItWorks.tsx     # Step-by-step guide
│   │   │   ├── Pricing.tsx        # Pricing tiers (Shipper/Trucker)
│   │   │   ├── Privacy.tsx        # Privacy policy
│   │   │   ├── SafetyTrust.tsx    # Safety features
│   │   │   ├── SharedShipment.tsx # Public share links for shipments
│   │   │   ├── SharedTrip.tsx     # Public share links for trips
│   │   │   ├── ShipperSolution.tsx# Shipper-focused landing
│   │   │   ├── TruckerSolution.tsx# Trucker-focused landing
│   │   │   ├── Terms.tsx          # Terms of service
│   │   │   ├── RoutesIndex.tsx    # All freight routes listing (30+)
│   │   │   ├── RouteDetail.tsx    # Individual route detail page
│   │   │   ├── locations/
│   │   │   │   └── LocationPage.tsx  # Dynamic /location/:city
│   │   │   └── guides/
│   │   │       └── GuidePage.tsx  # Dynamic /guide/:slug
│   │   │
│   │   ├── trucker/               # Trucker role pages
│   │   │   ├── Dashboard.tsx      # Trucker dashboard
│   │   │   ├── PostTrip.tsx       # Create new trip
│   │   │   ├── TruckerHub.tsx     # My trips list
│   │   │   ├── EditTrip.tsx       # Edit trip
│   │   │   ├── TruckerTripDetail.tsx  # Trip detail (trucker view)
│   │   │   ├── BrowseShipments.tsx    # Find shipments to carry
│   │   │   └── TruckerHistory.tsx     # Trip history
│   │   │
│   │   ├── shipper/               # Shipper role pages
│   │   │   ├── Dashboard.tsx      # Shipper dashboard
│   │   │   ├── PostShipments.tsx  # Create new shipment
│   │   │   ├── MyShipments.tsx    # My shipments list
│   │   │   ├── ShipmentDetail.tsx # Shipment detail
│   │   │   ├── EditShipment.tsx   # Edit shipment
│   │   │   ├── BrowseTrips.tsx    # Find available trucks
│   │   │   └── ShipperHistory.tsx # Shipment history
│   │   │
│   │   ├── admin/                 # Admin-only pages (role-protected)
│   │   │   ├── Dashboard.tsx      # Admin dashboard
│   │   │   ├── MonitoringDashboard.tsx  # System monitoring
│   │   │   ├── UserManagement.tsx      # User admin
│   │   │   ├── Moderation.tsx          # Content moderation
│   │   │   ├── GalleryManager.tsx      # Screenshot manager
│   │   │   └── TeamManager.tsx         # Team management
│   │   │
│   │   ├── blog/                  # Blog system
│   │   │   ├── BlogList.tsx       # Blog listing page
│   │   │   └── BlogArticle.tsx    # Individual blog post
│   │   │
│   │   └── screens/               # App preview screenshots (marketing)
│   │       ├── DashboardPreview.tsx
│   │       ├── MatchingPreview.tsx
│   │       ├── ChatPreview.tsx
│   │       ├── CreditScorePreview.tsx
│   │       ├── ReviewsPreview.tsx
│   │       └── AdminPreview.tsx
│   │
│   ├── components/                # Shared reusable components
│   │   ├── Layout.tsx             # Authenticated app layout (sidebar + nav)
│   │   ├── PublicLayout.tsx       # Marketing pages layout (navbar + footer)
│   │   ├── SeoMeta.tsx            # SEO meta tags + JSON-LD injector
│   │   ├── ErrorBoundary.tsx      # React error boundary
│   │   ├── Breadcrumbs.tsx        # Breadcrumb navigation
│   │   ├── GpsTracker.tsx         # Real-time GPS tracking component
│   │   ├── LiveMap.tsx            # Leaflet map component
│   │   ├── RouteMap.tsx           # Route visualization on map
│   │   ├── MapControls.tsx        # Map UI controls
│   │   ├── PricePredictor.tsx     # AI price prediction display
│   │   ├── AIInsights.tsx         # AI insights display
│   │   ├── CreditScore.tsx        # Credit score card
│   │   ├── CreditScoreBadges.tsx  # Achievement badges
│   │   ├── CreditScoreChart.tsx   # Score visualization
│   │   ├── CreditScoreFactors.tsx # Score factor breakdown
│   │   ├── ReviewDialog.tsx       # Post-trip review modal
│   │   ├── FavoriteButton.tsx     # Save/unsave toggle
│   │   ├── NotificationBell.tsx   # Real-time notification bell
│   │   ├── AuthSync.tsx           # Clerk ↔ Supabase profile sync
│   │   ├── RoleProtectedRoute.tsx # Role-based route guard
│   │   ├── LocationSelector.tsx   # City picker with geocoding
│   │   ├── TemplateSelector.tsx   # Shipment/trip templates
│   │   ├── SaveAsTemplate.tsx     # Save as template dialog
│   │   ├── VerificationBadge.tsx  # Verified user badge
│   │   ├── Star.tsx               # Star rating display
│   │   ├── ThemeToggle.tsx        # Dark/light mode toggle
│   │   ├── LogoMark.tsx           # SVG logo
│   │   ├── OfflineBanner.tsx      # Network status banner
│   │   ├── EmissionsCard.tsx      # Carbon emissions display
│   │   ├── IndexSkeleton.tsx      # Homepage loading skeleton
│   │   ├── PostHogProvider.tsx    # PostHog analytics provider
│   │   ├── GoogleAnalytics.tsx    # GA tracker
│   │   └── ui/                    # shadcn/ui components (40+ files)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── badge.tsx
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── avatar.tsx
│   │       ├── checkbox.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── label.tsx
│   │       ├── radio-group.tsx
│   │       ├── separator.tsx
│   │       ├── skeleton.tsx
│   │       ├── switch.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── tooltip.tsx
│   │       ├── scroll-area.tsx
│   │       ├── progress.tsx
│   │       ├── sheet.tsx
│   │       ├── table.tsx
│   │       ├── form.tsx
│   │       ├── popover.tsx
│   │       ├── calendar.tsx
│   │       └── ... (more shadcn components)
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useSupabase.ts         # Authenticated Supabase client
│   │   ├── useCreditScore.ts      # Credit score data fetching
│   │   ├── usePricePrediction.ts  # AI price prediction
│   │   ├── useSmartMatch.ts       # Smart matching logic
│   │   ├── useNetworkStatus.ts    # Online/offline detection
│   │   └── use-mobile.tsx         # Mobile viewport detection
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         # Auth state (Clerk user + Supabase profile)
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Anonymous Supabase client (Realtime only)
│   │       ├── final-schema.sql   # Full DB schema + RLS policies + indexes
│   │       └── apply-rls.sql      # RLS migration script
│   │
│   ├── config/
│   │   └── env.ts                 # Zod-validated environment variables
│   │
│   ├── data/                      # Static data (imported at build time)
│   │   ├── routes.ts              # 30+ freight route definitions
│   │   ├── blog.ts                # Blog post metadata + content
│   │   └── locations.json         # City data for location pages
│   │
│   ├── lib/
│   │   ├── utils.ts               # cn() helper (clsx + tailwind-merge)
│   │   ├── logger.ts              # Structured logging utility
│   │   └── gemini.ts              # Natural language search parser
│   │
│   ├── utils/
│   │   ├── supabaseClient.ts      # Clerk-authenticated Supabase client factory
│   │   ├── matching.ts            # AI match score calculator (7 factors)
│   │   ├── osrm.ts                # OSRM routing API + LRU cache
│   │   ├── geocode.ts             # Nominatim geocoding
│   │   ├── format.ts              # Date/number formatters
│   │   ├── chat.ts                # Chat utilities
│   │   ├── notifications.ts       # Push notification helpers
│   │   ├── emissions.ts           # Carbon emission calculator
│   │   ├── chartTheme.ts          # Recharts theme config
│   │   ├── posthog.ts             # PostHog client initialization
│   │   ├── capacitorOAuth.ts      # OAuth for Capacitor (native app)
│   │   ├── toast.ts               # Sonner toast helpers
│   │   └── whatsapp.ts            # WhatsApp share link generator
│   │
│   ├── theme/
│   │   └── theme.tsx              # Dark/light theme context provider
│   │
│   ├── types/
│   │   ├── index.ts               # Core data models
│   │   └── chat.ts                # Chat-specific types
│   │
│   └── test/                      # Test files
│
├── public/                        # Static assets (served as-is)
│   ├── robots.txt                 # AI-crawler-friendly robots.txt
│   ├── sitemap.xml                # XML sitemap (60+ URLs)
│   ├── llms.txt                   # Machine-readable site summary
│   ├── pricing.md                 # Machine-readable pricing data
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   ├── logo.png                   # App logo
│   ├── icons/                     # Favicon set
│   └── blog/                      # Blog post images
│
├── android/                       # Capacitor Android project
├── supabase/                      # Supabase CLI config
├── scripts/                       # Build/utility scripts
├── docs/                          # Documentation
│   ├── README.md                  # Docs index
│   ├── architecture.md            # System architecture deep-dive
│   ├── getting-started.md         # Local setup guide
│   ├── data-models.md             # Database schema reference
│   ├── authentication.md          # Clerk ↔ Supabase auth flow
│   ├── realtime.md                # Supabase Realtime subscriptions
│   ├── matching.md                # AI smart-matching algorithm
│   ├── edge-functions.md          # Supabase Edge Functions reference
│   ├── deployment.md              # Vercel + Capacitor deployment
│   ├── mobile-android.md          # Android build guide
│   ├── environment-variables.md   # Env var reference + Zod validation
│   ├── roadmap.md                 # Product roadmap
│   ├── llms.txt                   # Machine-readable site summary (copy)
│   ├── llms-full.txt              # Extended site summary (copy)
│   ├── seo/                       # SEO/GEO strategy
│   │   └── README.md              # SEO/GEO overview + index
│   ├── analytics/                 # Analytics instrumentation
│   └── assets/                    # Brand assets (logo, team photos)
├── dist/                          # Vite build output (gitignored)
├── vercel.json                    # Vercel deployment config
├── vite.config.ts                 # Vite build config (manual chunks)
├── tailwind.config.ts             # Tailwind config
├── tsconfig.json                  # TypeScript config
├── capacitor.config.ts            # Capacitor Android config
├── package.json                   # Dependencies + scripts
├── pnpm-lock.yaml                 # Lock file
├── index.html                     # SPA entry point (global JSON-LD schemas)
├── AI_RULES.md                    # Coding agent rules
├── CONTEXT.md                     # This file
└── loadsaathi.code-workspace      # VS Code workspace file
```

---

## 3. CORE SYSTEM FLOWS

### Flow 1: Authentication (Clerk → Supabase)
```
User → Clerk Sign-in/Sign-up
  → Clerk issues JWT
  → AuthContext.fetchProfile() called
  → createClerkSupabaseClient(token) creates authenticated Supabase client
  → Queries Supabase users table with Clerk user ID
  → Returns userProfile (id, email, user_type, full_name, phone, rating, verified)
  → userProfile stored in React state → available via useAuth() hook
```

### Flow 2: Post Trip (Trucker)
```
TruckerDashboard → PostTrip form
  → Geocode origin/dest cities → get lat/lng coordinates
  → OSRM getRoute() → calculate distance, duration, tolls
  → User fills: vehicle type, capacity, price, departure date
  → Supabase INSERT INTO trips → Realtime event
  → Shippers subscribed to trips table get notified
```

### Flow 3: Post Shipment (Shipper)
```
ShipperDashboard → PostShipments form
  → Geocode origin/dest cities → get lat/lng coordinates
  → OSRM getRoute() → calculate distance, duration
  → User fills: weight, budget, goods description, special requirements
  → Supabase INSERT INTO shipments → Realtime event
  → Truckers subscribed to shipments table get notified
```

### Flow 4: Smart Matching (AI Algorithm)
```
useSmartMatch hook → fetch active trips/shipments from Supabase
  → calculateMatchScore() for each potential pair:
    1. City match (+20 if same city)
    2. Proximity score (+15 for <20km from route)
    3. Route overlap (+20 if within 10km of origin/dest)
    4. Capacity fit (+10 if cargo ≤ truck capacity)
    5. Price alignment (+10 if within 20% of budget)
    6. Date match (+10 if departure within 3 days)
    7. Rating bonus (+15 for truckers with 4.5+ rating)
  → Sorted results with match % displayed to user
```

### Flow 5: Request & Accept
```
Shipper clicks "Request" on trip
  → INSERT INTO requests (trip_id, shipper_id, status='pending')
  → Trucker receives notification → reviews request
  → Trucker accepts → UPDATE requests.status = 'accepted'
  → UPDATE shipments.status = 'matched'
  → Chat enabled between shipper and trucker
```

### Flow 6: Real-time Chat
```
Chat component → Supabase Realtime subscription on messages table
  → User types message → INSERT INTO messages
  → Realtime event → recipient's UI updates instantly
  → Messages stored with request_id, sender_id, recipient_id, content, is_read
```

### Flow 7: GPS Tracking
```
AutoGpsTracker → navigator.geolocation.watchPosition() every 30 seconds
  → Supabase UPDATE trips SET origin_lat = lat, origin_lng = lng
  → LiveMap re-renders marker position
  → Geofence alerts via notifications table (when within 50km of destination)
```

### Flow 8: Credit Score Calculation
```
useCreditScore hook → Supabase RPC function (calculate_credit_score)
  → Factors:
    - Completion rate (30%)
    - On-time delivery (25%)
    - Communication quality (15%)
    - Review ratings (20%)
    - Account tenure (10%)
  → Returns score (300-900) + individual factor scores
```

### Flow 9: AI Price Prediction
```
usePricePrediction hook → Supabase edge function (gemini-proxy)
  → Sends: origin, destination, weight, goods type, date
  → Gemini API analyzes route + market demand
  → Returns: min price, max price, recommended price, confidence level
```

### Flow 10: SEO/AEO Content Delivery
```
Each page → SeoMeta component → Helmet injects:
  - <title> tag
  - <meta name="description">
  - Open Graph tags (og:title, og:description, og:image)
  - Twitter card tags
  - Canonical URL
  - JSON-LD structured data

index.html has global schemas:
  - Organization schema
  - LocalBusiness schema
  - WebSite schema with SearchAction

public/robots.txt:
  - Allows all crawlers (GPTBot, ClaudeBot, PerplexityBot, Googlebot)
  - Sitemap reference
  - Crawl-delay: 5

public/llms.txt:
  - Machine-readable site summary for AI bots
  - Links to pricing.md (detailed pricing)

public/pricing.md:
  - Structured pricing data for AI extraction
```

---

## 4. STATE MANAGEMENT & DATA MODELS

### State Management
```
NO Redux, NO Zustand, NO Jotai

1. Global Auth State:
   - React Context (AuthContext) → useAuth() hook
   - Contains: Clerk user object + Supabase userProfile
   - AuthSync component keeps Clerk ↔ Supabase in sync

2. Server State:
   - TanStack React Query (useQuery/useMutation)
   - All database operations go through React Query
   - Automatic caching, retry, refetch on focus

3. Theme State:
   - React Context (ThemeProvider) → useTheme() hook
   - Persists to localStorage ('loadsaathi-theme')
   - Respects system preference on first visit

4. Component State:
   - useState/useReducer for local UI state
   - Form state via React Hook Form (useForm)
```

### Data Models (Supabase Tables)
```typescript
// users table
interface User {
  id: string;           // Clerk user ID
  email: string;
  user_type: 'shipper' | 'trucker';
  full_name: string;
  phone: string;
  company_name?: string;
  vehicle_type?: string;  // truckers only
  rating: number;         // 0-5
  total_trips: number;
  verified: boolean;
  created_at: string;
}

// trips table
interface Trip {
  id: string;             // UUID
  trucker_id: string;     // FK → users.id
  origin_city: string;
  origin_state: string;
  origin_lat: number;
  origin_lng: number;
  dest_city: string;
  dest_state: string;
  dest_lat: number;
  dest_lng: number;
  vehicle_type: string;
  capacity_kg: number;
  price_per_kg: number;
  available_capacity_kg: number;
  departure_date: string;
  status: 'active' | 'full' | 'completed' | 'cancelled';
  created_at: string;
}

// shipments table
interface Shipment {
  id: string;             // UUID
  shipper_id: string;     // FK → users.id
  origin_city: string;
  origin_state: string;
  origin_lat: number;
  origin_lng: number;
  dest_city: string;
  dest_state: string;
  dest_lat: number;
  dest_lng: number;
  weight_kg: number;
  budget: number;
  goods_description: string;
  status: 'open' | 'matched' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
}

// requests table (shipper → trucker trip request)
interface Request {
  id: string;
  trip_id: string;        // FK → trips.id
  shipment_id: string;    // FK → shipments.id
  shipper_id: string;     // FK → users.id
  receiver_id: string;    // FK → users.id (trucker)
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
}

// shipment_requests table (trucker → shipper shipment request)
interface ShipmentRequest {
  id: string;
  shipment_id: string;    // FK → shipments.id
  trucker_id: string;     // FK → users.id
  shipper_id: string;     // FK → users.id
  proposed_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
}

// reviews table
interface Review {
  id: string;
  trip_id: string;
  trucker_id: string;
  shipper_id: string;
  reviewer_role: 'shipper' | 'trucker';
  rating: number;         // 1-5
  comment: string;
  created_at: string;
}

// messages table
interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  request_id: string;     // FK → requests.id
  is_read: boolean;
  created_at: string;
}

// notifications table
interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  related_trip_id?: string;
  type: 'info' | 'match' | 'request' | 'message';
  created_at: string;
}

// Realtime subscriptions enabled for:
// trips, shipments, requests, shipment_requests, messages, notifications
```

---

## 5. CODING STANDARDS & RULES

### Language & Framework
- **TypeScript strict mode** — no `any` types allowed
- **React 19** functional components only — no class components
- **React hooks** only — no lifecycle methods

### Styling
- **Tailwind CSS exclusively** — no inline styles, no CSS modules, no styled-components
- Use `cn()` helper from `lib/utils.ts` for conditional classes
- Color tokens defined in `globals.css` CSS custom properties

### Components
- **shadcn/ui** from `./components/ui/` — never edit ui/ files directly
- Use `lucide-react` for all icons
- New components go in `src/components/`

### Forms
- **React Hook Form** for all forms
- **Zod** for validation schemas
- Pattern: `useForm<ZodType>()` with `zodResolver`

### Data Fetching
- **TanStack React Query** for all database operations
- Never use raw `fetch()` for Supabase calls
- Pattern: `useQuery({ queryKey: [...], queryFn: () => supabase.from('table').select() })`

### Authentication
- Always use `useSupabase()` hook for authenticated DB operations
- Never create Supabase clients directly in components
- Clerk JWT is automatically attached via `createClerkSupabaseClient()`

### Realtime
- Use anonymous Supabase client from `integrations/supabase/client.ts`
- Never use authenticated client for Realtime subscriptions
- Pattern: `supabase.channel('channel-name').on('postgres_changes', {...}).subscribe()`

### Routing
- All routes defined in `src/App.tsx`
- Public routes wrapped in `<PublicLayout>`
- Protected routes wrapped in `<Layout>` + role checks
- Lazy-loaded via `React.lazy()` + `Suspense`

### File Naming
- **PascalCase** for components (`.tsx`): `UserProfile.tsx`
- **camelCase** for utils/hooks (`.ts`): `useSupabase.ts`, `matching.ts`
- **kebab-case** for config (`.ts`): `tailwind.config.ts`

### SEO Requirements
- Every public page MUST use `<SeoMeta>` component
- Required props: `title`, `description`, `canonical`
- Optional: `jsonLd`, `breadcrumbs`, `author`, `publishedTime`

### Environment Variables
- All env vars validated in `config/env.ts` via Zod
- Access via `import { env } from '@/config/env'`
- Never access `import.meta.env` directly outside `env.ts`

---

## 6. TROUBLESHOOTING & COMMON BUGS

### Build & Dev Issues

**"Failed to fetch dynamically imported module"**
- Cause: Stale index.html references deleted JS bundle
- Fix: Run `pnpm run build` to regenerate

**"Clerk key missing" or auth not working**
- Cause: Missing or invalid Clerk publishable key
- Fix: Check `VITE_CLERK_PUBLISHABLE_KEY` in `.env`
- Must start with `pk_test_` or `pk_live_`

**"Supabase RLS policy violation"**
- Cause: Row Level Security blocking queries
- Fix: Check `final-schema.sql` policies — all tables have RLS enabled
- Ensure user is authenticated and has correct `user_type`

### Geolocation & Maps

**Geocoding returns null coordinates**
- Cause: Nominatim rate limiting or invalid city name
- Fix: Check origin/dest state fields as fallback
- Rate limit: 1 request/second

**OSRM returns no route**
- Cause: Coordinates may be inverted
- Fix: Verify lat/lng order (OSRM expects lng,lat)
- Note: Geocoding returns lat first, OSRM needs lng first

**GPS tracker not updating**
- Cause: Browser requires HTTPS for geolocation
- Fix: Check Capacitor config for Android, ensure Vercel HTTPS

### UI & Theme

**Dark mode flash on page load**
- Cause: localStorage read happening after React mount
- Fix: Check theme.tsx reads `localStorage` in `useState` initializer

**Theme toggle not persisting**
- Cause: localStorage write failing
- Fix: Check `localStorage.setItem('loadsaathi-theme', ...)` in theme.tsx

### Data & Matching

**Match score always shows 0%**
- Cause: Trips/shipments missing lat/lng coordinates
- Fix: Ensure geocoding runs on form submit — proximity score requires coordinates

**Realtime not receiving updates**
- Cause: Channel subscription failing silently
- Fix: Check Supabase Realtime is enabled for the table in dashboard
- Ensure using anonymous client, not authenticated client

### Blog & SEO

**Blog content not rendering**
- Cause: slug mismatch between route and blog.ts data
- Fix: Check `BlogArticle.tsx` maps slug → entry from `blog.ts`

**SEO meta tags not appearing**
- Cause: Helmet not wrapping the app
- Fix: Ensure `<HelmetProvider>` is in `main.tsx`

**JSON-LD not showing in page source**
- Cause: Dynamic JSON-LD not being server-rendered
- Fix: Add static JSON-LD to `index.html` for global schemas
- Dynamic schemas injected by `SeoMeta` component

### Capacitor (Mobile)

**OAuth login fails on Android**
- Cause: Deep link not configured
- Fix: Check `capacitor.config.ts` allowNavigation list includes all auth domains

**App crashes on launch**
- Cause: Missing Capacitor sync
- Fix: Run `npx cap sync` after build

---

## 7. AEO/GEO CONTENT RULES

### Purpose
These rules ensure all content is optimized for AI Answer Engines (GPT, Perplexity, Claude, Gemini) while maintaining human readability.

### Rules for Content Creation

1. **Noscript blocks on all public pages** — Every page rendered by React MUST have a `<noscript>` block with the same content for AI bots that don't execute JavaScript.

2. **Article schema on blog posts** — Every blog post must have `BlogPosting` JSON-LD schema with `headline`, `author`, `datePublished`, `dateModified`, `image`, `publisher`.

3. **Statistics with sources** — When citing market data or statistics, always include the source name and year. Example: "Indian logistics market: $350B+ (IBEF 2026)".

4. **Author bylines** — All blog posts must show visible author name, title, and last-updated date.

5. **Comparison content** — Create "X vs Y" pages for key comparisons. AI engines cite comparison content 33% more often.

6. **Self-contained answer blocks** — Key information should be answerable from a single paragraph without requiring additional context.

7. **FAQ schema** — Use `FAQPage` JSON-LD schema on pages with Q&A content. Ensure questions are natural language and answers are complete.

8. **HowTo schema** — Use `HowTo` JSON-LD schema on instructional pages. Include `name`, `step`, `image`, `text`.

9. **Freshness signals** — Add "Last updated: [date]" visible on all public pages.

10. **Machine-readable files** — Maintain `llms.txt` and `pricing.md` for AI bot context.

### Content Structure for AI Optimization

```
Page Structure:
├── Title (H1) — include primary keyword
├── Self-contained intro paragraph (100-200 words)
│   └── Must answer "What is this?" without scrolling
├── Key statistics (with sources)
├── Detailed content sections
├── FAQ section (3-5 questions)
├── CTA (call to action)
└── Footer with related links

Blog Post Structure:
├── Author byline (name, title, date)
├── Featured image with alt text
├── Table of contents (optional)
├── Self-contained summary (150 words)
├── Detailed sections with H2/H3
├── Statistics with inline citations
├── FAQ section
├── Related posts
└── Author bio at bottom
```

### JSON-LD Schema Templates

**BlogPosting:**
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Title Here",
  "author": {
    "@type": "Person",
    "name": "Sanjaya Sahu",
    "jobTitle": "Founder & CEO",
    "url": "https://loadsaathi.in/about"
  },
  "publisher": {
    "@type": "Organization",
    "name": "LoadSaathi",
    "logo": {
      "@type": "ImageObject",
      "url": "https://loadsaathi.in/logo.png"
    }
  },
  "datePublished": "2026-01-15",
  "dateModified": "2026-08-05",
  "image": "https://loadsaathi.in/blog/image.jpg",
  "description": "Blog post description here"
}
```

**FAQPage:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text here?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Complete answer text here."
      }
    }
  ]
}
```

**HowTo:**
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to [do something]",
  "description": "Step-by-step guide description",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Step 1",
      "text": "Step 1 description",
      "image": "https://loadsaathi.in/step1.jpg"
    }
  ]
}
```

---

## 8. DEPLOYMENT & ENVIRONMENT

### Environment Variables Required
```
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# PostHog
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://app.posthog.com

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-...
```

### Build Commands
```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (http://localhost:5173)
pnpm run build        # Production build
pnpm run preview      # Preview production build
npx cap sync          # Sync web build to Capacitor Android
npx cap run android   # Run on Android emulator
```

### Vercel Configuration
- Framework: Vite
- Build command: `pnpm run build`
- Output directory: `dist`
- SPA rewrites: All routes → `index.html` (in `vercel.json`)
- Security headers configured (CSP, X-Frame-Options, etc.)

---

## 9. QUICK REFERENCE

### Adding a New Public Page
1. Create file in `src/pages/public/YourPage.tsx`
2. Add `<SeoMeta>` component with title, description, canonical, jsonLd
3. Add `<noscript>` block with full page content
4. Add route in `src/App.tsx` inside `<PublicLayout>` route group
5. Add to `public/sitemap.xml`
6. Test: `pnpm run build` → no errors

### Adding a New Protected Page
1. Create file in `src/pages/trucker/YourPage.tsx` or `src/pages/shipper/YourPage.tsx`
2. Add route in `src/App.tsx` inside `<Layout>` route group
3. Wrap with `<RoleProtectedRoute allowedRoles={['trucker']}>` if role-restricted
4. Test: `pnpm run build` → no errors

### Modifying Database Schema
1. Edit `src/integrations/supabase/final-schema.sql`
2. Create migration in `supabase/migrations/`
3. Update types in `src/types/index.ts`
4. Update any affected hooks or utils
5. Test: `pnpm run build` → no errors

### Common Patterns
```tsx
// Authenticated Supabase query
const supabase = useSupabase();
const { data, error } = await supabase.from('trips').select('*');

// React Query
const { data, isLoading } = useQuery({
  queryKey: ['trips', userId],
  queryFn: () => supabase.from('trips').select('*').eq('trucker_id', userId),
});

// Realtime subscription
const channel = supabase
  .channel('trips')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips' }, handleInsert)
  .subscribe();

// SeoMeta usage
<SeoMeta
  title="Page Title"
  description="Page description for search engines"
  canonical="/page-slug"
  jsonLd={schemaObject}
  breadcrumbs={[
    { name: 'Home', url: '/' },
    { name: 'Page Title', url: '/page-slug' },
  ]}
/>
```

---

**Last Updated:** 2026-08-05
**Maintained By:** LoadSaathi Engineering Team
**For Questions:** Refer to AI_RULES.md or this file
