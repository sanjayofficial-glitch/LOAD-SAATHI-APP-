# Event Taxonomy — LoadSaathi

**Date:** 2026-10-13

---

## Event Naming Convention

- All events use `snake_case`
- Format: `{object}_{action}` (e.g., `quote_form_start`)
- Past tense for completed actions (e.g., `estimate_generated`)

---

## Complete Event List

### Page Views

| Event | Description | Parameters |
|-------|-------------|------------|
| `view_service_page` | Service/commercial page viewed | `service_type`, `state?`, `city?` |
| `view_location_page` | Location page viewed | `city`, `state` |
| `view_route_page` | Route page viewed | `route_slug`, `origin`, `destination`, `distance_km?` |
| `view_guide` | Guide page viewed | `slug`, `category?` |
| `view_pricing_or_rate_guide` | Pricing/rate page viewed | `page_type` |

### CTA Interactions

| Event | Description | Parameters |
|-------|-------------|------------|
| `click_phone` | Phone number clicked | `page_type`, `cta_location` |
| `click_email` | Email link clicked | `page_type`, `cta_location` |
| `click_whatsapp` | WhatsApp button clicked | `channel`, `origin?`, `destination?`, `route?` |
| `internal_cta_click` | Internal CTA clicked | `cta_location`, `cta_text`, `page_type` |

### Form Funnel

| Event | Description | Parameters |
|-------|-------------|------------|
| `quote_form_start` | Quote form focused | `origin?`, `destination?`, `weight?` |
| `quote_form_submit` | Quote form submitted | `origin?`, `destination?`, `weight?` |
| `quote_form_success` | Quote request confirmed | `origin?`, `destination?`, `weight?`, `lead_id?` |
| `post_load_start` | Post-load form started | `origin?`, `destination?`, `weight?` |
| `post_load_submit` | Post-load form submitted | `origin?`, `destination?`, `weight?` |
| `post_load_success` | Load posted successfully | `origin?`, `destination?`, `weight?`, `lead_id?` |

### Signup Funnel

| Event | Description | Parameters |
|-------|-------------|------------|
| `register_started` | Registration started | `role?`, `source?` |
| `transporter_signup_start` | Transporter signup started | `source?` |
| `transporter_signup_complete` | Transporter registered | `lead_id?` |
| `shipper_signup_complete` | Shipper registered | `lead_id?` |

### Tool Usage

| Event | Description | Parameters |
|-------|-------------|------------|
| `calculator_started` | Calculator opened | `origin?`, `destination?`, `weight?` |
| `estimate_generated` | Estimate calculated | `origin`, `destination`, `route`, `weight`, `avg_price`, `min_price`, `max_price`, `source` |
| `tool_completed` | Tool produces result | `tool`, `[tool-specific]` |

---

## Parameter Reference

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page_type` | string | Type of page | `route`, `location`, `blog`, `service` |
| `service_type` | string | Service category | `ptl`, `ltl`, `ftl`, `return_load` |
| `state` | string | State name | `Odisha`, `Jharkhand` |
| `city` | string | City name | `Rourkela`, `Ranchi` |
| `route_slug` | string | Route URL slug | `rourkela-to-ranchi` |
| `origin` | string | Origin city | `Rourkela` |
| `destination` | string | Destination city | `Ranchi` |
| `distance_km` | number | Route distance | `180` |
| `cta_location` | string | Where CTA appears | `hero`, `inline`, `footer` |
| `cta_text` | string | CTA button text | `Get Quote`, `Book Now` |
| `channel` | string | WhatsApp channel | `quote`, `share`, `route` |
| `weight` | number | Cargo weight in tonnes | `2.5` |
| `lead_id` | string | Privacy-safe lead ID | `ls_abc123` |
| `source` | string | Traffic source | `organic`, `direct`, `referral` |
| `role` | string | User role | `shipper`, `trucker` |
| `tool` | string | Tool identifier | `fare_calculator` |
| `avg_price` | number | Average price | `2500` |
| `min_price` | number | Minimum price | `1800` |
| `max_price` | number | Maximum price | `3500` |

---

## Funnel Stages

```
view_service_page / view_location_page / view_route_page / view_guide
  → internal_cta_click / click_whatsapp / click_phone
    → quote_form_start / post_load_start / register_started
      → quote_form_submit / post_load_submit
        → quote_form_success / post_load_success
          → transporter_signup_complete / shipper_signup_complete
```
