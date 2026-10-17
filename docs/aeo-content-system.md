# AEO Content System — LoadSaathi

**Date:** 2026-10-13

---

## Goal

Make LoadSaathi pages easy for users, Google Search, featured-answer systems, and AI answer systems to understand and cite. The output must be accurate, useful, concise where appropriate, and connected to a commercial next step.

---

## Reusable Components

### 1. DirectAnswer

**File:** `supabase/src/components/DirectAnswer.tsx`

A concise, visible HTML answer that appears immediately after the H1.

**Props:**
```typescript
{
  answer: string;      // 40–70 word plain-language answer
  qualifier?: string;  // Optional source/qualifier line
}
```

**Usage:**
```tsx
<DirectAnswer
  answer="PTL freight from Rourkela to Ranchi (180 km) costs approximately ₹4–6 per kg..."
  qualifier="Indicative rates, updated October 2026."
/>
```

**Rules:**
- Must be visible HTML text (not in accordion, image, or JS-only)
- Must not include unsupported statistics or guarantees
- Must include qualifier for rate/time claims
- 40–70 words for optimal featured snippet capture

### 2. KeyTakeaways (Recommended)

A bullet list of 3–5 concise takeaways. Use only on pages where it adds genuine value.

**Implementation:** Add as a reusable component or inline in page templates.

### 3. QuestionAnswerSection

Renders question-based H2/H3 sections with concise answers.

**Already implemented:** FAQ sections on route, location, and blog pages.

### 4. ComparisonTable

For PTL vs LTL vs FTL, vehicle choices, booking methods.

**Already implemented:** Guide pages with rate tables.

### 5. StepByStepProcess

For "How to book," "How to post a load," etc.

**Already implemented:** Guide pages with step-by-step sections.

### 6. FAQSection

Visible FAQs with optional matching FAQPage schema.

**Already implemented:** All page types with FAQ sections.

---

## Content Briefs

### What is PTL transport?

| Field | Value |
|-------|-------|
| Primary intent | Informational |
| Direct answer | PTL (Part Truck Load) is a shipping method where multiple shippers share space in the same truck. Instead of booking an entire truck, you pay only for the weight and volume your cargo occupies. |
| Questions to answer | What does PTL stand for? How is it different from FTL? What is the minimum weight? |
| Required business facts | Weight limits, pricing model, service areas |
| Sources to verify | LoadSaathi service pages, industry definitions |
| CTA | "Get a PTL quote" → /tools/fare-calculator |
| Internal links | /ptl-transport, /guide/ptl-vs-ftl, /tools/ptl-vs-ftl-calculator |
| Reviewer | Operations |

### PTL vs LTL vs FTL

| Field | Value |
|-------|-------|
| Primary intent | Comparison |
| Direct answer | PTL shares truck space (cheapest for <3t), LTL is structured consolidation, FTL is exclusive truck use (best for >7t or urgent). |
| Questions to answer | Which is cheaper? Which is faster? When to use each? |
| Required business facts | Weight thresholds, rate comparisons, transit time differences |
| Sources to verify | LoadSaathi pricing model, calculator outputs |
| CTA | "Compare options" → /tools/ptl-vs-ftl-calculator |
| Internal links | /guide/ptl-vs-ftl, /ptl-transport, /ltl-transport, /truck-load-booking |
| Reviewer | Operations |

### How to book a truck for a partial load

| Field | Value |
|-------|-------|
| Primary intent | How-to |
| Direct answer | Post your load with origin, destination, weight, and date. AI matching finds verified truckers. Compare quotes, book, and track live. |
| Questions to answer | What info do I need? How long does it take? How do I pay? |
| Required business facts | Booking flow, payment process, tracking |
| Sources to verify | LoadSaathi booking flow |
| CTA | "Post your load" → /register |
| Internal links | /how-it-works, /register, /tools/fare-calculator |
| Reviewer | Operations |

### How does truck transport pricing work?

| Field | Value |
|-------|-------|
| Primary intent | Informational |
| Direct answer | Truck pricing depends on distance, cargo weight/type, vehicle type, fuel costs, tolls, and return-load availability. PTL is priced per kg/tonne; FTL per vehicle. |
| Questions to answer | What affects the rate? How is PTL priced? How is FTL priced? |
| Required business facts | Rate calculation model, factors |
| Sources to verify | LoadSaathi pricing methodology |
| CTA | "Calculate your rate" → /tools/freight-rate-calculator |
| Internal links | /tools/fare-calculator, /tools/freight-rate-calculator, /guide/freight-rates-east-india |
| Reviewer | Operations |

### How can transporters find return loads?

| Field | Value |
|-------|-------|
| Primary intent | How-to |
| Direct answer | Post your trip with vehicle type, capacity, and route before loading. AI matching surfaces return-load opportunities heading back toward your home base. |
| Questions to answer | When to post? How does matching work? What are the best corridors? |
| Required business facts | Return load process, matching algorithm |
| Sources to verify | LoadSaathi matching process |
| CTA | "Find return loads" → /register |
| Internal links | /return-load, /blog/how-to-find-return-loads-india |
| Reviewer | Operations |

### What documents are commonly needed for road freight in India?

| Field | Value |
|-------|-------|
| Primary intent | Informational |
| Direct answer | Common documents include RC, permit, fitness certificate, insurance, e-way bill (for consignments above ₹50,000), and driver's licence. |
| Questions to answer | Which documents are mandatory? What is an e-way bill? |
| Required business facts | Current regulations (verify before publishing) |
| Sources to verify | Government gazette, GST portal, transport department |
| CTA | "Check document checklist" → /tools/document-checklist |
| Internal links | /tools/document-checklist, /blog/indian-logistics-eway-bill-gst-2026 |
| Reviewer | Legal/Compliance |

### How does a digital freight marketplace work?

| Field | Value |
|-------|-------|
| Primary intent | Informational |
| Direct answer | A digital freight marketplace connects shippers and truckers on one platform. Shippers post loads, truckers post trips, and matching algorithms pair them based on route, capacity, price, and reliability. |
| Questions to answer | How is it different from a broker? How does matching work? What are the fees? |
| Required business facts | Platform model, fee structure |
| Sources to verify | LoadSaathi platform pages |
| CTA | "Join free" → /register |
| Internal links | /freight-marketplace, /how-it-works, /pricing |
| Reviewer | Operations |

### How to get a freight quote from Odisha to another city

| Field | Value |
|-------|-------|
| Primary intent | How-to |
| Direct answer | Use the fare calculator with origin, destination, weight, and date to get an indicative rate range. For a precise quote, post your load and receive verified trucker quotes. |
| Questions to answer | What info do I need? Is the calculator accurate? How do I book? |
| Required business facts | Calculator inputs, quote process |
| Sources to verify | LoadSaathi calculator, booking flow |
| CTA | "Get a quote" → /tools/fare-calculator |
| Internal links | /tools/fare-calculator, /tools/freight-rate-calculator, /register |
| Reviewer | Operations |

---

## Quality Checks

### Before Publishing

- [ ] Direct answer is 40–70 words
- [ ] No unsupported statistics (all numbers have sources)
- [ ] Rate figures labeled "indicative"
- [ ] Transit times labeled "approximately"
- [ ] No "guaranteed" or "cheapest" claims
- [ ] CTA is relevant and non-promotional
- [ ] Internal links are relevant
- [ ] Reviewer has approved content

### After Publishing

- [ ] Page renders correctly on mobile
- [ ] Direct answer is visible in HTML (view source)
- [ ] FAQ schema matches visible FAQs
- [ ] No duplicate content
- [ ] Page is indexed in Search Console
