---
id: FEAT-004
status: done
priority: P1
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: []
slices: [SLICE-04]
derived_from: docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md
tags: ["stack:typescript", "surface:library", "surface:package", "concern:refactor", "concern:shared-code", "concern:api-contract", "area:plugin-std"]
needs_contract: true
needs_ux: false
pm_customer_impact: 0.65
pm_effort_estimate: 0.4
pm_strategic_alignment: 0.75
pm_technical_risk: 0.6
pm_dependency_depth: 0.15
pm_composite_priority: P1
pm_autonomous_safe: true
pm_reviewed: 2026-07-08
autonomous_safe: true
triage_notes: "P1: genuine Windows-relevant recurring bug class with strong cross-repo call-site evidence, but technical_risk sits at the 0.6 band edge (schema/data-shape-adjacent churn on a stability-flagged seed) rather than lower; effort re-scoped to in-repo core extraction only, explicitly excluding the cross-repo consumer migration that made the plan's original M-estimate an epic."
started_at: 2026-07-08
slices_complete: [SLICE-04]
completed_at: 2026-07-08
---
## Description

Extract a pinned frontmatter parse/serialize core into `@astragenie/plugin-std`. Candidate #4 (M1 fix).
Eliminates a recurring bug class (LF-only regexes on a Windows-first ecosystem).

Seed: runner `src/scripts/lib/frontmatter.mts` (~38 importers verified, plan §8.2). Extract the
parse/serialize **core only** — API pinned at extraction. Runner-specific key helpers (backlog frontmatter
conventions) stay in runner. Add a CRLF/LF/BOM test matrix.

**Stability caution (plan §8.2):** seed last touched 2 days before plan date. Verify churn is in runner-specific
helpers (safe to leave behind), not the core, at migration time.

**Consumers:** runner (36 importers + 5 rogue regexes), dev-team (11 diverged parsers, 11 return shapes — per-file adaptation). astramem has none (stays out).

## Acceptance criteria
- AC-1: Given the seed runner frontmatter.mts parse/serialize behavior (plan §1.4, documented CRLF bugfix), When @astragenie/plugin-std ships its frontmatter module, Then it exports a pinned `parseFrontmatter`/`serializeFrontmatter` core API, with unit tests covering LF-only, CRLF, and BOM-prefixed input all parsing to the same normalized result.
- AC-2: Given a markdown file with malformed frontmatter (an unterminated `---` fence), When `parseFrontmatter` is called, Then it returns a typed failure (throw `DeterministicError` per the package's infra/domain policy, consistent with jsonl/http) rather than silently returning empty/partial data — verified by an unterminated-fence fixture.
- AC-3: Given the stability caution (§8.2: seed churned 2 days before plan date), When the core is extracted, Then only parse/serialize are pinned in plugin-std with ZERO imports of runner-specific backlog-frontmatter-key conventions — verified by an import-boundary check in the module's tests.
- AC-4: Given plugin-std's export convention (jsonl/http use both root re-export AND a subpath), When the frontmatter module is added, Then it is exposed via `./frontmatter` subpath + root re-export, and `bun --filter @astragenie/plugin-std test|typecheck` pass including the CRLF/LF/BOM matrix.

> Explicitly out of scope: migrating runner's 36 importers + 5 rogue regexes and dev-team's 11 parsers — companion FEATs in those repos.

Ref: plan §1.4, §8.2.

## Intake notes

Created via free-text intake (`/runner:intake "<text>"`). Priority is
unset — this FEAT has not been scored yet. Run `/runner:triage`
(PM scoring + `backlog pm-apply`) to score it before slicing.