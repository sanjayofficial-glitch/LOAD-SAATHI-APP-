# Load Saathi — Freight Marketplace

**Stack:** React + TypeScript + Vite | Clerk Auth | Supabase | React Leaflet | Tailwind CSS + shadcn/ui

**Path:** `D:\Users\sanja\dyad-apps\LOAD-SAATHI-APP-1-OSRM`

**Source root:** all app code lives under `supabase/src/` — paths below like `src/utils/…` mean `supabase/src/utils/…`

**Two user roles:** Trucker (drivers who post trips) and Shipper (customers who post shipments)

---

## Status — Fully Implemented

### Auth (Clerk)
- Clerk (`@clerk/clerk-react` v5.61.3) fully integrated
- SignIn at `/login`, SignUp at `/register`
- Role selection flow after signup at `/choose-role`
- `RoleProtectedRoute` gates pages by role
- `AuthContext.tsx` wraps `useUser`, `useSession`, `useClerk`
- Clerk key: `pk_test_aW4tb2FyZmlzaC0xNi5jbGVyay5hY2NvdW50cy5kZXYk`
- Clerk-to-Supabase JWT exchange via `createClerkSupabaseClient` + Supabase template

### Supabase
- Project: `https://aejvxilhydyfbwkhjpdt.supabase.co`
- Anon key set in `.env`
- `createClerkSupabaseClient()` in `src/utils/supabaseClient.ts` — the primary client
- `src/lib/supabaseClient.ts` (anonymous) still used for Realtime subscriptions (intentional — 3 files)
- SQL setup script at `supabase/complete-setup.sql` (all tables + RLS)
- Supabase CLI v2.105.0 available via npx

### Utility Files Created
| File | Purpose |
|------|---------|
| `src/utils/geocode.ts` | `geocodeCity()` via Nominatim OSM |
| `src/utils/osrm.ts` | `getRoute()` via OSRM driving API |
| `src/utils/whatsapp.ts` | `generateWhatsAppLink()` for WhatsApp deep links |
| `src/utils/matching.ts` | `calculateMatchScore()` + `getMatchLabel()` |

### Pages Updated
| Page | Change |
|------|--------|
| `RouteMap.tsx` | OSRM road geometry via GeoJSON, pre-stored coords props, distance/ETA display |
| `BrowseTrips.tsx` | Match score sorting descending, `.maybeSingle()` fix, badges |
| `BrowseShipments.tsx` | Match score sorting descending, badges |
| `PostTrip.tsx` | Geocode + OSRM route on creation, saves coords to DB |
| `PostShipments.tsx` | Geocode + OSRM route on creation, saves coords to DB |
| `ShipmentDetail.tsx` | WhatsApp button for accepted trucker |
| `TripDetail.tsx` | WhatsApp button to contact trucker |
| `EditTrip.tsx` | Fixed to use authenticated Supabase client |
| `EditShipment.tsx` | Fixed to use authenticated Supabase client |

### Cleanup Done
- Deleted `src/pages/tripper/EditTrip.tsx` (moved to `trucker/`)
- Deleted `src/components/NotificationService.tsx` (dead WS component)
- Fixed `TripStatusButton.module.css` (removed JS quotes from CSS)
- Empty states added to BrowseShipments, BrowseTrips, MyShipments, TruckerHub

### Known Issues / Not Done
- `shipment_requests` → `requests` table consolidation deferred (risky, original plan said not to)
- 3 files still import from `@/lib/supabaseClient` for Realtime (intentional)
- Clerk `afterSignUpUrl` prop deprecated (cosmetic warning)
- `src/lib/gemini.ts` is in use (BrowseShipments.tsx AI search) — not dead code

---

## Code Memory (graphify + .memory)

| Artifact | Purpose |
|----------|---------|
| `graphify-out/graph.json` | Full code knowledge graph (AST-only, 0 tokens) |
| `graphify-out/graph.html` | Interactive visualization — open in browser |
| `graphify-out/GRAPH_REPORT.md` | God nodes, communities, cross-file connections |
| `graphify-out/memory/` | Q&A feedback-loop memory (`graphify save-result`) |
| `.memory/` | Human-curated PARA facts (this file + MEMORY.md + daily logs) |

- Regenerate the graph free: `graphify update .` (AST-only). Deep semantic pass: `graphify . --deep` (costs tokens).
- Query the graph: `graphify query "<question>"`, `graphify path A B`, `graphify explain <node>`.
