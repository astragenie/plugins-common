---
id: FEAT-008
status: done
priority: P2
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: []
slices: [SLICE-06]
derived_from: null
tags: ["concern:api-consistency", "area:plugin-std", "area:gepa-core"]
needs_contract: false
needs_ux: false
autonomous_safe: true
composite_priority: P2
pm_reviewed: manual-2026-07-08
started_at: 2026-07-08
slices_complete: [SLICE-06]
completed_at: 2026-07-08
---
## Description

`@astragenie/plugin-std` ships two contradictory infra-error conventions across the modules landed by
the stabilization milestone — a defect surfaced by the SLICE-02 review:

- **result.ts documented policy** (header): domain errors → `Result`, **infra errors → throw**.
- **jsonl.ts (SLICE-02)** and **http util (SLICE-03)**: follow the policy — throw `TransientError` on fs/network infra failure.
- **file-lock-manager.ts (SLICE-01, gepa-core consumer)**: DEVIATES — returns `err(TransientError)` for the same fs-failure class.

Both surfaces are declared "frozen at extraction", so the inconsistency is baked into the contract other
repos will adopt. A caller cannot know whether an infra failure arrives as a thrown `TransientError` or an
`err(TransientError)` without reading each function. Pick ONE policy and align all consumers before the
cross-repo migrations (runner/dev-team/astramem) start depending on either shape.

Decide via DEC: (a) throw-for-infra everywhere (align file-lock-manager to throw), or (b) Result-for-infra
everywhere (change jsonl/http to return `err`). Note: `acquire()`'s whole point in SLICE-01 was a
never-throws contract — option (a) would partially undo that, so this is a genuine design decision, not a
mechanical sweep.

## Acceptance criteria
- AC-1: A DEC records the chosen infra-error policy with rationale (throw vs Result), covering the never-throws-acquire tension.
- AC-2: All plugin-std modules (errors/result, jsonl, http) and their in-repo gepa-core consumers conform to the chosen policy; tests updated.
- AC-3: result.ts header documents the single policy unambiguously so future modules can't diverge.

Ref: SLICE-02 grade (Surprises/Followups), plan §8.

## Intake notes

Created via free-text intake (`/runner:intake "<text>"`). Priority is
unset — this FEAT has not been scored yet. Run `/runner:triage`
(PM scoring + `backlog pm-apply`) to score it before slicing.