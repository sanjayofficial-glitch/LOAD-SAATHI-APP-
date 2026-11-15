# UI_UX_PSYCHOLOGY_BRAIN.md

```
FILE          : UI_UX_PSYCHOLOGY_BRAIN.md
VERSION       : 1.0.0
STATUS        : AUTHORITATIVE — overrides aesthetic preference, not accessibility
OWNER SKILL   : ui-ux-psychological-conversion-architect
CONSUMERS     : any agent that generates, refactors, or audits UI code
SCOPE         : web frontend (React/Next + Tailwind/CSS), Mobile 360px+ / Tablet 768px+ / Desktop 1280px+
DOMAIN TUNING : high-trust marketplace / logistics (LoadSaathi reference implementation)
SOURCES       : 10 verified books (see §19 Verification Ledger) + WCAG 2.2
HARD LIMITS   : brand palette is immutable · WCAG 2.2 AA is non-negotiable · no dark patterns (§11.5)
LAST AUDIT    : see §20 Changelog
```

---

## §0 — CONSUMPTION CONTRACT (read this before any UI work)

This file is a **rule database**, not an essay. Every principle from the source literature has been compiled into a numbered, testable rule. An agent must not paraphrase, soften, or "creatively reinterpret" a `MUST` rule.

### 0.1 Rule anatomy

```
RULE ID   : <BOOK>-<NN>        e.g. KR-03, NM-02, LX-05, FR-04
TIER      : MUST | SHOULD | MUST-NOT
RULE      : one imperative sentence, testable
IMPL      : concrete Tailwind / CSS / micro-copy artifact
TEST      : binary pass/fail check an auditor can run without taste
```

### 0.2 Tier semantics

| Tier | Meaning | Deviation allowed? |
|---|---|---|
| `MUST` | Non-negotiable for any shipped component. Derived from a hard usability/perception limit or an accessibility criterion. | Only with a written justification in the PR and an entry in §14 Changelog. |
| `SHOULD` | Strong default. Overridable by a measured A/B result or a brand constraint, never by "it looks better". | Yes, with a reason. |
| `MUST-NOT` | Anti-pattern / dark pattern. Never ship. | No. |

### 0.3 Conflict resolution order (strict, top wins)

1. **Accessibility & legal** — WCAG 2.2 AA, target sizes, contrast, focus visibility, reduced-motion.
2. **Brand palette immutability** — existing hex/HSL values are frozen. Psychology is applied through *area, saturation, isolation, spacing, motion*, never by inventing hues.
3. **`MUST` rules in this file.**
4. **`SHOULD` rules.**
5. **Aesthetic preference.**

> If a `SHOULD` persuasion rule conflicts with rule 2 (e.g. "add urgency red"), brand palette wins and the rule is re-expressed within the existing palette (see §16.2 Brand-Safe Isolation Protocol).

### 0.4 Mandatory audit output format

Any audit produced by the skill must emit findings in this shape — no prose-only reviews:

```
AUDIT REPORT v1
SCOPE        : <route/component list>
VIEWPORTS    : 360 / 768 / 1280  (+ 1440 if desktop-heavy)
PALETTE DELTA: <none | list of any hex change — must be "none">

FINDING | RULE_ID | TIER | LOCATION | EVIDENCE | FIX (patch-level) | EFFORT(S/M/L)
...

VERDICT: PASS | PASS_WITH_FIXES | FAIL
TOP 3 LEVERAGE FIXES: <ordered by (friction removed × surface area touched)>
```

### 0.5 Forbidden reasoning moves

- "Users will understand it" — if it needs understanding, `KR-01` is violated.
- "More content = more value" — `KR-04`, `FR-05`.
- "Add a color to make it pop" — palette is frozen; use `LX-06` isolation instead.
- "Animation makes it premium" — `EM-06` (cardinality of motion); decoration that delays the primary action is friction.
- Citing a number as if from a book when it is a heuristic (see the **VERIFIED / HEURISTIC** column in §12).

---

## §1 — GLOBAL DESIGN CONSTANTS (the physical layer all rules assume)

These are the measurable floors. Every component spec in §7 references them.

| Token | Value | Source of the number |
|---|---|---|
| `bp-mobile` | `360px` min supported width | project constraint |
| `bp-tablet` | `768px` (`md:`) | project constraint |
| `bp-desktop` | `1280px` (`xl:`) | project constraint |
| `tap-target` | `48×48px` mobile / `44×44px` desktop min | Fitts's Law (`LX-02`); WCAG 2.5.8 AA floors at 24×24, 2.5.5 AAA at 44×44 — we adopt 48 on touch as the practical default |
| `hit-slop` | `≥8px` between independent targets | Fitts's Law, WCAG 2.5.8 spacing exception is a floor, not a goal |
| `dur-instant` | `100ms` | perceived-instant feedback (~0.1s, Nielsen limit 1) |
| `dur-fast` | `180ms` | state change / hover / toggle |
| `dur-base` | `240ms` | entry/exit of small surfaces |
| `dur-slow` | `320ms` | sheet/drawer/modal |
| `dur-max` | `400ms` | Doherty Threshold ceiling for any interactive response (`LX-10`) |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | enter decelerating — attention lands |
| `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | exit accelerating — attention releases |
| `spring-cta` | `spring(stiffness 320, damping 26)` | press feedback, `60fps` only |
| `radius-sm/md/lg` | `8px / 12px / 20px` | consistency = cognitive ease (`JJ-06`) |
| `border-hairline` | `1px` `color-mix(in srgb, var(--brand-ink) 10%, transparent)` | crisp affordance (`NM-01`) |
| `space-unit` | `4px` base (Tailwind default) | rhythmic grouping (`JJ-02`) |
| `measure-body` | `58–72ch` desktop, `100%` mobile | reading-line limit (`JJ-05`) |
| `measure-lead` | `40–55ch` | hero subhead |
| `focus-ring` | `2px` solid + `2px` offset, contrast ≥3:1 vs adjacent | WCAG 2.4.11 / 1.4.11 |
| `z-nav` `z-sticky` `z-modal` `z-toast` | `40 / 50 / 60 / 70` | single stacking scale, no ad-hoc `z-[9999]` |

**Motion budget:** at most **one** attention-directing animation visible in a viewport at a time (`EM-05`). All durations collapse to `1ms` under `prefers-reduced-motion: reduce`.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; scroll-behavior: auto !important; }
}
```

---

# PILLAR 1 — COGNITIVE EASE & ZERO-FRICTION USABILITY

> Thesis: **the user is not reading, they are scanning, and they are in a hurry.** Every pixel must reduce the number of decisions required to act. Pillar 1 rules are pre-conditions for Pillar 2 — persuasion applied to a confusing interface amplifies distrust.

---

## §2 — PILLAR 1.1 · *Don't Make Me Think, Revisited* — Steve Krug (3rd ed., 2014)

**Verified core laws:** scanning over reading; the "billboard" model of page design (you get a glance, not a read); visual hierarchy as the primary driver of attention; eliminate "happy talk" (self-congratulatory filler copy); self-evident > self-explanatory > requires-explanation; the "trunk test" (a page must announce site, section, page identity without context).

