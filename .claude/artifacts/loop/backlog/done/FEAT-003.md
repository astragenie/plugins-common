---
id: FEAT-003
status: done
closed: 2026-07-08
close_note: "No in-repo deliverable. PM verified @astragenie/astramem-client is already 0.2.0 with AstramemDaemonClient shipped IN this monorepo (packages/astramem-client). The only residual — runner-plugin bumps its pin 0.1.0->0.2.0 + decides DaemonClient adoption — is runner-repo work, filed as companion FEAT-240 in runner-plugin. Closed as satisfied-elsewhere."
priority: P2
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: []
slices: []
derived_from: docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md
tags: [stack:typescript, surface:package, concern:consolidation]
needs_contract: false
needs_ux: false
pm_customer_impact: 0.3
pm_effort_estimate: 0.15
pm_strategic_alignment: 0.55
pm_technical_risk: 0.15
pm_dependency_depth: 0.1
pm_composite_priority: P2
pm_autonomous_safe: false
pm_reviewed: 2026-07-08
autonomous_safe: false
triage_notes: "P2: real remaining value is low (80% already shipped, verified directly in this repo's own package.json and git log) and every stated AC item is out-of-repo (runner-plugin) work this repo cannot execute; keep in the backlog for visibility but do not autonomously dispatch until re-scoped or relocated."
---
## Description

**RE-SCORED M→S (plan §8.2): ~80% already shipped.** runner PR #362 already delegates
`memory-transport.mts:19` to `@astragenie/astramem-client` (`resolveWireProvider`/`rememberSilent`);
PR #380 / DEC-072 deleted `memory-bridge.mts`, retired the CLI-spawn fallback, and closed the
two-vocabulary `--type` split (Q4 done). This FEAT closes the residual only — it is NOT a fresh M migration.

**Residual scope:**
- Bump runner `package.json` astramem-client pin `0.1.0` → `0.2.0`.
- Decide whether runner consumes the new `AstramemDaemonClient` REST surface (0.2.0) or stays on the provider seam.
- Confirm CLI-spawn retirement is complete (no residual shell-out paths).

Note: dev-team pins astramem-client caret `^0.1.0` (not exact) and hasn't adopted 0.2.0 — align pin convention (plan §8.6).

## Acceptance criteria
- runner pins astramem-client 0.2.0; build + memory tests green.
- Explicit decision recorded (DEC) on AstramemDaemonClient adoption vs deferral.
- No remaining CLI-spawn memory paths in runner.

Ref: plan §1.3, §8.2, §8.6.

## Intake notes

Created via free-text intake (`/runner:intake "<text>"`). Priority is
unset — this FEAT has not been scored yet. Run `/runner:triage`
(PM scoring + `backlog pm-apply`) to score it before slicing.