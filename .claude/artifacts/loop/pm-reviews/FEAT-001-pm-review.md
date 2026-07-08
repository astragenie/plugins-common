---
id: PM-REVIEW-FEAT-001
feature: FEAT-001
reviewed_at: 2026-07-08
pm_customer_impact: 0.75
pm_effort_estimate: 0.5
pm_strategic_alignment: 0.9
pm_technical_risk: 0.65
pm_dependency_depth: 0.15
composite_priority: P0
autonomous_safe: true
---
# PM Review — FEAT-001

## Demand Assessment

- **Evidence:** Verified by direct file read: gepa-core/packages/gepa-core/src/store/file-store.ts:46 still calls 'TrialSchema.parse(trial)' (throws) and src/lock/file-lock-manager.ts:63 still has a bare 'throw err' inside acquire() -- Gate Zero (0a) is confirmed UNMET, exactly matching the 2026-07-08 architect addendum (plan section 8.1). Plan also cites dev-team 7 production Result importers, astramem 10 files importing errors.ts, runner 12 base-less error classes -- real cross-repo duplication of error taxonomies. packages/plugin-std/src/errors.ts and result.ts already exist (untracked, verified read) matching the plan's 'already scaffolded' claim.

## Scope Challenge

- **Scope notes:** AC as written mixes in-repo work (Gate Zero fix + gepa-core first-consumer proof, both doable inside plugins-common) with an out-of-repo AC ('astramem-plugin src/lib/errors.ts cut over'). astramemory-plugin is NOT a package in this monorepo (packages/ only has astramem-client, astramem-openclaw, gepa-core, plugin-std) and cannot be edited from this repo's autonomous loop. Rewrote ACs below to cover only the in-repo-buildable scope; the astramem-plugin cutover should be tracked as a companion FEAT filed in that repo's own backlog, not as a blocking AC here. effort_estimate (0.5, effort_points approx 5 on the Fibonacci band 0.45-0.60->5) reflects the in-repo scope only, below the effort_points>=8 decomposition-gate threshold (FEAT-168) so no proposed_slices needed. Grade history: none available (.claude/artifacts/loop/grades/ has only README/template) -- no weak dimensions identifiable. Lessons digest command (bun src/scripts/loop.mts lessons recent 5) is not present in this repo ('Module not found') -- proceeding without it per the anti-hallucination rule rather than fabricating a lesson. Cost analog: .claude/artifacts/crew/cost/ does not exist in this repo -- no cost analog available, per Framework 5 fallback.

## Scores

- customer_impact: 0.75
- effort_estimate: 0.50
- strategic_alignment: 0.90
- technical_risk: 0.65
- dependency_depth: 0.15

## Priority Derivation

composite_priority: P0
autonomous_safe: true
reasoning: P0: hard Gate Zero blocker unblocking the entire consolidation milestone, verified still unmet in live code today; technical_risk 0.65 lands in the 0.6-0.8 band (cross-module reach, establishes a cross-plugin contract) even though the Gate Zero diff itself is 2 files; effort re-scoped down from the plan's cross-repo estimate to reflect only plugins-common-buildable work.

## Risks

- Pre-mortem (two weeks later, review/validation failure): most likely cause is the safeParse/never-throws fix changing file-store.ts / file-lock-manager.ts call-site expectations elsewhere in gepa-core (a caller that relied on the throw to abort a batch) -- undetected because no existing test currently exercises 'malformed trial data' or 'lock contention' at these two call sites.
- Pre-mortem (merged and broke the loop -- rollback cost): NOT a simple git revert once gepa-core actually consumes plugin-std's PluginError/Result -- reverting file-store.ts / file-lock-manager.ts back to throwing requires re-auditing every caller updated to handle the new Result-returning signature, i.e. a coordinated multi-file rollback.
- Pre-mortem (coverage gap): no existing test asserts 'acquire() never throws under lock contention' or 'readTrials() returns a typed error instead of throwing on malformed JSON' -- exactly the gap AC-2/AC-4 below close; without them a regression reintroducing the throw would pass the existing suite silently.
- Cross-plugin contract risk: PluginError/Result becomes a shared base contract multiple repos will build on -- once astramem-plugin and others adopt it, changing base semantics later is a breaking, hard-to-reverse change (this is why technical_risk sits in the 0.6-0.8 band rather than the 0.3-0.5 band despite the Gate Zero diff itself being small).