| Rule ID | Tier | Rule | Implementation | Test |
|---|---|---|---|---|
| `KR-01` | MUST | Every screen must be **self-evident** at a glance: no label requires a tooltip to be understood. | Primary CTA copy = `verb + object + (optional qualifier)`. `"See my truck cost"`, not `"Submit"` / `"Explore"` / `"Get started"`. | Cover the page copy, show only the h1 + primary button for 5s to a stranger: can they say what the page does and what the button does? |
| `KR-02` | MUST | Headline: **≤7 words**, one idea, no cleverness. Subhead: ≤25 words, states the mechanical benefit. | `text-balance`, `leading-[1.05]`→`1.15`, `tracking-[-0.02em]`, clamp scale below. | Word count of `h1` > 7 → fail. |
| `KR-03` | MUST | **F-pattern** for text/scan-heavy blocks and listing pages; **Z-pattern** only for sparse hero sections where the eye path is logo → headline → visual → CTA. | Hero: left-column copy + right-column visual, single CTA aligned to the reading terminus. Lists: bold first 2 words of each row (the F's horizontal strokes are the bolded lead-ins). | Screenshot + gaze-path annotation: is the primary CTA on the terminal fixation of the pattern rather than in a dead zone? |
| `KR-04` | MUST-NOT | No "happy talk": mission statements, "we are a leading platform…", multi-sentence intros above the fold, marketing prose between the user and the action. | Delete every sentence that doesn't answer *what do I get / what do I do / can I trust you*. Cap hero body copy at 2 lines on mobile. | On mobile 360px, does the first CTA appear within the first `1.5` viewport heights? |
| `KR-05` | MUST | **Visual hierarchy must be legible as a grey-scale wireframe**: 3 distinct levels (primary / secondary / tertiary) separable by size *and* weight *and* contrast. | Type scale: `h1 clamp(1.75rem,4.5vw,3.5rem)/700`, `h2 clamp(1.25rem,2.4vw,1.875rem)/600`, `body 1rem/400`, `meta 0.8125rem/500 uppercase tracking-[0.08em]`. | Blur test (`filter: blur(6px)`) — the intended eye-path must survive blur. Third level must not compete with the first. |
| `KR-06` | MUST | **Trunk test:** navbar states brand + current section; page title states the task; the CTA restates the outcome. A user landing cold (deep link / ad click) must know where they are. | Breadcrumb or `aria-label` on section; `h1` = the task in user language, not the feature name. | Open the URL directly in a new tab: can you name site, section, page in one glance? |
| `KR-07` | SHOULD | Obvious > subtle for clickability: links are links, buttons are buttons, and they do not look alike. | Links: brand color + underline on hover/focus. Buttons: filled or hairline-bordered, never bare text. | Colour-blind simulation: is a link still distinguishable from a CTA at 100% and in greyscale? |
| `KR-08` | SHOULD | **Omit needless words** at every level (label, button, error, empty state). Target ≥30% reduction on any copy passing through audit. | Cut: "Please", "Kindly", "in order to", "click here", duplicate labels. | Character count before/after; every remaining string answers a user question. |
| `KR-09` | MUST-NOT | Do not use the debunked "3-click rule" as a defense for cramming steps together; nor use carousels as primary content containers (users scan slide 1 only). | Replace carousels with a static 3-column bento or a horizontally scrollable row with visible peek + dots. | Any auto-rotating hero → fail. |

---

## §3 — PILLAR 1.2 · *The Design of Everyday Things* — Don Norman (rev. ed., 2013)

**Verified core laws:** affordances (what is possible), signifiers (what signals the possibility), mapping (control ↔ outcome correspondence), feedback (the system tells you what happened), conceptual model (the user's mental story of how it works), the **gulf of execution** (not knowing how) and **gulf of evaluation** (not knowing what happened), and Norman's own warning that *affordance* has been stretched to mean *perceived affordance* on screens.

| Rule ID | Tier | Rule | Implementation | Test |
|---|---|---|---|---|
| `NM-01` | MUST | Every interactive element carries a **visible signifier**: fill, `1px` border, elevation, or underline. Flat text is not a button. | `class="rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(16,24,40,.06)]"`; secondary variant uses hairline only. | Greyscale screenshot: can a new user enumerate the clickables? |
| `NM-02` | MUST | **Feedback within `100ms` of any input** — press, hover, focus, tap, selection. No silent interaction. | `:active { transform: translateY(1px) scale(.99) }`, `transition-[transform,background-color,box-shadow] duration-100`, `:hover { box-shadow: elevated }`, optimistic selection state on tap. | Throttle to 4× CPU: is there any frame where a tap produced no visual change? |
| `NM-03` | MUST | **Mapping**: control position must mirror outcome position (left-to-right quantity, "from → to" mirrors route direction, slider left = lower). | City selector renders `Origin → Destination` in DOM order and visual order on all breakpoints; never reverse on mobile. | Screen-reader order vs visual order vs semantic order: identical. |
| `NM-04` | MUST | **Close the gulf of evaluation**: after any calculation/submission, the user sees a result *with its inputs echoed back* ("Mumbai → Pune · 780 kg · 14 ft truck"), not a bare number. | Result card includes an `Inputs summary` chip row + "Edit" affordance returning to the calculator state. | Screenshot the result state: are all inputs visible without scrolling back? |
| `NM-05` | MUST | **Close the gulf of execution**: no form field may require information the user must leave the page to find. | Inline unit hints (`kg`, `ft`), expected-format examples as `placeholder` *and* persistent helper text, autocomplete over free text for cities/goods. | Fill the form as a first-time user: how many times must you guess or back out? |
| `NM-06` | MUST | **Conceptual model in one sentence**, stated once, at the point of first action: what the product does mechanically. | Hero subhead, ≤25 words: "Post your load, see the per-pallet cost of sharing a truck, book verified transporters." | A stranger can retell the mechanism after one glance. |
| `NM-07` | SHOULD | **Error prevention before error messaging** (Norman's forcing functions): constrain impossible states rather than validating after the fact. | Disable "Calculate" until required fields are filled + `aria-disabled` with a reason; invalid ranges not selectable (max weight per truck class). | Try to produce an error by normal use: count the errors you can reach. |
| `NM-08` | SHOULD | **Recoverability**: every destructive/lossy action is undoable for ≥5s (toast with Undo) instead of a confirm-dialog. | `sonner`-style toast, `Undo` on left, 5s, `role="status"`. | Delete an item: is undo reachable without a modal? |
| `NM-09` | MUST | **Discoverability over memorability**: recognition beats recall — show the options, don't make the user type them. | Chips/combobox with recent + popular values; no bare text inputs for enumerated data. | Can the task be completed without typing free text? |

---

## §4 — PILLAR 1.3 · *Designing with the Mind in Mind* — Jeff Johnson (3rd ed., 2020)

**Verified core laws:** perception is biased and relative; **Gestalt** grouping (proximity, similarity, enclosure/common region, continuity, closure); **reading is not linear** — the eye jumps (saccades) and takes in only a small foveal region per fixation, so peripheral vision only resolves gross shape/contrast/motion; colour vision is limited and unevenly distributed; attention is a scarce single channel; people complete partial patterns and infer structure from the weakest cues.

| Rule ID | Tier | Rule | Implementation | Test |
|---|---|---|---|---|
| `JJ-01` | MUST | **Group by proximity first**, enclosure second, dividers last. Never use a divider where a `gap` would do. | Bento grid: `grid gap-4 md:gap-6`; card padding `p-5 md:p-6`; outer section padding `py-16 md:py-24`. Divider lines allowed only between *unrelated* groups. | Remove all borders in devtools: does the grouping still read? If no → proximity is insufficient. |
| `JJ-02` | MUST | **Proximity spacing must be monotonic**: intra-group gap < inter-group gap < inter-section gap, with ≥2× ratio between steps. | `gap-2` (related label↔value) < `gap-6` (cards) < `py-24` (sections). | Measure gaps: any inversion → fail. |
| `JJ-03` | MUST | **Similarity = same function.** Two elements that look alike must behave alike; anything clickable must not look like static data, and vice versa. | One `Button` primitive, one `Card` primitive, one `Badge` primitive. No bespoke one-off styles per page. | Diff two CTAs across pages: same height, radius, weight, colour role. |
| `JJ-04` | MUST | **Common region beats the alternative**: put related data inside one bounded surface (card) rather than expressing the relationship with colour or icons alone. | `rounded-2xl border bg-[var(--surface)] p-5`; header/body/footer inside the card separated by spacing, not lines. | Screenshot in greyscale: are groups still obvious? |
| `JJ-05` | MUST | **Respect foveal limits**: one idea per visual cluster; ≤4 emphasised elements per viewport; body line-length 58–72ch; no more than one dominant contrast anchor per fold. | `max-w-[68ch]`, `text-pretty`; emphasis budget per viewport = 1 primary CTA + ≤3 supporting accents. | Count elements with `font-weight ≥ 700` or brand-fill: >4 in a fold → fail. |
| `JJ-06` | MUST | **Peripheral vision only sees shape/motion/contrast** — so the primary action must be discoverable as a high-contrast *blob* at peripheral resolution. | Primary CTA is the highest-contrast, most-saturated mass in its fold; everything else is neutral. | Squint test / 8px-downscale thumbnail: is the CTA the first or second salient blob? |
| `JJ-07` | SHOULD | **Colour is never the only carrier** of meaning (also WCAG 1.4.1). | Status uses colour **+** icon **+** text label: `Saved`, `In transit`, `Cancelled`. | Greyscale pass: all states still distinguishable. |
| `JJ-08` | SHOULD | **Continuity/alignment**: one vertical rhythm grid; left edges align across the fold; nothing floats outside the container. | `container mx-auto px-4 md:px-6 xl:px-8 max-w-[1200px]`; every card aligned to the same 12-col grid. | Overlay a 12-col grid at 1280: any element off-grid → fix. |

---

# PILLAR 2 — DECISION PSYCHOLOGY, TRUST & PERSUASION

> Thesis: **conversion is a System 1 event defended by System 2.** Pillar 1 makes the interface cheap to process; Pillar 2 makes the *decision* cheap and feels safe. Trust assets must arrive **before** the ask, because the ask is where skepticism activates.

---

## §5 — PILLAR 2.1 · *Thinking, Fast and Slow* — Daniel Kahneman (2011)

**Verified core laws:** **System 1** (fast, automatic, associative, emotional) vs **System 2** (slow, effortful, statistical, skeptical, easily depleted); **cognitive ease** (fluency feels true and safe — familiar, clear, high-contrast, repeated, rhymed); **loss aversion** (losses loom larger than equivalent gains — treat as a robust *framing heuristic*, not a universal constant; see §12 caveat); **anchoring** (the first number seen biases all subsequent judgement); **WYSIATI** (what you see is all there is — users decide from the visible evidence only); **peak-end rule** as later joint work.

| Rule ID | Tier | Rule | Implementation | Test |
|---|---|---|---|---|
| `DK-01` | MUST | **System 1 owns the hero fold.** No form fields, no reading, no computation required above the fold on first paint. | Hero = headline (≤7 words) + ≤25-word mechanism line + one primary CTA + one trust strip. Zero inputs. | Count inputs in the first 100vh: must be 0. |
| `DK-02` | MUST | **Anchor before you ask.** Show the expensive reference number, then the user's number — in that order, both legible, reference de-emphasised but never hidden. | Cost comparison: `Full truck ₹X` struck-through / muted; `Shared truck ₹Y` large + brand; savings delta as a pill. Order fixed: reference first in DOM. | DOM order of reference vs offer; is the reference visible without interaction? |
| `DK-03` | MUST | **Framing must be true and reversible**: any savings claim states its basis ("vs. booking a full 14-ft truck for the same corridor on the same date"). | Micro-copy under the number: basis + timestamp + "how we calculate" link. | Every quantitative claim has a basis string within 2 lines. |
| `DK-04` | MUST | **Cognitive ease engineering** — high contrast, familiar patterns, short words, no jargon, consistent terminology, `font-feature-settings` off for body legibility at small sizes. | Body contrast ≥ 7:1 (AAA-level for reading text where palette allows), no pure-black-on-pure-white glare; terminology glossary enforced: one name per concept ("load", not "consignment/shipment/cargo" interchangeably). | Grep for synonym drift: same concept named 2 ways → fix. |
| `DK-05` | SHOULD | **Loss aversion only via honest asymmetry**, never via fabricated scarcity. Permitted: "3 pallets left in this truck" when the number is real; "price holds until 6 PM today" when it is real. | Scarcity components must bind to real backend state and render a timestamp. | Can the scarcity value be falsified by refreshing? If it resets arbitrarily → fail (§11). |
| `DK-06` | MUST | **System 2 gets the detail on demand, not by default** — numbers are expandable into a breakdown, not dumped. | `<details>`/accordion "How this is calculated" listing per-km, per-kg, platform fee, GST. | Result screen: is a full breakdown reachable in one click? |
| `DK-07` | SHOULD | **Sequence the two systems**: fold = System 1 (visual + anchor), scroll 2 = System 1 defence (trust/social proof), scroll 3 = System 2 (mechanics, breakdown, FAQ), then the ask. | Section order locked in §16.3 page archetype. | Section order diff against spec. |
| `DK-08` | MUST-NOT | No dark-pattern pressure: no fake countdowns, no pre-checked paid add-ons, no hidden fees revealed at step 4, no "are you sure you want to lose money?" confirmshaming. | Fees appear in the first number the user sees, or the number is labelled "excl. fees". | Price at step 1 vs step N: identical total. |

---

## §6 — PILLAR 2.2 · *Influence: The Psychology of Persuasion* — Robert Cialdini (1984; New & Expanded ed., 2021 — seven principles)

**Verified core laws:** **Reciprocity**, **Commitment & Consistency**, **Social Proof**, **Authority**, **Liking**, **Scarcity**, and **Unity** (the seventh principle, added in the 2021 edition: shared identity — "one of us" — persuades beyond mere similarity). Three categories in the book: automatic shortcuts, which are most useful under load/uncertainty — exactly the state of a user comparing freight quotes.

| Rule ID | Tier | Rule | Implementation | Test |
|---|---|---|---|---|
| `CI-01` | MUST | **Reciprocity before the ask:** deliver real value with zero obligation *before* any phone number, OTP, or signup wall. The calculator must work fully anonymously. | Route `/quote` reachable with no auth; result visible without signup; signup asked only to *save/contact*, never to *see*. | Incognito: can you get a full quote without entering a phone number? |
| `CI-02` | MUST | **Social proof must be specific, local, and recent** — generic star ratings are noise; corridor-level activity converts. | Trust strip: `Verified transporters`, `Loads moved on Mumbai→Pune this week`, avatar cluster + named-city proof, each with a timestamp or count. | Any proof element without a number/name/date → replace or delete. |
| `CI-03` | MUST | **Authority = verifiable credentials, not decorative badges.** | `GST-verified`, `Transporter KYC`, `ISO`, `MC number` — displayed as text + icon, linked to a verification explanation, never as unlabeled clip-art seals. | Click each badge: does it explain the verification? |
| `CI-04` | MUST | **Unity over generic trust in the India logistics context** — language of shared identity: "transporters like you", regional language toggle, corridor names in local form. Use *we/our* sparingly and only when true. | Localised micro-copy (`hi`, `mr`, `ta`…), city names as users write them, association/cooperative affiliations where genuinely held. | Would a transporter from that corridor recognise themselves in the copy? |
| `CI-05` | SHOULD | **Commitment & consistency via micro-commitments**: micro-yeses that are cheap, visible, and cumulative. | Two-step calculator: `1` route → `2` load details → result. Progress shown as `1/2` with a labelled stepper; answers persist in `localStorage`. | Does partial progress survive a reload? |
| `CI-06` | SHOULD | **Liking** through human presence: real faces, real names, no stock-photo blandness; operator/transporter photos with role labels. | Avatar component with `name + role + corridor`, `loading="lazy"`, real `alt`. | Any avatar on the site is paired with a name and a role. |
| `CI-07` | MUST | **Trust is a system, not a strip**: proof must appear at *each* anxiety point — near the calculator result, near the price, near the booking button, near the form submit. | A single `<TrustSignal variant="pricing\|booking\|form" />` primitive reused at all four points. | Screenshot each step: is a trust cue within one viewport of every ask? |
| `CI-08` | MUST-NOT | No fabricated proof: no invented testimonial names, no "1M+ users" unless the number is auditable, no fake logo walls, no fake live-viewer counters. | Every proof component consumes a real data source or is deleted. | Source-of-truth link for each number exists in the repo/copy doc. |

---

## §7 — PILLAR 2.3 · *Predictably Irrational* — Dan Ariely (rev. ed., 2009) + *Nudge* — Thaler & Sunstein (2008; final ed., 2021)

**Verified core laws (Ariely):** relativity (we judge by comparison, not absolute value), the **decoy effect**, the **power of free** (zero is a qualitatively different price), **anchoring** on arbitrary numbers, ownership/endowment effects, and the cost of social vs market norms. **(Nudge):** **choice architecture**, **smart defaults**, **mapping** (make information map onto the choice), **feedback**, **expect error**, **structure complex choices**; and the book's own constraint — nudges must be transparent and easy to opt out of (libertarian paternalism), which is exactly the ethics bar for a high-trust product.

| Rule ID | Tier | Rule | Implementation | Test |
|---|---|---|---|---|
| `AR-01` | MUST | **Three options, one obviously best** in every plan/tier selector. Present a triangle: `Shared (default, best value)` / `Part load` / `Full truck`, where the middle is never a strawman. | Pricing/plan cards: 3 max visible, 4th+ behind "See all". Default card visually elevated + labelled `Most chosen` only if true. | Count choices in the first decision: ≤3 primary options (see `LX-03`). |
| `AR-02` | MUST | **Smart defaults everywhere**, chosen by the *most common real-world* value, never by the value most profitable to us. | Date = today/tomorrow, truck class = modal class for the corridor, weight unit = `kg` with `MT` toggle, route = last-used corridor. | Clear localStorage, open calculator: every field pre-filled with a valid, common value? |
| `AR-03` | MUST | **Structure complex choices** rather than listing them: group by the user's attributes (truck size, then body type), with counts per group. | Segmented control / chip groups instead of 20-row dropdowns; show `12 available` per group. | Any dropdown with >8 items and no grouping/search → fix. |
| `AR-04` | SHOULD | **Relativity framing on price**: show the per-unit number next to the total (`₹18,400 total · ₹23.6/kg`) so the comparison is dimensionally honest. | Dual-number component aligned right, subtle second line. | Both numbers present, same currency format, no rounding that changes the claim. |
| `AR-05` | SHOULD | **"Free" is a psychological event** — use it only when it is literally zero (e.g. `Free quote`, `No booking fee`), never "free*" with a footnote. | Badge `Free` on quote CTA; no asterisk. | grep `free\*` → 0 results. |
| `AR-06` | MUST | **Nudge, don't trap.** Every default is visible, editable, and reversible in ≤1 interaction; the opt-out is as discoverable as the opt-in. | Defaults marked with a small `Recommended` chip + `Change` link adjacent. | Can a user see and change every default without hunting? |
| `AR-07` | MUST | **Feedback at the decision point** (Nudge): after a choice, immediately state the consequence in plain language ("Sharing this truck saves ~₹X and adds ~6h transit"). | Consequence line under the selector, updated live, `aria-live="polite"`. | Does every material choice produce a plain-language consequence? |

---

# PILLAR 3 — HABIT, EMOTION, MEASURABLE UI LAWS & FRICTION

> Thesis: **Pillar 3 is the enforcement layer.** It converts the first two pillars into physically measurable constraints — pixels, milliseconds, element counts — and governs the emotional texture (premium, calm, trustworthy) that makes the interface feel worth its price.

---

## §8 — PILLAR 3.1 · *Hooked: How to Build Habit-Forming Products* — Nir Eyal (2014)

**Verified core laws:** the **Hook Model** — Trigger (external → internal) → Action → Variable Reward → Investment; action simplicity is driven by ability *and* motivation (Eyal builds directly on B.J. Fogg's behaviour model); **investment** loads the next trigger and increases stored value; variable reward sustains engagement. Eyal's own framing: the model is amoral — the ethical constraint is whether the habit serves the user's own defined goal.

| Rule ID | Tier | Rule | Implementation | Test |
|---|---|---|---|---|
| `HK-01` | MUST | **External trigger → immediate reward in one interaction.** The first meaningful action must never require account creation or a multi-step funnel. | `/quote`: two selections (origin+destination) → result renders in-place, `scrollIntoView({block:'nearest'})`, `aria-live="polite"`. | Time from landing to first reward: ≤15s, ≤3 interactions. |
| `HK-02` | MUST | **Action simplicity**: minimise the number of *distinct* physical inputs for the core loop; prefer selection over typing (each typed field costs motivation). | Combobox/chips for cities & goods; `inputMode="numeric"` for weight; stepper for pallets; only 2 fields upfront (`FR-01`). | Count typed characters required for a full quote: target ≤6 besides search. |
| `HK-03` | SHOULD | **Variable reward** = information reward: the *composition* of the savings breakdown varies meaningfully per route (distance, backhaul availability, consolidation). Never randomised/lottery mechanics. | Result card reveals a 3-row breakdown with a subtle staggered entrance (`60ms` cascade, `dur-base`). | Reward content is data-derived, not cosmetic randomness. |
| `HK-04` | MUST | **Investment**: store something valuable the user created — saved quotes, saved corridors, transporter shortlist, repeat defaults. | `Save this quote` (primary-secondary button, no auth required → stored locally; auth only to sync). | Refresh the page: is the user's work still there? |
| `HK-05` | SHOULD | **Internal trigger via copy**: name the recurring situation the user is already in ("Backhaul on Thursday? Fill the empty leg."). | Micro-copy on empty states and dashboard headers, ≤7 words. | Copy names a real operational moment, not a generic "Welcome back". |
| `HK-06` | MUST-NOT | **No manufactured compulsion**: no streak pressure, no guilt copy, no notification spam, no infinite scroll on transactional surfaces. | Notification preference default = transactional only. | Any copy that induces shame/anxiety to drive action → remove (§11). |

---

## §9 — PILLAR 3.2 · *Emotional Design* — Don Norman (2004)

**Verified core laws:** three levels of processing — **visceral** (pre-attentive, automatic, first-glance affect: beauty, threat, approach/avoid), **behavioral** (the pleasure of effective, fluent use — this is where usability lives), **reflective** (the story the user tells themselves and others about using the product: status, pride, identity). Also the **aesthetic-usability effect** connection: attractive things are *perceived* as easier to use — and are forgiven for small faults, which is why polish is a functional requirement, not decoration.

| Rule ID | Tier | Rule | Implementation | Test |
|---|---|---|---|---|
| `EM-01` | MUST | **Visceral pass in ≤50ms** — clean, calm, high-contrast-with-whitespace, no clutter at first paint, no layout shift (`CLS < 0.1`), no FOUC. | Explicit dimensions/`aspect-ratio` on every media block; fonts preloaded (`font-display: swap` + `<link rel="preload">`); skeletons with identical box metrics. | Throttled reload: does anything jump? Does the fold complete in <1s on 4G Fast? |
| `EM-02` | MUST | **60-30-10 balance without palette changes**: 60% neutral surface, 30% secondary/ink structure, 10% brand accent. The accent is *rationed*, not distributed. | Accent used on: primary CTA (filled), one active indicator, one key number. Everything else neutral. Backgrounds stay in the neutral ramp. | Count surfaces using the brand hue: >3 distinct roles → fail. |
| `EM-03` | MUST | **Typography is the premium signal**: one family (or one + monospace for numbers), ≤3 weights, optical sizes tightened on display text, tabular numerals for all prices/metrics. | `font-variant-numeric: tabular-nums`, `letter-spacing: -0.01em` on large text, `text-wrap: balance` on headings. | Prices misalign vertically in a column → fix. |
| `EM-04` | MUST | **60fps or don't ship it** — animate only `transform` and `opacity`; never `top/left/width/height/box-shadow` on scroll or on interaction-critical paths. | `will-change: transform` on moving elements only; `translateZ(0)` sparingly; no layout-triggering transitions. | DevTools Performance: no dropped frames on CTA press or sheet open (mid-tier Android). |
| `EM-05` | MUST | **Reflective layer**: the product must give the user something to be proud of — a shareable, professional-looking quote/receipt they'd forward to their boss or client. | `Share quote` → clean, print-safe (`@media print`) summary with the user's business identity, no watermark clutter. | Export/share output looks like a document a business would send. |
| `EM-06` | MUST | **Motion cardinality**: ≤1 attention-grabbing animation per viewport; everything else is ≤`180ms` state confirmation. Motion must be interruptible and must never delay the primary action. | Only one `animate-*` on entry; everything else is hover/active/focus transitions. | Screen recording: what is still moving after 1s of idle? Should be nothing. |

---

## §10 — PILLAR 3.3 · *Laws of UX* — Jon Yablonski (2nd ed., 2024)

**Verified core laws (chapter-level, 2nd ed.):** Jakob's Law · Fitts's Law · Miller's Law · Hick's Law · Postel's Law · Peak-End Rule · Aesthetic-Usability Effect · Von Restorff Effect · Tesler's Law · Doherty Threshold.

| Rule ID | Tier | Rule | Implementation | Test |
|---|---|---|---|---|
| `LX-01` | MUST | **Jakob's Law** — users spend most of their time elsewhere; match marketplace/SaaS conventions (nav left→right, logo top-left, search top-right, sticky mobile bottom bar, cart/booking pattern, standard card grids). Innovate on *value*, not on navigation grammar. | Mobile: bottom tab bar + sticky CTA; Desktop: top nav with `logo · primary links · auth`. | First-time-user test: does anyone ask "where do I click?" |
| `LX-02` | MUST | **Fitts's Law** — distance × size. Primary CTA: full-width on mobile (`h-12 min-h-[48px]`, `w-full`), ≥`48×48` touch area, placed within thumb zone (bottom 1/3 on mobile). | `class="h-12 w-full rounded-xl md:h-11 md:w-auto md:px-6"`, secondary targets ≥`44px`. | Tap-target audit at 360px: any target <48px tall or <8px from a neighbour → fail. |
| `LX-03` | MUST | **Hick's Law** — decision time grows with the log of the number of choices. ≤3 primary options per decision point; ≤5 nav items on mobile; long lists get search/filter/chunking. | Nav ≤5 visible + "More"; plan selectors 3; filter panels collapsible. | Count options at each decision point: >3 = must be grouped/defaulted/removed. |
| `LX-04` | MUST | **Miller's Law — applied correctly.** Miller (1956) is about *working-memory span (~7±2 chunks)*, **not** a licence for "7 nav items". Use it to justify **chunking** (phone numbers, IDs, prices) and ≤5-item groups — never to justify clutter. | Chunk: `MH-12-AB-3456`, `₹1,84,500` (Indian grouping), 3-field max per visual group. | Any group of >5 undifferentiated items → chunk or filter. |
| `LX-05` | MUST | **Peak-End Rule** — the *peak* moment and the *end* moment define the memory. Engineer both: a satisfying result reveal (peak) and a clean, reassuring confirmation (end). | End state: confirmation card with next step, human contact, and no upsell clutter. | Last screen of every flow: is it calm, complete, and forward-directed? |
| `LX-06` | MUST | **Von Restorff (isolation)** — the odd one out is remembered. Exactly **one** isolated element per viewport = the primary CTA. Secondary buttons must not compete in saturation/area. | Primary: solid brand fill, `shadow-sm`. Secondary: hairline + ink text. Tertiary: text + underline. Never two filled brand buttons side by side. | Greyscale + squint: exactly one dominant mass per fold. |
| `LX-07` | MUST | **Tesler's Law** — complexity cannot be destroyed, only relocated. Move it into the system (defaults, autofill, computation, validation), never onto the user. | Server-side validation with human messages; computed fields (per-kg, per-km) shown, never asked. | Every field the user fills: could the system derive it? If yes → derive. |
| `LX-08` | MUST | **Aesthetic-Usability Effect** — perceived ease follows perceived quality. Enforce: consistent radii, optical alignment, ≥`4px` multiples, no orphaned elements, no default browser styles leaking. | Design tokens only; no magic numbers; one radius per role. | Zoom to 200%: does anything break, overlap, or clip? |
| `LX-09` | MUST | **Doherty Threshold (<400ms)** — any interaction that takes longer must acknowledge within `100ms` (pressed state, skeleton, optimistic update) and must never dead-end. | `useTransition`/optimistic UI; skeletons matching final layout; `aria-busy`; progress for >1s ops. | Throttle 3G: is there ever >100ms of silence after a tap? |
| `LX-10` | SHOULD | **Postel's Law** — accept messy input, emit strict output. | Trim/normalise phone (`+91`, spaces, `0` prefix), city aliases ("Bombay"/"Mumbai"), weight units (`1.5T` = `1500kg`), autocorrect obvious typos with a confirmation chip. | Type deliberately messy data: does the form accept it gracefully? |

---

## §11 — PILLAR 3.4 · *Friction: The Untapped Force That Can Be Your Most Powerful Advantage* — Roger Dooley (2015)

**Verified core laws:** friction — physical, cognitive, and emotional — silently kills conversion; **reducing friction** (fewer fields, faster loads, unambiguous errors, fewer choices) is usually a bigger lever than adding persuasion; friction can be *added* deliberately and ethically where a pause serves the user (e.g. confirming a high-stakes action); the emotional friction of distrust and anxiety is as costly as the physical kind.

| Rule ID | Tier | Rule | Implementation | Test |
|---|---|---|---|---|
| `FR-01` | MUST | **Progressive disclosure**: ask ≤2 inputs before the first meaningful output; reveal the rest after engagement. | Step 1: origin + destination → immediate indicative range. Step 2 (post-engagement): weight, date, truck class → precise quote. | Count inputs before first output: ≤2. |
| `FR-02` | MUST | **Perceived-wait elimination**: skeleton loaders that match final geometry (no spinner-only states), prefetch on hover/intent, `stale-while-revalidate` caching. | Route-level `loading.tsx` with skeletons; `<Link prefetch>`; `next/image` with blur placeholder. | Reload on 3G: does the layout hold and does content stream in place? |
| `FR-03` | MUST | **Error friction removal**: errors are specific, adjacent to the field, human, and *fix-forward* (say what to do, not what went wrong). | `"Enter a 10-digit mobile number"` not `"Invalid input"`; `aria-describedby` + `aria-invalid`; preserve all valid input. | Force 3 errors: does every message contain an instruction? |
| `FR-04` | MUST | **No redundant asking**: never ask twice for the same datum; prefill from context (repeat bookings, saved corridors, referrer). | Persist calculator state across sessions; OTP-only auth (no password to invent). | Count total fields across the whole flow: any duplicate → merge. |
| `FR-05` | MUST | **Cognitive friction audit** — every step must pass: *"What do I do next?"* answerable in <3s without reading. | One primary action per step; disabled-state reasons visible; stepper shows position. | Screenshot each step: is there exactly one obvious next move? |
| `FR-06` | SHOULD | **Intentional, ethical friction** for irreversible/high-value actions: a deliberate review screen with the price and stakeholders restated (not a scary confirm dialog). | `Review & confirm` step showing route, weight, price, transporter, cancellation policy. | High-value action (>threshold) has a review step; low-value ones do not. |
| `FR-07` | SHOULD | **Emotional friction**: eliminate anxiety triggers — unclear pricing, "a representative will call you", unlabeled charges, unclear cancellation, no human contact path. | Persistent `Need help? Call/WhatsApp` with a real number and hours; cancellation policy summarised in 1 line at the decision point. | Every anxiety-raising element has an adjacent reassurance. |
| `FR-08` | MUST | **Performance is friction**: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at 4G/mid-tier mobile; no render-blocking third-party scripts; fonts self-hosted/subset. | `dynamic()` for below-fold heavy widgets; defer analytics; `font-display: swap`; server components by default. | Lighthouse mobile ≥90 perf, ≥95 a11y on every audited route. |

---

## §11.5 — ETHICS GUARDRAIL (overrides Pillar 2 whenever they conflict)

`MUST-NOT` — never ship, regardless of conversion upside:

| Dark pattern | Detection test |
|---|---|
| Fake scarcity / countdown that resets | Reload twice: does the number revert arbitrarily? |
| Confirmshaming ("No thanks, I like losing money") | Any decline path with guilt copy. |
| Roach motel (easy subscribe, hard cancel) | Cancel path ≤ same number of steps as signup path. |
| Hidden fees revealed late | Total at step 1 = total at step N. |
| Forced continuity / pre-checked add-ons | Every paid toggle defaults to off. |
| Privacy zuckering / over-permission | Every permission request has an in-context reason at the point of need. |
| Fabricated social proof | Every count/quote has a data source. |

Rationale: for a high-trust B2B logistics marketplace, a single dark pattern is a **reflective-layer** catastrophe (`EM-05`) — the user's story becomes "they tricked me", which suppresses repeat booking and word-of-mouth, the two cheapest acquisition channels available.

---

# §12 — SYNTHESIS A · THE ANTI-PATTERN AUDIT MATRIX

Use this table as the *first pass* of any audit. Left column is an observable symptom (analytics, QA, or verbal complaint) — not a guess. Each row names the violated law and a patch-level fix.

| # | Symptom (observable) | Violated law(s) | Exact code / UI fix |
|---|---|---|---|
| A1 | **Low CTR on the primary CTA (~3% or below)** | Von Restorff (`LX-06`), Fitts (`LX-02`), Krug hierarchy (`KR-05`), peripheral vision (`JJ-06`) | Make the CTA the single most saturated, largest interactive mass in the fold: `h-12 w-full md:w-auto md:px-7 rounded-xl bg-[var(--brand)] text-[var(--brand-ink)] font-semibold shadow-sm`; demote every competing button to hairline; delete secondary links from the same fold. One filled brand element per viewport. |
| A2 | **High bounce above the fold / <10s dwell** | Cognitive ease (`DK-01`), happy talk (`KR-04`), scanning (`KR-02`) | Delete hero body copy beyond 2 lines; rewrite `h1` to ≤7 words stating the outcome; move all "about us" prose below the trust section; ensure the value prop + CTA are inside the first `100vh` at 360px. |
| A3 | **Users don't scroll past hero** | Peak-end ordering (`DK-07`), Fitts (`LX-02`) | Add a visible scroll affordance and reduce hero height (`min-h-[85svh]`, not `100vh`); place the first proof element (`CI-02`) partially visible at the fold edge to create open-loop completion (`JJ` closure/continuity). |
| A4 | **Calculator started but not completed** | Gulf of execution (`NM-05`), Friction (`FR-01`, `LX-07`), Hick (`LX-03`) | Cut upfront fields to 2 (`origin`, `destination`); replace text inputs with searchable chips; pre-select the modal truck class (`AR-02`); show an indicative range instantly so the user sees the payoff before step 2. |
| A5 | **Form abandonment at phone/OTP** | Reciprocity (`CI-01`), loss of investment (`HK-04`), emotional friction (`FR-07`) | Move the ask *after* the reward: full quote visible anonymously; label the ask with its reason (`"To send this quote to your transporter"`); add `aria-describedby` reason text; keep the computed result pinned above the field. |
| A6 | **"How does this work?" support volume** | Conceptual model (`NM-06`), Jakob's Law (`LX-01`), Miller chunking (`LX-04`) | Add a 3-step mechanism strip (`Post → Compare → Book`) using numerals + ≤4 words each; repeat the model in the result card footer; rename any feature-word button to the user's verb. |
| A7 | **Price page drop-off / "costly" perception** | Anchoring (`DK-02`), relativity (`AR-04`), loss aversion (`DK-05`) | Show `Full truck ₹X` (muted, struck) *before* `Shared ₹Y`; add per-kg/per-km secondary number; add a one-line honest basis (`DK-03`); never show the offer alone. |
| A8 | **Low trust signals engagement (badges ignored)** | Authority (`CI-03`), specificity (`CI-02`) | Replace decorative seals with text+icon proof carrying a number, place, and recency; link each to a verification explainer; move the strip adjacent to the first ask (`CI-07`). |
| A9 | **Feels slow / rage taps** | Doherty (`LX-09`), Friction (`FR-02`, `FR-08`) | Add pressed state <100ms (`NM-02`), geometry-matched skeletons, `aria-busy`, optimistic selection; audit LCP/INP; remove render-blocking third-party scripts. |
| A10 | **Mobile CTA missed entirely** | Fitts + thumb zone (`LX-02`), isolation (`LX-06`) | Sticky bottom bar (`fixed inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)]`), `h-14` CTA, `backdrop-blur` + top hairline, dismissible after first scroll only once, never covering form inputs (`scroll-padding-bottom`). |
| A11 | **Users change defaults erratically / paralysis** | Smart defaults (`AR-02`), choice overload (`LX-03`, `AR-03`) | Reduce to 3 options, order by popularity, label the recommended one with a `Most chosen` chip only when true, group the rest behind "More options". |
| A12 | **Data-dense screens read as chaotic** | Gestalt proximity/enclosure (`JJ-01`, `JJ-04`), monotonic spacing (`JJ-02`) | Convert to bento: `grid gap-4 md:gap-6 sm:grid-cols-2 xl:grid-cols-3`; remove 80% of dividers; enforce `p-5` inner / `gap-4` intra / `py-16` inter rhythm; align all cards to one 12-col grid. |
| A13 | **Users distrust error messages / re-enter data** | Error friction (`FR-03`), recovery (`NM-08`) | Inline, adjacent, instructive messages; preserve valid input; `aria-invalid`; autosave drafts to `sessionStorage`; never clear a form on failure. |
| A14 | **Repeat booking rate low** | Investment (`HK-04`), peak-end (`LX-05`) | End each flow with a calm confirmation containing the saved quote, next step, and a human contact; add `Book again` from saved corridors; no upsell on the confirmation screen. |
| A15 | **Page feels "cheap" / premium pricing rejected** | Visceral + reflective (`EM-01`–`EM-05`), aesthetic-usability (`LX-08`) | Fix whitespace scale, one radius family, tabular numerals, tighten display tracking, remove every gradient/glow/stock-photo, cap brand accent at 10% area, add a print/share-clean quote document. |
| A16 | **Users ask "is this the final price?"** | Loss aversion + transparency (`DK-08`), feedback (`NM-04`) | State inclusions/exclusions in one line at the number; echo all inputs in the result (`NM-04`); show the fee breakdown in `<details>`; the total at step 1 must equal the total at step N. |
| A17 | **Banner blindness / promos unseen** | Von Restorff (over-use → `LX-06` violated), habituation (`EM-06`) | Remove all but one announcement; if a promo must exist, make it a single line inside the flow, not a coloured bar competing with the CTA. |
| A18 | **Keyboard/screen-reader users blocked** | Feedback (`NM-02`), WCAG 2.4.7 / 4.1.3 | Restore visible `:focus-visible` ring (`outline-2 outline-offset-2`), logical DOM order, `aria-live="polite"` on computed results, real `<button>`/`<a>` semantics, no `div onClick`. |

---

# §13 — SYNTHESIS B · COMPONENT-BY-COMPONENT PSYCHOLOGY SPEC

Every component below is specified once, reused everywhere. Deviating per-page is a `JJ-03` (similarity) violation.

## 13.1 Navbar

| Dimension | Spec |
|---|---|
| Psychology | Jakob's Law (`LX-01`) — this is a wayfinding device, not an ad slot. Miller (`LX-04`) — ≤5 chunks. Hick (`LX-03`) — fewer visible options = faster orientation. |
| Layout | Desktop (`xl`, 1280+): `h-16`, `logo` (left) · ≤5 links (center) · `Sign in` (ghost) + `Get a quote` (filled, the only saturated element) (right). Tablet (`md`, 768+): `h-14`, ≤4 links, CTA filled. Mobile (360+): `h-14`, logo + hamburger (48×48) + persistent CTA pinned in the sticky bottom bar, *not* in the header. |
| Rules | Sticky with `backdrop-blur-md bg-white/80` + hairline on scroll only (`NM-01`); never `position: sticky` with a large logo shrink animation; no dropdowns for the 3 most-used destinations; active route gets a 2px underline in brand color (`LX-06` rationed). |
| Micro-copy | Destination labels = user nouns (`Loads`, `Trucks`, `Pricing`), ≤2 words, sentence case. No `Solutions`, `Platform`, `Ecosystem`. |
| Do / Don't | ✅ one filled CTA. ❌ two filled buttons, a promo banner inside the nav, or a mega-menu on mobile. |
| Acceptance | 360px: no horizontal scroll, hamburger ≥48px, focus ring visible, ≤5 items in the open sheet with the CTA first. |

```html
<header class="sticky top-0 z-40 h-16 border-b border-[color-mix(in_srgb,var(--ink)_10%,transparent)] bg-white/80 backdrop-blur-md">
  <nav class="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 md:px-6 xl:px-8">
    <a href="/" class="flex items-center gap-2 font-semibold tracking-[-0.02em]">…</a>
    <ul class="hidden md:flex items-center gap-1 text-sm font-medium">…</ul>
    <div class="flex items-center gap-2">
      <a href="/login" class="hidden md:inline-flex h-10 items-center rounded-lg px-3 text-sm text-[var(--ink-2)] hover:text-[var(--ink)]">Sign in</a>
      <a href="/quote" class="inline-flex h-10 items-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-[var(--brand-ink)] transition-transform duration-100 active:scale-[.98]">Get a quote</a>
    </div>
  </nav>
</header>
```

## 13.2 Hero Fold (the System 1 decision surface)

| Dimension | Spec |
|---|---|
| Psychology | Krug billboard (`KR-02`), System 1 only (`DK-01`), visceral pass (`EM-01`), isolation (`LX-06`), peripheral salience (`JJ-06`). |
| Content budget (hard) | `h1` ≤7 words · subhead ≤25 words · exactly 1 primary CTA · 1 tertiary text link max · 1 proof strip · 0 input fields · 0 carousels. |
| Layout | Desktop: 12-col, copy `col-span-5`, visual `col-span-7` (Z-path terminus at the CTA). Tablet: 6/6 stacked-copy-first. Mobile: single column, copy first, visual as `aspect-[4/3]` below, CTA repeated in sticky bar. |
| Spacing | `pt-14 md:pt-20 xl:pt-24`; `pb-10 md:pb-16`; copy block `max-w-[34rem]`; `gap-4` between copy elements, `gap-8` before CTA. |
| Typography | `h1`: `text-[clamp(1.875rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-balance`. Subhead: `text-base md:text-lg text-[var(--ink-2)] max-w-[46ch] text-pretty`. |
| Visual | One real product/route illustration or screenshot of the actual result card — **not** an abstract 3D blob. If an illustration is used, it must depict the mechanism (truck + shared load), 2D-flat with 2 depth levels max (§14). |
| Anchor | If a savings anchor exists, it belongs *here*, above the fold, as `Full ₹X` (muted) → `Shared ₹Y` (hero number). |
| Acceptance | Screenshot at 360/768/1280: exactly one saturated element; `h1` ≤7 words; CTA fully visible without scroll at 360×640; squint test passes. |

## 13.3 Interactive Calculator / Visualizer (the core conversion engine)

| Dimension | Spec |
|---|---|
| Psychology | Reciprocity (`CI-01`), Hook action→reward (`HK-01`), Doherty (`LX-09`), Fitts (`LX-02`), Postel (`LX-10`), Nudge defaults (`AR-02`), anchoring (`DK-02`), feedback (`NM-04`). |
| Step architecture | **Step 1 (≤2 inputs):** origin + destination (searchable combos). → *instant* indicative range. **Step 2 (progressive disclosure):** weight, date, truck class — all pre-defaulted. → precise quote + savings breakdown. **Step 3:** save/share (investment) — auth only here. |
| Component choices | Combobox with regions + recent corridors; segmented control for truck class (≤4 options); stepper for pallets; numeric input with `inputMode` + unit suffix; date = 3 quick chips (`Today`, `Tomorrow`, `Pick a date`). |
| Live feedback | Every change recomputes with debounce `≤150ms`; result animates number change with `tabular-nums` and a `120ms` opacity fade (never count-up animations >400ms — `EM-06`). `aria-live="polite"` on the result container. |
| Result card | Reference price (muted, struck) → offer price (largest element in the card) → savings pill → inputs echo (`NM-04`) → `<details>`: "How this is calculated" (`DK-06`) → trust line (`CI-07`) → primary CTA → `Save quote` (secondary). |
| Loading | Skeleton matching the result card geometry; never a centred spinner; `min-h` reserved to prevent CLS (`EM-01`). |
| Error states | Impossible states prevented (`NM-07`); if a corridor is unserviceable, show alternatives rather than a red error. |
| Acceptance | Full quote obtainable anonymously (`CI-01`); ≤2 inputs before first output; first result <400ms or skeleton <100ms; keyboard-only completion; state survives reload (`HK-04`). |

## 13.4 Trust & Social Proof Bento Grid

| Dimension | Spec |
|---|---|
| Psychology | Gestalt enclosure (`JJ-04`), specific social proof (`CI-02`), authority (`CI-03`), unity (`CI-04`), reciprocity pre-ask (`CI-01`), chunking (`LX-04`). |
| Grid | `grid gap-4 md:gap-6 sm:grid-cols-2 xl:grid-cols-3`; 1 "hero tile" spanning 2 cols on desktop for the single strongest proof (a named corridor testimonial with photo + role + date), remaining tiles = counts/credentials/logos. Tiles equal height via `h-full`, content top-aligned. |
| Content rules | Every tile must carry a number, name, place, or date. Generic star-ratings and unlabeled seals are deleted (`CI-02`). Max 2 accent uses total across the grid; tiles are neutral surfaces. |
| Ordering | Strongest → weakest, left-to-right, top-to-bottom (peak-end + scanning). The strongest tile sits adjacent to the CTA column, not in the last row. |
| Placement | Repeat a compressed single-line version adjacent to every ask (`CI-07`) — result card, checkout, form submit. |
| Do / Don't | ✅ `KYC-verified transporters · 4,180 loads moved this month`. ❌ five unlabeled logos and four gold stars with no source. |
| Acceptance | Greyscale pass: grouping intact without borders; every proof element traceable to data. |

## 13.5 Mobile Sticky Bars (thumb-zone conversion device)

| Dimension | Spec |
|---|---|
| Psychology | Fitts (`LX-02`), isolation (`LX-06`), Jakob's (`LX-01`), Doherty (`LX-09`), cognitive load (`KR-05`). |
| Anatomy | `fixed inset-x-0 bottom-0 z-50`, height `56–64px` + `padding-bottom: env(safe-area-inset-bottom)`, `bg-white/95 backdrop-blur`, `border-t` hairline. Left: context (`From ₹Y`, `tabular-nums`). Right: one filled CTA, `h-11 px-5 rounded-lg`, ≥`120px` wide, `flex-1` if alone. |
| Behaviour | Appears after the user passes the hero (not on first paint); hides on scroll-down, reveals on scroll-up (≤`180ms`); must never overlap form fields — add `scroll-padding-bottom: 96px` to the scroll container and `padding-bottom` to the last section. |
| Constraints | Exactly 1 bar (never stack a cookie bar + CTA bar); ≤2 elements; no dismiss requirement unless a cookie notice shares the space — in which case the cookie notice becomes a small inline card in the flow, never a bottom bar. |
| Desktop/Tablet | No sticky CTA bar at `md+`; the nav CTA and in-flow CTAs carry the load. A sticky *summary rail* is allowed on the quote/checkout page at `xl` (right column, `sticky top-24`). |
| Acceptance | 360×640: bar never covers an input, contrast ≥4.5:1, tap area ≥48px, `aria-hidden` when off-screen, focus order reaches it logically. |

## 13.6 Forms

| Dimension | Spec |
|---|---|
| Psychology | Gulf of execution/execution (`NM-05`), Postel (`LX-10`), error prevention (`NM-07`), friction (`FR-01`,`FR-03`,`FR-04`), commitment (`CI-05`), Tesler (`LX-07`). |
| Structure | Single column always (never 2-up on mobile; 2-up only for short paired fields at `md+`). Label above input, persistent (never placeholder-as-label). Helper text reserved `1` line to prevent jump. `gap-5` between fields, `gap-2` label↔input (`JJ-02`). |
| Inputs | `h-12` on mobile, `text-base` (prevents iOS zoom), `rounded-lg`, hairline border, `:focus` → 2px brand ring with offset; `:invalid` only after blur; `autocomplete` + `inputmode` + `enterkeyhint` set correctly. |
| Micro-copy | Labels = nouns the user says (`Mobile number`, `Pickup date`). Reasons for sensitive asks stated inline (`"We'll send the driver's number here"`). Buttons = outcome (`Get quote`, `Confirm booking`), never `Submit`. |
| Validation | Inline, after blur + on submit; specific + instructive (`FR-03`); error text replaces helper text in place (no layout shift); first invalid field receives focus; all valid data preserved. |
| Length | Ask only what is needed for the *next* step. Phone/OTP = the last thing, and only with a stated reason (`CI-01`). |
| Acceptance | Keyboard-only completion; screen-reader announces errors + `aria-live` summary; zero duplicate fields; ≤2 fields before the first reward. |

---

# §14 — SYNTHESIS C · 2D/3D VECTOR & MOTION PSYCHOLOGY RULES

Motion is **attention currency**. Every animation spends some; only a few earn it back. The governing law is Johnson's perceptual limit + Norman's feedback requirement: motion exists to (a) confirm a state change, (b) show spatial continuity between two states, (c) direct attention to a new result. Motion that does none of these is cognitive noise (`EM-06`).

## 14.1 Decision table — motion permitted vs prohibited

| Situation | Motion allowed | Rule ID | Specification |
|---|---|---|---|
| Press / tap on any control | ✅ `MUST` | `MV-01` | `scale(.98)` + `translateY(1px)`, `100ms`, spring or `ease-out`. No colour-only feedback. |
| Hover on desktop controls | ✅ `MUST` | `MV-02` | Elevation change (`shadow-sm`→`shadow-md`) or background tint at `180ms`; never scale-up on hover (causes layout shimmer in dense grids). Disabled at `md-` (no hover). |
| Focus (keyboard) | ✅ `MUST` | `MV-03` | Ring appears instantly (`0ms` transition on `outline`), never animated in — focus must be instantaneous. |
| New result / computed value | ✅ `MUST` | `MV-04` | `120ms` opacity crossfade + `4px` upward `translateY` on the result block; `aria-live` announcement. No count-up >400ms. |
| Surface entry (sheet, drawer, modal, popover) | ✅ `MUST` | `MV-05` | Modal/sheet: `320ms` `ease-out` transform + backdrop `180ms` opacity. Popover/tooltip: `180ms`, `transform-origin` at the trigger (spatial continuity). |
| Surface exit | ✅ `MUST` | `MV-06` | `180ms` `ease-in` — exits are always faster than entrances. Never delay unmount beyond the duration. |
| State change (toggle, tab, stepper, accordion) | ✅ `MUST` | `MV-07` | Shared-layout transition or `240ms` height/opacity via `grid-template-rows: 0fr→1fr` (avoids layout thrash); thumb slide `240ms`. |
| Success confirmation | ✅ `SHOULD` | `MV-08` | One `≤600ms` check-draw or subtle pulse, once. No confetti on a B2B transactional flow unless it is a genuine milestone. |
| First-load reveal of the hero | ✅ `SHOULD` | `MV-09` | Single stagger, `≤320ms`, `≤4` elements, `translateY(8px)`+opacity; must not delay LCP text (animate only `opacity`/`transform` on already-rendered DOM). |
| Scroll-triggered reveal of below-fold sections | ⚠️ `SHOULD`, once | `MV-10` | Reveal once, `IntersectionObserver` at `0.2`, no re-trigger, no parallax. Disabled under `prefers-reduced-motion`. |
| Continuous/looping decoration (floating blobs, gradient drift, marquee) | ❌ `MUST-NOT` | `MV-11` | Never in the first viewport or near a CTA. Loops compete with System 1's motion detectors and degrade reading (`JJ-06`). |
| Auto-advancing carousel | ❌ `MUST-NOT` | `MV-12` | Users see slide 1 only; auto-advance steals attention mid-decision (`KR-09`). |
| Number count-up on prices | ❌ `MUST-NOT` | `MV-13` | Prices must be readable at a glance; a moving number is unparseable and feels manipulative. |
| Parallax / scroll-jacking / 3D tilt on cards | ❌ `MUST-NOT` | `MV-14` | Breaks scroll expectations (`LX-01`) and causes motion sickness; also jank-prone at 360px. |
| Skeleton shimmer | ⚠️ permitted | `MV-15` | Slow `1.6s` linear gradient, low contrast (≤8% lightness delta), paused when the tab is hidden. Prefer a static tint if any vestibular risk is signalled. |
| Attention ping for a new message/notification | ✅ once | `MV-16` | `≤2` pulses then stop permanently. Never loop. |

## 14.2 Motion tokens

```css
:root{
  --ease-out: cubic-bezier(.16,1,.3,1);
  --ease-in:  cubic-bezier(.7,0,.84,0);
  --d-100: 100ms; --d-180: 180ms; --d-240: 240ms; --d-320: 320ms;
}
.enter { transition: transform var(--d-320) var(--ease-out), opacity var(--d-180) var(--ease-out); }
.exit  { transition: transform var(--d-180) var(--ease-in),  opacity var(--d-100) var(--ease-in); }
.press:active { transform: scale(.98) translateY(1px); }
```

**Performance contract (`EM-04`):** animate only `transform`/`opacity`/`filter`; `will-change` only during the animation; no animation on elements that contain `position: sticky`; verify on a mid-tier Android at 4× CPU throttle.

## 14.3 2D/3D vector & depth psychology

| Rule ID | Tier | Rule | Rationale (law) | Implementation |
|---|---|---|---|---|
| `VX-01` | MUST | **Depth must encode hierarchy, not decorate it.** Elevation levels map 1:1 to interaction layers: `0` page · `1` card · `2` raised/interactive · `3` popover · `4` modal. | Norman's mapping (`NM-01`); Gestalt enclosure (`JJ-04`). | 4 shadow tokens only: `shadow-[0_1px_2px_rgba(16,24,40,.06)]`, `0_2px_8px/.08`, `0_8px_24px/.10`, `0_16px_48px/.12`. No ad-hoc shadows. |
| `VX-02` | MUST | **Illustrations must depict the mechanism**, not abstract geometry: a shared truck with two labelled loads teaches the conceptual model (`NM-06`); an abstract 3D sphere teaches nothing. | Conceptual model (`NM-06`), visceral clarity (`EM-01`). | Flat 2D with **max 2 depth planes** (base + one raised layer) + one accent fill from the existing palette at ≤15% of illustration area. |
| `VX-03` | MUST | **Isometric/3D assets obey the same accent ration** — the brand hue may appear in an illustration only where it would also appear in the UI (≤10% of the composition, `EM-02`). | Von Restorff scarcity (`LX-06`). | Greyscale the illustration: it must still read as the mechanism. |
| `VX-04` | SHOULD | **Use 3D only where volume carries information** (load stacking/pallet visualisation, truck capacity fill). Use 2D elsewhere. | Cognitive ease — gratuitous 3D adds parse cost (`DK-04`). | Capacity visualizer: 3D pallet fill is permitted and must be interactive (drag/click to add) with an accessible numeric fallback. |
| `VX-05` | MUST | **Depth cues must be consistent within a viewport**: one light source (top, `y+2`), shadows fall down, never mix inset and outset elevation on sibling cards. | Perceptual constancy (`JJ-03` similarity). | Audit: any sibling card with an inverted shadow → fix. |
| `VX-06` | SHOULD | **Iconography: one stroke weight (1.5–2px), one corner radius, one grid (24px).** Icons support text, never replace it for novel actions. | Gestalt similarity (`JJ-03`), recognition over recall (`NM-09`). | Icon-only buttons require `aria-label` + tooltip; novel actions get icon + label. |
| `VX-07` | MUST-NOT | **No glassmorphism on text surfaces, no glow/neon gradients, no gradient-filled buttons** — they reduce contrast and read as "consumer app", not "trusted logistics partner". | Visceral trust (`EM-01`), contrast (WCAG 1.4.3). | Backgrounds: flat neutral or ≤6% tonal shift. Blur (`backdrop-blur`) only on sticky bars over scrolling content. |
| `VX-08` | MUST | **Micro-illustration budget**: ≤1 illustrative element per fold; it must not sit between the headline and the CTA. | Attention cardinality (`EM-06`). | Screenshot: does the illustration compete with the CTA's salience? |
| `VX-09` | MUST | **Reduced motion parity**: every transform-based rule has a static equivalent that still communicates the state (colour/outline/label change). | WCAG 2.3.3, vestibular safety. | `prefers-reduced-motion` pass: all state changes still legible? |
| `VX-10` | SHOULD | **Vector performance**: SVGs inlined and `currentColor`-driven (themeable without new assets), `viewBox` set, `aria-hidden` on decorative, `role="img"` + `<title>` on meaningful; no SVG >30KB in the critical path; Lottie only for the ≤1 permitted loop and lazy-loaded. | Doherty (`LX-09`), friction (`FR-08`). | Bundle check: hero SVG gz <15KB. |

---

# §15 — RESPONSIVE PARITY MATRIX (no rule may be silently dropped on a breakpoint)

Parity means *the same psychological job is done*, not the same pixels. Any rule that cannot be honoured literally must be honoured by a named substitute.

| Component | Mobile 360–767 | Tablet 768–1279 | Desktop 1280+ | Degradation policy |
|---|---|---|---|---|
| Navbar | `h-14`, logo + hamburger (48×48); CTA lives in sticky bottom bar | `h-14`, ≤4 links visible, filled CTA in nav | `h-16`, ≤5 links, filled CTA in nav | Nav CTA may move to sticky bar on mobile — the *isolation* rule transfers to the sticky CTA. |
| Hero | Single col, `pt-14`, `h1 clamp(1.875rem,5vw,3.5rem)`, visual below copy | 6/6, visual right | 5/7, visual right, `xl:pt-24` | Illustration may be hidden below `md` **only** if the headline alone conveys the mechanism; otherwise crop, never remove. |
| CTA | `w-full h-12` (+ sticky duplicate) | `h-11 px-6` | `h-11 px-7` | Never drop the single-CTA rule. |
| Calculator | 1 input/row, chips in a horizontally scrollable row with visible peek | 2-col grid for route inputs | 2-col grid + sticky result rail | Result card must remain above the fold *after* interaction on all sizes (`scrollIntoView` with `block:'nearest'`). |
| Trust bento | 1 col, hero tile first | 2 col | 3 col, hero tile spans 2 | Never >6 tiles on mobile; compress to 3 + "See all". |
| Sticky bar | Present, `h-14` + safe-area | Absent | Absent (sticky right rail on checkout only) | The isolation/fitts job is done by the nav CTA at `md+`. |
| Forms | 1 col, `h-12`, `text-base` | 1 col, pairs allowed for short fields | 1 col max `max-w-[560px]` | Never 2-up at 360px. |
| Motion | Reduce stagger count to ≤2; disable hover-only cues | Full | Full + magnetic hover permitted on primary CTA only | Reduced-motion always wins over breakpoint. |
| Type scale | `clamp` with `vw` | `clamp` | Fixed upper bound | No breakpoint-specific font hacking; use `clamp()`. |

**Global responsive invariants:** no horizontal scroll at 320px; `min-h-[100svh]` not `100vh` (mobile browser chrome); `env(safe-area-inset-*)` respected; `text-base` minimum on inputs; no tap target below 48px; every sticky element tested with a virtual keyboard open.

---

# §16 — BRAND-PALETTE IMMUTABILITY & ISOLATION PROTOCOL

The palette is frozen. Every psychological effect below must be produced **without introducing a new hue**.

## 16.1 Semantic token layer (map existing hex → roles, never the reverse)

```css
:root{
  /* FROZEN — existing brand values, unchanged */
  --brand:        /* existing primary hex */;
  --brand-ink:    /* existing on-primary text colour */;
  --ink:          /* existing dark text */;

  /* DERIVED — permitted neutral ramp built from --ink via color-mix (no new hues) */
  --ink-2: color-mix(in srgb, var(--ink) 72%, white);
  --line:  color-mix(in srgb, var(--ink) 10%, transparent);
  --surface: color-mix(in srgb, var(--ink) 2%, white);
  --surface-2: color-mix(in srgb, var(--ink) 5%, white);
}
```

## 16.2 Brand-Safe Isolation Protocol (replaces "add a colour to make it pop")

| If you want… | Do this instead of a new colour | Rule |
|---|---|---|
| The CTA to stand out | Reduce the *area* of brand usage elsewhere (target 10%), increase CTA size + `font-semibold`, add whitespace isolation (`my-6` clear space around it), and remove all competing fills. | `LX-06`, `EM-02` |
| The result number to dominate | Scale + `tabular-nums` + `font-bold`; lighten everything else to `--ink-2`. | `KR-05`, `EM-03` |
| Success / error / warning states | Use icon + label + `font-medium` in brand/ink, with the *shape* rather than a new hue carrying meaning (check/cross/triangle). If semantic colours already exist in the brand system, reuse them at ≤8% area. | `JJ-07`, WCAG 1.4.1 |
| A "premium" feel | Increase whitespace, tighten display tracking, cut element count, one radius family, quiet borders. Premium is *subtraction*. | `EM-01`, `LX-08` |
| Urgency | Honest timestamp + real remaining quantity in neutral ink with bold weight. Never a red flashing element. | `DK-05`, `DK-08` |

## 16.3 Locked page archetype (System 1 → proof → System 2 → ask)

```
1  Navbar (1 filled CTA)
2  HERO          — ≤7-word h1, ≤25-word mechanism, 1 CTA, optional savings anchor, 0 inputs   [DK-01, KR-02]
3  INSTANT VALUE — 2-input calculator OR one-click indicative range (reciprocity)             [CI-01, FR-01]
4  PROOF STRIP   — specific, dated, local counts + credentials                                [CI-02, CI-03]
5  MECHANISM     — 3 steps, numerals + ≤4 words each                                          [NM-06, LX-04]
6  BENTO PROOF   — hero tile + 5 tiles, all quantified                                        [JJ-04, CI-02]
7  OBJECTION FAQ — 5 questions, answered in the user's words                                  [FR-07, KR-08]
8  FINAL CTA     — restated outcome + single action + human contact                           [LX-05, CI-07]
9  Footer        — legal, verification explainers, real contact, language toggle              [NM-06, CI-04]
```

Mobile order is identical; only composition changes. Sections 2–4 must all be reachable within ~2.5 viewport scrolls at 360px (`KR-04`).

---

# §17 — LOADSAATHI APPLICATION PLAYBOOK (reference implementation notes)

> Assumption flag: LoadSaathi specifics below are the *reference* domain model (load posting, truck sharing, freight quote). Values marked `⟨repo⟩` must be read from the actual project — never invented. No metric targets in this file are promises; they are audit thresholds.

## 17.1 Diagnosing a ~3% CTR on a functional-but-plain site

A functioning site with low CTR is almost never an "awareness" problem. Ranked by typical leverage:

1. **Salience failure** (`LX-06`, `JJ-06`) — the CTA is not the odd one out: multiple filled buttons, brand colour spread across badges/links/headers, no whitespace isolation.
2. **Ask-before-value** (`CI-01`, `FR-01`) — the calculator or quote is gated behind fields/signup, so reciprocity never fires.
3. **Fold dilution** (`KR-04`, `DK-01`) — hero carries copy, badges, carousel, and inputs; System 1 has nothing to act on.
4. **Unanchored price** (`DK-02`) — a single number with no reference frame reads as "a cost", not "a saving".
5. **Generic proof** (`CI-02`) — seals and stars with no numbers, so they cost attention and buy no trust.
6. **Waiting silence** (`LX-09`, `FR-02`) — no pressed state/skeleton; perceived slowness reads as unreliability, which is fatal for a logistics marketplace.

## 17.2 Fix sequence (do in this order; each step is independently shippable)

| Step | Action | Rules | Expected mechanism (not a promised number) |
|---|---|---|---|
| 1 | Reduce brand-colour surface area to CTA + one active state + one key number | `LX-06`, `EM-02` | Restores Von Restorff isolation → CTA becomes the peripheral-vision target |
| 2 | Strip the hero to ≤7-word `h1` + ≤25-word subhead + 1 CTA + proof strip; delete carousel | `KR-02`, `KR-04`, `DK-01` | Removes scanning cost before the first decision |
| 3 | Make the quote fully anonymous and 2-input | `CI-01`, `FR-01` | Reciprocity before the ask; removes the signup wall's friction |
| 4 | Add the anchor: `Full truck ₹X` muted → `Shared ₹Y` hero number, with basis line | `DK-02`, `DK-03`, `AR-04` | Anchoring + relativity turns a price into a saving |
| 5 | Replace seals with dated, corridor-level proof; repeat a one-line version beside every ask | `CI-02`, `CI-03`, `CI-07` | Specificity converts proof into trust; placement kills step-drop-off |
| 6 | Ship mobile sticky bar + pressed states + geometry-matched skeletons | `LX-02`, `MV-01`, `FR-02`, `LX-09` | Fitts + Doherty: the action is reachable and the system feels alive |
| 7 | Add `Save quote` (no auth) and a calm confirmation end-state | `HK-04`, `LX-05` | Investment → return visits; peak-end → memory of a good flow |
| 8 | Reduce 5-colour card chaos to a 3-col bento with monotonic spacing | `JJ-01`, `JJ-02`, `JJ-04` | Enclosure replaces dividers; grouping cost drops |

## 17.3 Instrumentation contract (so the audit is falsifiable)

Ship these events before/with the redesign, or the audit is opinion:

```
hero_cta_click          { variant, viewport, position_in_fold }
calculator_start        { step }
calculator_result_shown { latency_ms, corridor, truck_class }
quote_saved             { auth_state }
signup_started|completed{ source_step }
sticky_bar_cta_click    { viewport }
scroll_depth            { pct: 25|50|75|100 }
web_vitals              { LCP, INP, CLS, viewport }
```

Primary health metric = **result_shown → quote_saved → booking_started** funnel, not raw CTR. CTR alone can rise while the funnel rots (`DK-05` honesty check).

---

# §18 — RULE INDEX (quick lookup by ID)

| Prefix | Source | Section | Rule IDs |
|---|---|---|---|
| `KR` | Krug, *Don't Make Me Think* (2014) | §2 | KR-01 … KR-09 |
| `NM` | Norman, *The Design of Everyday Things* (2013) | §3 | NM-01 … NM-09 |
| `JJ` | Johnson, *Designing with the Mind in Mind* (2020) | §4 | JJ-01 … JJ-08 |
| `DK` | Kahneman, *Thinking, Fast and Slow* (2011) | §5 | DK-01 … DK-08 |
| `CI` | Cialdini, *Influence* (2021 ed.) | §6 | CI-01 … CI-08 |
| `AR` | Ariely (2009) + Thaler & Sunstein (2021) | §7 | AR-01 … AR-07 |
| `HK` | Eyal, *Hooked* (2014) | §8 | HK-01 … HK-06 |
| `EM` | Norman, *Emotional Design* (2004) | §9 | EM-01 … EM-06 |
| `LX` | Yablonski, *Laws of UX* (2nd ed., 2024) | §10 | LX-01 … LX-10 |
| `FR` | Dooley, *Friction* (2015) | §11 | FR-01 … FR-08 |
| `MV` | Motion synthesis (§14) | §14.1 | MV-01 … MV-16 |
| `VX` | Vector/depth synthesis (§14.3) | §14.3 | VX-01 … VX-10 |
| `A#` | Anti-pattern matrix (§12) | §12 | A1 … A18 |

**Severity defaults for audit:** any `MUST` violation that sits on the primary conversion path = **blocking**; `MUST` elsewhere = **high**; `SHOULD` = **medium**; palette modification = **blocking regardless**.

---

# §19 — VERIFICATION LEDGER

The verification rule for this file: **every book, author, law, and named principle cited is real and attributable.** Where a widely-repeated UX claim is *not* supported by the source literature, it is flagged below and the file's rules are written against the accurate version.

## 19.1 Source register (verified)

| # | Work | Author | Edition cited | Concepts actually used |
|---|---|---|---|---|
| 1 | *Don't Make Me Think, Revisited: A Common Sense Approach to Web Usability* | Steve Krug | 3rd ed., New Riders, 2014 (orig. 2000) | scanning vs reading, billboard/glance model, visual hierarchy, happy talk, self-evident design, trunk test |
| 2 | *The Design of Everyday Things* | Don Norman | Revised & expanded ed., Basic Books, 2013 (orig. *The Psychology of Everyday Things*, 1988) | affordances, signifiers, mapping, feedback, conceptual models, gulfs of execution/evaluation |
| 3 | *Designing with the Mind in Mind: Simple Guide to Understanding User Interface Design Guidelines* | Jeff Johnson | 3rd ed., Morgan Kaufmann, 2020 | perceptual bias, Gestalt grouping, foveal/peripheral vision limits, reading behaviour, attention limits |
| 4 | *Thinking, Fast and Slow* | Daniel Kahneman | Farrar, Straus & Giroux, 2011 | System 1 / System 2, cognitive ease, anchoring, loss aversion, WYSIATI, peak-end (with co-authors) |
| 5 | *Influence: The Psychology of Persuasion* | Robert B. Cialdini | New & Expanded ed., Harper Business, 2021 (orig. 1984) | reciprocity, commitment & consistency, social proof, authority, liking, scarcity, **unity** (7th, added 2021) |
| 6 | *Predictably Irrational: The Hidden Forces That Shape Our Decisions* | Dan Ariely | Revised & expanded ed., 2009 (orig. 2008) | relativity, decoy effect, power of free, anchoring, endowment, social vs Market norms |
| 7 | *Nudge: The Final Edition* | Richard H. Thaler & Cass R. Sunstein | 2021 (orig. 2008) | choice architecture, defaults, mapping, feedback, expect error, structure complex choices, transparency/opt-out requirement |
| 8 | *Hooked: How to Build Habit-Forming Products* | Nir Eyal (with Ryan Hoover) | Portfolio, 2014 | trigger → action → variable reward → investment; action simplicity (via Fogg) |
| 9 | *Emotional Design: Why We Love (or Hate) Everyday Things* | Don Norman | Basic Books, 2004 | visceral / behavioral / reflective processing; aesthetic-usability link |
| 10 | *Laws of UX: Using Psychology to Design Better Products & Services* | Jon Yablonski | 2nd ed., O'Reilly, 2024 (orig. 2020) | Jakob's, Fitts's, Miller's, Hick's, Postel's, Peak-End, Aesthetic-Usability, Von Restorff, Tesler's, Doherty Threshold (the ten chapters of the 2nd ed.) |
| 11 | *Friction: The Untapped Force That Can Be Your Most Powerful Advantage* | Roger Dooley | McGraw-Hill, 2015 | physical/cognitive/emotional friction; friction audits; reduced friction beats added persuasion |

Adjacent standards used for hard numbers only: **WCAG 2.2** (2.5.8 target size 24×24 CSS px AA / 2.5.5 44×44 AAA; 1.4.1, 1.4.3, 1.4.11, 2.4.7, 2.4.11, 2.3.3), **Nielsen's response-time limits** (≈0.1s instant / 1s flow / 10s attention), **Doherty & Thadani, IBM Systems Journal (1982)** for the ≈400ms threshold.

## 19.2 Corrections & cautions deliberately baked into the rules

| Commonly repeated claim | Status | How this file handles it |
|---|---|---|
| "Miller's Law means max 7 nav items" | **Misapplication.** Miller (1956) concerns the span of absolute judgement/working memory in *chunks*, not menu counts. | `LX-04` uses Miller only for **chunking**; option counts are governed by Hick's Law (`LX-03`). |
| "The 3-click rule" | **Not supported** by usability research; Krug argues against it. | Explicitly listed as `MUST-NOT` reasoning in `KR-09`. |
| "Z-pattern layout" | A design **heuristic**, not an eye-tracking finding (the F-pattern *is* derived from eye-tracking research, NN/g). | `KR-03` permits Z-pattern only for sparse heroes; F-pattern preferred where text dominates. |
| "10-second comprehension rule" | Editorial guideline in Krug's spirit, not a measured constant. | Encoded as the operational test in `KR-01`, not cited as a research finding. |
| "60-30-10 colour rule" | Interior-design **rule of thumb**, no experimental basis. | Used as an *area-rationing* heuristic (`EM-02`), never as an empirical law. |
| "Loss aversion is a universal ~2× constant" | Contested in later literature (e.g. Gal & Rucker's 2018 critique); effect is real but context-dependent. | `DK-05` treats it as a **framing heuristic** and forbids fabricated scarcity; no multiplier is claimed. |
| "Variable reward = gamification" | Eyal's model is behavioural, and its ethics are explicitly contested. | `HK-03` restricts variability to *information* rewards from real data; `HK-06` bans compulsion mechanics. |
| Any specific conversion lift figure | **No unverified metric appears in this file.** | All targets are audit thresholds (latency, sizes, counts), not performance promises. |
| LoadSaathi-specific numbers, testimonials, badges | Not supplied to this file. | Marked `⟨repo⟩`/placeholder; `CI-08` forbids shipping unverified proof. |

## 19.3 Standing rule for future edits

Any addition to this file must be one of:
1. A rule with a `RULE ID`, `TIER`, `IMPL`, and `TEST` (compilable into §18).
2. A verified source with edition, added to §19.1.
3. A correction added to §19.2 with the reason.

Anything else (anecdote, "best practice", a stat with no source) is rejected at review.

---

# §20 — CHANGELOG

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-11-15 | Initial compilation: 10 sources → 3 pillars, 79 numbered rules (KR/NM/JJ/DK/CI/AR/HK/EM/LX/FR), 18-row anti-pattern matrix, 6 component specs, mv/vx motion + depth rules, responsive parity matrix, brand-safe isolation protocol, verification ledger. |
| 1.0.1 | 2026-11-15 | **LoadSaathi homepage audit round.** Precedents recorded (not new psychology): (a) *Nav CTA demotion* — the header "Get Started" was demoted filled→hairline outline so the hero CTA is the only solid brand fill per viewport (`LX-06`, `EM-02`); the hero, not the nav, owns the fill. (b) *Scoped derived tokens* — the SharedTruckVisualizer ships 6 derived brand tokens (`--brand-orange/blue/navy/slate/line/soft/warm`) registered in Tailwind; they extend the frozen palette for that component only and never replace the core `--primary`/`--color-accent` chain (`§0.3` rule 2, `§16.1`). (c) *H1 unification* — the homepage headline is now identical in the HTML shell, the edge function's crawl block (`api/agent.js`), and the hydrated React hero: **"Pay Only for the Space You Fill"** (7 words, `KR-02`); keep all three in sync when the headline changes. (d) *Peak-moment badge* — a savings badge that is key-swapped via `AnimatePresence` must keep its container mounted and crossfade only the text; `mode="wait"` on the whole badge makes it blink out at the peak (`DK-02`, `LX-05`). (e) *Contrast floor* — `#94a3b8`/`#cbd5e1` on white (2.58:1 / 1.48:1) are below WCAG AA and were raised to `#64748b` (4.76:1); `§0.3` rule 1 puts accessibility above brand tinting. (f) *Touch floor* — visualizer controls use `min-h-12` (48px) rather than the app's 44px default, because the brain's `LX-02` floor is 48×48 on touch. |

---

**END OF BRAIN.** Agents: do not summarise this file from memory — re-read the relevant section (§0–§17) before generating or auditing any component, and cite rule IDs in every finding.
