# AAO Trust Framework — LoadSaathi

**Date:** 2026-10-13

---

## Goal

Make LoadSaathi a trustworthy, citable source for India freight, PTL/LTL, truck booking, and return-load questions through original expertise, verifiable evidence, transparent authorship, freshness, and clean information architecture.

---

## Trust Pages & Authorship

### Current State

| Page | Status | Notes |
|------|--------|-------|
| /about | Exists | Company story, founding team |
| /contact | Exists | Registered office, support channels |
| /safety-trust | Exists | Trust features, verification process |
| /pricing | Exists | Transparent fee disclosure |
| /privacy | Exists | Data handling practices |
| /terms | Exists | Platform terms |
| /editorial-policy | Missing | Needs creation |
| /methodology | Missing | Needs creation |
| /corrections | Missing | Needs creation |

### Authorship Model

```typescript
interface Author {
  name: string;           // Real name, verified
  role: string;           // e.g., "Founder & CEO"
  bio: string;            // 1-2 sentence bio
  reviewedBy?: string;    // For operational/compliance content
  lastReviewed?: string;  // ISO date
}
```

### Current Authors (Needs Verification)

| Name | Role | Status |
|------|------|--------|
| Sanjaya Sahu | Founder & CEO | Verified (public profile) |
| Prince Mallik | Co-Founder & COO | Verified (public profile) |
| Priya Sharma | Product Lead | **Needs verification** |
| Amit Verma | Supply Chain Consultant | **Needs verification** |
| Rajesh Kumar | Logistics Operations Specialist | **Needs verification** |
| Vikram Singh | CTO | **Needs verification** |
| LoadSaathi Team | Editorial | Default fallback |

**Action Required:** Confirm all author names are real people. If not, use "LoadSaathi Team" instead.

---

## Original Knowledge Assets

### Templates to Create

| Template | Status | Required Data |
|----------|--------|---------------|
| Freight rate methodology | Not created | Rate calculation model, data sources |
| Route coverage methodology | Not created | Coverage verification process |
| Freight glossary | Not created | Industry terms and definitions |
| PTL/LTL/FTL decision guide | Exists (/guide/ptl-vs-ftl) | — |
| Shipment case study | Not created | Real customer data with permission |
| Odisha/East India freight insights | Partial (blog articles) | Verified market data |
| How LoadSaathi matching works | Exists (/blog/how-load-saathi-matching-works) | — |
| Support/tracking/dispute workflows | Not created | Actual workflow documentation |

### Template Structure

Each knowledge asset must include:

```typescript
interface KnowledgeAsset {
  title: string;
  slug: string;
  status: "draft" | "review" | "published";
  author: string;           // Real, verified name
  reviewer: string;         // For operational/compliance content
  datePublished: string;    // ISO date
  lastUpdated: string;      // ISO date
  updateCadence: string;    // e.g., "quarterly", "monthly"
  methodology: string;      // How data is gathered/calculated
  limitations: string;      // What this content does NOT cover
  sources: string[];        // Primary sources for claims
  cta: string;              // Call to action
  internalLinks: string[];  // Related pages
}
```

---

## Citation-Quality Architecture

### Rules

1. **Clear definitions** — Define industry terms (PTL, LTL, FTL, e-way bill, etc.)
2. **Original examples** — Use real LoadSaathi scenarios, not generic examples
3. **Transparent methodology** — Explain how rates are calculated
4. **Source links** — Link to official primary sources for regulations, taxes, compliance
5. **HTML text** — Important facts must render in HTML text, not just schema or JS

### Primary Sources to Reference

| Topic | Primary Source |
|-------|---------------|
| GST/e-way bill | gst.gov.in |
| Motor Vehicles Act | legislative.gov.in |
| National Highways | morth.nic.in |
| PIB releases | pib.gov.in |
| NITI Aayog | niti.gov.in |
| DPIIT | dpiit.gov.in |

---

## Content Quality Controls

### Pre-Publish Checklist

- [ ] No placeholder claims ("TBD", "coming soon")
- [ ] No unsupported numerical assertions
- [ ] No fake testimonials or reviews
- [ ] No fake citations or sources
- [ ] No stale dates (>6 months for rate content, >12 months for evergreen)
- [ ] No "best", "cheapest", or "guaranteed" language
- [ ] Author is verified
- [ ] Reviewer has approved (for operational/compliance content)
- [ ] Methodology is documented
- [ ] Limitations are stated

### Automated Checks (To Implement)

- [ ] Flag pages with no author
- [ ] Flag pages with no update history
- [ ] Flag pages with data-based claims but no methodology
- [ ] Flag pages with "best", "cheapest", "guaranteed" language
- [ ] Flag pages with unsupported numerical assertions

---

## AI Features

### Current State

- `llms.txt` exists — site summary for AI agents (standard practice, not required by Google)
- No AI-only schema
- No hidden AI content
- Follows standard SEO and content-quality practices

### Principles

1. **No special AI schema** — Use standard schema.org types
2. **No hidden content** — All content is visible to users and crawlers
3. **No AI-only pages** — All pages serve user needs first
4. **No claims of AI inclusion** — Don't claim inclusion in AI Overviews or other surfaces
5. **Standard SEO best practices** — Crawlable, indexable, helpful content

---

## Roadmap

### Phase 1 (Immediate)
- [ ] Verify all author names
- [ ] Create /editorial-policy page
- [ ] Create /methodology page
- [ ] Add "Last updated" display to all content pages

### Phase 2 (1 month)
- [ ] Create /corrections page
- [ ] Add pre-publish checklist to content workflow
- [ ] Implement automated content quality checks
- [ ] Create author profile pages (for verified authors)

### Phase 3 (3 months)
- [ ] Create freight rate methodology page
- [ ] Create route coverage methodology page
- [ ] Create freight glossary
- [ ] Publish first verified case study
