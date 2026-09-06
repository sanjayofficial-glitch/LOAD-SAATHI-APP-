# LoadSaathi App Demo Video — Production Plan

## Goal

Produce a **2.5–3 minute** product demo video that shows how LoadSaathi works end-to-end — from the perspective of both a **trucker** and a **shipper** — highlighting the 8 core features. Target platforms: **website hero**, **LinkedIn**, **investor decks**, **app store listing**.

## Constraints & Context

- **Source code (`src/`):** Not present in this working copy (knowledge/documentation repo only). The video will be produced from **screen mockups / recorded walkthroughs** of the live app at `loadsaathi.in` plus documented screenshots and the marketing preview React components.
- **Available visual assets:**
  - Screenshots: `docs/assets/screenshots/{home-hero,dashboard,matching,chat,credit-score,reviews}.png`
  - Logo: `docs/assets/load-saathi-logo.svg`, `public/logo.svg`
  - Hero bg: `public/hero-bg.webp`
  - OG image: `public/og-image.png`
  - 6 blog OG SVGs in `public/blog/og/`
  - 6 Marketing preview React components (DashboardPreview, MatchingPreview, ChatPreview, CreditScorePreview, ReviewsPreview, AdminPreview)
- **No in-app chat preference:** Per user memory, the live app uses **WhatsApp deep links** for driver contact, not in-app chat (though chat component exists). Plan should use WhatsApp for contact, mention chat as existing capability.
- **Brand colors:** Tailwind-based (context from `globals.css` CSS custom properties — dark teal primary, amber accent).

## Narrative Arc (Three Acts)

| Act | Duration | Purpose |
|-----|----------|---------|
| **Hook** (0:00–0:10) | 10s | Problem: India's trucks drive empty half the time. LoadSaathi solves it. |
| **Trucker Journey** (0:10–1:25) | 75s | Trucker posts trip → gets matched → accepts request → GPS tracked → reviewed → credit grows |
| **Shipper Journey** (1:25–2:40) | 75s | Shipper posts shipment → AI matches → requests trucker → chats → tracks live → reviews |
| **Features + CTA** (2:40–3:00) | 20s | Feature montage + logo + tagline + CTA |

## Detailed Scene Breakdown

### Scene 0 — Title + Hook (0:00–0:10, 10s)
- **Visual:** Animated map of India (East India highlighted) → empty truck icon animating → fills with LoadSaathi logo
- **Voiceover:** "Every day in India, thousands of trucks drive empty on return trips. LoadSaathi connects shippers with truckers to fill those empty miles — using AI."
- **Overlay text:** "LoadSaathi — India's AI-Powered Freight Marketplace"
- **Assets:** Logo SVG, India map SVG (AI-generated), truck icon
- **Production:** Hyperframes programmatic

### Scene 1 — Trucker Side: Post a Trip (0:10–0:25, 15s)
- **Visual:** Screen recording or mockup of Trucker Dashboard → "Post Trip" button → form with origin/dest city autocomplete, vehicle type, capacity, price, departure date → OSRM route line drawn on mini-map → "Post Trip" click → success toast
- **Voiceover:** "Ramesh, a trucker from Rourkela, has space on his return trip to Ranchi. He posts his trip — entering cities, selecting his truck type, and setting his rate. LoadSaathi automatically calculates the route distance using OSRM."
- **Overlay text:** "Post Trip • Route auto-calculated • Instant publish"
- **Assets:** PostTrip.tsx flow (documented), OSRM map line
- **Production:** Screen recording from live app + Hyperframes overlay callouts

### Scene 2 — Trucker Side: AI Smart Matching (0:25–0:40, 15s)
- **Visual:** Screenshot/mockup of BrowseShipments page showing match-score list: "Priya Traders — 92% match (Rourkela→Ranchi, 3T, ₹24k)" with match factors breakdown (city match, proximity, capacity fit, price, date, rating)
- **Voiceover:** "Within seconds, AI matches him with relevant shippers. The 7-factor matching algorithm scores every potential connection — route overlap, capacity fit, price compatibility, rating, and more."
- **Overlay text:** "AI Smart Matching • 7 factors • Match % displayed"
- **Assets:** `matching.png` screenshot, `useSmartMatch.ts` flow diagram, `calculateMatchScore()` logic
- **Production:** Screenshot + animated match score bar

