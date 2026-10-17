# Content Evidence Checklist — LoadSaathi

**Date:** 2026-10-13

---

## Purpose

This checklist is used to verify that all content claims on loadsaathi.in are backed by actual data, sources, or evidence. It must be completed before any content is published.

---

## Pre-Publish Evidence Checklist

### Authorship & Attribution

- [ ] Author name is a real, verified person
- [ ] Author bio is accurate and not misleading
- [ ] Reviewer name is provided (for operational/compliance content)
- [ ] "Last updated" date is current and accurate
- [ ] No ghostwritten content under a fake name

### Statistical Claims

Every numerical claim must have a source:

| Claim Type | Required Source | Example |
|------------|-----------------|---------|
| Market size | Industry report + date | "USD 167.5B (Mordor Intelligence, 2026)" |
| Growth rate | Industry report + date | "8.8% CAGR (Mordor Intelligence, 2026)" |
| Percentage of trucks empty | Government/industry source | "40% (MoRTH, 2025)" |
| Earnings data | Platform data or industry survey | "₹18,000-25,000/month (LoadSaathi data)" |
| Rate figures | Platform data or labeled "indicative" | "₹4-6/kg (indicative, Oct 2026)" |
| Distance | OSRM road routing | "180 km (OSRM)" |
| Transit time | Verified average | "~4 hours (typical)" |

### Coverage Claims

- [ ] All cities listed are actually served
- [ ] All corridors listed are operational
- [ ] "areaServed" in schema matches actual coverage
- [ ] No claims of service in unverified locations
- [ ] No "we serve every city" claims

### Rate & Pricing Claims

- [ ] Rate figures are labeled "indicative" if not live
- [ ] Rate figures have an "as of" date
- [ ] Rate figures include context (cargo type, vehicle type)
- [ ] No "guaranteed" or "fixed" rate claims
- [ ] No "cheapest" or "best price" claims
- [ ] Platform fees are clearly disclosed

### Regulatory & Compliance Claims

- [ ] All regulations cited are current (verify date)
- [ ] Sources are primary (government portals, not news articles)
- [ ] Compliance advice is reviewed by legal/compliance team
- [ ] No guarantees of compliance outcomes

### Testimonials & Reviews

- [ ] Customer names are real (with permission)
- [ ] Claims are from actual customers (not fabricated)
- [ ] No incentivized reviews without disclosure
- [ ] No fake case studies

---

## Automated Checks (To Implement)

### Placeholder Detection
- [ ] Flag "TBD", "coming soon", "XXX", "lorem ipsum"
- [ ] Flag empty or missing fields

### Unsupported Numerical Assertions
- [ ] Flag numbers without nearby source citations
- [ ] Flag percentages without context

### Stale Content
- [ ] Flag rate content older than 6 months without review
- [ ] Flag evergreen content older than 12 months without review

### Missing Attribution
- [ ] Flag pages with no author
- [ ] Flag pages with no "last updated" date
- [ ] Flag data-based claims with no methodology

### Prohibited Language
- [ ] Flag "best", "cheapest", "guaranteed", "lowest"
- [ ] Flag superlatives without evidence
- [ ] Flag unsubstantiated claims

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Author | | | |
| Reviewer | | | |
| Operations | | | |
| Legal/Compliance | | | (if applicable) |
