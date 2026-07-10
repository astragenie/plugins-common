---
id: FEAT-006
status: done
closed: 2026-07-08
close_note: "Deferred per operator decision 2026-07-08. In-repo half is a plugin-std zod flags/config accessor with NO in-repo consumer; the real value (merging runner + dev-team features-service registries + their live-hook consumers) is cross-repo. Closed rather than ship a frozen API unproven in-repo. Cross-repo work tracked as companion FEATs in runner-plugin and dev-team backlogs."
priority: P2
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: [FEAT-001]
slices: []
derived_from: docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md
tags: [stack:typescript, surface:library, surface:package, concern:refactor, concern:shared-code, concern:consolidation, concern:api-contract, area:gepa-core, area:plugin-std]
needs_contract: true
needs_ux: false
pm_customer_impact: 0.4
pm_effort_estimate: 0.4
pm_strategic_alignment: 0.65
pm_technical_risk: 0.65
pm_dependency_depth: 0.4
pm_composite_priority: P2
pm_autonomous_safe: false
pm_reviewed: 2026-07-08
autonomous_safe: false
triage_notes: "P2: blocked on FEAT-001 landing and being actually consumed (not just published), moderate customer impact, and live-hook-behavior risk keeps technical_risk in the 0.6-0.8 band despite modest in-repo effort; re-sequence after FEAT-001 proves consumption."
---
## Description

Extract a shared flags/config zod accessor into `@astragenie/plugin-std`, merging the runner + dev-team
`features-service` registries. Candidate #6 (M4/M5 fix). Accessor contract: unknown key → loud,
explicit-disable ≠ absent, deprecated-alias always logged.

**Gated on FEAT-001 actually CONSUMED in gepa-core, not merely published (plan §8.2)** — depends on the
shared error taxonomy for its failure mode.

Seed: gepa-core zod-with-defaults + runner/dev-team `features-service` registry semantics (header pre-declares
this merge). Migrate registry-by-registry with parity tests kept green until cutover; flag-lite mirrors die.

## Acceptance criteria
- `plugin-std` exports the zod flags/config accessor with the loud-unknown-key contract.
- runner + dev-team features-service registries merged; parity-test mirrors removed.
- Live-hook flag behavior unchanged across cutover.

Ref: plan §1.6, §8.2, §8.5.

## Intake notes

Created via free-text intake (`/runner:intake "<text>"`). Priority is
unset — this FEAT has not been scored yet. Run `/runner:triage`
(PM scoring + `backlog pm-apply`) to score it before slicing.