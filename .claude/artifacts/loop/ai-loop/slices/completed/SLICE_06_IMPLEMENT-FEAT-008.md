---
id: SLICE-06
title: Implement FEAT-008
status: completed
feature: FEAT-008
phase: null
priority: P2
target_release: null
requires_validation: true
risk: medium
created: 2026-07-08
updated: 2026-07-08
completed_at: 2026-07-08
---
# SLICE-06: Implement FEAT-008

Implements FEAT-008. See [feature file](../../../backlog/in-progress/FEAT-008.md) for product context.

## Objective

`@astragenie/plugin-std` ships two contradictory infra-error conventions across the modules landed by

## In scope

- bullet 1
- bullet 2

## Out of scope

- bullet 1

## Acceptance criteria

- [ ] AC-1: A DEC records the chosen infra-error policy with rationale (throw vs Result), covering the never-throws-acquire tension.
- [ ] AC-2: All plugin-std modules (errors/result, jsonl, http) and their in-repo gepa-core consumers conform to the chosen policy; tests updated.
- [ ] AC-3: result.ts header documents the single policy unambiguously so future modules can't diverge.

## Done When

- all acceptance criteria PASS with evidence per `01-loop-control/EVIDENCE_RULES.md`
- build / test commands per `.claude/loop.json` pass
- feature FEAT-008 moved from `in-progress/` to `done/`
- Crew `final-synthesis` artifact written
- (pure refactors / mechanical changes: set `requires_validation: false` in frontmatter
   above to waive the validation gate — no badge needed at close time)

## Reviewer ladder

- Reviewer A: ...
- Reviewer B: ...
