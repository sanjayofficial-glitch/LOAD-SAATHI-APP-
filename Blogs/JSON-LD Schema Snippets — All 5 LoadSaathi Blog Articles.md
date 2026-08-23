# JSON-LD Schema Snippets — All 5 LoadSaathi Blog Articles

**Prepared for:** LoadSaathi (loadsaathi.in)
**Date:** August 14, 2026
**How to use:** Copy the `<script>` block for each article and paste it into the `<head>` of that page's HTML (or via your CMS's "custom head HTML" field). Every snippet is valid JSON-LD for Google's Rich Results. Verify each one in [Google's Rich Results Test](https://search.google.com/test/rich-results) before publishing.

**Audience priority applied:** As requested, all snippets are framed around LoadSaathi's core audiences — **independent truck drivers first, then MSME/SME shippers**. The `audience` property, `author`/`publisher` framing, and FAQ answers all reflect this positioning.

---

## Snippet 0 — Sitewide Organization + WebSite (add to every page, not just articles)

This defines who LoadSaathi is for Google's knowledge graph and enables the sitelinks search box. Your homepage already has an Organization block; replace it with this fuller version:

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://loadsaathi.in/#organization",
      "name": "LoadSaathi",
      "alternateName": ["Load Saathi", "LoadSaathi AI"],
      "url": "https://loadsaathi.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://loadsaathi.in/logo.png",
        "width": 512,
        "height": 512
      },
      "description": "LoadSaathi is India's AI-powered freight marketplace connecting independent truck drivers and MSME shippers for PTL, FTL and return loads — with a focus on East India corridors.",
      "foundingDate": "2026",
      "founder": {
        "@type": "Person",
        "name": "Sanjaya Sahu",
        "jobTitle": "Founder, LoadSaathi",
        "sameAs": [
          "https://in.linkedin.com/in/load-saathi-119867422/",
          "https://x.com/LoadSaathi"
        ]
      },
      "sameAs": [
        "https://x.com/LoadSaathi",
        "https://www.facebook.com/people/Load-Saathi/61590859902405/",
        "https://www.instagram.com/loadsaathi/",
        "https://www.linkedin.com/in/load-saathi-119867422/",
        "https://www.reddit.com/user/Loadsaathi/"
      ],
      "areaServed": [
        { "@type": "Place", "name": "Odisha, India" },
        { "@type": "Place", "name": "Jharkhand, India" },
        { "@type": "Place", "name": "West Bengal, India" }
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "url": "https://loadsaathi.in/contact",
        "availableLanguage": ["English", "Hindi", "Odia"]
      },
      "knowsAbout": [
        "PTL transport", "LTL transport", "return loads", "freight rate calculation",
        "truck load matching", "East India freight logistics", "digital freight marketplace"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://loadsaathi.in/#website",
      "url": "https://loadsaathi.in",
      "name": "LoadSaathi – AI Truck Load & Return Load Marketplace in India",
      "publisher": { "@id": "https://loadsaathi.in/#organization" },
      "inLanguage": "en-IN"
    }
  ]
}
</script>
```

---

## Article 1 — Return Loads in Rourkela (`/blog/return-loads-rourkela`)

**Audience:** Independent truck drivers (primary).

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://loadsaathi.in/blog/return-loads-rourkela#article",
      "headline": "Return Loads in Rourkela 2026 — Fill Your Empty Return Trip & Cut Fuel Waste",
      "description": "Find return loads from Rourkela in 2026. Fill your empty return trip to Kolkata, Ranchi, Bhubaneswar and Jamshedpur with verified shippers and save 40-60% on deadhead kilometres.",
      "image": "https://loadsaathi.in/images/return-loads-rourkela-cover.jpg",
      "datePublished": "2026-08-15T00:00:00+05:30",
      "dateModified": "2026-08-15T00:00:00+05:30",
      "author": {
        "@type": "Organization",
        "@id": "https://loadsaathi.in/#organization",
        "name": "LoadSaathi Editorial Team",
        "url": "https://loadsaathi.in/blog"
      },
      "publisher": { "@id": "https://loadsaathi.in/#organization" },
      "mainEntityOfPage": { "@id": "https://loadsaathi.in/blog/return-loads-rourkela" },
      "inLanguage": "en-IN",
      "audience": {
        "@type": "Audience",
        "audienceType": "Independent truck drivers, owner-operators and fleet drivers in Odisha and Jharkhand"
      },
      "articleSection": "Trucker Tips",
      "wordCount": 1900,
      "timeRequired": "PT9M"
    },
    {
      "@type": "FAQPage",
      "@id": "https://loadsaathi.in/blog/return-loads-rourkela#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I find return loads from Rourkela?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Register your truck on a digital load-matching platform like LoadSaathi. The AI engine matches your return corridor with verified shippers posting loads that start where your current delivery ends, so you get return load offers before you even finish unloading."
          }
        },
        {
          "@type": "Question",
          "name": "Which apps give return loads in Odisha?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "LoadSaathi, alongside national load boards, offers the strongest East India coverage for return loads in Odisha and Jharkhand. Regional WhatsApp groups also share loads informally, but without payment protection or shipper verification."
          }
        },
        {
          "@type": "Question",
          "name": "How much can I save with a return load?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A partial return load typically covers your return-leg diesel (Rs 15,000-20,000 on a 430 km corridor like Rourkela-Kolkata) and adds Rs 20,000-30,000 in revenue, effectively doubling round-trip profit. Around 40% of Indian trucks return empty, so finding a backhaul is the single biggest earnings lever for independent truckers."
          }
        },
        {
          "@type": "Question",
          "name": "Is LoadSaathi free for truckers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Truckers can register and browse AI-matched loads on LoadSaathi, including independent owner-operators with a single truck. The platform charges shippers a service fee instead of taking a 10-15% broker commission, so truckers keep more of what they earn."
          }
        },
        {
          "@type": "Question",
          "name": "What cargo types come back from Kolkata to Rourkela?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Steel coils and TMT bars heading to distributors, cement consignments, FMCG goods and packaged food are the most common return cargoes on the Rourkela-Kolkata corridor, making it one of the most reliable backhaul routes in East India."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://loadsaathi.in/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://loadsaathi.in/blog" },
        { "@type": "ListItem", "position": 3, "name": "Return Loads in Rourkela 2026", "item": "https://loadsaathi.in/blog/return-loads-rourkela" }
      ]
    }
  ]
}
</script>
```

