---
id: SLICE-02
title: Implement FEAT-002
status: completed
feature: FEAT-002
phase: null
priority: P1
target_release: null
requires_validation: true
risk: medium
created: 2026-07-08
updated: 2026-07-08
completed_at: 2026-07-08
---
# SLICE-02: Implement FEAT-002

Implements FEAT-002. See [feature file](../../../backlog/in-progress/FEAT-002.md) for product context.

## Objective

Extract shared jsonl utilities into `@astragenie/plugin-std`: `append` / `appendBatch` / `readSafe` /

## In scope

- bullet 1
- bullet 2

## Out of scope

- bullet 1

## Acceptance criteria

- [x] AC-1: Given the seed runner jsonl-append.mts pattern (plan §1.2, most stable candidate found), When @astragenie/plugin-std ships its jsonl module, Then it exports append, appendBatch, readSafe, tail, and an opt-in rotate, each with a unit test covering the documented happy path.
- [x] AC-2: Given a jsonl file containing a torn (partially-written) final line, When readSafe parses the file, Then it returns the well-formed lines plus a count of skipped torn lines rather than throwing (closes the two-swallow-disciplines defect M2) — verified by a test with a deliberately truncated fixture line.
- [x] AC-3: Given gepa-core's existing jsonl usage (file-store.ts guarded-read, 2 call sites per plan §1.2), When gepa-core is migrated to import plugin-std's jsonl module, Then its local guarded-read implementation is deleted, gepa-core's existing jsonl tests are re-pointed at the shared module, and they pass.
- [x] AC-4: Given plugin-std's jsonl API is declared frozen at extraction, When the package is updated, Then packages/plugin-std/package.json's exported surface includes the jsonl module and both `bun run typecheck` and `bun test` pass for the new module.

## Done When

- all acceptance criteria PASS with evidence per `01-loop-control/EVIDENCE_RULES.md`
- build / test commands per `.claude/loop.json` pass
- feature FEAT-002 moved from `in-progress/` to `done/`
- Crew `final-synthesis` artifact written
- (pure refactors / mechanical changes: set `requires_validation: false` in frontmatter
   above to waive the validation gate — no badge needed at close time)

## Reviewer ladder

- Reviewer A: ...
- Reviewer B: ...