### Scene 3 — Trucker Side: Accept & GPS Tracking (0:40–1:00, 20s)
- **Visual:** Notification bell → new booking request notification → accept button → map switches to GPS tracking view showing live truck position moving along route → ETA updates
- **Voiceover:** "Ramesh gets a real-time notification. He accepts the request. Now his live GPS position updates every 30 seconds — the shipper can see exactly where he is on the route."
- **Overlay text:** "Real-time notifications • GPS tracking every 30s • Live map"
- **Assets:** NotificationBell.tsx, AutoGpsTracker.tsx, LiveMap.tsx, `dashboard.png` screenshot
- **Production:** Animated map marker moving along route path (programmatic)

### Scene 4 — Trucker Side: Reviews & Credit Score (1:00–1:25, 25s)
- **Visual:** Trip completed → review dialog (5-star rating, comment) → Credit score dashboard showing score increase from 720 to 755, with factor breakdown pie chart (completion 30%, on-time 25%, communication 15%, reviews 20%, tenure 10%)
- **Voiceover:** "After delivery, both parties review each other. Ramesh's digital freight credit score rises — built from completion rate, on-time delivery, communication quality, reviews, and account tenure. Higher scores mean better match priority."
- **Overlay text:** "Bidirectional reviews • Credit score 300–900 • 5-factor scoring"
- **Assets:** `credit-score.png`, `reviews.png`, CreditScore.tsx, ReviewDialog.tsx
- **Production:** Screenshot + animated credit score counter

### Scene 5 — Shipper Side: Post a Shipment (1:25–1:40, 15s)
- **Visual:** Screen recording/mockup of Shipper Dashboard → "Post Shipment" → form: origin/dest cities, weight, budget, goods description → AI price prediction shows "₹22,000–26,000 (recommended: ₹24,000)" → submit
- **Voiceover:** "Meanwhile, Priya from a small steel trader in Rourkela needs to ship 3 tonnes of coils to Ranchi. She posts her shipment and gets AI-powered price prediction — the system suggests a fair rate based on route demand and historical data."
- **Overlay text:** "Post Shipment • AI Price Prediction • Gemini-powered"
- **Assets:** PostShipments.tsx, `usePricePrediction.ts`, price-predict edge function
- **Production:** Screen recording + Hyperframes price range overlay

### Scene 6 — Shipper Side: AI Matched Results (1:40–1:55, 15s)
- **Visual:** BrowseTrips page showing sorted results: "Ramesh Kumar — 92% match (Trucker, 4.8★, ₹24,000)" with truck details panel, route overlay on map, match factors
- **Voiceover:** "The AI smart matching engine scores every available trucker. Top matches appear first — Ramesh shows up at 92% match with a detailed score breakdown."
- **Overlay text:** "7-factor AI matching • Sorted by match % • Route overlay on map"
- **Assets:** `matching.png` screenshot, BrowseTrips.tsx, matching.ts
- **Production:** Screenshot with animated sort/filter

### Scene 7 — Shipper Side: Chat + Confirm + Live Track (1:55–2:20, 25s)
- **Visual:** Request button → WhatsApp deep link opens ("Chat with Ramesh on WhatsApp") → status updates to "Accepted" via realtime → LiveTruckMap shows truck moving → shipper sees ETA updating → "Delivery confirmed"
- **Voiceover:** "Priya sends a request. They connect via WhatsApp for quick negotiation. Once confirmed, she watches Ramesh's truck move in real-time on the live map. When he arrives, she confirms delivery."
- **Overlay text:** "WhatsApp contact • Real-time status • Live GPS tracking"
- **Assets:** Whatsapp.ts (`generateWhatsAppLink`), LiveTruckMap.tsx, RouteMap.tsx, TripStatusButton
- **Production:** Screen recording mockup + live map animation

### Scene 8 — Shipper Side: Review + Credit Score (2:20–2:40, 20s)
- **Visual:** Review dialog → 5-star rating submitted → Credit score updates → ShipperHistory shows completed trips with earnings saved
- **Voiceover:** "After delivery, Priya reviews Ramesh. Her credit score updates — building trust on the platform. She sees her savings vs traditional freight and completed trip history."
- **Overlay text:** "Bidirectional reviews • Credit score update • Trip history"
- **Assets:** `reviews.png`, CreditScore.tsx, `dashboard.png`
- **Production:** Screenshot + animated score update

### Scene 9 — Features Montage (2:40–2:55, 15s)
- **Visual:** 8 feature cards flash by with icons:
  1. AI Smart Matching
  2. GPS Tracking
  3. Credit Score (300–900)
  4. Price Prediction
  5. Real-time Notifications
  6. Live Map
  7. Bidirectional Reviews
  8. Android App (Capacitor)
