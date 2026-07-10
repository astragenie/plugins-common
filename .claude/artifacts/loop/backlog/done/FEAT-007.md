---
id: FEAT-007
status: done
priority: P3
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: []
slices: [SLICE-05]
derived_from: docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md
tags: ["stack:typescript", "surface:library", "surface:package", "concern:refactor", "concern:shared-code", "concern:api-contract", "area:plugin-std"]
needs_contract: true
needs_ux: false
pm_customer_impact: 0.3
pm_effort_estimate: 0.2
pm_strategic_alignment: 0.55
pm_technical_risk: 0.15
pm_dependency_depth: 0.05
pm_composite_priority: P3
pm_autonomous_safe: false
pm_reviewed: 2026-07-08
autonomous_safe: false
triage_notes: "P3: lowest strategic priority in the source plan itself (explicitly tied for last of the 7 scored candidates), small and low-risk in-repo deliverable (a thin spawn wrapper, no policy per the scope guard), but the existing AC still bundles cross-repo dedup work this repo cannot execute -- hold at P3 pending re-scope."
started_at: 2026-07-08
slices_complete: [SLICE-05]
completed_at: 2026-07-08
---
## Description

Extract a minimal `runGit` spawn wrapper into `@astragenie/plugin-std`. Candidate #7. Scope guard:
`runGit(args, opts) → {ok, stdout, stderr, status}` **ONLY** — no worktree logic, no policy (per do-NOT list).

Seed: dev-team `briefing/git.ts:51-58` (byte-identical twin in `branch-cleanup.ts` dies at extraction).

**Consumers:** dev-team (3 impls → dedup immediately), runner (29 raw git spawn sites across 12 files → migrate opportunistically, not big-bang).

## Acceptance criteria
- AC-1: Given the seed dev-team `briefing/git.ts:51-58` wrapper, When @astragenie/plugin-std ships `runGit`, Then it exports `runGit(args: string[], opts?) => Promise<{ok, stdout, stderr, status}>` (or documented sync variant matching the seed) — spawn only, NO worktree logic and NO policy — with a unit test asserting a successful command (e.g. `git --version` or an init'd temp repo) returns `ok:true`, `status:0`, captured stdout.
- AC-2: Given a git command that exits non-zero (e.g. `git rev-parse` in a non-repo temp dir), When `runGit` runs it, Then it returns `ok:false` with the non-zero `status` and captured `stderr` — it does NOT throw on command failure (only a genuine spawn error is exceptional). Verified by a test.
- AC-3: Given plugin-std's export convention (jsonl/http use root re-export + subpath), When `runGit` is added, Then it is exposed via `./git` subpath + root re-export; `bun --filter @astragenie/plugin-std test|typecheck|lint` pass. API frozen at extraction.

> Explicitly out of scope: dev-team's 3-impl dedup and runner's 29 raw-git-spawn sites — companion FEATs in those repos (opportunistic migration).

Ref: plan §1.7.

## Intake notes

Created via free-text intake (`/runner:intake "<text>"`). Priority is
unset — this FEAT has not been scored yet. Run `/runner:triage`
(PM scoring + `backlog pm-apply`) to score it before slicing.