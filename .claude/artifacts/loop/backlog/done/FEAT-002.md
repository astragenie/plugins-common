---
id: FEAT-002
status: done
priority: P1
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: []
slices: [SLICE-02]
derived_from: docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md
tags: ["stack:typescript", "surface:library", "surface:package", "concern:refactor", "concern:shared-code", "concern:consolidation", "area:gepa-core", "area:plugin-std"]
needs_contract: true
needs_ux: false
pm_customer_impact: 0.5
pm_effort_estimate: 0.3
pm_strategic_alignment: 0.75
pm_technical_risk: 0.3
pm_dependency_depth: 0.1
pm_composite_priority: P1
pm_autonomous_safe: true
pm_reviewed: 2026-07-08
autonomous_safe: true
triage_notes: "P1: parallelizable, low-risk, high-duplication win across 4 repos with the most stable seed found in the whole plan (1 touch/3mo); technical_risk stays in the 0.3-0.5 band (new pattern in repo, no contract change, clean rollback); effort re-scoped to in-repo core + gepa-core consumption only."
started_at: 2026-07-08
slices_complete: [SLICE-02]
completed_at: 2026-07-08
---
## Description

Extract shared jsonl utilities into `@astragenie/plugin-std`: `append` / `appendBatch` / `readSafe` /
`tail` / opt-in `rotate`. Candidate #2. Independent of #1, parallelizable.

Seed: runner `src/scripts/lib/jsonl-append.mts` (most stable candidate found — 1 touch in 3 months).
Add guarded reader (seed gepa-core `file-store.ts:13-31`) + tail-read (seed dev-team `jsonl.mjs`) + rotation (seed astramem `log.ts`). Torn-line counting is the default (kills the two-swallow-disciplines defect M2).

**Consumers to migrate back (opportunistic):** runner (8 canonical + rogue), dev-team (10 rogue appends + 5 tail-read), astramem-plugin (4 — plan §8.4 adoption track), gepa-core (2).

## Acceptance criteria
- AC-1: Given the seed runner jsonl-append.mts pattern (plan §1.2, most stable candidate found), When @astragenie/plugin-std ships its jsonl module, Then it exports append, appendBatch, readSafe, tail, and an opt-in rotate, each with a unit test covering the documented happy path.
- AC-2: Given a jsonl file containing a torn (partially-written) final line, When readSafe parses the file, Then it returns the well-formed lines plus a count of skipped torn lines rather than throwing (closes the two-swallow-disciplines defect M2) — verified by a test with a deliberately truncated fixture line.
- AC-3: Given gepa-core's existing jsonl usage (file-store.ts guarded-read, 2 call sites per plan §1.2), When gepa-core is migrated to import plugin-std's jsonl module, Then its local guarded-read implementation is deleted, gepa-core's existing jsonl tests are re-pointed at the shared module, and they pass.
- AC-4: Given plugin-std's jsonl API is declared frozen at extraction, When the package is updated, Then packages/plugin-std/package.json's exported surface includes the jsonl module and both `bun run typecheck` and `bun test` pass for the new module.

> Explicitly out of scope: consumer migration in runner-plugin, dev-team, astramem-plugin (rogue append/tail-read sites) — companion FEATs in those repos, not blocking here.

Ref: plan §1.2, §8.4.

## Intake notes

Created via free-text intake (`/runner:intake "<text>"`). Priority is
unset — this FEAT has not been scored yet. Run `/runner:triage`
(PM scoring + `backlog pm-apply`) to score it before slicing.