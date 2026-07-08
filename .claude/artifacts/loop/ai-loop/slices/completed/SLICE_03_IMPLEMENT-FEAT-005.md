---
id: SLICE-03
title: Implement FEAT-005
status: completed
feature: FEAT-005
phase: null
priority: P1
target_release: null
requires_validation: true
risk: medium
created: 2026-07-08
updated: 2026-07-08
completed_at: 2026-07-08
---
# SLICE-03: Implement FEAT-005

Implements FEAT-005. See [feature file](../../../backlog/in-progress/FEAT-005.md) for product context.

## Objective

Extract a thin transport-policy http util into `@astragenie/plugin-std`: `fetchWithTimeout` / `fetchJson`

## In scope

- bullet 1
- bullet 2

## Out of scope

- bullet 1

## Acceptance criteria

- [x] AC-1: Given gepa-core's azure-openai linkSignal pattern (packages/gepa-core/src/providers/azure-openai/index.ts, timeout-via-AbortSignal with external-signal linking), When @astragenie/plugin-std ships fetchWithTimeout / fetchJson, Then the module exports a timeout-via-AbortSignal helper with external-signal linking matching that pattern, with a unit test asserting the returned signal aborts when either the timeout or an external signal fires.
- [x] AC-2: Given packages/gepa-core/src/providers/generic-openai/index.ts and packages/gepa-core/src/providers/groq/index.ts currently issue requests with NO timeout (plan §1.5 'no timeout at all'), When migrated to plugin-std's fetchWithTimeout, Then a request that never receives a response aborts after the configured timeout instead of hanging forever — verified by a test using a never-resolving mock fetch and a short timeout.
- [x] AC-3: Given the plan's split (§8.2: astramem's local.ts/saas.ts half is mid-churn adopting astramem-contracts), When this FEAT ships, Then astramem's half is NOT touched — verified by zero changes to any astramem-owned path, and the deferral condition recorded here / in a DEC (resume only after astramem-contracts settles).
- [x] AC-4: Given plugin-std's frozen-API convention (FEAT-002 precedent), When fetchWithTimeout / fetchJson ship, Then all 5 gepa-core judge providers (azure-openai, gemini, generic-openai, groq, ollama) import the shared helper, and gepa-core's existing provider tests pass unchanged except for the new timeout on generic-openai/groq.

## Done When

- all acceptance criteria PASS with evidence per `01-loop-control/EVIDENCE_RULES.md`
- build / test commands per `.claude/loop.json` pass
- feature FEAT-005 moved from `in-progress/` to `done/`
- Crew `final-synthesis` artifact written
- (pure refactors / mechanical changes: set `requires_validation: false` in frontmatter
   above to waive the validation gate — no badge needed at close time)

## Reviewer ladder

- Reviewer A: ...
- Reviewer B: ...