---

## Article 2 — PTL Transport in Odisha & Jharkhand (`/blog/ptl-transport-odisha-jharkhand`)

**Audience:** MSME/SME shippers (primary), truck drivers (secondary). Includes a `Service` block describing your PTL service — this is what helps you appear in "service" rich results.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://loadsaathi.in/blog/ptl-transport-odisha-jharkhand#article",
      "headline": "PTL Transport in Odisha & Jharkhand 2026 — Share Truck Space & Pay Only for What You Ship",
      "description": "PTL transport in Odisha and Jharkhand: share truck space and pay per tonne, not per full truck. 2026 rates for Rourkela, Ranchi, Kolkata and Bhubaneswar corridors plus a step-by-step booking guide for MSMEs.",
      "image": "https://loadsaathi.in/images/ptl-transport-odisha-cover.jpg",
      "datePublished": "2026-08-19T00:00:00+05:30",
      "dateModified": "2026-08-19T00:00:00+05:30",
      "author": {
        "@type": "Organization",
        "@id": "https://loadsaathi.in/#organization",
        "name": "LoadSaathi Editorial Team",
        "url": "https://loadsaathi.in/blog"
      },
      "publisher": { "@id": "https://loadsaathi.in/#organization" },
      "mainEntityOfPage": { "@id": "https://loadsaathi.in/blog/ptl-transport-odisha-jharkhand" },
      "inLanguage": "en-IN",
      "audience": {
        "@type": "Audience",
        "audienceType": "MSME and SME shippers, traders, millers and distributors in Odisha and Jharkhand"
      },
      "articleSection": "Shipper Guide",
      "wordCount": 2200,
      "timeRequired": "PT10M"
    },
    {
      "@type": "Service",
      "@id": "https://loadsaathi.in/blog/ptl-transport-odisha-jharkhand#service",
      "serviceType": "Part Truck Load (PTL) Transport",
      "name": "PTL Transport in Odisha & Jharkhand",
      "provider": { "@id": "https://loadsaathi.in/#organization" },
      "areaServed": [
        { "@type": "Place", "name": "Odisha, India" },
        { "@type": "Place", "name": "Jharkhand, India" }
      ],
      "description": "AI-matched PTL (shared truck space) transport for MSMEs and SMEs on East India corridors. Pay per tonne, not per full truck, with live GPS tracking and escrow-backed payment.",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": "1800",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": "1800",
          "minPrice": "1500",
          "maxPrice": "3000",
          "unitText": "per tonne, corridor dependent"
        }
      },
      "url": "https://loadsaathi.in/ptl-transport"
    },
    {
      "@type": "FAQPage",
      "@id": "https://loadsaathi.in/blog/ptl-transport-odisha-jharkhand#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the minimum weight for PTL?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most PTL operators in India accept consignments from 500 kg to 6 tonnes. Below 500 kg, parcel-courier LTL networks usually work better; above 6-8 tonnes, booking a full truck (FTL) becomes cheaper per tonne."
          }
        },
        {
          "@type": "Question",
          "name": "How much cheaper is PTL than FTL?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "PTL typically costs 30-40% less than booking a full truck for the same consignment, because MSME shippers pay only for their share of truck space while the platform fills the rest with compatible loads."
          }
        },
        {
          "@type": "Question",
          "name": "Which cities have PTL service in Odisha?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "PTL service is available on all major corridors from Rourkela, Bhubaneswar, Cuttack, Sambalpur, Kolkata, Ranchi, Jamshedpur and Dhanbad - the full East India freight belt covered by LoadSaathi."
          }
        },
        {
          "@type": "Question",
          "name": "How long does PTL delivery take in Jharkhand?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Short corridors like Ranchi-Jamshedpur (130 km) move within a day. Longer corridors like Ranchi-Bhubaneswar (480 km) take 10-12 hours. Add 20-30% buffer during monsoon season."
          }
        },
        {
          "@type": "Question",
          "name": "Is my cargo insured in shared truck space?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Cargo liability terms depend on the transport agreement and should be confirmed at booking. On LoadSaathi, consignment terms, vehicle details and delivery verification are documented digitally at booking, and both shipper and trucker are verified and credit-scored."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://loadsaathi.in/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://loadsaathi.in/blog" },
        { "@type": "ListItem", "position": 3, "name": "PTL Transport in Odisha & Jharkhand 2026", "item": "https://loadsaathi.in/blog/ptl-transport-odisha-jharkhand" }
      ]
    }
  ]
}
</script>
```

---

## Article 3 — Truck Driver & Owner Earnings in Odisha 2026 (`/blog/trucker-earnings-odisha-2026`)

**Audience:** Independent truck drivers and owner-operators (primary). The Article block explicitly declares this audience so Google associates LoadSaathi with trucker-economy queries.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://loadsaathi.in/blog/trucker-earnings-odisha-2026#article",
      "headline": "Truck Driver & Owner Earnings in Odisha 2026 — Salary, Profit Per Trip & the Return Load Advantage",
      "description": "How much do truck drivers earn in Odisha 2026? Driver salaries by truck type, a full owner P&L per trip, running cost per km, and how return loads can double an independent trucker's earnings.",
      "image": "https://loadsaathi.in/images/trucker-earnings-odisha-cover.jpg",
      "datePublished": "2026-08-22T00:00:00+05:30",
      "dateModified": "2026-08-22T00:00:00+05:30",
      "author": {
        "@type": "Organization",
        "@id": "https://loadsaathi.in/#organization",
        "name": "LoadSaathi Editorial Team",
        "url": "https://loadsaathi.in/blog"
      },
      "publisher": { "@id": "https://loadsaathi.in/#organization" },
      "mainEntityOfPage": { "@id": "https://loadsaathi.in/blog/trucker-earnings-odisha-2026" },
      "inLanguage": "en-IN",
      "audience": {
        "@type": "Audience",
        "audienceType": "Independent truck drivers, owner-operators and small fleet owners in Odisha and Jharkhand"
      },
      "articleSection": "Trucker Tips",
      "wordCount": 2400,
      "timeRequired": "PT11M"
    },
    {
      "@type": "FAQPage",
      "@id": "https://loadsaathi.in/blog/trucker-earnings-odisha-2026#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the salary of a truck driver in Odisha?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Average truck driver salaries in Odisha range from Rs 12,000 to Rs 30,000 per month depending on vehicle class and cargo. Regional runs pay Rs 15,000-20,000; long-haul steel, coal and port cargo runs pay Rs 20,000-30,000."
          }
        },
        {
          "@type": "Question",
          "name": "How much profit does a truck owner make per month?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A 10-tyre truck owner with direct bookings and paid return loads on the Rourkela-Kolkata corridor can net Rs 3-3.5 lakh per month on two round trips weekly. Broker-dependent owners with empty returns typically net only Rs 60,000-80,000."
          }
        },
        {
          "@type": "Question",
          "name": "How do return loads increase truck earnings?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A paid return leg covers return diesel and toll (Rs 18,000-20,000 on a 430 km corridor) and adds Rs 20,000-30,000 in revenue, more than doubling round-trip profit. Roughly 40% of Indian trucks return empty - eliminating that is the biggest earnings lever for independent truckers."
          }
        },
        {
          "@type": "Question",
          "name": "What is the running cost per km for a 10-tyre truck?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A 10-tyre truck or trailer costs Rs 45-60 per km to operate, including diesel, tyres, maintenance, insurance and driver wages. At typical corridor earnings of Rs 60-85 per km, the truck must stay at least 70% loaded to remain profitable."
          }
        },
        {
          "@type": "Question",
          "name": "Is it profitable to buy a truck in Jharkhand?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes - provided you secure both legs of every trip. Ranchi-Jamshedpur-Dhanbad corridors carry dense coal and manufacturing traffic, making backhauls easier to find than in most regions. High utilization returns the investment in 3-4 years; empty returns can stretch payback beyond 6 years."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://loadsaathi.in/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://loadsaathi.in/blog" },
        { "@type": "ListItem", "position": 3, "name": "Trucker Earnings in Odisha 2026", "item": "https://loadsaathi.in/blog/trucker-earnings-odisha-2026" }
      ]
    }
  ]
}
</script>
```

