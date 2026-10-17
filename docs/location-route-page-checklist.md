# Location & Route Page Checklist — LoadSaathi

**Date:** 2026-10-13

---

## Location Page Checklist

### Pre-Publish

- [ ] City is verified as served by LoadSaathi
- [ ] `slug` is unique and URL-friendly
- [ ] `name` and `state` are correct
- [ ] `description` is unique (2-3 sentences, factual)
- [ ] `industries` array is verified (not generic)
- [ ] `commodities` array is verified (specific to this city)
- [ ] `hubDistances` are verified against OSRM road routing
- [ ] `rateRanges` are labeled "indicative" in visible text
- [ ] `localFaq` has 3+ unique questions with factual answers
- [ ] `lastReviewed` date is set
- [ ] `owner` is assigned

### SEO

- [ ] Title tag: `Freight Transport in {City}, {State} — LoadSaathi`
- [ ] Meta description: unique, under 160 chars, includes city name
- [ ] H1: `Freight Transport in {City}`
- [ ] Canonical URL: `https://loadsaathi.in/location/{slug}`
- [ ] BreadcrumbList schema matches visible breadcrumbs
- [ ] WebPage + QAPage schema present
- [ ] DirectAnswer component renders after H1
- [ ] Page is in sitemap.xml

### Content Quality

- [ ] No "we serve every city" claims
- [ ] No fake addresses or offices
- [ ] No placeholder text
- [ ] No keyword stuffing
- [ ] No duplicate content from other location pages
- [ ] All claims are factual and verifiable

---

## Route Page Checklist

### Pre-Publish

- [ ] Corridor is verified as operational
- [ ] `slug` is unique and URL-friendly
- [ ] `from` and `to` cities are correct
- [ ] `fromState` and `toState` are correct
- [ ] `distanceKm` is verified against OSRM road routing
- [ ] `transitTime` is verified (not straight-line estimate)
- [ ] `dataStatus` is set (`verified`, `corrected`, or `needs_review`)
- [ ] `description` is unique (mentions specific commodities/industries)
- [ ] `keywords` are relevant and not stuffed
- [ ] `commodities` array is verified

### SEO

- [ ] Title tag: `Part Load Transport {From} to {To} | PTL & LTL Truck Booking | LoadSaathi`
- [ ] Meta description: unique, under 160 chars, includes distance and transit time
- [ ] H1: `Part Load Transport {From} to {To}`
- [ ] Canonical URL: `https://loadsaathi.in/routes/{slug}`
- [ ] BreadcrumbList schema matches visible breadcrumbs
- [ ] Service + Offer + QAPage schema present
- [ ] DirectAnswer component renders after H1
- [ ] Rate figures labeled "indicative"
- [ ] Page is in sitemap.xml

### Content Quality

- [ ] No "guaranteed" or "cheapest" claims
- [ ] No fabricated transit times
- [ ] No invented rate figures
- [ ] No keyword stuffing
- [ ] No duplicate content from other route pages
- [ ] All claims are factual and verifiable
- [ ] `dataStatus: "needs_review"` routes are flagged for review

---

## Post-Publish

- [ ] Page returns 200 status
- [ ] Canonical URL is correct
- [ ] No redirect chains
- [ ] Page is indexed (check Search Console after 1-2 weeks)
- [ ] No duplicate title/description in Search Console
- [ ] Page renders correctly on mobile
- [ ] All internal links work
- [ ] Analytics events fire correctly
