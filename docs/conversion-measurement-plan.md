# Conversion Measurement Plan — LoadSaathi

**Date:** 2026-10-13

---

## Goal

Measure whether SEO, GEO, AEO, and AAO traffic creates real freight-marketplace outcomes.

---

## Funnel Specification

```
Organic landing page
  → CTA click (WhatsApp, phone, form)
    → Form start
      → Form submit
        → Qualified lead
          → Booked shipment
```

---

## Event Taxonomy

### Page View Events

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `view_service_page` | Service page loads | service_type, state, city |
| `view_location_page` | Location page loads | city, state |
| `view_route_page` | Route page loads | route_slug, origin, destination, distance_km |
| `view_guide` | Guide page loads | slug, category |
| `view_pricing_or_rate_guide` | Pricing/rate page loads | page_type |

### CTA Events

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `click_phone` | Phone number clicked | page_type, cta_location |
| `click_email` | Email link clicked | page_type, cta_location |
| `click_whatsapp` | WhatsApp button clicked | channel, origin, destination, route |
| `internal_cta_click` | Internal CTA clicked | cta_location, cta_text, page_type |

### Form Events

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `quote_form_start` | Quote form focused | origin, destination, weight |
| `quote_form_submit` | Quote form submitted | origin, destination, weight |
| `quote_form_success` | Quote request confirmed | origin, destination, weight, lead_id |
| `post_load_start` | Post-load form started | origin, destination, weight |
| `post_load_submit` | Post-load form submitted | origin, destination, weight |
| `post_load_success` | Load posted successfully | origin, destination, weight, lead_id |

### Signup Events

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `register_started` | Registration started | role, source |
| `transporter_signup_start` | Transporter signup started | source |
| `transporter_signup_complete` | Transporter registered | lead_id |
| `shipper_signup_complete` | Shipper registered | lead_id |

### Tool Events

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `calculator_started` | Calculator opened | origin, destination, weight |
| `estimate_generated` | Estimate calculated | origin, destination, route, weight, avg_price, min_price, max_price, source |
| `tool_completed` | Tool produces result | tool, [tool-specific params] |

---

## Privacy Rules

**NEVER send to analytics:**
- Names
- Phone numbers
- Email addresses
- Precise addresses
- Shipment contents
- Pricing details (except tool-level min/max bands)

**Safe to send:**
- Page type, service type, state, city
- Route origin/destination (city names only)
- CTA location, device category
- Traffic source/medium
- Privacy-safe lead ID (internal UUID, not PII)

---

## Mapping: Conversion → SEO/GEO/AEO/AAO Pages

| Conversion | Relevant Pages |
|------------|----------------|
| `view_service_page` | /ptl-transport, /ltl-transport, /truck-load-booking, /freight-marketplace, /return-load |
| `view_location_page` | /location/rourkela, /location/ranchi, /location/kolkata, etc. |
| `view_route_page` | /routes/rourkela-to-ranchi, /routes/bhubaneswar-to-kolkata, etc. |
| `view_guide` | /guide/ptl-vs-ftl, /guide/freight-rates-east-india, /guide/shipping-steel |
| `quote_form_start` | /tools/fare-calculator, /tools/freight-rate-calculator, /tools/ptl-vs-ftl-calculator |
| `post_load_start` | /register (shipper flow) |
| `transporter_signup_start` | /register (trucker flow) |
| `click_phone` | All pages with phone CTA |
| `click_whatsapp` | All pages with WhatsApp CTA |

---

## CRM Integration (Privacy-Safe)

To join anonymous web events to CRM outcomes:

1. **At form submit:** Generate a `lead_id` (UUID) stored in first-party cookie
2. **Send `lead_id`** with all analytics events (not PII)
3. **At CRM import:** Match `lead_id` to CRM record
4. **Never send PII** to analytics platforms

---

## Test Instructions

### Browser Dev Tools
1. Open DevTools → Network tab
2. Filter by `posthog` or `analytics`
3. Trigger events (click CTA, submit form)
4. Verify event name and parameters
5. Verify NO PII in event payload

### PostHog Debug View
1. Open PostHog toolbar (dev mode)
2. Check "Events" tab
3. Verify events fire correctly
4. Verify no PII in event properties

### GA4 Debug View
1. Open GA4 → Debug View
2. Trigger events on the page
3. Verify events appear in real-time
4. Verify parameters are correct

---

## Required from Owner

| Item | Purpose |
|------|---------|
| PostHog API key | Already in env vars |
| GA4 measurement ID | Already in env vars |
| GTM container ID | Already in env vars |
| CRM access | For lead ID joining |
| Consent settings | For consent-aware loading |
