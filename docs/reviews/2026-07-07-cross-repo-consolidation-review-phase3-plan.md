# Cross-Repo Consolidation Review — Phase 3 Plan

> Built 2026-07-07 from Phase 2 findings. Scoring per prompt:
> `Priority = (Impact × Frequency) / Migration Cost`, Risk as tie-breaker/veto,
> all axes 1–5. ≥2 mature call sites (or accepted DEC/ADR) required per candidate;
> everything else is on the do-NOT-extract list.

---

## 1. Ranked extraction / adoption plan

| # | Candidate | I | F | C | Risk | Priority | Effort |
|---|---|---|---|---|---|---|---|
| 1 | `plugin-std`: errors + Result | 4 | 3 | 1 | low | **12** | S |
| 2 | `plugin-std`: jsonl utils | 3 | 4 | 1 | low | **12** | S |
| 3 | astramem-client adoption in runner-plugin | 5 | 4 | 2 | med | **10** | M |
| 4 | `plugin-std`: frontmatter | 4 | 5 | 2 | med | **10** | M |
| 5 | `plugin-std`: http client util | 3 | 4 | 1.5 | low-med | **8** | S |
| 6 | `plugin-std`: flags/config accessor | 4 | 3 | 2 | med | **6** | M |
| 7 | `plugin-std`: `runGit` spawn wrapper | 2 | 3 | 1 | low | **6** | S |
| 8 | `loop.json` schema package | 4 | 3 | 3 | high | **4** | L |

