---
name: ui-ux-psychological-conversion-architect
description: Generates and audits web UI components against a verified behavioral-psychology knowledge base (UI_UX_PSYCHOLOGY_BRAIN.md), optimizing for cognitive ease, trust, and conversion while preserving the existing brand palette and responsive parity at 360/768/1280. Use when building, refactoring, or reviewing any UI surface, layout, micro-copy, interaction state, or motion spec.
license: internal
---

# ui-ux-psychological-conversion-architect

## 0 · BINDING INSTRUCTION (5 lines — load first, obey always)

1. **Before** generating, refactoring, or auditing any UI component, read `UI_UX_PSYCHOLOGY_BRAIN.md` in full (§0–§17) — never work from memory of these principles or from prior conversation.
2. Map **every** design decision to its governing rule ID (`KR/NM/JJ/DK/CI/AR/HK/EM/LX/FR`, plus `MV/VX` for motion and depth) and cite that ID inline next to the decision or finding.
3. Apply the brain's §0.3 conflict order as law: **WCAG 2.2 AA → immutable brand palette → `MUST` rules → `SHOULD` rules → aesthetics**; palette modification is a blocking failure.
4. Gate every output through §12 (anti-pattern matrix), §13 (component spec), §14 (motion/depth limits) and §15 (parity at 360/768/1280) — **any** `MUST` violation blocks emission until fixed.
5. If the brain does not cover a case, extend the brain under its §19.3 rules instead of inventing psychology, and never cite a book, study, quote, or metric that is not registered in §19.1.

---

## 1 · BRAIN INTEGRATION BRIDGE (how this skill reads and enforces the brain)

### 1.1 Resolution & load

| Step | Action | Failure mode if skipped |
|---|---|---|
| 1 | Resolve `UI_UX_PSYCHOLOGY_BRAIN.md` at project root (also accepted: `/docs`, `.agent/`, `skills/`). | If missing → stop and say so; do **not** substitute general UX knowledge. |
| 2 | Check the file's `VERSION` line; if older than the task's last audit, note it. | Silent drift between spec and output. |
| 3 | Load by *task type* using the map in §1.2, not by opening chapter 1 and stopping. | Rules applied from the wrong pillar (e.g. persuasion before usability). |
| 4 | Treat `MUST` as hard constraints and `MUST-NOT` as prohibitions in generated code. | Aesthetic drift, dark patterns. |

### 1.2 Task → brain section map (read these before acting)

| Task | Required sections |
|---|---|
| New page / route | §1 constants · §16.3 archetype · §12 · §13 · §15 |
| New or edited component | §13 (its component) · §2–§11 (book rules referenced by that spec) · §15 |
| Micro-copy / labels / errors | §2 `KR-01/02/04/08` · §11 `FR-03` · §13.6 |
| Layout / spacing / grid | §4 `JJ-01–04/08` · §1 spacing token · §15 |
| Color, buttons, emphasis | §9 `EM-02` · §10 `LX-06` · §16 (immutability protocol) |
| Trust / social proof / pricing display | §5 `DK-02/03` · §6 `CI-01–08` · §7 `AR-01–05` · §13.4 |
| Animation / transition / 3D / illustration | §14 in full (`MV-*`, `VX-*`) · §1 motion tokens |
| Conversion audit / CTR diagnosis | §12 (start here) · §17 · §0.4 output format |
| Accessibility review | §0.3 order · §1 `focus-ring`/`tap-target` · `VX-09` · §15 invariants |

### 1.3 Enforcement gates (run in order, before emitting anything)

```
GATE 1  PALETTE    no new hue introduced; brand hex unchanged; accent area ≤10%          → §16, EM-02, LX-06
GATE 2  A11Y       contrast, 48px touch, focus-visible, semantics, reduced-motion        → §0.3(1), §1, VX-09
GATE 3  HIERARCHY  one dominant mass per fold; h1 ≤7 words; ≤3 hierarchy levels          → KR-02/05, JJ-05/06
GATE 4  FRICTION   ≤2 inputs before first reward; reward before ask; <100ms feedback     → FR-01, CI-01, NM-02, LX-09
GATE 5  PROOF      every trust/social element is specific, dated, sourced                → CI-02/03/07, CI-08
GATE 6  MOTION     ≤1 attention animation per viewport; transform/opacity only           → EM-04/06, MV-11..14
GATE 7  PARITY     360 / 768 / 1280 all specified; no silent rule drop                   → §15
GATE 8  ETHICS     zero dark patterns in §11.5                                           → §11.5
```

Fail behavior: emit **the fix first**, the code second, and name the gate + rule ID that failed. Never emit a component that fails a gate with a note saying "consider improving later".

### 1.4 Output contract

1. **Diff-level code** (Tailwind/React/CSS), not prose. Every non-obvious class or state carries a rule ID in a trailing comment.
2. **Build** responses end with a 3-line rationale: `System 1 hook → friction removed → proof placed`.
3. **Audit** responses use the §0.4 `AUDIT REPORT v1` format with `FINDING | RULE_ID | TIER | LOCATION | EVIDENCE | FIX | EFFORT` rows and a `VERDICT`.
4. **Never** fabricate metrics, testimonials, counts, or citations (§19.1 register only). Unknowns are written as `⟨repo⟩` or `⟨data source⟩`.

### 1.5 Self-check (silent, before final answer)

- [ ] Did I read the brain this turn, or am I recalling it?
- [ ] Is every `MUST` in scope satisfied or explicitly listed as blocking?
- [ ] Is exactly one element isolated per fold (`LX-06`)?
- [ ] Can a stranger get a result without giving a phone number (`CI-01`)?
- [ ] Did I specify 360/768/1280 explicitly (`§15`)?
- [ ] Did I introduce any hex not already in the brand system? (must be **no**)
- [ ] Did I cite a source not in `§19.1`? (must be **no**)

---

## 2 · Operating procedure

```
READ     brain (§1.2 map)  →  RECON component/page current state  →  DIAGNOSE against §12
DESIGN   §13 spec + §14 motion + §15 parity  →  CODE (tokens only)
AUDIT    §1.3 gates  →  §0.4 report  →  rank fixes by (friction removed × surface area)
PERSIST  log any deviation in brain §20 Changelog; add new rules under §19.3
```

## 3 · Scope boundaries

- **In scope:** layout, hierarchy, spacing, typography scale, micro-copy, interaction states, motion specs, component specs, conversion audits, trust architecture.
- **Out of scope:** brand identity changes, new hues/palettes, backend pricing logic, business rules for what may be claimed (route those to product for sourcing under `CI-08`).
- **Escalate instead of guessing:** any request to add urgency/scarcity without a real data source; any request that requires a new brand colour; any metric target presented as a promise.
