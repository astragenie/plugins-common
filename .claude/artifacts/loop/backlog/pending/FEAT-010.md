---
id: FEAT-010
status: pending
priority: P3
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: [FEAT-001]
slices: []
derived_from: docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md
tags: [stack:typescript, surface:library, surface:package, concern:config, concern:consolidation, concern:api-contract, area:loop-config, blocked:ownership]
needs_contract: true
needs_ux: false
autonomous_safe: false
composite_priority: P3
pm_reviewed: manual-2026-07-08
recommendation: defer
---
## Description

`loop.json` schema package (Phase-3 plan candidate #8, §1.8). One zod schema + typed accessor for
`.claude/loop.json`, converting the current mirror-by-comment contract (review finding H3) into code.

- **Consumers (all cross-repo):** runner (16 `resolveConfig` callers + 13 bypass sites) and dev-team
  (4 readers, 3 partial schemas die). **plugins-common itself has NO `loop.json` consumer** — the
  loop.json in this repo is read by the installed runner CLI, not by this repo's own source.
- **Effort L; regression HIGH** — the schema churns with every runner feature; a published package
  adds a release step to every config change.
- **Blocked on Q2 (ownership)** per the plan; plan directive: "do not start before #1–#6 land."

## Recommendation: DEFER (do not autonomous-build)

This is the same shape as **FEAT-006** (flags/config accessor), which the operator DEFERRED/closed on
2026-07-08 with the rationale: "In-repo half has NO in-repo consumer; the real value is cross-repo;
closed rather than ship a frozen API unproven in-repo." FEAT-010 matches that pattern exactly, and adds
an explicit ownership blocker (Q2) plus HIGH regression risk. Building it unsupervised would produce a
frozen cross-plugin config contract with no in-repo proof and no resolved owner — precisely what the
FEAT-006 decision rejected.

Left for a human owner decision (the "human in the loop" checkpoint):
- Resolve Q2 (who owns the loop.json schema — plugins-common, runner, or a shared contract?).
- Decide open-validation (unknown-keys pass-through) so runner can extend ahead of the package.
- Then either file cross-repo companion FEATs (runner + dev-team adopt the schema) like FEAT-009's
  pattern, or close as deferred like FEAT-006.

## Acceptance criteria (draft — do not slice until Q2 resolved)
- AC-1: A DEC resolves loop.json schema ownership (Q2) before any code.
- AC-2: zod schema + typed accessor for `.claude/loop.json` with open (unknown-keys-pass-through) validation.
- AC-3: at least one PROVEN consumer adopts it (cross-repo companion FEAT), not an in-repo-unused frozen API.

## Intake notes

Filed manually 2026-07-08 during the FEAT-008→FEAT-011 autonomous run. Scored P3/autonomous_safe=false by
the FEAT-006 precedent + plan §1.8 (ownership-blocked, HIGH regression). Run `/runner:triage` for an
independent PM score if the owner wants to reconsider before deferring.
