---
id: FEAT-012
status: pending
priority: null
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: [FEAT-009]
slices: []
derived_from: .claude/artifacts/crew/reviews/20260708T225241Z-review-result-slice-09-review.md
tags: [area:plugin-registry, concern:completeness, concern:test-coverage]
---
## Description

Follow-up to FEAT-009 SLICE-3, capturing two non-blocking findings the SLICE-09 review raised
(`approved_with_notes`). SLICE-3 met AC-3 (single-producer reader + staleness warning) but under-delivered
against the SLICE-2 ADR's broader reader description, and left reader error-branches untested.

1. **Multi-producer merge + cross-plugin collision detection** (ADR SLICE-3 scope beyond AC-3):
   the reader currently loads a single `registry/<plugin>/` directory. The ADR (design doc lines 145-146,
   255-262, 289-291) commits the reader to merging `registry/<plugin>/*.json` across ALL producers and
   detecting same-name collisions across differing `sourcePlugin` values — the mechanism that actually
   catches two plugins claiming the same agent name. Not built; no descope note was recorded at the time.
2. **`readManifestFile` error-branch tests**: `packages/plugin-registry/src/read.ts` `readManifestFile`
   has 4 failure branches (missing / unreadable / unparseable-JSON / schema-invalid); only the missing-file
   branch is tested. Add the 3 missing.

## Acceptance criteria (draft — triage before slicing)
- AC-1: A `readAllRegistries(registryRoot)` (or equivalent) merges every producer's agents.json/skills.json
  into one resolvable view.
- AC-2: Resolving a name present under two different `sourcePlugin` values surfaces a `name_collision`
  warning/error (decide throw-vs-warn per DEC-002 — a collision is arguably a domain outcome → warn),
  with a test reproducing two producers claiming the same agent name.
- AC-3: `readManifestFile`'s unreadable, unparseable-JSON, and schema-invalid branches each have a test
  asserting the correct DeterministicError.

## Intake notes

Created directly as a follow-up stub (not via free-text intake). Priority unset — run `/runner:triage`
(PM scoring) before slicing.
