---
id: SLICE-01
title: Implement FEAT-001
status: completed
feature: FEAT-001
phase: null
priority: P0
target_release: null
requires_validation: true
risk: high
created: 2026-07-08
updated: 2026-07-08
completed_at: 2026-07-08
---
# SLICE-01: Implement FEAT-001

Implements FEAT-001. See [feature file](../../../backlog/in-progress/FEAT-001.md) for product context.

## Objective

Extract a shared `PluginError` base + `Deterministic`/`Transient` taxonomy and a `Result` type into

## In scope

- bullet 1
- bullet 2

## Out of scope

- bullet 1

## Acceptance criteria

- [x] AC-1: Given gepa-core/packages/gepa-core/src/store/file-store.ts:46 currently calls TrialSchema.parse(trial) which throws on invalid input, When the Gate Zero fix lands, Then file-store.ts uses TrialSchema.safeParse(trial) and returns a Result<Trial, DeterministicError> (or an equivalent non-throwing path) instead of throwing, with a passing unit test asserting no throw on invalid trial data.
- [x] AC-2: Given gepa-core/packages/gepa-core/src/lock/file-lock-manager.ts:63 currently executes a bare throw err inside acquire(), When the never-throws contract fix lands, Then acquire() returns a Result<Lock, TransientError> (or documented equivalent) on failure instead of throwing, verified by a unit test that simulates lock-contention failure and asserts the call does not throw.
- [x] AC-3: Given @astragenie/plugin-std already exports PluginError, DeterministicError, TransientError, and Result (packages/plugin-std/src/errors.ts, packages/plugin-std/src/result.ts), When gepa-core's file-store.ts and file-lock-manager.ts are updated per AC-1/AC-2, Then both modules import and construct these shared types directly rather than re-declaring local equivalents, proving first-consumer adoption inside this repo.
- [x] AC-4: Given a malformed trial JSON line is read via the file-store read path, When TrialSchema.safeParse rejects it, Then the function returns err(new DeterministicError(...)) rather than throwing, and a test asserts the caller receives the typed error with code and transient: false instead of an unhandled exception.

## Done When

- all acceptance criteria PASS with evidence per `01-loop-control/EVIDENCE_RULES.md`
- build / test commands per `.claude/loop.json` pass
- feature FEAT-001 moved from `in-progress/` to `done/`
- Crew `final-synthesis` artifact written
- (pure refactors / mechanical changes: set `requires_validation: false` in frontmatter
   above to waive the validation gate — no badge needed at close time)

## Reviewer ladder

- Reviewer A: ...
- Reviewer B: ...
