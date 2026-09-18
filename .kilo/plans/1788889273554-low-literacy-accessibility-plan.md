# Low-Literacy Trucker Accessibility Plan

## Goal
Make LoadSaathi usable for truckers with low literacy and limited smartphone experience. The current interface assumes users can read English, type city names, and navigate multi-field forms. Many target users cannot.

## Constraints
- No new backend services or database tables
- Reuse existing Capacitor Android wrapper
- Keep changes additive; do not break authenticated flows
- First rollout: Android app only (Capacitor), web stays as-is until validated

## Current State (verified)
- `PostTrip.tsx` and `PostShipments.tsx` already have `mode: 'quick' | 'full'` toggles, but quick mode is **not** the default for new users
- No i18n, no voice input, no SMS/WhatsApp flows, no OCR
- `FAQ.tsx` claims English + Hindi support, but no translation system exists
- Browse flows (`BrowseShipments.tsx`, `BrowseTrips.tsx`) rely on text search, filters, and map interactions

## Priority 1 — Zero-typing posting (highest ROI)
1. **Make Quick Post the default**  
   Change default `mode` from `'full'` to `'quick'` in `PostTrip.tsx` and `PostShipments.tsx`. Hide advanced fields behind an Advanced toggle. Quick form asks only: Origin → Destination → Weight → Price/tonne → Date.

2. **Voice input on city fields**  
   Add a microphone button next to Origin and Destination inputs. Use `webkitSpeechRecognition` with Hindi + English + regional language hints. On success, auto-fill the field and advance to the next field. Fallback: if speech API is unavailable, show the keyboard as normal.

3. **Simplified Browse for Truckers**  
   Add a “Show me loads” big button on `TruckerHub.tsx` that opens a swipeable card stack instead of the current list/map/search UI. Each card shows: Origin → Destination, Weight, Price, “Accept” button. One tap to accept. No filters, no search.

## Priority 2 — Language & audio guidance
4. **Hindi voice-over for key flows**  
   Record 3 short audio clips per flow (Post Trip, Find Load, Track Shipment): “Step 1: Select your city”, “Step 2: Enter weight”, “Done”. Store as static assets. Play automatically when the screen loads, with a mute button. Use existing `posthog` analytics to track mute rate.

5. **Hindi UI labels alongside English**  
   Add a global `SimpleLabels` context that translates the 20 most common UI strings to Hindi (e.g., “Origin” → “कहां से”, “Destination” → “कहां तक”, “Weight” → “भार”). Do NOT build a full i18n system. Just hardcode the top labels used in trucker flows.

## Priority 3 — WhatsApp / SMS fallback
6. **WhatsApp “send load details” flow**  
   Add a floating WhatsApp button on `BrowseShipments.tsx`. When tapped, open `https://wa.me/918328998031?text=Load%20details%3A%20[origin]%20[dest]%20[weight]`. A human agent replies with a pre-filled booking link. No app interaction required from the trucker.

7. **SMS-based trip posting (experimental)**  
   Add a phone-number field in `Profile.tsx` for SMS opt-in. When enabled, send a Twilio/WhatsApp Business API message after trip creation: “Trip posted: Rourkela → Kolkata, 5 tonnes. Call 8328998031 to edit.” This is notification-only; no inbound SMS parsing in v1.

## Priority 4 — Trust & onboarding
8. **Photo-based profile instead of text forms**  
   In `Profile.tsx`, replace RC/insurance number inputs with a “Take photo of RC” button that uses `navigator.mediaDevices.getUserMedia` (or Capacitor Camera plugin) and stores the image in Supabase Storage. OCR is v2.

9. **Mentor pairing for new truckers**  
   Add a `mentor_id` column to the `users` table (migration required). During onboarding (`ChooseRole.tsx`), if the user selects “trucker”, show a “Get help from an experienced trucker” checkbox. If checked, assign the nearest high-rated trucker on the same route as mentor. Show mentor name + phone on the trucker dashboard.

## Out of scope (explicit)
- Full i18n system, Odia/Bengali/Tamil translations
- Inbound SMS parsing
- OCR document processing
- USSD menu
- iOS support (Capacitor iOS not in scope for this audience)

## Dependencies
- Priority 1.2 (voice input) depends on Capacitor Android WebView supporting `webkitSpeechRecognition` or a native plugin
- Priority 3.1 (WhatsApp) depends on WhatsApp Business API or manual agent workflow
- Priority 4.2 (mentor pairing) depends on new `mentor_id` DB column

## Validation
- **Metric**: % of new trucker trips posted in Quick mode vs Full mode (target: >80% Quick mode within 30 days)
- **Metric**: Voice input usage rate on city fields (target: >40% of Quick posts use voice)
- **Manual test**: Complete Post Trip flow on a 4G Android phone with one thumb in <60 seconds
- **Manual test**: Trucker Hub card stack swipe/accept flow without reading any text

## Open questions
1. Do we want a dedicated Android build with native speech-to-text, or rely on the browser `webkitSpeechRecognition` inside Capacitor WebView?
   - **Recommended**: Start with browser API in Capacitor WebView; if accuracy is poor, fall back to a native Capacitor speech plugin.
2. Do we want WhatsApp agent-assisted booking from day one, or should it be invite-only for 50 truckers first?
   - **Recommended**: Invite-only pilot with 20 truckers on the Rourkela–Kolkata corridor, then expand if completion rate >60%.
