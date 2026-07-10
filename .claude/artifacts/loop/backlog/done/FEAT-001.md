---
id: FEAT-001
status: done
priority: P0
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: []
slices: [SLICE-01]
derived_from: docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md
tags: ["stack:typescript", "surface:library", "surface:package", "concern:refactor", "concern:shared-code", "concern:api-contract", "area:gepa-core", "area:plugin-std"]
needs_contract: true
needs_ux: false
pm_customer_impact: 0.75
pm_effort_estimate: 0.5
pm_strategic_alignment: 0.9
pm_technical_risk: 0.65
pm_dependency_depth: 0.15
pm_composite_priority: P0
pm_autonomous_safe: true
pm_reviewed: 2026-07-08
autonomous_safe: true
triage_notes: "P0: hard Gate Zero blocker unblocking the entire consolidation milestone, verified still unmet in live code today; technical_risk 0.65 lands in the 0.6-0.8 band (cross-module reach, establishes a cross-plugin contract) even though the Gate Zero diff itself is 2 files; effort re-scoped down from the plan's cross-repo estimate to reflect only plugins-common-buildable work."
started_at: 2026-07-08
slices_complete: [SLICE-01]
completed_at: 2026-07-08
---
## Description

Extract a shared `PluginError` base + `Deterministic`/`Transient` taxonomy and a `Result` type into
`@astragenie/plugin-std`. Candidate #1 in the phase-3 consolidation plan.

**Gate Zero (0a) is a hard precondition — must land first (plan §8.1):**
- `gepa-core/packages/gepa-core/src/store/file-store.ts:46` → convert `TrialSchema.parse` to `safeParse`.
- `gepa-core/packages/gepa-core/src/lock/file-lock-manager.ts:63` → make `acquire()` honor a genuine never-throws contract.

Seeds: dev-team `scripts/lib/result.ts` (policy header verbatim) + astramem `src/lib/errors.ts` taxonomy.
First consumer = plugins-common itself (gepa-core B1). errors.ts + result.ts are already scaffolded (untracked) — this FEAT lands Gate Zero, proves consumption, then publishes.

**Consumers to migrate back:** gepa-core (proof), astramem-plugin (`src/lib/errors.ts` still defines its own Deterministic/Transient — plan §8.4), runner (12 base-less error classes + dead `result.mts`).

## Acceptance criteria
- AC-1: Given gepa-core/packages/gepa-core/src/store/file-store.ts:46 currently calls TrialSchema.parse(trial) which throws on invalid input, When the Gate Zero fix lands, Then file-store.ts uses TrialSchema.safeParse(trial) and returns a Result<Trial, DeterministicError> (or an equivalent non-throwing path) instead of throwing, with a passing unit test asserting no throw on invalid trial data.
- AC-2: Given gepa-core/packages/gepa-core/src/lock/file-lock-manager.ts:63 currently executes a bare throw err inside acquire(), When the never-throws contract fix lands, Then acquire() returns a Result<Lock, TransientError> (or documented equivalent) on failure instead of throwing, verified by a unit test that simulates lock-contention failure and asserts the call does not throw.
- AC-3: Given @astragenie/plugin-std already exports PluginError, DeterministicError, TransientError, and Result (packages/plugin-std/src/errors.ts, packages/plugin-std/src/result.ts), When gepa-core's file-store.ts and file-lock-manager.ts are updated per AC-1/AC-2, Then both modules import and construct these shared types directly rather than re-declaring local equivalents, proving first-consumer adoption inside this repo.
- AC-4: Given a malformed trial JSON line is read via the file-store read path, When TrialSchema.safeParse rejects it, Then the function returns err(new DeterministicError(...)) rather than throwing, and a test asserts the caller receives the typed error with code and transient: false instead of an unhandled exception.

> Explicitly out of scope: astramem-plugin's `src/lib/errors.ts` cutover (plan §8.4) lives in a separate repo not present in this monorepo — track via a companion FEAT in astramem-plugin's own backlog, not a blocking AC here.

Ref: plan §1.1, §8.1, §8.2, §8.4.

## Intake notes

Created via free-text intake (`/runner:intake "<text>"`). Priority is
unset — this FEAT has not been scored yet. Run `/runner:triage`
(PM scoring + `backlog pm-apply`) to score it before slicing.