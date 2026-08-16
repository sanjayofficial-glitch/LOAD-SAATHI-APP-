# How to Publish These 5 Articles — Publication Guide for loadsaathi.in

**Date:** August 14, 2026 | **Prepared by:** Manus AI

This guide accompanies the five SEO-optimized article drafts. Follow it in order to get maximum ranking impact, and note the one critical technical dependency at the top.

## Critical Dependency: The Rendering Fix Comes First

Every article below is optimized to rank — but the ranking audit showed that your inner pages currently return an identical client-rendered HTML shell to crawlers, so Google cannot see unique titles or content on any blog URL. **Before publishing article #1, implement prerendering/SSR for blog pages** (see the Keyword Ranking Performance Audit report, Priority 1). If the fix ships after the articles, simply republish and resubmit — the content is not lost, only the visibility.

## Gap Check Summary

Before writing, each topic was checked against your live blog inventory (~33 posts). Here is the result:

| # | Topic | Status on Your Site | Action |
|---|---|---|---|
| 1 | Return Loads in Rourkela | You have a national "How to Find Return Load Trucks" post (Aug 9) but **no Rourkela city article** | Published as new article |
| 2 | PTL Transport in Odisha & Jharkhand | PTL vs FTL and national rate guides exist, **no state-level PTL article** | Published as new article |
| 3 | Trucker Earnings in Odisha 2026 | **Nothing exists** — this was your biggest content gap | Published as new article |
| 4 | E-Way Bill Rules for Transporters | Two EWB posts exist (July 23 national; Aug 5 GST Advisory 668) — both aimed at national queries you can't win | Published as transporter-angled rewrite; publish new or merge into the Aug 5 post |
| 5 | Steel Transport from Rourkela | National steel guides exist, **no Rourkela-specific article** | Published as new article |

## Publishing Checklist Per Article

For each article, your developer/webmaster should set these before going live:

1. **Slug** — exactly as specified in each article's SEO SETUP header (e.g., `/blog/return-loads-rourkela`).
2. **Title tag** — 50–60 characters, primary keyword near the front.
3. **Meta description** — 150–160 characters, includes keyword + a benefit/number.
4. **H1** — matches the article's H1 (keyword + year).
5. **Internal links** — all specified in the checklist table of each article; these build the topic cluster that Google needs to see.
6. **Canonical tag** — set to the article's own URL.
7. **Schema** — Article + FAQPage JSON-LD; the FAQ blocks are already written at the end of each article.
8. **Images** — at least one per article with the suggested alt text; compress under 150 KB.
9. **Category** — as specified (Trucker Tips / Shipper Guide / Industry Guide).
10. **Read time** — already specified; ensure word count matches (~1,800–2,800 words per article).

## Publishing Order and Cadence

| Week | Publish | Follow-up Action |
|---|---|---|
| Week 1 | #1 Return Loads in Rourkela | Submit URL in Google Search Console → URL Inspection → Request Indexing |
| Week 1–2 | #4 E-Way Bill Transporters (publish or merge) | Same resubmission; update your two existing EWB posts to internally link to it |
| Week 2 | #2 PTL Transport in Odisha & Jharkhand | Link from all 5 city guide posts (Rourkela, Ranchi, Bhubaneswar, Kolkata, Jamshedpur) |
| Week 3 | #3 Trucker Earnings in Odisha | Link from "How to Become a Truck Owner" and "Cost per km" posts |
| Week 4 | #5 Steel Transport from Rourkela | Link from both existing national steel posts |

## Internal Linking Rules Going Forward

Every future blog post should contain 3–5 internal links: two to your route/location pages (`/routes/*`, `/location/*`), one to a relevant calculator or solution page, and one to another blog post in the same cluster. Every route page should link to its matching blog article and the fare calculator. This internal web is what tells Google your site is an authority on East India freight — and it compounds with each new article.

## Measuring Success (Check After 60 Days)

Re-run the five keyword checks from the long-tail content plan and track in Google Search Console: impressions and average position for each article's primary keyword, plus total clicks to `/blog/*`. Target after 60 days: all five articles in the top 10 for their primary keywords, and at least three in the top 3. If any article stalls below page 2, it usually means (a) the render fix is incomplete for that template, or (b) it needs one more internal link from a higher-traffic page.
