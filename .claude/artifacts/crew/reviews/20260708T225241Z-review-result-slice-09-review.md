---
findings: "🔴:0,🟡:2,❓:0"
status: completed
decision: approved_with_notes
---
# Review Result: Review Result

- Created: 2026-07-08T22:56:05.162Z
- Reviewer: reviewer
- Decision: approved_with_notes
- Status: completed
- Summary: Staleness comparator, AC-3 FEAT-240 reproduction, DEC-002 throw/warn split, and version_uncomparable degrade-to-warning are all correctly implemented and well-tested (59/59 tests pass, clean tsc + biome); two non-blocking gaps found: the ADR's SLICE-3 multi-producer merge + collision detection is entirely unimplemented, and readManifestFile's malformed-JSON/schema-invalid branches are untested.
- Evidence Checked:
  - bun test: 59 pass
  - 0 fail
  - 121 expect() calls across 6 files. bunx tsc --noEmit: clean. bun run lint (biome): clean
  - 18 files. resolveName(src/read.ts:99-128): semver.lt(entry.version
  - expectedVersion) correctly fires stale only when entry OLDER (tests/read.test.ts:61-65 equal-boundary NOT stale
  - :54-59 newer NOT stale
  - :67-76 older IS stale — all three cases explicitly asserted). FEAT-240 dogfood round-trip (tests/read.test.ts:143-171) runs the REAL generateRegistry->readRegistry->resolveName pipeline (not just in-memory fixtures)
  - asserts found:true AND warning fires (no false-negative drop). readRegistry (src/read.ts:45-68) throws RegistryReadInvalidError for missing/unreadable/unparseable/schema-invalid manifests (infra
  - DEC-002); resolveName has no throw path for not-found/stale/uncomparable (all Result-shaped
  - domain
  - DEC-002). version_uncomparable (src/read.ts:110-125) is caught and degrades to a warning
  - never a throw
  - never a silent pass (tests/read.test.ts:84-100) — the version field is intentionally schema-unconstrained (schema/agents.schema.json: minLength 1 only
  - no semver pattern) per the ADR's own documented risk tradeoff
  - so a garbage version cannot mask staleness as a SILENT pass (it still produces a warning
  - just a different message) but does evade the specific stale_registry signal — documented residual risk
  - not a defect. Trust surface: readRegistry schema-validates every entry via validateAgainstSchema before any field is used (additionalProperties:false
  - name/sourcePlugin pattern ^[A-Za-z0-9][A-Za-z0-9._-]*$ blocking path traversal/shell metachars) — good defense in depth. not-found returns {found:false
  - warnings:[]} without throwing (tests/read.test.ts:49-52
  - :173-187)
  - correctly leaving the gate to the caller.
- Files Reviewed:
  - packages/plugin-registry/src/read.ts (new)
  - packages/plugin-registry/src/errors.ts (RegistryReadInvalidError added)
  - packages/plugin-registry/src/index.ts (exports)
  - packages/plugin-registry/tests/read.test.ts (new)
  - packages/plugin-registry/package.json + bun.lock (semver ^7.6.0 + @types/semver added)
- Test Adequacy: 9 tests added covering resolveName boundary cases (not-found, fresh, equal, stale, skill-lookup, uncomparable) plus a genuine generateRegistry->readRegistry->resolveName round trip reproducing FEAT-240; readRegistry's malformed-JSON and schema-validation-failure error branches (readManifestFile lines 55-66) have zero test coverage — only the missing-file branch is exercised.
- Risks: 1) [MEDIUM/HIGH-isolated] ADR SLICE-3 acceptance criteria (design doc lines 145-146, 255-262, 289-291, 315-321) commit this slice to a reader that globs+merges registry/<plugin>/*.json across MULTIPLE producers and detects/reports same-name collisions across differing sourcePlugin values. The delivered read.ts only loads ONE producer directory (readRegistry(dir)) — there is no merge function and no collision-detection code or test anywhere in the diff, and no descope note in the run brief/plan. This is additive (doesn't break delivered behavior) and low-risk to add later, but it is a documented, unmet deliverable of this exact slice, not a future companion-FEAT item. 2) [MEDIUM] readManifestFile has 4 distinct failure branches (missing/unreadable/unparseable-JSON/schema-invalid) but only the missing-file branch is tested — a regression in JSON-parse or schema-validation error handling would not be caught by this test suite. 3) [residual, non-blocking] version field is intentionally not semver-pattern-constrained in the committed schema, so a producer stamping a non-semver garbage version degrades the specific stale_registry signal to a generic version_uncomparable warning instead — still non-silent per AC-3's literal wording, but a caller that only checks for the string 'stale_registry' (rather than any non-empty warnings array) could miss it; worth a one-line callout in the reader's own doc comment or the consumer-facing contract note.
- Required Follow-up: Before closing FEAT-009 fully: (a) file a follow-up task for the multi-producer merge + collision-detection reader function the ADR commits SLICE-3 to (or explicitly amend the ADR/FEAT to descope it with a documented reason); (b) add 2-3 tests for readManifestFile's malformed-JSON and schema-invalid branches. Neither blocks merging this delta — both are additive, non-regressing follow-ups.

