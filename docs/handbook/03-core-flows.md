# Core Flows (Mermaid Diagrams)

> Every major data flow in LoadSaathi, visualized. Render these on GitHub or any Mermaid-compatible viewer.

---

## 1. Authentication Flow (Clerk → Supabase)

```mermaid
sequenceDiagram
    participant U as User
    participant C as Clerk
    participant R as React SPA
    participant S as Supabase

    U->>C: Sign in / Sign up
    C->>R: JWT issued (VITE_CLERK_PUBLISHABLE_KEY)
    R->>R: AuthContext.fetchProfile()
    R->>C: session.getToken({ template: 'supabase' })
    C->>R: Supabase JWT
    R->>S: SELECT * FROM users WHERE id = clerk_user_id
    S->>R: userProfile (email, user_type, full_name, rating)
    R->>R: Profile stored in React state → useAuth() available

    Note over R,S: All subsequent DB queries use createClerkSupabaseClient(token)
    Note over R,S: Realtime subscriptions use anon client + authorizeRealtime(token)
```

---

## 2. Post Trip (Trucker)

```mermaid
flowchart TD
    A[Trucker opens PostTrip form] --> B[Enter origin & dest cities]
    B --> C[geocodeCity - Nominatim]
    C --> D[getRoute - OSRM]
    D --> E[Distance, duration, tolls calculated]
    E --> F[Fill: vehicle type, capacity, price, departure date]
    F --> G[Form validation - Zod + React Hook Form]
    G --> H[INSERT INTO trips via Clerk-authenticated Supabase]
    H --> I[Realtime event fires]
    I --> J[Shippers subscribed to trips table notified]
```

**Key files:** `pages/trucker/PostTrip.tsx`, `utils/osrm.ts`, `utils/geocode.ts`

---

## 3. Post Shipment (Shipper)

```mermaid
flowchart TD
    A[Shipper opens PostShipments form] --> B[Enter origin & dest cities]
    B --> C[geocodeCity - Nominatim]
    C --> D[getRoute - OSRM]
    D --> E[Distance, duration calculated]
    E --> F[Fill: weight, budget, goods description, requirements]
    F --> G[Form validation - Zod + React Hook Form]
    G --> H[INSERT INTO shipments via Clerk-authenticated Supabase]
    H --> I[Realtime event fires]
    I --> J[Truckers subscribed to shipments table notified]
```

**Key files:** `pages/shipper/PostShipments.tsx`, `utils/osrm.ts`, `utils/geocode.ts`

---

## 4. Smart Matching Algorithm

```mermaid
flowchart TD
    A[User clicks Browse] --> B[useSmartMatch hook]
    B --> C{Deterministic Score}
    C --> C1[City/State match: 0-30 pts]
    C --> C2[Geographic proximity: 0-25 pts]
    C --> C3[Route overlap: 0-15 pts]
    C --> C4[Capacity fit: 0-15 pts]
    C --> C5[Price compatibility: 0-10 pts]
    C --> C6[Date match: 0-5 pts]
    C --> C7[Rating bonus: 0-5 pts]
    C1 --> D[Total: 0-100]
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D
    C6 --> D
    C7 --> D
    D --> E{AI Score}
    E --> F[Edge Function match-ml]
    F --> G[Returns: aiScore, confidence, reasoning]
    G --> H[Sorted results with match % displayed]
    H --> I[getMatchLabel: Excellent / Good / Fair]
    H --> J[getAIMatchBadge: AI-verified]
```

**Key files:** `utils/matching.ts`, `hooks/useSmartMatch.ts`

### Score Factors Detail

| Factor | Max Points | Logic |
|--------|-----------|-------|
| City/State match | 30 | Same city = 30, same state = 20, adjacent = 10 |
| Geographic proximity | 25 | Haversine distance from route: <20km = 25, <50km = 15, <100km = 8 |
| Route overlap | 15 | Within 10km of origin/dest = 15, 20km = 10 |
| Capacity fit | 15 | Cargo ≤ truck capacity = 15, <80% = 12, <60% = 8 |
| Price compatibility | 10 | Within 20% of budget = 10, <40% = 7, <60% = 4 |
| Date match | 5 | Same day = 5, within 3 days = 3, within 7 days = 1 |
| Rating bonus | 5 | Trucker rating ≥ 4.5 = 5, ≥ 4.0 = 3, ≥ 3.5 = 1 |

---

## 5. Request & Accept Flow

```mermaid
sequenceDiagram
    participant S as Shipper
    participant DB as Supabase
    participant T as Trucker

    S->>DB: INSERT INTO requests (trip_id, status='pending')
    DB->>T: Realtime notification
    T->>DB: Review request
    alt Accept
        T->>DB: UPDATE requests.status = 'accepted'
        DB->>S: Realtime: request accepted
        DB->>DB: UPDATE shipments.status = 'matched'
        S->>DB: sendNotification(trucker, 'offer_accepted')
    else Reject
        T->>DB: UPDATE requests.status = 'rejected'
        DB->>S: Realtime: request declined
        S->>DB: sendNotification(trucker, 'offer_declined')
    end
```

