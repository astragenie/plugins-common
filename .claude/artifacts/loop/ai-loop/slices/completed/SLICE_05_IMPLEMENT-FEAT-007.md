---
id: SLICE-05
title: Implement FEAT-007
status: completed
feature: FEAT-007
phase: null
priority: P3
target_release: null
requires_validation: true
risk: low
created: 2026-07-08
updated: 2026-07-08
completed_at: 2026-07-08
---
# SLICE-05: Implement FEAT-007

Implements FEAT-007. See [feature file](../../../backlog/in-progress/FEAT-007.md) for product context.

## Objective

Extract a minimal `runGit` spawn wrapper into `@astragenie/plugin-std`. Candidate #7. Scope guard:

## In scope

- bullet 1
- bullet 2

## Out of scope

- bullet 1

## Acceptance criteria

- [x] AC-1: Given the seed dev-team `briefing/git.ts:51-58` wrapper, When @astragenie/plugin-std ships `runGit`, Then it exports `runGit(args: string[], opts?) => Promise<{ok, stdout, stderr, status}>` (or documented sync variant matching the seed) — spawn only, NO worktree logic and NO policy — with a unit test asserting a successful command (e.g. `git --version` or an init'd temp repo) returns `ok:true`, `status:0`, captured stdout.
- [x] AC-2: Given a git command that exits non-zero (e.g. `git rev-parse` in a non-repo temp dir), When `runGit` runs it, Then it returns `ok:false` with the non-zero `status` and captured `stderr` — it does NOT throw on command failure (only a genuine spawn error is exceptional). Verified by a test.
- [x] AC-3: Given plugin-std's export convention (jsonl/http use root re-export + subpath), When `runGit` is added, Then it is exposed via `./git` subpath + root re-export; `bun --filter @astragenie/plugin-std test|typecheck|lint` pass. API frozen at extraction.

## Done When

- all acceptance criteria PASS with evidence per `01-loop-control/EVIDENCE_RULES.md`
- build / test commands per `.claude/loop.json` pass
- feature FEAT-007 moved from `in-progress/` to `done/`
- Crew `final-synthesis` artifact written
- (pure refactors / mechanical changes: set `requires_validation: false` in frontmatter
   above to waive the validation gate — no badge needed at close time)

## Reviewer ladder

- Reviewer A: ...
- Reviewer B: ...
