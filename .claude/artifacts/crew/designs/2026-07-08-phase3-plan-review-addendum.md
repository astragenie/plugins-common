# Phase 3 Stabilization Plan — Review Addendum (2026-07-08)

Source plan: `docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md`
(built 2026-07-07). This addendum corrects the plan against repo state one day later.
It does not restate the plan; see the source doc for full candidate detail.

## Corroborated fresh findings (verified against source, 2026-07-08)

- `packages/gepa-core/packages/gepa-core/src/store/file-store.ts:46` — still
  `TrialSchema.parse(trial)` (throws). Gate Zero (0a) **not done**.
- `packages/gepa-core/packages/gepa-core/src/lock/file-lock-manager.ts:63` — still
  bare `throw err`. Never-throws `acquire()` contract **not honored**.
- `packages/plugin-std/package.json` + `src/errors.ts` + `src/result.ts` — already
  scaffolded and renamed from `plugin-kernel` (0b + #1 both physically done per
  `git status`), **ahead of** 0a in the plan's own dependency table (`1 | ... |
  Blocked by: 0a, 0b`).
- `runner-plugin/src/scripts/lib/memory-transport.mts:19` imports
  `_resetResolveCache, _setWireProvider, rememberSilent` from
  `@astragenie/astramem-client`; header cites FEAT-188/DEC-072, confirms CLI-spawn
  fallback retirement and `--type` unification already landed. `memory-bridge.mts`
  no longer exists in `runner-plugin/src/scripts/lib/`.
- `runner-plugin/package.json:29` pins `@astragenie/astramem-client: "0.1.0"`;
  `plugins-common/packages/astramem-client/package.json` is `0.2.0` — residual gap
  is a version bump + optional `AstramemDaemonClient` REST-surface adoption, not a
  transport migration.
- `astramemory-plugin/src/providers/{local,saas}.ts` — `fetchWithTimeout` now has
  6 call sites in `saas.ts` and 6 in `local.ts` (grew since the plan's "small and
  settled" characterization); `astramemory-plugin/package.json:32` pins
  `@astragenie/astramem-contracts: "1.2.0"` (external, astramem-local-owned wire
  schema package) — confirms concurrent churn in the same files #5 wants to extract
  from.
- `astramemory-plugin/src/lib/errors.ts` still defines its own
  `class DeterministicError extends Error` / `TransientError extends Error` — has
  not cut over to `plugin-std`'s `PluginError`-based taxonomy yet.
- `astramem-contracts` (repo: astramem-local) is a JSON-Schema/Zod/type package for
  wire contracts (atom/retrieval/sync/capture) — orthogonal concern to
  `plugin-std` (errors/Result/http policy); no design conflict, only a file-timing
  collision risk with candidate #5.

## Corrected critical path

1. Finish 0a now (gepa-core `file-store.put` → `safeParse`/Result,
   `LockManager.acquire` → never-throws via plugin-std) using the module that
   already exists — this is the missing proof-of-concept step, not new scope.
2. Re-score #3 down: CLI-spawn retirement, `--type` unification, transport
   delegation are shipped (PR #362/#380, DEC-072). Remaining scope is a semver
   bump (0.1.0→0.2.0) + a separate decision on `AstramemDaemonClient` REST-surface
   adoption.
3. #2 jsonl proceeds unaffected.
4. #5 http util: defer for astramem specifically (file-collision risk with
   astramem-contracts adoption in `local.ts`/`saas.ts`); gepa-core's
   `azure-openai` `linkSignal` half can extract alone, single-repo, no collision.
5. #4 frontmatter, #6 flags, #7 runGit, #8 loop.json — unaffected by fresh
   findings, proceed per original plan ordering (#6 additionally gated on #1
   being *actually consumed*, not merely published).

## Sequencing violation called out

`0b` (rename) and `#1` (errors+Result package) are done; `0a` (Gate Zero) is not.
The plan's own table blocks `#1` on `{0a, 0b}`. Shipping the module before its
designated proof consumer adopts it defeats the stated purpose of Gate Zero
("the target proves the convention before anyone else adopts it") — the taxonomy
is unvalidated against a real call site.

## Per-candidate disposition

| # | Candidate | Disposition | Reason |
|---|---|---|---|
| 1 | errors + Result | Keep, not closed | Code shipped but first-consumer commitment (gepa-core) unmet |
| 2 | jsonl utils | Keep | No fresh finding challenges it |
| 3 | astramem-client adoption (runner) | Re-scope down | ~80% already shipped via PR #362/#380/DEC-072; residual is a version bump |
| 4 | frontmatter | Keep | Unaffected, Q3 already decided |
| 5 | http client util | Defer (astramem half) | Seeds churned today (AbortSignal + astramem-contracts); collision risk |
| 6 | flags/config accessor | Keep, re-sequence | Gate on #1 being *proven*, not just published |
| 7 | runGit wrapper | Keep | Unaffected |
| 8 | loop.json schema | Keep deferred | Unaffected, still blocked on Q2 |

## astramem-plugin as plugin-std consumer

| Order | Adopt | Cost | Gate |
|---|---|---|---|
| 1 | errors + Result (#1) | Low — 10 call sites, same shape as seed | After Gate Zero actually proves the contract in gepa-core |
| 2 | jsonl utils (#2) | Low — ~4 call sites | After #2 ships; independent of (1) |
| 3 | http util (#5) | Medium — touches churning files | After astramem-contracts adoption in local.ts/saas.ts settles; do not parallelize |

Conflict with `astramem-contracts`: none in design (orthogonal concerns — wire
schema vs. error/transport policy); the only risk is textual/timing collision in
`local.ts`/`saas.ts`. Sequence http-util extraction strictly after the contracts
adoption lands in those two files.

Seam boundary to preserve: `astramem-client`'s `peerDependency` on
`@astragenie/astramem-plugin >=0.6.0` already encodes astramem as the seam's
producer/reviewer. astramem should be a plain (non-peer) consumer of `plugin-std`
— do not let `plugin-std` acquire a peer dependency back on astramem; that would
invert the pure-library boundary.

## Top 3 risks + cheapest mitigation

1. Convention-without-proof (plugin-std shipped ahead of Gate Zero) — mitigate by
   landing the 0a retrofit (few hours, already scoped) before any further
   candidate layers on top.
2. Concurrent-file collision (#5 vs astramem-contracts in local.ts/saas.ts) —
   mitigate by extracting only gepa-core's linkSignal half now; defer astramem's
   half until contracts work settles.
3. Stale-cost risk on #3 (scored as 1-2d M-effort; ~80% already merged) —
   mitigate by re-scoring with corrected inputs and replacing the execution-table
   row before anyone schedules against the stale estimate.