---

## Article 4 — E-Way Bill Rules for Transporters & Truckers 2026 (`/blog/eway-bill-rules-transporters-truckers-2026`)

**Audience:** Independent truck drivers and small transporters (primary), MSME shippers generating consignments (secondary).

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://loadsaathi.in/blog/eway-bill-rules-transporters-truckers-2026#article",
      "headline": "E-Way Bill Rules for Transporters & Truckers 2026 — What Changed and What You Must Do",
      "description": "E-way bill rules for transporters 2026: mandatory Ship-To GSTIN from 1 August, the new closure facility, Portal 2.0, truck driver duties and penalties - a practical compliance guide for Indian truckers and small transporters.",
      "image": "https://loadsaathi.in/images/eway-bill-transporters-cover.jpg",
      "datePublished": "2026-08-26T00:00:00+05:30",
      "dateModified": "2026-08-26T00:00:00+05:30",
      "author": {
        "@type": "Organization",
        "@id": "https://loadsaathi.in/#organization",
        "name": "LoadSaathi Editorial Team",
        "url": "https://loadsaathi.in/blog"
      },
      "publisher": { "@id": "https://loadsaathi.in/#organization" },
      "mainEntityOfPage": { "@id": "https://loadsaathi.in/blog/eway-bill-rules-transporters-truckers-2026" },
      "inLanguage": "en-IN",
      "audience": {
        "@type": "Audience",
        "audienceType": "Independent truck drivers, small transporters and MSME shippers moving goods by road in India"
      },
      "articleSection": "Industry Insights",
      "wordCount": 2100,
      "timeRequired": "PT10M"
    },
    {
      "@type": "FAQPage",
      "@id": "https://loadsaathi.in/blog/eway-bill-rules-transporters-truckers-2026#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Does a truck driver need to generate an e-way bill?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The driver does not generate the e-way bill - the supplier, recipient or transporter does. But the driver must confirm the e-way bill number exists, that the vehicle number in Part B matches the truck being driven, and carry the number for the entire trip. No e-way bill, no trip."
          }
        },
        {
          "@type": "Question",
          "name": "What happens if the e-way bill expires mid-transit?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Expired validity is a valid ground for detention at check posts. Generate validity based on actual distance plus a buffer (roughly 1 day per 200 km). If it expires mid-route, the transporter must generate a fresh e-way bill - you cannot legally continue on an expired one."
          }
        },
        {
          "@type": "Question",
          "name": "What is e-way bill closure and does it benefit transporters?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "E-way bill closure is a voluntary facility letting the supplier close the bill once delivery is verified as complete. It protects transporters and truck drivers by creating clean evidence of completed delivery and reducing open-bill verification mismatches on the vehicle."
          }
        },
        {
          "@type": "Question",
          "name": "What is the Ship-To GSTIN change from 1 August 2026?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "For bill-to/ship-to consignments, the GSTN made the Ship-To GSTIN - the recipient's actual delivery-location GSTIN - mandatory in the e-way bill from 1 August 2026. Consignments missing this field are flagged at check-post verification and may be detained."
          }
        },
        {
          "@type": "Question",
          "name": "What is the penalty for e-way bill violations for transporters?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Violations lead to detention of goods and vehicle, plus a penalty of up to Rs 10,000 or the tax amount involved, whichever is higher. The costliest consequence is usually transit delay - check-post detention typically takes days to resolve."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://loadsaathi.in/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://loadsaathi.in/blog" },
        { "@type": "ListItem", "position": 3, "name": "E-Way Bill Rules for Transporters 2026", "item": "https://loadsaathi.in/blog/eway-bill-rules-transporters-truckers-2026" }
      ]
    }
  ]
}
</script>
```

---

## Article 5 — Steel Transport from Rourkela 2026 (`/blog/steel-transport-rourkela`)

**Audience:** MSME/SME steel traders, fabricators and dealers (primary), steel-hauling independent truckers (secondary).

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://loadsaathi.in/blog/steel-transport-rourkela#article",
      "headline": "Steel Transport from Rourkela 2026 — Coils, TMT & Plates: Trucks, Rates & Safety Rules",
      "description": "Steel transport from Rourkela 2026: rate guide for coils, TMT and plates to Kolkata, Ranchi, Jamshedpur and Bhubaneswar, plus the right trucks and loading rules for safe, compliant steel shipping.",
      "image": "https://loadsaathi.in/images/steel-transport-rourkela-cover.jpg",
      "datePublished": "2026-08-29T00:00:00+05:30",
      "dateModified": "2026-08-29T00:00:00+05:30",
      "author": {
        "@type": "Organization",
        "@id": "https://loadsaathi.in/#organization",
        "name": "LoadSaathi Editorial Team",
        "url": "https://loadsaathi.in/blog"
      },
      "publisher": { "@id": "https://loadsaathi.in/#organization" },
      "mainEntityOfPage": { "@id": "https://loadsaathi.in/blog/steel-transport-rourkela" },
      "inLanguage": "en-IN",
      "audience": {
        "@type": "Audience",
        "audienceType": "MSME steel traders, fabricators and dealers in Rourkela, Jamshedpur and East India; steel-hauling independent truckers"
      },
      "articleSection": "Industry Guide",
      "wordCount": 1900,
      "timeRequired": "PT8M"
    },
    {
      "@type": "FAQPage",
      "@id": "https://loadsaathi.in/blog/steel-transport-rourkela#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much does it cost to transport steel from Rourkela to Kolkata?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "PTL steel transport from Rourkela to Kolkata (430 km) typically costs Rs 1,800-2,500 per tonne in 2026. Full-truck consignments of 16-18 tonnes run Rs 45,000-65,000 depending on season and urgency."
          }
        },
        {
          "@type": "Question",
          "name": "Which truck is used for steel coil transport?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Steel coils travel on flatbeds or low-beds with coil cradles. Coils must be loaded on their axis, cradled with timber, and individually lashed with wire rope and chain binders - never stacked loose on a flat deck."
          }
        },
        {
          "@type": "Question",
          "name": "Is steel transport insured?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Cargo liability terms vary by agreement and should be confirmed at booking. On LoadSaathi, consignment terms, vehicle details and delivery verification are documented digitally at booking, so liability is clear for both the MSME shipper and the trucker."
          }
        },
        {
          "@type": "Question",
          "name": "How do I book a steel transport truck online?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Post your consignment on LoadSaathi with origin, destination, weight and product type. The AI matching engine surfaces verified, steel-experienced truckers with digital credit scores, live rates and live GPS tracking - and confirms your booking with escrow-backed payment."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://loadsaathi.in/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://loadsaathi.in/blog" },
        { "@type": "ListItem", "position": 3, "name": "Steel Transport from Rourkela 2026", "item": "https://loadsaathi.in/blog/steel-transport-rourkela" }
      ]
    }
  ]
}
</script>
```

