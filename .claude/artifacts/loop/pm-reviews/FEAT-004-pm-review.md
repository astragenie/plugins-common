---
id: PM-REVIEW-FEAT-004
feature: FEAT-004
reviewed_at: 2026-07-08
pm_customer_impact: 0.65
pm_effort_estimate: 0.4
pm_strategic_alignment: 0.75
pm_technical_risk: 0.6
pm_dependency_depth: 0.15
composite_priority: P1
autonomous_safe: true
---
# PM Review — FEAT-004

## Demand Assessment

- **Evidence:** Plan quote (section 1.4): runner frontmatter.mts has '~38 importers verified' (plan section 8.2) and a 'documented CRLF bugfix' -- a real, recurring bug class (LF-only regexes on a Windows-first ecosystem; this session's own environment is Windows 11, reinforcing relevance). dev-team has '11 diverged parsers, 11 return shapes' per the plan, meaning the duplication is not just line-count but behavioral divergence.

## Scope Challenge

- **Scope notes:** Cross-repo pattern again: AC as written requires migrating runner's 36 importers + 5 rogue regexes and dev-team's 11 diverged parsers -- both out-of-repo (runner-plugin, dev-team are not packages in this monorepo). Rewrote ACs below to cover only the in-repo-buildable core (parse/serialize extraction + CRLF/LF/BOM test matrix), which is the actual plugins-common deliverable. This re-scoping is why effort_estimate (0.4, effort_points approx 3 on the Fibonacci band 0.30-0.45->3) sits well below the plan's full M-effort estimate (~2 days including cross-repo migration) -- if the cross-repo migration were folded back into this FEAT's scope, effort_points would very likely cross the 8-point decomposition-gate threshold (FEAT-168) and require a proposed_slices split; flagging this explicitly so a later re-scope doesn't silently skip the gate. Stability caution from plan section 8.2 carried forward: seed churned 10x/3mo, last touch 2 days before the plan date -- verify at migration time that churn was in runner-specific key helpers (left behind) and not the core (extracted).

## Scores

- customer_impact: 0.65
- effort_estimate: 0.40
- strategic_alignment: 0.75
- technical_risk: 0.60
- dependency_depth: 0.15

## Priority Derivation

composite_priority: P1
autonomous_safe: true
reasoning: P1: genuine Windows-relevant recurring bug class with strong cross-repo call-site evidence, but technical_risk sits at the 0.6 band edge (schema/data-shape-adjacent churn on a stability-flagged seed) rather than lower; effort re-scoped to in-repo core extraction only, explicitly excluding the cross-repo consumer migration that made the plan's original M-estimate an epic.

## Risks

- Pre-mortem (review/validation failure two weeks out): most likely cause is the CRLF/LF/BOM normalization changing byte-for-byte round-trip output for an edge case not in the new test matrix (e.g. mixed CRLF+LF within one file, or a BOM combined with a CRLF fence) -- the seed's own churn history (10x/3mo) suggests exactly these edge cases keep surfacing.
- Pre-mortem (rollback cost if merged and broke the loop): if the core is not yet consumed by any in-repo caller, rollback is a plain git revert; risk escalates only once a future FEAT migrates callers onto it, at which point rollback needs re-auditing those call sites -- not a concern for this FEAT's own scope but worth naming since frontmatter sits upstream of every backlog file parse.
- Pre-mortem (coverage gap): no existing test in this repo exercises a BOM-prefixed frontmatter file or an unterminated '---' fence -- AC-1/AC-2 below close this; without them a regression that mis-parses a BOM file would not be caught by any current suite.
- Cascade risk: frontmatter parsing sits upstream of every consumer that reads a backlog/FEAT/SPEC file -- a corrupted parse/serialize core (even scoped to plugin-std only) would silently mis-parse frontmatter for any future in-repo consumer, which is why technical_risk is held at the top of the 0.3-0.5 boundary (0.6) rather than lower.