- **Voiceover:** "LoadSaathi: AI matching, live GPS tracking, digital credit scores, price prediction, real-time notifications, and a mobile app for Android."
- **Assets:** Icon set, screenshots, team photo (optional)
- **Production:** Hyperframes programmatic card animation

### Scene 10 — CTA + Logo (2:55–3:00, 5s)
- **Visual:** LoadSaathi logo + tagline "Jamsaathi — Fill Your Empty Miles" (Hindi/local flavor) + website loadsaathi.in
- **Voiceover:** "LoadSaathi — loadsaathi.in"
- **Assets:** Logo SVG, hero-bg.webp
- **Production:** Hyperframes with gradient background

## Production Approach

### Primary Method: Screen Recording + Programmatic Overlays
1. **Record the live app** at `loadsaathi.in` (or use dev server `pnpm dev` if accessible) navigating through the documented flows
2. **Use Hyperframes** (HTML/CSS-based, agent-native) for:
   - Title scenes, transitions, CTAs
   - Animated overlay callouts (arrows, circles, labels)
   - Feature cards animation
   - Score counters, route animations
3. **Use existing screenshots** as fallback/static frames where screen recording isn't available

### Secondary Method: AI B-Roll for Lifestyle
- Generate 3-4 short AI video clips (5-8 seconds each) showing:
  - Indian truck on highway (trucker perspective)
  - Warehouse/MSME loading goods (shipper perspective)
  - Dashboard view from truck cab
  - Map/route visualization overlay
- **Model:** Veo 3 (highest quality) or Seedance (cost-effective, batch-friendly)
- **Use:** Interspersed between screen-recorded sections for visual variety

### Voiceover
- **Narrator:** AI voice via HeyGen or ElevenLabs (Hindi-accented English preferred)
- **Captions:** Burned-in + SDH for accessibility (always on, per video skill guidance)
- **Music:** Upbeat, optimistic Indian fusion instrumental (royalty-free)

### Aspect Ratios
- **Primary:** 16:9 (YouTube, website, LinkedIn post) — 1920×1080
- **Secondary crop:** 9:16 (Shorts, Reels, LinkedIn Stories) — 1080×1920 (auto-crop in post)

## Script Outline

```
[0:00] HOOK
"Every day in India, thousands of trucks drive empty on return trips.
LoadSaathi connects shippers with truckers to fill those empty miles — using AI."

[0:10] TRUCKER FLOW
"Ramesh, a trucker from Rourkela, has space on his return trip to Ranchi.
He posts his trip — entering cities, selecting his truck type, and setting his rate.
LoadSaathi automatically calculates the route distance using OSRM."

[0:25] MATCHING
"Within seconds, AI matches him with relevant shippers.
The 7-factor matching algorithm scores every potential connection —
route overlap, capacity fit, price compatibility, rating, and more."

[0:40] ACCEPT + GPS
"Ramesh gets a real-time notification. He accepts the request.
Now his live GPS position updates every 30 seconds —
the shipper can see exactly where he is on the route."

[1:00] REVIEWS + CREDIT
"After delivery, both parties review each other.
Ramesh's digital freight credit score rises — built from completion rate,
on-time delivery, communication quality, reviews, and tenure.
Higher scores mean better match priority."

[1:25] SHIPPER FLOW
"Meanwhile, Priya from a small steel trader in Rourkela needs to ship
3 tonnes of coils to Ranchi. She posts her shipment and gets
AI-powered price prediction — the system suggests a fair rate
based on route demand and historical data."

[1:40] MATCHED RESULTS
"The AI matching engine scores every available trucker.
Top matches appear first — Ramesh shows up at 92% match with a detailed score breakdown."

[1:55] CHAT + TRACK
"Priya sends a request. They connect via WhatsApp for quick negotiation.
Once confirmed, she watches Ramesh's truck move in real-time on the live map.
When he arrives, she confirms delivery."

[2:20] SHIPPER REVIEW + CREDIT
"After delivery, Priya reviews Ramesh. Her credit score updates — building trust on the platform.
She sees her savings vs traditional freight and completed trip history."

[2:40] FEATURES
"LoadSaathi: AI matching, live GPS tracking, digital credit scores,
price prediction, real-time notifications, and a mobile app for Android."

[2:55] CTA
"LoadSaathi — loadsaathi.in"
```

## Assets Checklist

