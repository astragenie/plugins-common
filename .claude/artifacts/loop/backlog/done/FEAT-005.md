---
id: FEAT-005
status: done
priority: P1
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: []
slices: [SLICE-03]
derived_from: docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md
tags: ["stack:typescript", "surface:library", "surface:package", "concern:refactor", "concern:shared-code", "concern:api-contract", "area:gepa-core", "area:plugin-std"]
needs_contract: true
needs_ux: false
pm_customer_impact: 0.5
pm_effort_estimate: 0.3
pm_strategic_alignment: 0.7
pm_technical_risk: 0.35
pm_dependency_depth: 0.1
pm_composite_priority: P1
pm_autonomous_safe: true
pm_reviewed: 2026-07-08
autonomous_safe: true
triage_notes: "P1: fixes a real, currently-live hang-forever bug (verified: no timeout in generic-openai/groq) at low cost, and is the only FEAT in this batch already scoped entirely within this repo by the plan's own architect-reviewer split -- no re-scoping required, unlike the other six."
started_at: 2026-07-08
slices_complete: [SLICE-03]
completed_at: 2026-07-08
---
## Description

Extract a thin transport-policy http util into `@astragenie/plugin-std`: `fetchWithTimeout` / `fetchJson`
(timeout via `AbortSignal`, external-signal linking, typed JSON-parse failure, optional retry). NOT a client
class hierarchy — consumers keep their own request/response typing. Candidate #5 (m3 fix). Kills the
no-timeout bug class (generic-openai/groq currently hang forever).

**SPLIT per plan §8.2 (stability gate was wrong — astramem seeds churning TODAY):**
- **Now:** extract gepa-core `azure-openai` `linkSignal` half (`index.ts:205-210`) — single-repo, zero collision.
- **DEFER:** astramem `local.ts`/`saas.ts` `fetchWithTimeout` half — mid-churn adopting `astramem-contracts`
  + threading `AbortSignal`. Extract only after that work settles. Do NOT parallelize the two.

**Boundary note (plan §8.3):** `@astragenie/astramem-contracts` (wire-shape package, restricted registry) is
orthogonal (wire-shape vs transport-policy) — no design conflict, but same-file collision risk. Keep separate.

**Consumers:** gepa-core 5 judge providers, astramem local/saas + wire-probe (deferred), dev-team langfuse-emit, astramem-client health probes.

## Acceptance criteria
- AC-1: Given gepa-core's azure-openai linkSignal pattern (packages/gepa-core/src/providers/azure-openai/index.ts, timeout-via-AbortSignal with external-signal linking), When @astragenie/plugin-std ships fetchWithTimeout / fetchJson, Then the module exports a timeout-via-AbortSignal helper with external-signal linking matching that pattern, with a unit test asserting the returned signal aborts when either the timeout or an external signal fires.
- AC-2: Given packages/gepa-core/src/providers/generic-openai/index.ts and packages/gepa-core/src/providers/groq/index.ts currently issue requests with NO timeout (plan §1.5 'no timeout at all'), When migrated to plugin-std's fetchWithTimeout, Then a request that never receives a response aborts after the configured timeout instead of hanging forever — verified by a test using a never-resolving mock fetch and a short timeout.
- AC-3: Given the plan's split (§8.2: astramem's local.ts/saas.ts half is mid-churn adopting astramem-contracts), When this FEAT ships, Then astramem's half is NOT touched — verified by zero changes to any astramem-owned path, and the deferral condition recorded here / in a DEC (resume only after astramem-contracts settles).
- AC-4: Given plugin-std's frozen-API convention (FEAT-002 precedent), When fetchWithTimeout / fetchJson ship, Then all 5 gepa-core judge providers (azure-openai, gemini, generic-openai, groq, ollama) import the shared helper, and gepa-core's existing provider tests pass unchanged except for the new timeout on generic-openai/groq.

Ref: plan §1.5, §8.2, §8.3.

## Intake notes

Created via free-text intake (`/runner:intake "<text>"`). Priority is
unset — this FEAT has not been scored yet. Run `/runner:triage`
(PM scoring + `backlog pm-apply`) to score it before slicing.