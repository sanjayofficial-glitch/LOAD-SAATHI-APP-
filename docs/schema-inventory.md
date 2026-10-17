# Schema Inventory — LoadSaathi

**Date:** 2026-10-13

---

## Schema Types by Page

### Sitewide (index.html)

| Schema Type | Pages | Key Fields | Source |
|-------------|-------|------------|--------|
| Organization | All (via index.html) | name, url, logo, description, foundingDate, founder, employees, sameAs, contactPoint, address | `api/site.js` |
| LocalBusiness | All (via index.html) | name, description, url, telephone, priceRange, address, geo, openingHoursSpecification, areaServed, sameAs | `api/site.js` |
| WebSite | All (via index.html) | name, url, description, publisher, potentialAction (SearchAction) | `api/site.js` |

### Dynamic (api/agent.js)

| Schema Type | Pages | Key Fields | Source |
|-------------|-------|------------|--------|
| BreadcrumbList | All public pages | itemListElement (Home → Section → Page) | `api/agent.js` |
| Article | Blog, Guide | headline, description, author, datePublished, dateModified, mainEntityOfPage, articleSection, wordCount | `api/agent.js` BLOG_DATA, GUIDE_DATA |
| FAQPage | Blog, Guide, Location, Transport-service | mainEntity (Question/Answer) | `api/agent.js` |
| Service | Route | name, description, url, provider, areaServed, serviceType, offers | `api/agent.js` ROUTE_DATA |
| Offer | Route | priceCurrency, price, priceSpecification, availability | `api/agent.js` laneRates() |
| QAPage | Route | name, mainEntity (Question/Answer) | `api/agent.js` routeFaq() |
| HowTo | Guide | name, description, datePublished, dateModified, step | `api/agent.js` GUIDE_DATA |
| WebPage | All | name, description, url, inLanguage | `api/agent.js` |
| Table | Guide | name, url, description, headers, rows | `api/agent.js` GUIDE_DATA rateTable |
| WebPage + Place | Location | name, description, url, about (Place with address) | `api/agent.js` LOCATION_DATA |
| Organization | /about | name, url, logo, description, sameAs, contactPoint | `api/agent.js` |
| LocalBusiness | /contact | name, url, logo, telephone, email, address, geo, openingHoursSpecification | `api/agent.js` |

---

## Fields Intentionally Omitted

| Field | Reason |
|-------|--------|
| `aggregateRating` | No verified review data |
| `review` | No verified customer reviews |
| `price` (on Service) | Rates are estimates, not live prices — using `priceSpecification` with min/max instead |
| `image` (on Article) | No unique per-article images (using default OG image) |
| `author` (on some articles) | Some articles use "LoadSaathi Team" — no individual author |
| `datePublished` (on routes) | Routes don't have publication dates — they are evergreen reference pages |

---

## Schema Validation Checklist

### Automated
- [ ] Add JSON-LD validation to build pipeline (`scripts/validate-schema.mjs`)
- [ ] Validate all required fields are present
- [ ] Validate no empty strings in required fields

### Manual (Google Rich Results Test)
- [ ] Test homepage: https://search.google.com/test/rich-results
- [ ] Test blog article: `/blog/reduce-empty-kilometers`
- [ ] Test route page: `/routes/rourkela-to-ranchi`
- [ ] Test location page: `/location/rourkela`
- [ ] Test guide page: `/guide/ptl-vs-ftl`
- [ ] Test FAQ page: `/faq`

### Search Console
- [ ] Check "Enhancements" section for rich result eligibility
- [ ] Monitor for schema errors in Search Console
- [ ] Verify breadcrumbs appear in search results

---

## Data Dependencies

| Data | Source | Used By |
|------|--------|---------|
| Company info | `api/site.js` | Organization, LocalBusiness |
| Blog articles | `api/agent.js` BLOG_DATA | Article, FAQPage |
| Route data | `api/agent.js` ROUTE_DATA | Service, Offer, QAPage |
| Location data | `api/agent.js` LOCATION_DATA | WebPage, Place |
| Guide data | `api/agent.js` GUIDE_DATA | HowTo, Table |
| Rate bands | `api/agent.js` laneRates() | Service.offers |
| Social profiles | `api/site.js` SOCIALS | Organization.sameAs |