| Asset | Source | Status |
|-------|--------|--------|
| LoadSaathi logo (SVG) | `docs/assets/load-saathi-logo.svg` | ✅ Available |
| India map SVG | AI-generated (Veo 3 / image gen) | 🔄 Need to generate |
| Home hero screenshot | `docs/assets/screenshots/home-hero.png` | ✅ Available |
| Dashboard screenshot | `docs/assets/screenshots/dashboard.png` | ✅ Available |
| Matching screenshot | `docs/assets/screenshots/matching.png` | ✅ Available |
| Chat screenshot | `docs/assets/screenshots/chat.png` | ✅ Available |
| Credit score screenshot | `docs/assets/screenshots/credit-score.png` | ✅ Available |
| Reviews screenshot | `docs/assets/screenshots/reviews.png` | ✅ Available |
| Hero background | `public/hero-bg.webp` | ✅ Available |
| OG image | `public/og-image.png` | ✅ Available |
| Truck lifestyle B-roll | AI-generated (Veo 3 / Seedance) | 🔄 Need to generate |
| MSME/warehouse B-roll | AI-generated (Veo 3 / Seedance) | 🔄 Need to generate |
| Feature icons | shadcn/ui + lucide-react | ✅ Available in codebase |
| Team photo (optional) | `docs/assets/team/sanjaya-sahu.png` | ✅ Available |
| Route line animation assets | From LiveMap.tsx / RouteMap.tsx | 🔄 Need to recreate |

## Technical Steps

### Step 1: Asset Preparation
- [ ] Run the live app or capture screen recordings of key flows
- [ ] Generate AI B-roll: truck on highway, warehouse loading, driver dashboard view (2-3 clips, 5-8s each)
- [ ] Export screenshots at 2x resolution for crispness
- [ ] Create route line animation assets (Rourkela → Ranchi path)

### Step 2: Hyperframes Project Setup
- [ ] `npm create hyperframes@latest loadsaathi-demo`
- [ ] Set canvas to 1920×1080 (16:9)
- [ ] Import brand colors from Tailwind config
- [ ] Set up frame template with consistent header/footer

### Step 3: Build Frames
- [ ] Scene 0: Title + Hook (map animation + logo reveal)
- [ ] Scene 1-4: Trucker journey (screen recording embeds + callout overlays)
- [ ] Scene 5-8: Shipper journey (screen recording embeds + callout overlays)
- [ ] Scene 9: Features montage (programmatic card animation)
- [ ] Scene 10: CTA + logo

### Step 4: Assemble & Render
- [ ] Place screen recordings as video elements in Hyperframes frames
- [ ] Add animated callout overlays (arrows, circles, labels) per scene
- [ ] Add caption text at bottom of each frame
- [ ] Add background music track (low volume, 20% mix)
- [ ] Render to `dist/loadsaathi-demo.mp4` (16:9)
- [ ] Export 9:16 crop version for social

### Step 5: Output & Distribution
- [ ] 16:9 version → website hero, LinkedIn, YouTube, investor decks
- [ ] 9:16 version → Instagram Reels, YouTube Shorts, LinkedIn Stories
- [ ] GIF extract (10s hook) for Twitter/X
- [ ] Still poster frame for video thumbnail

## Validation Checklist

- [ ] Total runtime between 2:30 and 3:00
- [ ] Both trucker AND shipper complete journeys shown
- [ ] All 8 features mentioned by name
- [ ] AI smart matching algorithm described (7 factors)
- [ ] Credit score (300-900) with 5 factors described
- [ ] OSRM route calculation mentioned
- [ ] WhatsApp contact shown (not in-app chat per user preference)
- [ ] GPS tracking frequency (30s) mentioned
- [ ] Price prediction (Gemini) mentioned
- [ ] Captions burned in
- [ ] Logo visible in final frame
- [ ] CTA with loadsaathi.in visible
- [ ] Both 16:9 and 9:16 versions produced

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Cannot screen-record live app (auth required) | Use documented screenshots + Hyperframes to simulate flows; note in voiceover that these are app screens |
| AI B-roll doesn't match app UI style | Style prompts to match LoadSaathi's color palette (teal + amber, clean modern) |
| Voiceover accent doesn't feel local | Use ElevenLabs Indian English voice (Ravi/Roshan preset) |
| Hyperframes rendering issues on Windows | Fallback to Remotion (React-based, same Node environment) |
| Video too long for social cuts | Create 15s/30s/60s teaser cuts from full video |
| No access to live app for accurate screens | Use marketing preview components (`DashboardPreview.tsx`, etc.) which render live UI at `/screens/dashboard` route |