---

## Implementation Notes (Read Before Publishing)

**1. Update the dates and image URLs.** Each snippet carries a `datePublished` starting 2026-08-15 in the publishing order from the Publication Guide, and placeholder image URLs (`/images/*-cover.jpg`). Replace with your actual publish dates and real image URLs — a broken image URL fails validation and blocks the Article rich result.

**2. Validate before going live.** Paste each snippet into [Google's Rich Results Test](https://search.google.com/test/rich-results) or the [Schema Markup Validator](https://validator.schema.org/). Both must show zero errors.

**3. The Article block and FAQPage must live on the same page.** Google matches `FAQPage` only to visible content on the same URL, so the FAQ text in the article body must match the FAQ answers in the schema (it already does — do not edit one without the other).

**4. If you merge Article 4 into the existing Aug 5 EWB post,** use that post's URL everywhere in the snippet instead of `/blog/eway-bill-rules-transporters-truckers-2026`, and set a 301 redirect from the new slug to the old URL so any acquired ranking power transfers.

**5. Keep the Organization/WebSite block (Snippet 0) sitewide**, and remove the older partial Organization block from the homepage so there is only one canonical Organization definition — conflicting `@id` definitions confuse the knowledge graph.

**6. This JSON-LD does not bypass the rendering problem.** Schema embedded in a client-rendered SPA shell is still invisible to crawlers until the prerendering/SSR fix goes live (see the Keyword Ranking Performance Audit, Priority 1). Plan to ship the fix in the same sprint as Article 1.
