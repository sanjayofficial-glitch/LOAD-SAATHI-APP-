# PostHog post-wizard report

The wizard completed a client-side PostHog integration for this Vite React marketplace. The existing SDK setup now requires configured environment variables, preserves autocapture and session replay defaults, enables automatic exception capture, identifies authenticated Clerk users with person properties, and resets identity on logout. Critical shipment, trip, booking, messaging, review, favorite, and fare-estimation actions now emit privacy-safe events. A production build passed, and targeted ESLint completed with no errors.

| Event | Description | File |
|---|---|---|
| `shipment_posted` | A shipper successfully posts a shipment to the marketplace. | `src/pages/shipper/PostShipments.tsx` |
| `trip_posted` | A trucker successfully posts available capacity as a trip. | `src/pages/trucker/PostTrip.tsx` |
| `shipment_offer_sent` | A trucker successfully sends a price offer for a shipment. | `src/pages/shipper/ShipmentDetail.tsx` |
| `booking_request_updated` | A trucker accepts or declines a shipment booking request. | `src/pages/trucker/TruckerTripDetail.tsx` |
| `trip_status_updated` | A trucker advances a trip through its operational lifecycle. | `src/pages/trucker/TruckerTripDetail.tsx` |
| `review_submitted` | A marketplace participant successfully submits a trip review. | `src/components/ReviewDialog.tsx` |
| `favorite_updated` | A user adds or removes a marketplace entity from favorites. | `src/components/FavoriteButton.tsx` |
| `message_sent` | A user successfully sends a message in a booking conversation. | `src/pages/Chat.tsx` |
| `fare_estimated` | A visitor successfully calculates a freight fare estimate. | `src/pages/public/FareCalculator.tsx` |

## Next steps

We've built insights and a dashboard to monitor the newly instrumented user behavior:

- [Analytics basics dashboard (wizard)](https://us.posthog.com/project/518131/dashboard/1888035)
- [Marketplace supply funnel (wizard)](https://us.posthog.com/project/518131/insights/lf8km1pl)
- [Shipment demand and offers (wizard)](https://us.posthog.com/project/518131/insights/r9aZzMmc)
- [Trip lifecycle outcomes (wizard)](https://us.posthog.com/project/518131/insights/hjH3vwSl)
- [Marketplace engagement (wizard)](https://us.posthog.com/project/518131/insights/ZPT5eLOA)
- [Booking request decisions (wizard)](https://us.posthog.com/project/518131/insights/FNZXgGJ2)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Confirm the exact `VITE_POSTHOG_API_KEY` and `VITE_POSTHOG_HOST` names remain documented in `.env.example` and any monorepo/bootstrap scripts.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or the Vite upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path calls `identify` after Clerk restores the authenticated user.
- [ ] Confirm `shipment_posted`, `trip_posted`, and downstream marketplace events arrive in PostHog without user-entered descriptions, messages, names, phone numbers, or addresses in event properties.
- [ ] Supabase and Clerk data sources were found; run `npx @posthog/wizard warehouse` to connect them to PostHog's data warehouse.

### Agent skill

An agent skill folder was installed under `.claude/skills/integration-javascript_web`. It provides current PostHog JavaScript Web integration guidance for future agent development.
