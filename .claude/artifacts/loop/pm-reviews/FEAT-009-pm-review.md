---
id: PM-REVIEW-FEAT-009
feature: FEAT-009
reviewed_at: 2026-07-08
pm_customer_impact: 0.65
pm_effort_estimate: 0.65
pm_strategic_alignment: 0.85
pm_technical_risk: 0.9
pm_dependency_depth: 0.6
composite_priority: P1
autonomous_safe: false
---
# PM Review — FEAT-009

## Demand Assessment

- **Evidence:** Verified cross-repo, not hypothetical, and it has already happened TWICE. (1) runner-plugin CLAUDE.md (C:/work/mega/runner-plugin/CLAUDE.md, 'CI gates' §5): 'blocks a crew:<name> / runner:<name> dispatch instruction whose <name> doesn't resolve to a real agent... astragenie/runner-plugin#371 -- a phantom crew:builder shipped in installed loop rules and broke consumer orchestrators.' (2) runner-plugin's own closed FEAT-240 (C:/work/mega/runner-plugin/.claude/artifacts/loop/backlog/done/FEAT-240.md, P1 bug, filed and closed same day 2026-07-08): 'Crew (dev-team) renamed its review agent crew:inspector -> crew:reviewer... runner-plugin still emits... phantom subagent... validate-agent-refs.mts:129 allowlists the bare name "inspector", so the CI gate that was built to catch exactly this class... does NOT flag it -- cross-plugin rename gap.' Stakeholder: the runner-plugin loop maintainer (whoever has to file an emergency P1 the day a crew rename ships) and, more broadly, every plugin consuming crew/dev-team agent names cross-namespace. Current workaround: a hand-maintained, frozen allowlist Set in validate-agent-refs.mts -- proven NOT tolerable, because it produces a false negative (CI stays green) rather than a false positive, which is the worst failure mode for a gate. Frequency: two independent occurrences already on record in this one downstream repo (inspector->reviewer, builder->*-dev) -- a recurring class, not an edge case.

## Scope Challenge

- **Scope notes:** Weak dimensions (plugins-common .claude/artifacts/loop/loop-snapshot.md, last-5-grade averages): architecture_quality 0.704, observability 0.574, production_readiness 0.668, security 0.64, product_completeness 0.67 are all below the 0.80 bar (only reliability 0.862 and test_confidence 0.884 clear it). ACs below include a dedicated observability AC (AC-4) and security AC (AC-5) targeting the two weakest dimensions directly; architecture_quality/production_readiness/product_completeness are addressed indirectly via the schema-validation and staleness ACs (AC-1/AC-3) but a future --deep pass should verify those land as explicit test coverage, not just AC text. Effort calibration (Framework 5): closest analogs are FEAT-004 (frontmatter parse/serialize core) and FEAT-007 (runGit spawn wrapper) -- both 'new pattern, single-package extraction' work. FEAT-007's own single-repo cost report (.claude/artifacts/crew/cost/20260708T174501Z-cost-report-slice-feat007-slice05.md) was $17.48 / ~19min for a slice scoped ENTIRELY inside plugins-common with zero cross-repo publish contract. FEAT-009 cannot be scoped that cheaply: unlike FEAT-004/007 (which produce a library other repos import at their own pace), FEAT-009's stated goal only closes the FEAT-240 failure class once crew AND runner actually consume a published manifest -- that requires designing and shipping a NEW cross-repo publish/versioning contract, which has no cost analog in this repo's history (bumping effort above the FEAT-004/007 band; 'no cost analog' for the publish-contract portion specifically). Scope challenge (Framework 2): per the FEAT-004/FEAT-007 grade lessons' own established pattern ('Companion FEATs (out of repo)'), this FEAT-009 is re-scoped to what plugins-common can actually build and ship itself -- registry JSON Schema, a local generator/reader library, and an architect-level publish-model ADR. Actually wiring crew (dev-team) to GENERATE and publish its manifest, and wiring runner-plugin's validate-agent-refs.mts to CONSUME the published registry instead of its local allowlist Set, are out-of-repo changes that must be filed as companion FEATs in those repos' own backlogs -- plugins-common's autonomous loop cannot edit dev-team or runner-plugin source. Overlap check: no existing FEAT in done/ or pending/ covers a name registry; closest sibling pattern is @astragenie/astramem-client (cited by the FEAT author itself as the shared-seam precedent) and packages/plugin-std's parseFrontmatter/DeterministicError, which the generator should reuse rather than re-implement.

## Scores

- customer_impact: 0.65
- effort_estimate: 0.65
- strategic_alignment: 0.85
- technical_risk: 0.90
- dependency_depth: 0.60

## Priority Derivation

composite_priority: P1
autonomous_safe: false
reasoning: P1, autonomousSafe=false: strategically core to plugins-common's own stated mission (shared cross-plugin kernel, README explicitly frames it as the astramem-client shared-seam pattern) and backed by two independently verified, already-occurred incidents (not speculative demand) -- but technical_risk sits in the 0.9-1.0 band because this establishes a NEW cross-plugin contract with a genuinely undecided publish/versioning design (push vs pull, staleness handling), which is exactly the 'unknowns needing a spike' criterion; effort_estimate 0.65 maps to 8 Fibonacci points (FEAT-167 band 0.6<=x<0.85), tripping the FEAT-168 decomposition gate, satisfied below via proposedSlices (sum=13pts) that scope plugins-common's own buildable slices and explicitly defer producer (crew/dev-team) and consumer (runner-plugin) migration to companion FEATs filed in those repos, matching this repo's own established FEAT-004/FEAT-007 precedent. Recommend an architect pre-flight (runner:architect) on the publish-model decision (SLICE-2 below) before any builder starts SLICE-1.

## Risks

- Pre-mortem Q1 (two weeks later, slice fails review/validation -- most likely cause): the push-vs-pull publish model is undecided (crew CI job pushes its generated manifest into plugins-common on release? or plugins-common polls/pulls at publish time?) -- a builder guessing at this without an architect ADR first would very likely produce a design a reviewer bounces for not handling multi-plugin-source-of-truth conflicts or release-ordering races.
- Pre-mortem Q2 (merged and broke the loop -- what does rollback actually require): NOT revert-only once any consumer (runner's validate-agent-refs.mts) actually switches from its local Set to reading the published registry -- that is a cross-plugin contract change (rubric 0.9-1.0 band); reverting the registry format after adoption requires coordinated changes in at least two other repos' CI, not a single git revert in plugins-common.
- Pre-mortem Q3 (which existing test would NOT catch a regression here): no existing test in this repo (or in runner-plugin's validate-agent-refs.test.mts, per grep) exercises a stale/unregenerated registry being silently trusted -- this is exactly the FEAT-240 failure shape (stale allowlist entry masking a real rename) reproduced one layer up in a generated-manifest form; AC-3 below closes this specific coverage gap.
- Cascade risk: this FEAT explicitly targets the dispatch-integrity class of bug (agent-name resolution feeding CI gates and, transitively, autonomous-loop dispatch decisions in consumer repos) -- a wrong or stale registry entry doesn't just fail one build, it can let a phantom-agent dispatch silently pass CI in every downstream plugin that adopts the registry, the same cascade FEAT-240 and #371 already demonstrated twice.
- Injection-defense note: the FEAT-009 body and linked context contained no embedded imperative instructions to obey (no 'ignore prior scoring rules' or similar) -- scoring proceeded normally on the frameworks above; noting the absence explicitly per the injection-defense contract.
