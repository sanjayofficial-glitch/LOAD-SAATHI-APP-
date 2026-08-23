# LoadSaathi SEO Implementation & Publishing Checklist

This document provides a step-by-step execution plan for the LoadSaathi marketing and development teams to implement the SEO growth strategy.

## Phase 1: Technical Cleanup & Consolidation (Week 1)

**Goal:** Eliminate keyword cannibalization and ensure Google can properly crawl and index the most important pages.

*   [ ] **Calculator Consolidation:**
    *   Set up 301 redirects for `/transport-cost-calculator`, `/freight-rate-calculator`, `/truck-load-calculator`, `/ptl-vs-ftl-calculator`, and `/return-load-calculator` pointing to the primary `/fare-calculator` page.
*   [ ] **Indexation Review:**
    *   Log into Google Search Console.
    *   Navigate to the "Pages" report and view the 31 "Not Indexed" URLs.
    *   If any of these are core pages (like the homepage, contact page, or key routes), click "Request Indexing."
    *   If they are low-value pages (e.g., author archives, tag pages), ensure they have a `<meta name="robots" content="noindex">` tag in the HTML head.
*   [ ] **Update Meta Tags on `/fare-calculator`:**
    *   **Title:** `Truck Transport Cost & Freight Rate Calculator India 2026 | LoadSaathi`
    *   **Description:** `Calculate exact 2026 PTL and FTL truck transport costs per km in India. Get instant freight charges for your route and save up to 30% on shared loads.`

## Phase 2: Route Page Rollout (Weeks 2-3)

**Goal:** Capture high-intent commercial traffic by launching localized route pages.

*   [ ] **Publish the Jamshedpur to Bhubaneswar Page:**
    *   Use the content drafted in `Draft_Route_Jamshedpur_Bhubaneswar.md`.
    *   Publish at the URL: `/routes/jamshedpur-to-bhubaneswar`
*   [ ] **Draft & Publish Next Priority Routes:**
    *   Using the same template, create pages for:
        *   `/routes/rourkela-to-kolkata`
        *   `/routes/bhubaneswar-to-vizag`
        *   `/routes/ranchi-to-dhanbad`
*   [ ] **Internal Linking Update:**
    *   Update the main `/routes` hub page to ensure all new route pages are prominently linked.

## Phase 3: Content Marketing & Social Alignment (Weeks 3-4)

**Goal:** Publish blog content that aligns with top-performing social themes and targets informational search queries.

*   [ ] **Publish "The Cost of Empty Miles" Blog:**
    *   Use the content drafted in `Draft_Blog_Empty_Miles.md`.
    *   Ensure the Instagram Reel is properly embedded using Instagram's embed code.
    *   Publish at the URL: `/blog/hidden-cost-empty-miles-msme-logistics`
*   [ ] **Draft & Publish "PTL vs. FTL" Guide:**
    *   **Title:** `PTL vs. FTL: Why Part Truck Load is the Smart Choice for Indian MSMEs in 2026`
    *   **URL:** `/blog/ptl-vs-ftl-smart-choice-msme`
    *   Ensure it links to the `/fare-calculator` and `/guide/ptl-vs-ftl`.
*   [ ] **Social Media Promotion:**
    *   Share the new blog posts on LinkedIn and Facebook.
    *   Create a new Instagram Story highlighting the "Empty Miles" blog post with a "Link in Bio" CTA.

## Phase 4: Measurement & Analytics Setup (Ongoing)

**Goal:** Ensure we are tracking the right metrics to measure the success of the SEO strategy.

*   [ ] **Configure GA4 Events:**
    *   Ensure Google Analytics 4 is properly tracking the following custom events:
        *   `calculator_started`
        *   `estimate_generated`
        *   `generate_lead`
*   [ ] **Monitor GSC Performance:**
    *   Check Google Search Console weekly to monitor impressions and clicks for the newly launched route pages and the consolidated calculator page.