Formula kept honest: the strategically biggest item (#3) is adoption of an existing
package, so its migration cost drags it below two trivially cheap S-sized wins. That is
correct — ship #1/#2 while #3's landing chain is coordinated.

**Operator goal → candidate mapping** (stated 2026-07-07: "reuse shared classes like
memory providers, httpclient etc."):

| Shared class wanted | Delivered by | Notes |
|---|---|---|
| Memory providers (`MemoryProvider`/`WireProvider` types + resolution) | **#3** (astramem-client adoption) | The package already exports the provider types dev-team compiles against (`astramem-provider.ts:15` imports `type WireProvider`). Runner's hand-typed `AstramemProvider` interface dies at adoption. No new package needed — the class reuse IS the adoption. |
| HTTP client | **#5** (http client util) | Thin transport-policy wrapper (timeout/abort/JSON), not a client class hierarchy — evidence shows the duplication is in policy (timeouts, cancellation), not in request modeling. |
| Error classes | **#1** (errors + Result) | `PluginError` base + `Transient`/`Deterministic` taxonomy. |
| Feature toggles | **#6** (flags/config accessor) | Pre-declared merge of the two features-service registries. |

### 1.1 `plugin-std` — errors + Result (S)

- **Siting**: repurposed `plugin-kernel` renamed `@astragenie/plugin-std` (see § Open
  questions Q1) — library semantics, importable piecemeal, no lifecycle.
- **Seed**: dev-team `scripts/lib/result.ts` (policy header verbatim) + astramem
  `src/lib/errors.ts` taxonomy (`DeterministicError`/`TransientError`), merged per
  Phase 2 § 4a sketch.
- **Call sites**: dev-team 7 production Result importers; astramem 10 files import
  errors.ts; runner has 12 base-less error classes and a dead `result.mts` to replace;
  gepa-core has zero classes and needs them (B1). ≥2 mature call sites: yes.
- **Principles**: removes duplication (3 independent taxonomies), improves API
  stability (shared `code`/`transient` contract), reduces maintenance cost.
- **Ownership**: plugins-common maintainers define; consuming repos may PR new
  subclasses but not change base semantics.
- **Effort S; regression low** (additive — old classes migrate per-file); depends on
  nothing; tests: port dev-team's result tests + new base-class tests.
- **Stability gate**: seeds stable (result.ts churn ~0; errors.ts small and settled).
- **First consumer commitment**: fix B1 inside plugins-common itself (gepa-core
  `file-store.put()`, `LockManager.acquire()`) using the new module — the target
  proves the convention before anyone else adopts it.

### 1.2 `plugin-std` — jsonl utils (S)

- **Seed**: runner `src/scripts/lib/jsonl-append.mts` (119 LOC, 8 importers, **1 touch
  in 3 months — most stable candidate found**). Add `readJsonlSafe`-style guarded
  reader (seed: gepa-core `file-store.ts:13-31`) + tail-read (seed: dev-team
  `jsonl.mjs:16-55`) + opt-in rotation (seed: astramem `log.ts`).
- **Call sites**: runner 8 canonical + 8 rogue; dev-team 10 rogue appends + 5 tail-read;
  astramem 4; gepa-core 2. Four repos. ≥2 mature: overwhelmingly.
- **Principles**: removes duplication; kills the two-swallow-disciplines defect (M2) by
  making torn-line counting the default.
- **Ownership**: plugins-common; API = append/appendBatch/readSafe/tail/rotate, frozen
  at extraction.
- **Effort S; regression low**; no deps; tests: runner's existing jsonl tests port over.

### 1.3 astramem-client adoption in runner-plugin (M) — B2 fix

- Not an extraction — a migration to an existing package. Replace runner's three
  transports (`memory-transport.mts` dynamic import, `memory-bridge.mts` CLI spawn,
  hand-typed interfaces) with `resolveWireProvider()`/`rememberSilent`/`recallSilent`.
- **Call sites**: 14 runner files touch astramem; dev-team already proves the pattern
  (astramem-provider.ts "never shells the CLI" header).
- **Principles**: clarifies ownership, improves version compatibility (compile-time
  types instead of "not compiled against"), removes duplication.
- **Ownership**: astramem-client API owned by plugins-common + astramem plugin authors;
  runner consumes, does not fork.
- **Effort M; regression med** — memory transport is FEAT-188 S1b work landed days ago
  (#357/#361) and churning; the CLI-spawn fallback semantics (fire-and-forget, two-
  vocabulary `--type` split, `memory-bridge.mts:17-32`) must be preserved or explicitly
  retired via DEC.
- **Dependencies**: coordinate with the in-flight astramem-client landing chain
  (2026-07-07) — this is that chain's runner leg, not a parallel effort.
- **Stability gate**: astramem-client itself is young (0.1.0, 2 touches) but IS the
  designated seam by decision; gate waived per accepted-decision clause.
- **Windows note**: consume via npm registry exactly like dev-team (`.npmrc` scope
  override, sha512 tarball in lockfile) — this dodges the Bun `file:`-dep EPERM
  junction problem entirely.

### 1.4 `plugin-std` — frontmatter (M) — M1 fix

- **Seed**: runner `src/scripts/lib/frontmatter.mts` (313 LOC, fan-in 36, documented
  CRLF bugfix).
- **Call sites**: runner 36 importers + 5 rogue regexes; dev-team 11 diverged parsers.
  Two repos, ~50 sites. astramem has none (stays out).
- **Principles**: removes duplication; eliminates a recurring bug class (LF-only
  regexes on a Windows-first ecosystem).
- **Effort M; regression med** — dev-team's 11 parsers have 11 return shapes; migration
  is per-file adaptation, not find-replace. Tests: runner's frontmatter tests port;
  add CRLF/LF/BOM matrix cases.
- **Stability gate — flagged**: seed churned 10×/3mo, last touch 2 days ago. Mitigation:
  extract the parse/serialize core only, pin the API, leave runner-specific key helpers
  (backlog frontmatter conventions) in runner. If churn is in those helpers (verify at
  migration time), the core is stable; if churn is in the core, defer one month.

### 1.5 `plugin-std` — http client util (S) — m3 fix

- **Shape**: one `fetchJson(url, opts)` / `fetchWithTimeout` helper — timeout via
  `AbortSignal`, external-signal linking, JSON parse with typed failure, optional
  retry policy. NOT a full HTTP client class — a thin policy wrapper over native fetch.
- **Seeds**: astramem `fetchWithTimeout` (`src/providers/local.ts:62-69`, duplicated
  verbatim in `saas.ts:80-87` with a comment admitting "no shared dependency per Track A
  scope") + gepa-core azure-openai's `linkSignal` pattern (`azure-openai/index.ts:205-210`).
- **Call sites**: gepa-core's 5 judge providers (three different timeout idioms, one —
  generic-openai/groq — with **no timeout at all**), astramem local+saas providers,
  astramem `wire-probe.ts`, dev-team `langfuse-emit.ts` (bespoke raw fetch ×4 endpoints),
  astramem-client health probes. Three repos + the workspace itself. ≥2 mature: yes.
- **Principles**: removes duplication; eliminates the no-timeout bug class (m3);
  standardizes cancellation semantics.
- **Ownership**: plugins-common. Consumers keep their own request/response typing —
  the util owns transport policy only.
- **Effort S; regression low-med** — adding a timeout to generic-openai/groq is a
  deliberate behavior change (currently hangs forever); everything else is
  semantics-preserving. Tests: port astramem's provider-contract timeout cases.
- **Stability gate**: pattern (fetch + AbortSignal) is platform-stable; seeds are small
  and settled.

### 1.6 `plugin-std` — flags/config accessor (M) — M4/M5 fix

- **Seed**: gepa-core's zod-with-defaults mechanism + the registry semantics of
  runner/dev-team `features-service` (whose header pre-declares this merge,
  `features-service.mts:12-14`). Accessor contract per Phase 2 § 4c: unknown key →
  loud, explicit-disable ≠ absent, deprecated-alias always logged.
- **Call sites**: 2 registries + 2 flag-lite mirrors + 8/11 registered flags + the
  24/53 ad-hoc chain reads that migrate opportunistically.
- **Principles**: removes duplication (parity-test-synced mirrors die), reduces
  maintenance cost, clarifies ownership.
- **Effort M; regression med** — flag semantics guard live behavior (hooks); migrate
  registry-by-registry with parity tests kept green until cutover. Depends on #1
  (errors) for its failure mode.

### 1.7 `plugin-std` — `runGit` wrapper (S)

- **Seed**: dev-team `briefing/git.ts:51-58` (byte-identical twin in
  `branch-cleanup.ts` dies at extraction).
- **Call sites**: dev-team 3 impls; runner 29 raw git spawn sites across 12 files
  (migrate opportunistically, not big-bang). Principles: removes duplication.
- **Effort S; regression low**. Scope guard: `runGit(args, opts) → {ok, stdout, stderr,
  status}` ONLY — no worktree logic, no policy (see do-NOT list).

### 1.8 `loop.json` schema package (L) — M3/H1 fix — decide ownership first

- **Shape**: one zod schema + typed accessor for `.claude/loop.json`, consumed by
  runner (16 `resolveConfig` callers + 13 bypass sites) and dev-team (4 readers, 3
  partial schemas die).
- **Principles**: improves version compatibility, removes duplication, clarifies
  ownership — this converts the mirror-by-comment contract (H3) into code.
- **Effort L; regression HIGH** — the schema churns with every runner feature; a
  published package adds a release step to every config change. Mitigations: schema
  package versions independently; dev-team pins minor; unknown-keys pass through
  (open validation) so runner can extend ahead of the package.
- **Blocked on Q2** (ownership). Do not start before #1–#6 land.

---

## 2. Do-NOT-extract list

| Candidate | Why not |
|---|---|
| semver compare (`compareSemver`) | One mature implementation, one repo, 4 call sites. Used-once util. |
| markdown table/section renderers | Every implementation is private with 1 internal call site; shapes differ per artifact. Repo-specific presentation, not a util. |
| worktree managers (runner ×2) | Churning, policy-heavy (merge/preflight/prune semantics are loop-specific). Intra-runner dedup of the two impls is worthwhile — inside runner. |
| astramem selector/providers internals | Plugin-owned domain; every file churned within the last 6 days; astramem-client is already the sanctioned boundary. |
| `gepa.config.json` schema | Single consumer ecosystem-wide (dev-team via gepa-core); just had a live schema bug (`de7dc45`); churning. |
| CLI arg-parsing helpers | 4 hand-rolled loops in astramem, more elsewhere — but each is ~35 LOC and repo-CLI-specific; a shared parser is anticipated-future-reuse, not current duplication of one shape. |
| hook shell shims (astramem ×3, 90% identical) | Intra-repo dedup (parameterize one shim). Not cross-repo. |
| plugin-kernel docblock scope (workflow-state machine, ID registry, event spine) | Anticipated future reuse with zero implementations and a churning source (`workflow-state.ts` 11×/3mo). Violates the no-hypotheticals rule as written. Revisit per-piece when the source stabilizes. |
| artifact-path resolution as a shared package | The namespaces are plugin policy (`loop/` vs `crew/`). The real fixes are per-repo: adopt own `paths` module (runner: 34 rogue files; dev-team: create one, 36 rogue files) and put runner's writes into `.claude/artifacts/crew/**` behind a crew CLI verb or schema contract (Phase 2 rule 4). |

---

## 3. Versioning strategy

**npm registry (`@astragenie` scope), independent per-package versions.** Evidence:

- dev-team already consumes astramem-client + gepa-core via registry with an `.npmrc`
  scope override and sha512-locked tarballs — proven working on this Windows/Bun stack
  with **zero** `file:`/`link:` junction workarounds.
- Observed cadence is wildly asymmetric (gepa-core 0.1.0→0.7.0 in 11 days vs
  astramem-client 2 touches total): lockstep would force pointless consumer churn.
- `file:`/`link:`/`workspace:` cross-repo consumption is ruled out by the Bun-Windows
  EPERM constraint; junctions raise per-machine install friction the review prompt
  flags as migration risk.

Consumers pin caret on minor (`^0.x` semantics: pin exact while 0.x, per bun behavior —
dev-team pins gepa-core exact at `0.7.0` already, follow that). Keep gepa-core's
`check-semver.ts` export-diff gate; add it to plugin-std.

---

## 4. If we started today (anti-anchoring)

Smallest package graph for these four repos, ignoring history:

1. **`astramem-client`** — the memory seam. (Exists. Correct.)
2. **`plugin-std`** — errors/Result, jsonl, frontmatter, http client util,
   flags/config accessor, runGit. Pure library, no lifecycle, piecemeal imports.
   (Does not exist; plugin-kernel occupies its slot as an empty scaffold — Q1 decision:
   rename/repurpose it into this.)
3. **`gepa-core`** — GEPA domain only: trial store, scorers, judges, pareto, drift.
   (Exists, but carries two generic-infra modules — lock manager, budget meter — that
   belong in plugin-std once stable.)

Not in the greenfield graph: **plugin-kernel** (framework ambitions, no code — its two
real ideas are "shared locks" [already shipped in gepa-core] and "shared workflow-state"
[source too unstable to move]); a **loop.json schema package** *would* be in the
greenfield graph as part of runner's public surface, which is why it survives as
candidate #7 despite its cost.

Highest-value differences vs reality: (a) plugin-kernel's slot should be plugin-std —
rename/repurpose rather than implement the docblock; (b) gepa-core's boundary should be
frozen now so infra stops accreting there; (c) the ecosystem's shared contracts that
today live in prose (halt-badges registry, upstream-requests, mirror-by-comment
modules) belong in typed packages exactly to the extent they are already consumed by
two repos — no further.

---

## 5. Sequencing

1. **Gate zero**: fix B1 inside plugins-common (error contracts in gepa-core) + adopt
   conventions doc — the target stops being the worst-disciplined repo before receiving
   code.
2. #1 errors/Result + #2 jsonl (S each, independent, parallelizable).
3. #3 astramem-client runner adoption — coordinate with the live landing chain.
4. #4 frontmatter (Q3: decided, extract now, API pinned), #5 http util, #6 flags,
   #7 runGit.
5. #8 loop.json schema — only after Q2 resolved and #1–#6 prove the pipeline.
6. Per-repo cleanups that fall out (not plugins-common work): delete runner's 51 dead
   exports + zombie codemod + hardcoded hero-crew path (B3); dedupe astramem's bin/lib
   twins; dev-team adopts its own artifact-paths module.

## 6. Execution table with ETAs

Effort = agent-assisted work incl. tests + review + release. Elapsed = calendar with
normal review gates. Totals: ~9–12 working days effort, ~2 weeks elapsed with
parallelization (tracks: #1/#2 parallel day 1; #3 independent; #4/#5/#7 fan out after
0b; #6 after #1; #8 last).

| # | Step | What | Repo(s) | Effort | Elapsed | Blocked by |
|---|---|---|---|---|---|---|
| 0a | Gate zero — B1 fixes | `file-store.put()` → `safeParse`, `LockManager.acquire()` honor never-throws contract, conventions doc + CI gates | plugins-common | 4–6 h | 1 d | — |
| 0b | Rename plugin-kernel → `plugin-std` | Manifest, workspace refs, smoke test, README; delete framework docblock | plugins-common | 1–2 h | same day | Q1 ✅ |
| 1 | `plugin-std`: errors + Result | Merge dev-team `result.ts` + astramem taxonomy → `PluginError` base; first consumer = plugins-common itself | plugins-common | 4–8 h | 1 d | 0a, 0b |
| 2 | `plugin-std`: jsonl utils | Port runner `jsonl-append.mts` + safe-read + tail + rotation; publish | plugins-common | 4–8 h | 1 d (parallel #1) | 0b |
| 2b | jsonl consumer migration | 8+10+4 rogue sites, opportunistic | runner, dev-team, astramem | 4–6 h | trailing, 2–3 d | 2 |
| 3 | astramem-client adoption in runner | Replace 3 transports, 14 files; DEC for Q4 (retire CLI spawn + `--type` vocabulary); npm registry dep | runner-plugin | 1–2 d | 2–3 d | live landing chain |
| 4 | `plugin-std`: frontmatter | Extract pinned parse/serialize core (4–6 h); migrate runner 5 rogue regexes (2–3 h) + dev-team 11 parsers (1–1.5 d) | plugins-common → runner, dev-team | ~2 d | 3–4 d | 0b; Q3 ✅ |
| 5 | `plugin-std`: http util | `fetchWithTimeout`/`fetchJson` (3–5 h) + migrate 5 judge providers, astramem local/saas, wire-probe, langfuse (3–4 h) | plugins-common → dev-team, astramem | ~1 d | 1–2 d | 0b |
| 6 | `plugin-std`: flags/config accessor | zod accessor + merge two features-service registries, kill flag-lite mirrors, parity-test cutover | plugins-common → runner, dev-team | 1–2 d | 3–4 d | 1 |
| 7 | `plugin-std`: `runGit` | Wrapper (2–3 h); dev-team dedup immediate, runner's 29 sites opportunistic | plugins-common → dev-team | 2–3 h | 1 d | 0b |
| 8 | `@astragenie/loop-config` | Schema from `resolveConfig` + 13 bypass sites; dev-team's 4 readers migrate; publish from runner | runner → dev-team | 2–3 d | 1 wk | Q2 confirm; #1–#6 |
| 9 | Fallout cleanups | Runner: 51 dead exports, zombie codemod, hardcoded hero-crew path (B3). astramem: bin/lib twin dedup. dev-team: own paths module | all | 0.5–1 d | scattered | none |

## 7. Open questions (operator decisions)

Decisions recorded 2026-07-07:

- **Q1 — DECIDED: rename/repurpose** plugin-kernel as `@astragenie/plugin-std` —
  library semantics (piecemeal imports, no lifecycle, no IoC). The kernel docblock's
  framework scope is NOT implemented; its two real ideas (shared locks, shared
  workflow-state) re-enter per-piece via the normal candidate rules when their sources
  stabilize.
- **Q2 — RECOMMENDED, awaiting confirm**: `loop.json` schema ships as a
  **runner-published** package (e.g. `@astragenie/loop-config`, source in runner-plugin,
  published to the same npm scope). Rationale: `loop.json` is runner's public surface —
  owner of behavior owns the schema; collocation means schema and behavior change in one
  PR/release; dev-team pins minor with unknown-keys passthrough; plugins-common stays
  policy-free.
- **Q3 — DECIDED: extract frontmatter now**, API pinned to the parse/serialize core;
  runner-specific key helpers stay in runner (candidate #4 unblocked).
- **Q4 — DECIDED: retire runner's CLI-spawn memory fallback** at astramem-client
  adoption (#3). Requires a DEC recording the retirement + resolution of the
  two-vocabulary `--type` split (`memory-bridge.mts:17-32`) — the closed `MemoryKind`
  enum becomes the only vocabulary; the free-string wire vocabulary dies with the CLI
  spawn path.