---

## 6. Real-Time Chat

```mermaid
sequenceDiagram
    participant A as Party A
    participant RT as Supabase Realtime
    participant DB as Supabase DB
    participant B as Party B

    A->>RT: subscribeToMessages(request_id)
    Note over RT: authorizeRealtime(token) called first
    RT-->>A: Channel subscribed

    A->>DB: INSERT INTO messages (sender, recipient, content)
    DB-->>RT: postgres_changes event
    RT-->>B: New message received
    RT-->>A: Confirmation

    Note over A,B: HTML sanitized, 2000-char cap
    Note over A,B: ChatKind: 'request' or 'shipment_request'
```

**Key files:** `utils/chat.ts`, `pages/messaging/Chat.tsx`, `pages/messaging/ChatList.tsx`

---

## 7. GPS Tracking

```mermaid
flowchart TD
    A[AutoGpsTracker mounts in Layout] --> B[navigator.geolocation.watchPosition]
    B --> C[Every 30 seconds]
    C --> D[UPSERT INTO driver_locations]
    D --> E[driver_id, lat, lng, trip context]
    E --> F[Realtime event]
    F --> G[useLiveDriverLocations updates map markers]
    G --> H[LiveMap re-renders truck positions]

    I[Every 60 seconds] --> J[Refresh trip context]
    J --> K[Check if user has active trip]
```

**Key files:** `components/AutoGpsTracker.tsx`, `hooks/useLiveDriverLocations.ts`, `components/LiveMap.tsx`

---

## 8. Credit Score Calculation

```mermaid
flowchart TD
    A[useCreditScore hook] --> B[Edge Function credit-score]
    B --> C[Calculate 5 factors]
    C --> C1[Completion rate: 30%]
    C --> C2[On-time delivery: 25%]
    C --> C3[Communication quality: 15%]
    C --> C4[Review ratings: 20%]
    C --> C5[Account tenure: 10%]
    C1 --> D[Weighted sum → score 300-900]
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D
    D --> E[Tier: Excellent / Good / Fair / Poor]
    E --> F[useCreditInsights → narrative explanation]
```

**Key files:** `hooks/useCreditScore.ts`, Edge Function `credit-score`

---

## 9. Price Prediction

```mermaid
flowchart LR
    A[Shipper opens calculator] --> B[usePricePrediction hook]
    B --> C[Debounced 800ms]
    C --> D[Edge Function price-predict]
    D --> E[Input: origin, dest, weight, vehicle type]
    E --> F[AI analyzes route + market demand]
    F --> G[Output: recommendedPrice, range, confidence, trend]
```

**Key files:** `hooks/usePricePrediction.ts`, Edge Function `price-predict`

---

## 10. Notification System

```mermaid
flowchart TD
    A[Event occurs] --> B{Event type}
    B -->|Booking request| C[notifyTruckerOfBookingRequest]
    B -->|Request accepted| D[notifyShipperOfRequestAccepted]
    B -->|Trip started| E[notifyShipperOfTripStarted]
    B -->|Trip completed| F[notifyShipperOfTripCompleted]
    B -->|New review| G[notifyTruckerOfNewReview]
    B -->|Trucker offer| H[notifyShipperOfTruckerOffer]

    C --> I[RPC create_notification - SECURITY DEFINER]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I

    I --> J[NotificationBell receives Realtime event]
    J --> K[User sees in-app notification]
```

**Key files:** `utils/notifications.ts`, `components/NotificationBell.tsx`

---

## 11. Complete System Architecture

```mermaid
flowchart TB
    subgraph Client
        WEB[Web SPA - Vercel]
        AND[Android App - Capacitor]
    end

    subgraph Auth
        CLERK[Clerk - Auth + JWT]
    end

    subgraph Database
        SUPA[Supabase - PostgreSQL + RLS]
        RT[Supabase Realtime]
        EDGE[Supabase Edge Functions]
    end

    subgraph External
        OSRM[OSRM - Routing]
        NOM[Nominatim - Geocoding]
        GEM[Gemini AI - NL Search]
    end

    subgraph Analytics
        PH[PostHog]
        GA[Google Analytics]
        VER[Vercel Analytics]
    end

    WEB --> CLERK
    AND --> CLERK
    CLERK -->|JWT| SUPA
    WEB --> SUPA
    WEB --> OSRM
    WEB --> NOM
    EDGE --> GEM
    RT --> WEB
    WEB --> PH
    WEB --> GA
    WEB --> VER

    subgraph Data Tables
        T1[users]
        T2[trips]
        T3[shipments]
        T4[requests]
        T5[messages]
        T6[notifications]
        T7[driver_locations]
        T8[reviews]
    end

    SUPA --> T1
    SUPA --> T2
    SUPA --> T3
    SUPA --> T4
    SUPA --> T5
    SUPA --> T6
    SUPA --> T7
    SUPA --> T8
```

---

*All diagrams render in GitHub's Markdown viewer, VS Code, and any Mermaid-compatible tool.*
