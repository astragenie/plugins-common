# Cross-Repo Consolidation Review — Phase 1 Evidence

> Generated 2026-07-07 from workflow run `wf_f9c35878-885` — 12 evidence agents
> (4 repos x 3 dimension-groups), citations + counts only; verdicts live in Phase 2.
> Prompt: `2026-07-07-cross-repo-consolidation-review-prompt.md`.

---

# REPO: runner-plugin

## Dimensions 1-2: duplication census + dependency edges

<!-- agent: runner-plugin:dup+graph -->

Now I have all the citations needed. Compiling the final evidence report.

## 1. Duplication census (runner-plugin inventory)

| topic | file:line-span | approx LOC | call-site count (this repo) |
|---|---|---|---|
| JSONL append (canonical helper) | `src/scripts/lib/jsonl-append.mts:1-119` | 119 | `appendJsonl`/`appendJsonlBatch`/`appendJsonlSync` imported by 8 modules (`auto-dispatch.mts`, `dispatch-trace.mts`, `dispatch-worktree.mts`, `error-pattern-registry.mts`, `learnings-citations.mts`, `learnings.mts`, `pause-telemetry.mts`, `telemetry.mts`) |
| JSONL append/parse, hand-rolled (bypasses `jsonl-append.mts`) | `src/scripts/lib/grade-jsonl-writer.mts:26-31` (`appendGradeEvent`, mkdir+`fs.appendFile`+`JSON.stringify`+`"\n"`, byte-identical shape to `appendJsonl`) | 6 | 1 exported fn, used by grade-close path |
| JSONL append/parse, hand-rolled | `src/scripts/lib/wave/events.mts:8,125,145-148` (`appendFileSync`/`readFileSync`+`JSON.parse` per line) | ~15 | wave event log read+write |
| JSONL append/parse, hand-rolled | `src/scripts/lib/halt-badge-state.mts:34-52,108-111` (state JSON write + audit-log tail-read/parse) | ~20 | 2 fns |
| JSONL read/parse, hand-rolled | `src/scripts/lib/cost-by-skill.mts:83-93` | ~11 | 1 fn |
| JSONL read/parse, hand-rolled | `src/scripts/lib/dispatch-prune.mts:115-123` | ~9 | 1 fn |
| JSONL read/parse, hand-rolled | `src/scripts/lib/grade-telemetry.mts:26-35,67` | ~12 | 2 fns |
| JSONL read/parse, hand-rolled | `src/scripts/lib/memory-context.mts:84-96` | ~13 | 1 fn |
| Artifact-path resolver (canonical) | `src/scripts/lib/paths.mts:1-80` (`artifactRoot`/`gradesRoot`/`decisionsRoot`/etc., config-overridable via `PATH_DEFAULTS`) | 80 | 15 exported functions |
| Artifact-path literals, hand-rolled (bypass `paths.mts`) | 22 files, 25 occurrences of `path.join(..., ".claude", "artifacts", ...)` outside `paths.mts` — e.g. `backlog-auditor.mts:221`, `ceremonies.mts:119,134`, `cost-alert-loader.mts:4-5`, `dispatch-prune.mts:47`, `dispatch-tree-snapshot.mts:24`, `fanout-marker.mts:13`, `grade-jsonl-writer.mts:5`, `grade-writer.mts:415`, `halt-badge-state.mts:34`, `learnings.mts:28`, `memory-context.mts:84`, `memory-snapshot.mts:56-57`, `pause-telemetry.mts:65`, `planning-rules.mts:17`, `review-gate.mts:27`, `shape-marker.mts:13`, `slice-cost-ceiling.mts:33`, `slice-linker/agent-report-writer.mts:240`, `validation-gate.mts:8`, `loop.mts:1839`, `validate-decline-citations.mts:53`, `validate-effort-points.mts:96` | n/a (25 literal instances) | 22 distinct files |
| `.claude/loop.json` reader (canonical) | `src/scripts/lib/config-resolver.mts:114` (`resolveConfig`) | part of 160-line file | 16 files call `resolveConfig` |
| `.claude/loop.json` reader, hand-rolled `fs.readFile`+`JSON.parse` (bypass `resolveConfig`) | 13 files: `auto-walker.mts:197`, `cost-setup.mts:157`, `dispatch-cost-aggregate.mts:45`, `event-notifier.mts:117`, `grade-writer.mts:536`, `memory-doctor.mts:47`, `memory-sink.mts:66`, `phase-gate/parallel-orchestrator.mts:166`, `phase-gate.mts:451`, `slice-linker/agent-report-writer.mts:301`, `slice-linker/astrarunner-ingest.mts:124`, `stuck-detector.mts:41`, `wave/cli.mts:24` | n/a | 13 files |
| Frontmatter parse/write (canonical) | `src/scripts/lib/frontmatter.mts:1-313` (`FRONTMATTER_RE` at line 27, explicit CRLF-tolerance bugfix documented lines 23-26) | 313 | 27 files import from `frontmatter.mjs` |
| Frontmatter regex, hand-rolled (diverged — CRLF-tolerant) | `src/scripts/lib/backlog-auditor.mts:28` (`FRONTMATTER_SPLIT_RE = /^---\s*\r?\n/m`) | 1 | 1 |
| Frontmatter regex, hand-rolled (diverged — no CRLF tolerance, the exact bug `frontmatter.mts` fixed) | `src/scripts/lib/crew-bundle-parser.mts:64` (`/^---\n([\s\S]*?)\n---\n/`); `src/scripts/lib/wave/failure-pivot.mts:60`; `src/scripts/lib/wave/planner.mts:91`; `src/scripts/lib/wave/touches-files.mts:4` (all `/^---\n([\s\S]*?)\n---/`, LF-only) | 1 each, 4 files | 4 |
| Git worktree creation (impl #1) | `src/scripts/lib/worktree-manager.mts:1-342` (single-slice `loop.worktreeMode`, `ensure`, `git worktree add` at 250, `git worktree list --porcelain` parse at 145) | 342 | 1 call site |
| Git worktree creation (impl #2, independent) | `src/scripts/lib/dispatch-worktree.mts:1-437` (wave/parallel mode, `preflightGitClean`, `worktree add` at 50) | 437 | 2 call sites |
| Subprocess spawn (git specifically), no shared wrapper | 12 files, 29 call sites of `execFile("git"…)`/`execFileSync("git"…)`/`spawn("git"…)`: `agent-version.mts`, `auto-merge.mts`, `checkpoint-commit.mts`, `dispatch-merge.mts`, `dispatch-prune.mts`, `dispatch-worktree.mts`, `learnings.mts`, `slice-linker/complete-slice.mts`, `slice-linker/crew-bridge.mts`, `slice-linker/slice-progress.mts`, `wave/real-deps.mts`, `worktree-manager.mts` | n/a | 29 call sites |
| Subprocess spawn (general), no shared wrapper module at all | 26 files under `src/scripts/lib/**` import `node:child_process` directly (`spawn`/`execFile`/`execFileSync`) — zero `exec-*`/`spawn-*`/`command-*` helper module exists in `src/scripts/lib/` (`ls` returned no match) | n/a | 26 files |
| Semver comparison (canonical) | `src/scripts/lib/plugin-identity.mts:163-172` (`compareSemver`) | 10 | 4 call sites in this repo: `plugin-identity.mts:87,186,207`, `loop-installer.mts:68` — clean, no duplicate implementation found elsewhere |
| Markdown-section builder pattern, independently reinvented per module (no shared helper) | `src/scripts/lib/memory-snapshot.mts:146-299` — 10 private `render*` functions, each returning `["## Heading", "", "- bullet", ...]`; `src/scripts/lib/retrospective.mts:204-273` — 7 private `render*` functions, same array-of-strings-with-`##`-heading shape | ~150 combined | private, 1 call site each (module-internal) |
| Validation-gate scripts | `src/scripts/validate-manifests.mts:1-3` (comment: "See hero-crew's validator for rationale") — cannot compare against dev-team's copy from this repo alone; flagged for cross-repo check in Phase 2 | n/a | n/a |

Clean — checked (no duplicate implementation found in this repo): version/semver comparison has exactly one implementation (`plugin-identity.mts::compareSemver`) with no shadow copies.

## 2. Dependency graph — outgoing edges from runner-plugin

| # | Edge (source → target) | Mechanism | Evidence |
|---|---|---|---|
| 1 | runner-plugin → crew (dev-team), sibling checkout | Hardcoded absolute filesystem path probe, tried before plugin cache: `C:/work/mega/hero-crew/scripts/crew.mjs`, then `$HOME/work/mega/hero-crew/...`, then `$HOME/hero-crew/...` | `src/scripts/lib/slice-linker/crew-bridge.mts:23-53` (`findHeroCrewCli`), literal path at line 39 |
| 2 | runner-plugin → crew, override env var | `$HERO_CREW_PATH` env var joined with `scripts/crew.mjs` | `src/scripts/lib/slice-linker/crew-bridge.mts:32-35` |
| 3 | runner-plugin → crew, Claude Code plugin cache | Reads `$HOME/.claude/plugins/cache/<marketplace>/crew/*/scripts/{crew.ts,crew.mjs}`, filesystem directory-listing coupling, not a package dependency | `src/scripts/lib/plugin-identity.mts:66-103` (`getCrewCliCacheGlob`, `findCrewCli`) |
| 4 | runner-plugin → crew, spawned CLI invocation | `execFile`/spawn of the resolved `crew.mjs`/`crew.ts` for `write-run-brief`, cost-report, handoff, final-synthesis writes | `src/scripts/lib/slice-linker/crew-bridge.mts:69-100+` (calls `findHeroCrewCli()` then spawns) |
| 5 | runner-plugin → crew, version gate (semver pin, no package dep) | `MIN_CREW_VERSION = "0.48.0"` compared against installed crew's manifest version via `compareSemver` | `src/scripts/lib/plugin-identity.mts:134`, consumed at `src/scripts/lib/loop-installer.mts:68` |
| 6 | runner-plugin → crew, feature-gated version pin | `ORCHESTRATE_SLICE_MIN_CREW_VERSION = "0.11.0"` | `src/scripts/lib/plugin-identity.mts:140,186` |
| 7 | runner-plugin → crew, shared artifact-path contract (prose, not code) | `.claude/artifacts/crew/designs/<featId>-contracts.md` path constant explicitly documented as shared with crew's `/crew:orchestrate-slice` Step 1 | `src/scripts/lib/contracts-artifact.mts:4,8-9` |
| 8 | runner-plugin → crew, implicit artifact-tree reads (crew's namespace, not runner's) | 9+ modules read/write under `.claude/artifacts/crew/**` (cost, cost-insights, ceremonies, reviews, validations, bundles, agents, designs) — a namespace runner does not own | `src/scripts/lib/cost-alert-loader.mts:4-5`, `ceremonies.mts:119,134`, `grade-writer.mts:415`, `review-gate.mts:27`, `validation-gate.mts:8`, `slice-linker/agent-report-writer.mts:240`, `contracts-artifact.mts:4` |
| 9 | runner-plugin → crew, schema coupling (reads crew-produced JSON) | `cost-alert-loader.mts` comment: "upstream hero-crew aggregate writer emits this map" — parses a JSON shape crew produces | `src/scripts/lib/cost-alert-loader.mts:38-39` |
| 10 | runner-plugin → crew, config-level naming coupling | `.claude/loop.json`'s `cost.regression.projectAliases` includes `"C--work-mega-hero-crew-autonomous-loop"` — cost-regression matching keyed to crew's own project-name string | `.claude/loop.json:120-123`, consumed by `src/scripts/lib/cost-regression.mts` |
| 11 | runner-plugin → crew, stale hardcoded path in crew's own command (cross-repo drift, documented) | crew's `commands/orchestrate-slice.md` Step 2.5 still greps runner's superseded `scripts/presets/<name>.json` path instead of `.claude/loop.json` | `docs/upstream-requests/2026-07-06-crew-orchestrate-slice-preset-path.md:13-40` |
| 12 | runner-plugin → crew, 6 additional open prose contracts | redundant-read hook-deny behavior, brief-me halt-badge rendering, forward-declared skill ids, verdict-not-checked author/judge, 3rdparty provenance/injection defense, workflow-state load validation | `docs/upstream-requests/2026-06-06-hero-crew-redundant-read-hook-deny.md`, `2026-06-07-hero-crew-brief-me-halt-badge-rendering.md`, `2026-06-07-hero-crew-forward-declared-skill-ids.md`, `2026-06-13-hero-crew-verdict-not-checked-author-judge.md`, `2026-07-02-hero-crew-3rdparty-provenance-and-injection-defense.md`, `2026-07-02-hero-crew-workflow-state-load-validation.md` (each frontmatter: `target_repo: astragenie/dev-team`) |
| 13 | runner-plugin → crew, halt-badge schema exported for crew's consumption | `docs/halt-badges.md` declared as "single source of truth" consumed by "crew `brief-me` renderer" | `docs/halt-badges.md:8-10` |
| 14 | runner-plugin → crew, generic webhook fan-out (config-driven, not hardcoded to crew) | `fanoutHaltBadgesFromSnapshot` posts halt-badge envelopes via configurable webhook URL (`LOOP_INGEST_URL` / `loop.json` `webhook.url`) | `src/scripts/lib/webhook-fanout.mts:2,7,14,26`; documented wire contract at `docs/halt-badges.md:33-40` |
| 15 | runner-plugin → astramem plugin, runtime dynamic-import discovery (no package dep) | Discovers installed astramem plugin root via `CLAUDE_PLUGIN_ROOT_MEMORY` env or derives it from a resolved CLI path, then `import(pathToFileURL(<root>/src/lib/selector.ts))` and calls `provider.remember()` in-process | `src/scripts/lib/memory-transport.mts:82-123` |
| 16 | runner-plugin → astramem plugin, CLI spawn fallback | Resolves `astramem[.exe/.cmd/.bat]` via `CLAUDE_PLUGIN_ROOT_MEMORY/bin/` or PATH probe (`where`/`which`), then spawns `astramem remember …` | `src/scripts/lib/memory-bridge.mts:104-172,254-320` |
| 17 | runner-plugin → astramem plugin, structural type coupling (not compiled against) | `AstramemProvider`/`ProviderIngestPayload` interfaces hand-typed locally because "the plugin is discovered at runtime, not compiled against" — no shared `astramem-client` package import found anywhere in `src/` | `src/scripts/lib/memory-transport.mts:34-52` (comment explicitly disclaims compiling against the real interface); confirmed via repo-wide grep — zero occurrences of `astramem-client` import in `src/` |
| 18 | runner-plugin → plugins-common, package dependency | None found: `package.json` has no `file:`/`link:`/`workspace:` entries pointing at `astramem-client`, `gepa-core`, or `plugin-kernel`; grep for `plugins-common` in `src/` returns no matches | `package.json` (dependencies: `ajv`, `ajv-formats` only); grep of `src/` for `plugins-common`/`astramem-client`/`gepa-core`/`plugin-kernel` — 0 matches |
| 19 | Internal near-cycle, `memory-bridge.mts` ↔ `memory-transport.mts` | `memory-transport.mts` imports `resolveCli` from `memory-bridge.mts` (line 30); `memory-bridge.mts::emit()` lazy-imports `memory-transport.mts` at call time specifically to avoid "a static import here would create an ESM cycle" | `src/scripts/lib/memory-transport.mts:30`; `src/scripts/lib/memory-bridge.mts:259-263` |
| 20 | Internal layer check — `lib/` importing entry/command layers | None found: no `src/scripts/lib/**` file imports from `commands/` (markdown-only, no code) or from CLI entry files (`../loop.mjs`, `../cli/*`) | grep across `src/scripts/lib` for `commands/` and `../cli/` imports — 0 matches |

Clean — checked: no `file:`/`link:`/`workspace:` dependency in `package.json` on any plugins-common package; no static import of `astramem-client`, `gepa-core`, or `plugin-kernel` anywhere under `src/`; no `lib/`→entry-layer inversion found.

## Dimensions 3-5: exception handling, provider seams, DI/testability

<!-- agent: runner-plugin:err+seams+di -->

## Dimension 3: Exception handling comparison — runner-plugin

**Scope checked**: `src/scripts/**/*.mts` (217 files), excluding `src/tests/**`.

**Aggregate counts**:

| Metric | Count | Evidence |
|---|---|---|
| `try {` blocks | 379 | `grep -rPo "\btry\s*\{" src/scripts --include=*.mts \| wc -l` |
| `catch` clauses total | 369 | 97 with bound param (`catch (e) {`) + 272 parameter-less (`catch {`) |
| Custom error classes (`extends Error`) | 12 | listed below |
| `throw new Error(...)` | 146 | e.g. `src/scripts/lib/phase-gate.mts:219` |
| `throw new <CustomErrorClass>(...)` | 56 | e.g. `src/scripts/lib/auto-merge.mts:261` (`throw new MergeError({...`) |
| Bare-string throws (`throw "..."` / `` throw `...` ``) | 0 | only false-positive hit was a comment, `src/scripts/lib/task-store/providers/linear-provider.mts:6` |
| `process.exit(N)` calls | 12 | all in entry scripts, none in `lib/` (see exit-code table) |
| `process.exitCode` assignments | 57 | across `src/scripts/**` |

**Custom error classes** (12, no shared base beyond `Error` itself — each repeats its own `code`/`name` shape independently):

| Class | Location |
|---|---|
| `MergeError` | `src/scripts/lib/auto-merge.mts:114` |
| `DispatchDepthExceeded` | `src/scripts/lib/dispatch-types.mts:41` |
| `DispatchFanoutExceeded` | `src/scripts/lib/dispatch-types.mts:48` |
| `DispatchWorktreeError` | `src/scripts/lib/dispatch-types.mts:55` |
| `DispatchConfigError` | `src/scripts/lib/dispatch-types.mts:62` |
| `SchemaError` | `src/scripts/lib/preset-schema.mts:1` |
| `InvalidProposedSlicesError` | `src/scripts/lib/proposed-slices.mts:30` |
| `DecompositionRequiredError` | `src/scripts/lib/proposed-slices.mts:41` |
| `AcceptanceCriteriaRequiredError` | `src/scripts/lib/slice-linker/feature-lifecycle.mts:107` |
| `WorkflowStateSchemaMismatchError` | `src/scripts/lib/workflow-state-guard.mts:31` |
| `WorkflowStateCorruptError` | `src/scripts/lib/workflow-state-guard.mts:39` |
| `WorktreeError` | `src/scripts/lib/worktree-manager.mts:46` |

**Catch-block behavior breakdown** (of 369 total catch clauses):

| Behavior | Count | Representative citations |
|---|---|---|
| Wrap into new/custom error and rethrow (`catch(e){ ... throw new X` within ~150 chars) | 10 | `src/scripts/lib/auto-merge.mts:260-262` (`} catch { throw new MergeError({ code: "WORKTREE_MISSING", ...`) |
| Bare rethrow of caught identifier (`catch(e){ ... throw e` within ~150 chars) | 9 | (heuristic match count; exact identifiers not individually enumerated here) |
| Log-and-continue (catch body writes to `console.*` / `process.stderr.write` / `process.stdout.write` before returning/continuing) | 21 | e.g. `src/scripts/loop.mts:658` region (`process.stdout.write(...); process.exit(0)` is a success path, not catch — true log-and-continue catches are counted via the grep pattern, not enumerated individually here) |
| Everything else — no rethrow, no log call (silent swallow, often with only a comment and/or a default return value) | ≈329 (369 − 10 − 9 − 21) | see swallow sample below |

**Swallowed catches** (silent — no rethrow, no log): sample of 40+ citations out of the ≈329 counted above, one per file where the pattern recurs:

- `src/scripts/cli/connect.mts:151-153, 177-179, 211-213, 357-359`
- `src/scripts/loop.mts:426-428, 530-532, 616-618, 633-635, 1578-1580, 1856-1858`
- `src/scripts/lib/artifact-verdict.mts:58-60`
- `src/scripts/lib/auto-dispatch.mts:170-172`
- `src/scripts/lib/auto-merge.mts:275-277, 318-320, 327-329, 342-344, 366-368, 525-527, 588-590, 607-609`
- `src/scripts/lib/auto-walker.mts:94-96, 185-187, 242-244`
- `src/scripts/lib/config-resolver.mts:145-147`
- `src/scripts/lib/cost-alert-loader.mts:95-97, 122-124, 137-139, 244-246, 260-262, 308-310`
- `src/scripts/lib/cost-by-skill.mts:94-96`
- `src/scripts/lib/dispatch-merge.mts:153-155`
- `src/scripts/lib/dispatch-prune.mts:126-128`
- `src/scripts/lib/dispatch-tree-snapshot.mts:84-86`
- `src/scripts/lib/dispatch-worktree.mts:69-71, 74-76, 296-298, 366-368, 434-436`
- `src/scripts/lib/doctor.mts:232-234, 257-259`
- `src/scripts/lib/event-notifier.mts:177-179, 250-252, 280-282`
- `src/scripts/lib/grade-writer.mts:465-467, 469-471, 543-545, 578-580, 616-618, 651-653`
- `src/scripts/lib/halt-badge-state.mts:43-45, 90-92`
- `src/scripts/lib/memory-bridge.mts:115-117, 274-276, 292-294`
- `src/scripts/lib/memory-doctor.mts:62-64, 273-275`
- `src/scripts/lib/phase-gate.mts:144-146, 459-461, 488-490`
- `src/scripts/lib/plugin-identity.mts:94-96, 99-101`
- `src/scripts/lib/slice-linker/close-slice.mts:278-280, 284-286, 333-335`
- `src/scripts/lib/slice-linker/complete-slice.mts:416-418, 740-742, 812-814, 831-833`
- `src/scripts/lib/task-store/providers/github-provider.mts:26` — the one truly single-line empty `catch {}`

Recurring inline comments describing the intent behind these swallows: `"best-effort"` (multiple files), `"fail-open"` (`auto-merge.mts:276`, `halt-badge-state.mts:44`), `"Fail-silent: ... must never affect ..."` (`grade-writer.mts:579`, `phase-gate.mts:489`), `"never blocks slice complete"` (`complete-slice.mts:741,813,832`), `"skip malformed line(s)"` (7+ files parsing JSONL).

**Exit-code discipline**: all 12 `process.exit(N)` call sites are in top-level entry scripts, none under `src/scripts/lib/`:

| File | Lines |
|---|---|
| `src/scripts/cli/connect.mts` | :441 (`.then((code) => process.exit(code))`, with a comment at :15 stating exit is "only called from the top-level main()") |
| `src/scripts/loop.mts` | :645, :658, :661, :881, :936 |
| `src/scripts/pre-push-validate.mts` | :31, :34, :49, :82, :94 |
| `src/scripts/validate-imports.mts` | :61 |

`grep -rn "process\.exit(" src/scripts/lib --include=*.mts` returns zero matches — confirmed no `lib/`-layer violation of the repo's own "no `process.exit(N)` from library functions" convention (stated in `CLAUDE.md`).

**Result-shaped returns**: a typed `Result<T,E>` helper exists at `src/scripts/lib/result.mts:1-19` (`ok`/`err`/`isOk`/`isErr`), but `grep -rn "result\.mjs" src --include=*.mts` shows its only importer is `src/tests/result.test.mts:3-4` — zero non-test call sites. Separately, 9 files use an ad-hoc `{ ok: true/false, ... }` object shape without importing the shared helper: `src/scripts/lib/ac-linter.mts`, `auto-dispatch.mts` (`DispatchResult` interface, `src/scripts/lib/auto-dispatch.mts:31-38`), `event-validator.mts`, `phase-gate.mts`, `webhook-sender.mts`, `validate-event-schemas.mts`, `validate-learnings-schema.mts`, `validate-snapshot-freshness.mts`.

**File mixing Result-shaped return with throw**: `src/scripts/lib/phase-gate.mts` returns `{ ok: true, crewArtifactPath }` / `{ ok: false, error: ... }` at lines 147/149, and separately `throw new Error("Hard dependency missing: crew CLI not found...")` at line 219 in the same file.

## Dimension 4: Provider / integration-seam usage — runner-plugin

**astramem seams** — three distinct mechanisms coexist, none of them the shared `packages/astramem-client`:

| Mechanism | Citation |
|---|---|
| Package dependency on `astramem-client` | none — `package.json` `dependencies` block contains only `ajv`/`ajv-formats` (`C:/work/mega/runner-plugin/package.json`); `grep -rn "astramem-client" .` (repo-wide) returns zero matches |
| CLI spawn (legacy/rollout-fallback transport) | `src/scripts/lib/memory-bridge.mts:158` (`spawn(whichCmd, ["astramem"], ...)`), `:309` (`spawn(cliPath, args, ...)`); `src/scripts/lib/memory-recall.mts:77`, `:181`; `src/scripts/lib/memory-doctor.mts:91` |
| In-process `MemoryProvider` (FEAT-188 S1b, primary transport since `runner-plugin#357`) | `src/scripts/lib/memory-transport.mts:100-104` — dynamic `import(pathToFileURL(selectorPath).href)` of the astramem plugin's own `src/lib/selector.ts`, resolved via filesystem path derived from `resolveCli()` (`memory-transport.mts:30,88-92`) |
| CLI discovery/path resolution shared helper | `resolveCli()` in `memory-bridge.mts`, reused by `memory-transport.mts:30` and `memory-recall.mts:19` |

Files touching astramem at all (14): `grade-writer.mts`, `learnings.mts`, `memory-bridge.mts`, `memory-context.mts`, `memory-doctor-renderer.mts`, `memory-doctor.mts`, `memory-recall.mts`, `memory-sanitize.mts`, `memory-sink.mts`, `memory-transport.mts`, `pr-fixer.mts`, `recall-injector.mts`, `retrospective.mts`, `slice-linker/start-slice.mts` — all under `src/scripts/lib/`.

Header comment documenting the deliberate two-vocabulary split between transports: `src/scripts/lib/memory-bridge.mts:17-32` (`--type` on the `remember` wire is "a DIFFERENT free-string vocabulary than memory-sink.mts's closed MemoryKind enum").

**crew seams**:

| Mechanism | Citation |
|---|---|
| Version pin (semver floor check) | `src/scripts/lib/plugin-identity.mts:134` (`MIN_CREW_VERSION = "0.48.0"`), `:140` (`ORCHESTRATE_SLICE_MIN_CREW_VERSION = "0.11.0"`) |
| Filesystem glob discovery of crew's cache dir | `src/scripts/lib/plugin-identity.mts:66-70` (`getCrewCliCacheGlob()` — `$HOME/.claude/plugins/cache/${marketplaceName}/crew/*/scripts/crew.{ts,mjs}`), `:78-103` (`findCrewCli()`, reads `path.join(homedir, ".claude", "plugins", "cache", marketplaceName, "crew")`) |
| CLI spawn of the discovered crew binary | consumed at `src/scripts/lib/phase-gate.mts:7` (`import { findCrewCli, crewCliRuntime } from "./plugin-identity.mjs"`), `:217` (`const crewCli = await findCrewCli()`) |
| Prose upstream-request contracts (no code) | `docs/upstream-requests/` — 6 open files as of this check, e.g. `docs/upstream-requests/2026-07-06-crew-orchestrate-slice-preset-path.md`, `2026-07-02-hero-crew-workflow-state-load-validation.md`, `2026-06-13-hero-crew-verdict-not-checked-author-judge.md` |
| Cross-plugin badge-registry contract (prose, not code) | `docs/halt-badges.md` (referenced from `CLAUDE.md` § "Read first" item 6) |

**Agent-dispatch seams**:

| Mechanism | Citation |
|---|---|
| `dispatchAgent()` in-code helper | `src/scripts/lib/auto-dispatch.mts:125` — but per its own header comment at `:1-5`, it does **not** call an LLM/agent; it "acknowledges dispatch intent immediately and appends an audit log entry" via `appendJsonlBatch` (`auto-dispatch.mts:10`) |
| Actual role-agent dispatch (PM, architect, builder, reviewer, etc.) | prose instructions in command markdown, executed by whichever session/agent reads them — e.g. `commands/start.md:60` (`"dispatchInstruction": "Dispatch crew:fullstack-dev subagent with this prompt:..."`), `commands/wave.md:51,61` (`Agent(subagent_type: general-purpose...)`) |
| Deprecated marker-queue dispatch path | `.claude/artifacts/loop/pending-dispatch/` — per `CLAUDE.md` § "Auto-dispatch primitives", "deprecated for production use — no consumer is planned (see DEC-011)" |

**"Is provider ever abstracted?"**: one real interface-based provider abstraction exists in this repo, but for a different integration (task-tracker sync, not astramem/crew/agent-dispatch): `src/scripts/lib/task-store/provider-interface.mts:29` (`export interface TaskStoreProvider`), implemented by `src/scripts/lib/task-store/providers/github-provider.mts`, `linear-provider.mts`, `noop-provider.mts`. No equivalent interface type exists for the astramem or crew seams — those are hand-rolled function pairs (`resolveCli`/`findCrewCli` + spawn), not swappable implementations of a declared interface.

## Dimension 5: Dependency injection & testability — runner-plugin

**How modules receive dependencies** — three patterns observed, no consistent DI container:

| Pattern | Example citation |
|---|---|
| Module-scope singleton cache, populated lazily, with an explicit test-reset export | `src/scripts/lib/memory-bridge.mts:90` (`let _cliCache: {path:string} \| false \| null = null`), reset via `_resetCliCache()` at `:175-176`; `src/scripts/lib/memory-transport.mts:59` (`let _providerCache`), reset via `_resetTransportCache()` at `:72-76` |
| Test-only dependency injection seam (`_setX`) gated on `NODE_ENV`/`BUN_TEST` | `src/scripts/lib/memory-transport.mts:65-68` (`_setProvider()`, guarded by `isTestEnv()` at `:78-80`) |
| Plain parameter passing (no module-scope state) | `src/scripts/lib/auto-dispatch.mts:125` (`dispatchAgent(opts: DispatchOpts)` takes all collaborators — `costAdvisor`, `repoRoot`, etc. — as fields on `opts`) |

**Worst import-time side effect**: `src/scripts/lib/plugin-identity.mts:14-21` runs a synchronous filesystem check (`existsSync`) at **module load time**, outside any function body:
```
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
let pluginRoot = path.resolve(scriptDir, "..", "..");
if (!existsSync(path.join(pluginRoot, ".claude-plugin"))) {
  pluginRoot = path.resolve(scriptDir, "..", "..", "..");
}
```
Every importer of this module (including `phase-gate.mts` via `findCrewCli`/`crewCliRuntime`) triggers this disk stat before any exported function is invoked. Other `scriptDir`-deriving modules (`config-resolver.mts:31`, `decisions-store.mts:11`, `grade-writer.mts:32`, `loop-installer-tokens.mts:10`, `pre-push-validate.mts:21`) compute a path at module scope but do not perform I/O there — `plugin-identity.mts` is the only one that hits the filesystem at import time.

**Test coping strategy**: 248 test files total (`find src/tests -name "*.test.mts" | wc -l`). 168 files use real temp-directory filesystem fixtures (`grep -rln "mkdtempSync\|fs.mkdtemp\|tmpdir()" src/tests | wc -l`). Zero files import `mock` from `"bun:test"` (`grep -rn "import.*mock.*from \"bun:test\"" src/tests --include=*.mts | wc -l` → 0), and zero use `jest.fn`/`vi.fn`/`spyOn`/sinon-style mocking. 10 test files rely on the module's own exported test-seam reset/inject functions (`_setProvider`, `_resetTransportCache`, `_resetCliCache`, etc.): `src/tests/grade-notes-memory.test.mts`, `grade.test.mts`, `learnings.test.mts`, `memory-bridge.test.mts`, `memory-context.test.mts`, `memory-doctor.test.mts`, `memory-recall.test.mts`, `memory-sink.test.mts`, `memory-transport.test.mts` (seam usage at `src/tests/memory-transport.test.mts:17-18,27,38,76,98,113,125,130,146`), `post-builder-fanout.test.mts`. Net picture: this repo's dominant test strategy is real-FS-in-temp-dir integration-style testing plus repo-authored reset/inject seams, not a mocking library.

**`plugin-kernel` applicability**: not applicable to runner-plugin — `grep -rn "plugin-kernel" package.json src/scripts --include=*.mts` (repo-wide) returns zero matches; this repo does not consume that plugins-common package.

## Dimensions 6-8: boundaries, bad practices, toggles/config/churn

<!-- agent: runner-plugin:bounds+practices+config -->

## 6. Modularization & boundaries

**Method**: parsed all 217 `.mts` files under `src/scripts/` (excluding `src/tests/`, `node_modules`), resolved every relative `import`/dynamic `import()` specifier to its target file, and counted edges both directions. Cross-checked candidate dead exports by grepping every other `.mts` file (including `src/tests/`) for the symbol name.

### Fan-out (imports made BY the file) — top 10

| File | Local imports (static + dynamic) |
|---|---|
| `runner-plugin/src/scripts/loop.mts` | 96 (4 static at loop.mts:3-6, 105 lazy `await import(...)` call sites, e.g. loop.mts:245,249,255,265,269,288,294,305) |
| `runner-plugin/src/scripts/lib/slice-linker/start-slice.mts` | 33 |
| `runner-plugin/src/scripts/lib/slice-linker/complete-slice.mts` | 29 |
| `runner-plugin/src/scripts/lib/grade-writer.mts` | 21 |
| `runner-plugin/src/scripts/lib/hierarchical-dispatch.mts` | 17 |
| `runner-plugin/src/scripts/lib/stop-conditions.mts` | 16 |
| `runner-plugin/src/scripts/lib/slice-linker/feature-lifecycle.mts` | 14 |
| `runner-plugin/src/scripts/lib/slice-linker/agent-report-writer.mts` | 13 |
| `runner-plugin/src/scripts/lib/phase-gate.mts` | 12 |
| `runner-plugin/src/scripts/lib/slice-linker/close-slice.mts` | 12 |

### Fan-in (files importing THIS target) — top 10

| File | Importer count |
|---|---|
| `runner-plugin/src/scripts/lib/frontmatter.mts` | 36 |
| `runner-plugin/src/scripts/lib/paths.mts` | 36 |
| `runner-plugin/src/scripts/lib/telemetry.mts` | 15 |
| `runner-plugin/src/scripts/lib/auto-dispatch.mts` | 14 |
| `runner-plugin/src/scripts/lib/backlog-parser.mts` | 14 |
| `runner-plugin/src/scripts/lib/dispatch-types.mts` | 13 |
| `runner-plugin/src/scripts/lib/config-resolver.mts` | 13 |
| `runner-plugin/src/scripts/lib/webhook-fanout.mts` | 12 |
| `runner-plugin/src/scripts/lib/grade-parser.mts` | 11 |
| `runner-plugin/src/scripts/lib/backlog-writer.mts` | 11 |

### Mixed-responsibility files (citations, not size alone)

- `runner-plugin/src/scripts/loop.mts` (1927 lines) — a `COMMANDS` dispatch table (loop.mts:243-663, 20 top-level command keys) plus full business-logic implementations for unrelated domains inline in the same file: `runBacklogSubcommand` (loop.mts:1125), `runSpecSubcommand` (loop.mts:1385), `runSliceSubcommand` (loop.mts:1662), `runDecisionsSubcommand` (loop.mts:1685), `runFeatureSubcommand` (loop.mts:1741), `runLearningsSubcommand` (loop.mts:1794), `runGithubSubcommand` (loop.mts:1885), plus spec-field validation logic `detectMissingSpecFields` (loop.mts:1244) and architect-output parsing `parseArchitectOutput` (loop.mts:1232) — CLI arg parsing, dispatch table, and ~7 unrelated domains' business logic in one file.
- `runner-plugin/src/scripts/lib/slice-linker/crew-bridge.mts` (650 lines) — mixes crew-CLI subprocess discovery/spawn (`findHeroCrewCli` crew-bridge.mts:23, `runCrew` crew-bridge.mts:197), cost-report writing/dedup (`tryWriteCostReport` crew-bridge.mts:233, `sweepCostReportDedup` crew-bridge.mts:295), cost-advisor envelope posting (`postCostAdviseEnvelope` crew-bridge.mts:319), markdown synthesis rendering (`renderSynthesisScores` crew-bridge.mts:386, `renderSynthesisBody` crew-bridge.mts:403, `writeCrewFinalSynthesis` crew-bridge.mts:467), and badge writing (`markValidationSkippedBadge` crew-bridge.mts:370) in one module.
- `runner-plugin/src/scripts/lib/slice-linker/feature-lifecycle.mts` (679 lines) — mixes AC parsing (`extractAcceptanceCriteria` feature-lifecycle.mts:81, `assertAcceptanceCriteria` feature-lifecycle.mts:124), slice-content generation (`buildSliceContent` feature-lifecycle.mts:166), feature→slice classification (`classifySlice` feature-lifecycle.mts:278, `sliceFromFeature` feature-lifecycle.mts:339), multi-slice materialization (`materializeProposedSlices` feature-lifecycle.mts:502), and a "featureSimplify" trigger (`featureSimplify` feature-lifecycle.mts:598) in one module.
- `runner-plugin/src/scripts/lib/slice-linker/complete-slice.mts` (1093 lines, 29 functions) and `runner-plugin/src/scripts/lib/slice-linker/start-slice.mts` (966 lines, 29 functions) each fold ceremony orchestration together with worktree management, telemetry/trajectory recording, memory-recall emission, grade/badge writing, and (complete-slice.mts only) auto-merge triggering — e.g. `runAutoMergeStage` (complete-slice.mts:852), `resolveWorktreeAndBranch` (complete-slice.mts:894), `recordCompleteTrajectory` (complete-slice.mts:817), `triggerFeatureSimplify` (complete-slice.mts:1072) all live in the same file as the core `completeSlice` (complete-slice.mts:591).

### Dead exports (zero call sites)

Script checked 347 exported functions/consts (excluding types/interfaces) across `src/scripts/` for usage anywhere else in `src/scripts/` or `src/tests/`. **51 have no cross-file usage.** Representative citations:

| File:line | Symbol |
|---|---|
| `runner-plugin/src/scripts/lib/plugin-identity.mts:30` | `getPluginIdentity` |
| `runner-plugin/src/scripts/lib/plugin-identity.mts:140` | `ORCHESTRATE_SLICE_MIN_CREW_VERSION` |
| `runner-plugin/src/scripts/lib/plugin-identity.mts:180` | `checkOrchestrateSliceSupport` |
| `runner-plugin/src/scripts/lib/plugin-identity.mts:186` (uses `_resetCacheForTests`) | `_resetCacheForTests` |
| `runner-plugin/src/scripts/lib/grade-parser.mts` | `averageScore`, `readGrade`, `GRADE_PLACEHOLDER_PATTERNS` |
| `runner-plugin/src/scripts/lib/lessons-ratchet.mts` | `scanGradeLessonsFromRepo` |
| `runner-plugin/src/scripts/lib/skill-resolver.mts` | `isRoleVariant` |
| `runner-plugin/src/scripts/lib/planning-rules.mts` | `writeRule` |
| `runner-plugin/src/scripts/lib/auto-merge.mts` | `AUTO_MERGE_COMMIT_TEMPLATE` |
| `runner-plugin/src/scripts/lib/loop-installer-tokens.mts` | `resolveLoopPath`, `buildMandatoryDocsList` |
| `runner-plugin/src/scripts/loop.mts` | `runBacklogPmApply`, `runBacklogAudit`, `runBacklogEnrich` (each only self-referenced inside loop.mts, never imported by another module — dispatched only via the in-file `COMMANDS`/`runBacklogSubcommand` table) |
| (+41 more, full list available on request) | |

**Cross-check against prior audit**: `runner-plugin/docs/audits/2026-06-15-prod-release-audit.md:230` names exactly 7 exports for deletion (`loop-installer-tokens`, `grade-parser.averageScore`, `plugin-identity.getPluginIdentity`, `lessons-ratchet.scanGradeLessonsFromRepo`, `skill-resolver.isRoleVariant`, `planning-rules.writeRule`, `auto-merge.AUTO_MERGE_COMMIT_TEMPLATE`). All 7 are still present and still dead as of this scan (22 days later, repo HEAD `f2803af9` / 2026-07-07).

### Implicit public surface (things another repo could read)

- `runner-plugin/docs/halt-badges.md` (391 lines) — SPEC-003 registry of every `snapshot.*` halt-badge field (10 top-level badges: `costRegression`, `sessionDrift`, `sliceCostCeiling`, `gradeTrend`, `mergeFailed`, `redundantReadStop`, `marathonCheckpoint`, `pausedForExternalEvent`, `stuckDetected`, `prWatch`, at halt-badges.md:88-356, plus a "Wave-mode badges" section at halt-badges.md:356) — explicitly documented as a cross-plugin contract.
- `runner-plugin/src/scripts/lib/plugin-identity.mts` — `MIN_CREW_VERSION` constant is the version-pin surface crew is measured against; `getCrewCliCacheGlob` (plugin-identity.mts, dead per above) exposes a cache-glob path shape.
- `runner-plugin/docs/upstream-requests/2026-07-06-crew-orchestrate-slice-preset-path.md` — documents that hero-crew's `orchestrate-slice.md` greps a runner-plugin preset path directly (filesystem-path coupling, not a declared import).
- 6 other open upstream-request docs (`runner-plugin/docs/upstream-requests/2026-06-06-hero-crew-redundant-read-hook-deny.md`, `2026-06-07-hero-crew-brief-me-halt-badge-rendering.md`, `2026-06-07-hero-crew-forward-declared-skill-ids.md`, `2026-06-13-hero-crew-verdict-not-checked-author-judge.md`, `2026-07-02-hero-crew-3rdparty-provenance-and-injection-defense.md`, `2026-07-02-hero-crew-workflow-state-load-validation.md`) — each is a prose contract against crew behavior, not code.

### Rule violations / enforcement gaps

- `runner-plugin/src/scripts/validate-imports.mts` declares and enforces (via a standalone script) a boundary rule: files outside `src/scripts/lib/slice-linker.mts` (the barrel) or the `slice-linker/` dir itself must not import `slice-linker/*` submodules directly (validate-imports.mts:13-21). It is registered as `package.json:20` (`"validate:imports": "bun ./src/scripts/validate-imports.mts"`) but **does not appear** in `.github/workflows/ci.yml` or `.github/workflows/pr-comment-crew.yml`, and is not in the 9-step CI gate list in `runner-plugin/CLAUDE.md` ("## CI gates"). The rule's checker exists but is not wired into the enforced pipeline.
- Layer check: grepped every file under `src/scripts/lib/**` for an import of any top-level entry script (`loop.mts`, `dispatch.mts`, `bump-version.mts`, `codemod-add-any.mts`, `migrate-product-backlog.mts`, `pre-push-validate.mts`, `validate-*.mts`) — **clean, 0 matches** across all 15 top-level scripts and all `lib/` files checked.

## 7. Bad practices sweep

- **`@ts-ignore`**: 0 occurrences repo-wide (`src/scripts` and `src/tests`).
- **`@ts-nocheck`**: 74 files, **all** under `src/tests/**` (e.g. `runner-plugin/src/tests/acceptance-criteria.test.mts`, `runner-plugin/src/tests/slice-complete.test.mts`); 0 in `src/scripts/**`. Consistent with the stated repo convention (`CLAUDE.md` — "the `ban-ts-comment` rule is disabled for `src/tests/**`").
- **`any`-density in non-test code** (`src/scripts/**`, 217 files, 38,452 lines): `: any` type annotations — 272 occurrences; `as any` casts — 24; `Record<string, any>` — 470; `any[]` — 111.
  - `runner-plugin/src/scripts/codemod-add-any.mts` (161 lines) is a still-present, unreferenced tool whose own header states: *"This file is a one-shot migration tool for the TypeScript port (FEAT-021). It will be deleted after the port is complete."* (codemod-add-any.mts:4-5). Its function (`applyFix`, codemod-add-any.mts:36-61) mechanically inserts `: any` at every TS7006/TS7031/TS7034/TS7005/TS18046/TS18047/TS18048 diagnostic location (codemod-add-any.mts:112,150-153). Not referenced from `package.json`, `README.md`, `CLAUDE.md`, or `CHANGELOG.md`. Last touched 2026-06-07 (commit `9a98b99f`, "TypeScript Phase 1 permissive migration"); two subsequent tsconfig-tightening commits landed after it (`f836d434` "noImplicitAny + useUnknownInCatchVariables", `aefd4adc` "noUncheckedIndexedAccess") without the file being removed.
- **Repeated magic strings**:
  - Literal artifact-path prefix `.claude/artifacts/loop` appears **78 times across 45 files** in `src/scripts/**`, even though `runner-plugin/src/scripts/lib/paths.mts` exports canonical resolvers (`artifactRoot` paths.mts:26, `backlogRoot` paths.mts:38, `gradesRoot` paths.mts:44, `decisionsRoot` paths.mts:47, `specsRoot` paths.mts:41, `retroRoot` paths.mts:53, `miningRoot` paths.mts:56, `learningRunsRoot` paths.mts:59, `snapshotPath` paths.mts:62). Only 11 of the 45 files import `paths.mjs`; 34 files hardcode the literal, including `runner-plugin/src/scripts/dispatch.mts`, `runner-plugin/src/scripts/lib/hierarchical-dispatch.mts`, `runner-plugin/src/scripts/lib/eval-generator.mts`, `runner-plugin/src/scripts/lib/wave/planner.mts`, `runner-plugin/src/scripts/lib/wave/runner.mts`.
  - Frontmatter key names have no shared constants module (`frontmatter.mts` is a generic parser, not a key registry): `autonomous_safe` — 28 occurrences / 11 files; `needs_contract` — 18 / 6; `needs_ux` — 14 / 4; `declined_per` — 12 / 3; `composite_priority` — 4 / 2; `touches_files` — 5 / 4 (all counted in `src/scripts/**`).
- **Silent config fallbacks masking misconfiguration**: the documented `marathonCheckpointEvery` opt-out trap (`runner-plugin/src/scripts/lib/marathon-checkpoint.mts:44-48`: `typeof raw === "number" && Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_MARATHON_CHECKPOINT_EVERY` — 0/negative silently reverts to default rather than disabling) recurs in the same shape elsewhere:
  - `runner-plugin/src/scripts/lib/redundant-read-detector.mts:60-62` (cap) and `:69` (stale-hours) — identical `> 0 ? raw : DEFAULT` guards.
  - `runner-plugin/src/scripts/lib/failure-classifier.mts:79` — `opts.sinceDays > 0 ? opts.sinceDays : DEFAULT_WINDOW_DAYS`.
- **Naming inconsistency for one concept** (slice completion): the registered command surface is `/runner:close` (`runner-plugin/commands/close.md` exists; `runner-plugin/CLAUDE.md:349` states `/runner:close` — "subsumed the former `/runner:slice-complete`"), and the internal core function is `completeSlice` (`runner-plugin/src/scripts/lib/slice-linker/complete-slice.mts:591`), wrapped by a separate `closeSlice` (`runner-plugin/src/scripts/lib/slice-linker/close-slice.mts:102`, which calls `completeSlice` internally at close-slice.mts:25). But `runner-plugin/CLAUDE.md:385` (the "Autonomous Loop — HARD RULES" summary) still instructs: *"Every slice MUST use `/runner:slice start` and `/runner:slice complete`"* — a command form that does not exist in `commands/` (no `slice.md`; only `start.md` and `close.md` are present) and that CLAUDE.md's own line 349 says was already subsumed/renamed.
- **Hand-authored `.mjs` beyond the sanctioned list**: `runner-plugin/CLAUDE.md:113-115` states the exception list is `scripts/setup-github-sync.mjs`, `scripts/setup-task-store.mjs`, `scripts/competitor-audit/aggregate.mjs`, and *"the two `hooks/*.mjs` files"*. The actual `hooks/` directory contains **four** `.mjs` files with no `.mts` source: `runner-plugin/hooks/bootstrap-context.mjs`, `runner-plugin/hooks/feature-flag-lite.mjs`, `runner-plugin/hooks/guard-feat-dispatch.mjs`, `runner-plugin/hooks/version-check.mjs` (all last-changed 2026-07-04, git log confirms no `.mts` counterpart for any of the four).
- **`process.exit` vs `process.exitCode` split**: `process.exit(N)` calls found only in entry-point files — `runner-plugin/src/scripts/cli/connect.mts:441`, `runner-plugin/src/scripts/loop.mts:645,658,661,881,936`, `runner-plugin/src/scripts/pre-push-validate.mts:31,34,49,82,94`, `runner-plugin/src/scripts/validate-imports.mts:61` (12 call sites / 4 files) — 0 in `src/scripts/lib/**`, consistent with the "no `process.exit(N)` from library functions" rule. Separately, 16 files set `process.exitCode` instead — two different exit-signaling idioms coexist across entry scripts with no single documented convention for which to use.

## 8. Feature-toggle / config audit + churn/stability signals

### Toggle inventory (this repo's own `.claude/loop.json` + code-level flag mechanisms)

| Toggle | Kind | Citation |
|---|---|---|
| `memory.enabled` | tri-state (`true`/`false`/`"auto"`) | `runner-plugin/.claude/loop.json:5` |
| `split` | boolean | `runner-plugin/.claude/loop.json:8`; schema at `runner-plugin/src/scripts/lib/preset-schema.mts:30,195-196` |
| `features.redundant-read-stop.enabled` | boolean (formal registry) | `runner-plugin/.claude/loop.json:25-27` |
| `loop.notifications.enabled` / `.mode` | boolean / enum(`"webhook"`) | `runner-plugin/.claude/loop.json:32-33` |
| `loop.marathonMode` | boolean | `runner-plugin/.claude/loop.json:55` |
| `loop.autoMode` | boolean | `runner-plugin/.claude/loop.json:56` |
| `loop.dispatchLimits.expandedInlineCriteria` | boolean | `runner-plugin/.claude/loop.json:61` |
| `loop.marathonRunner` | enum(`"wave"` vs default sequential) | `runner-plugin/.claude/loop.json:92` |
| `loop.marathonCheckpointEvery` | int (0/neg = silent default, see dim 7) | `runner-plugin/.claude/loop.json:105` |
| `loop.validation.satisfiedByReview` | boolean | `runner-plugin/.claude/loop.json:106-108` |
| `loop.orchestratorMode` | enum(`"slice-build"`/`"orchestrate-slice"`) — absent from this repo's `loop.json`, defaults in code | `runner-plugin/src/scripts/lib/slice-linker/dispatch.mts:71-72` (`orchestratorMode ?? "slice-build"`); resolver at `runner-plugin/src/scripts/lib/slice-linker/start-slice.mts:98-104` |
| `reviewers.ladder` | enum-array (`["A"]`/`["B"]`/`["A","B"]`) | `runner-plugin/.claude/loop.json:151-153` |
| `reviewers.strictParallel` | boolean | `runner-plugin/.claude/loop.json:154` |
| `slice.postBuilderFanout` | boolean | `runner-plugin/.claude/loop.json:157-159` |
| `phaseGate.parallel` | boolean | `runner-plugin/.claude/loop.json:160-161` |
| `github.enabled` | boolean | `runner-plugin/.claude/loop.json:231-232` |
| Formal per-feature flags: `dispatch-guard-block`, `close-refusal`, `snapshot-autoregen`, `learnings-capture`, `version-check`, `bootstrap-context`, `parallel-fe-be-variant` (+`redundant-read-stop` above) | boolean, via registry | `runner-plugin/src/scripts/lib/features-service.mts:34-103` (8 entries total), read via `isFeatureEnabled`/`isEnabled` at features-service.mts:144,160 |
| `LOOP_DISPATCH_DEPTH`, `HERO_CREW_PATH`, `CREW_MARKETPLACE_NAME`, `LOOP_INGEST_URL`, `LOOP_INGEST_TOKEN` | env vars | `runner-plugin/src/scripts/lib/dispatch-gates.mts:9,11`; `runner-plugin/src/scripts/lib/hierarchical-dispatch.mts:45,144`; `runner-plugin/src/scripts/lib/slice-linker/crew-bridge.mts:32-33`; `runner-plugin/src/scripts/lib/plugin-identity.mts:67,83`; `runner-plugin/src/scripts/lib/plugin-options.mts:29,37` |

**Same kind of toggle, two mechanisms in one repo**: `features-service.mts` is a formal registry (8 flags, versioned metadata, default-on fail-safe policy per features-service.mts:1-15) that its own file header states "mirrors crew's sibling registry ... so the two registries can merge into one kernel service in Phase 2" (features-service.mts:12-14) — but at least 15 other boolean/enum toggles in the same `.claude/loop.json` (`marathonMode`, `autoMode`, `orchestratorMode`, `marathonRunner`, `validation.satisfiedByReview`, `reviewers.strictParallel`, `slice.postBuilderFanout`, `phaseGate.parallel`, `notifications.enabled`, `github.enabled`, `memory.enabled`, `split`, `dispatchLimits.expandedInlineCriteria`, `marathonCheckpointEvery`, and `phaseGateArtifactDir`) are read as raw ad-hoc `config?.loop?.X` values, never entered into the registry.

### Ad-hoc optional-chain-with-default config reads

Grepped `src/scripts/**` for `config?.a?.b...` chains (2+ levels): **60 occurrences**; of those, **24** combine directly with a `??` default in the same expression, e.g.:
`runner-plugin/src/scripts/lib/brief.mts:79` (`config?.loop?.autoMode ?? config?.loop?.marathonMode ?? true`), `runner-plugin/src/scripts/lib/grade-telemetry.mts:59,91`, `runner-plugin/src/scripts/lib/grade-trend.mts:81-82,126-127`, `runner-plugin/src/scripts/lib/memory-snapshot.mts:436,446`, `runner-plugin/src/scripts/lib/perf-report.mts:93`, `runner-plugin/src/scripts/lib/slice-linker/crew-bridge.mts:247`, `runner-plugin/src/scripts/lib/slice-linker/start-slice.mts:124,851-852`, `runner-plugin/src/scripts/lib/stop-conditions.mts:483`.

### Churn (last 3 months, `git log --since="3 months ago"`, repo HEAD `f2803af9`, run 2026-07-07)

Total commits touching `src/scripts/**` in the window: 933 file-touches across 990 total repo commits in the window.

Per-subdirectory churn (file-touch counts, not commit counts):

| Directory | File-touches (3mo) |
|---|---|
| `src/scripts/lib` (flat files) | 584 |
| `src/scripts/lib/slice-linker/` | 159 |
| `src/scripts` (top-level entry scripts) | 131 |
| `src/scripts/lib/wave/` | 26 |
| `src/scripts/lib/task-store/` | 15 |
| `src/scripts/lib/github-sync/` | 9 |
| `src/scripts/lib/phase-gate/` (subdir) | 8 |
| `src/scripts/cli/` | 1 |

Top 10 most-changed files in `src/scripts/**` (3-month commit count, last-change date):

| File | Commits (3mo) | Last change |
|---|---|---|
| `runner-plugin/src/scripts/loop.mts` | 79 | 2026-07-06 |
| `runner-plugin/src/scripts/lib/slice-linker/start-slice.mts` | 43 | 2026-07-07 |
| `runner-plugin/src/scripts/lib/slice-linker/complete-slice.mts` | 28 | 2026-07-05 |
| `runner-plugin/src/scripts/lib/slice-linker/dispatch.mts` | 25 | 2026-07-04 |
| `runner-plugin/src/scripts/lib/slice-linker/feature-lifecycle.mts` | 22 | 2026-07-06 |
| `runner-plugin/src/scripts/lib/grade-writer.mts` | 21 | 2026-07-07 |
| `runner-plugin/src/scripts/lib/stop-conditions.mts` | 17 | 2026-07-02 |
| `runner-plugin/src/scripts/lib/auto-walker.mts` | 14 | 2026-07-01 |
| `runner-plugin/src/scripts/validate-manifests.mts` | 12 | 2026-06-15 |
| `runner-plugin/src/scripts/lib/slice-linker/agent-report-writer.mts` | 12 | 2026-07-05 |

### Stability check on likely extraction-candidate utilities (highest fan-in from dim 6)

| File | Commits (3mo) | Last change |
|---|---|---|
| `runner-plugin/src/scripts/lib/paths.mts` | 4 | 2026-07-06 |
| `runner-plugin/src/scripts/lib/frontmatter.mts` | 10 | 2026-07-05 |
| `runner-plugin/src/scripts/lib/config-resolver.mts` | 6 | 2026-07-06 |
| `runner-plugin/src/scripts/lib/jsonl-append.mts` | 1 | 2026-07-02 |
| `runner-plugin/src/scripts/lib/plugin-identity.mts` | 12 | 2026-07-06 |

None of these five (including the two highest-fan-in modules, `paths.mts` and `frontmatter.mts`) has gone unchanged for ≥1 month as of 2026-07-07 — all were touched within the prior 1-5 days.

---

# REPO: dev-team

## Dimensions 1-2: duplication census + dependency edges

<!-- agent: dev-team:dup+graph -->

## Dimension 1 — Duplication census (dev-team inventory)

Scope note: dev-team has **no visibility into the other three repos** from this pass. All rows below are dev-team-only implementations of the suspect topics; cross-repo matching is deferred to Phase 2.

| Topic | File:line-span | Approx LOC | Call-site count (within dev-team) |
|---|---|---|---|
| `crew.json` config loader | `dev-team/scripts/lib/features-service.ts:176-188` (`readCrewConfig`) | 13 | 12 call sites: `scripts/crew.ts`, `hooks/pre-tool-use-model-enforce.ts`, `hooks/lib/check-subagent-return.ts`, `hooks/pre-tool-use-bash-gate.ts`, `hooks/pre-push-verifier.ts`, `hooks/post-tool-use-bash-gate.ts`, `hooks/lib/check-task-update-burst.ts`, `scripts/lib/cost-setup.ts`, `hooks/lib/record-read-content.ts`, `hooks/lib/preflight-shell.ts`, `hooks/lib/record-edit.ts`, `hooks/lib/check-redundant-read.ts` |
| `.claude/loop.json` (a **runner-plugin-owned** config file) read directly by dev-team, no shared schema package | `dev-team/scripts/lib/models/resolve-model.ts:1-28` (comment-documented mirror; consumer is `scripts/crew.ts` per the file's own note at line 19-20); `dev-team/scripts/lib/memory/inject-recall.ts:30,46-55` (`LOOP_CONFIG_PATH`, `loadMemoryConfig`); `dev-team/scripts/lib/memory/schema.ts:6-10` (`MemoryConfigSchema` comment describing a key-collision reconciliation with "runner-plugin's live memory-bridge keys"); `dev-team/scripts/lib/cost-watch.ts:112-115` (`loop.cost.ceilingUsd` reader) | 28 / 10 / 5 / 4 respectively | 4 independent read-sites of the same external file, 3 different partial-schema readers |
| JSONL tail-read helper (single shared impl) | `dev-team/scripts/lib/jsonl.mjs:16-55` (`tailReadJsonl`) | 40 | 5 call sites: `scripts/lib/briefing/hook.ts:37`, `scripts/lib/memory/drift-check.ts:50`, `scripts/lib/memory/file-provider.ts:66`, `scripts/lib/wakeup.mjs:302`, `scripts/lib/wakeup.mjs:303` |
| JSONL append (no shared helper — each call site hand-rolls) | `scripts/lib/approvals.ts:120`; `scripts/lib/claims.ts:189`; `scripts/lib/bash-gate-timer.ts:41`; `scripts/lib/dispatch-timing.ts:47`; `scripts/lib/gepa/auto-pr.ts:101`; `scripts/lib/gepa/candidate-generator-aiplugin.ts:74`; `scripts/lib/gepa/capture-tee.ts:61`; `scripts/lib/gepa/gepa-optimize-cmd.ts:169`; `scripts/lib/memory/capture-learning.ts:49`; `scripts/lib/gepa/observability-events.ts:119` | 1 line each (10 near-identical `appendFileSync(path, line, {flag:"a"})` / `fs.appendFile(path, \`${JSON.stringify(x)}\n\`)` statements) | 10 independent call sites, 0 shared "appendJsonl" export exists anywhere in `scripts/lib/jsonl.mjs` |
| `.claude/artifacts/**` path construction | No shared root-path constant/builder found. Representative literal `path.join(..., ".claude", "artifacts", "crew"/"loop", ...)` occurrences: `scripts/prune-artifacts.ts:22`; `scripts/lib/agent-stats-aggregator.ts:109,279,282,305`; `scripts/validate-backlog-drift.ts:91`; `scripts/validate-bundles.ts:13`; `scripts/lib/briefing/cost.ts:119-120`; `scripts/validate-slices.ts:34`; `scripts/lib/briefing/bundle.ts:51`; `scripts/lib/build-bundle/assemble.ts:18`; `scripts/lib/build-bundle/inline.ts:13`; `scripts/lib/cost-judge-aggregator.ts:242`; `scripts/lib/installer/audit.ts:29`; `scripts/lib/outcome-linkage.ts:128-129`; `scripts/lib/installer/harness-files.ts:24,79-83`; `scripts/lib/installer/legacy-migration.ts:23-24`; `scripts/lib/gepa/run-with-lock.ts:28` | 1-2 lines each | ≥19 distinct hand-typed segment sequences across 16 files; `scripts/lib/artifacts/write.ts:720` (`resolveArtifactPath`) is a single writer's internal filename builder, not a shared root-path resolver, and is not reused by the other 15 sites |
| Frontmatter block parsing (`---\n...\n---`) | 11 independent local implementations, all named `parseFrontmatter`/variants, each with a slightly different regex/return shape: `scripts/orchestrate-slice-classify.ts:152-156` (5 LOC, delegates to `parseYaml`); `scripts/lib/artifact-cache.ts:11-24` (14 LOC, hand-rolled colon-split); `scripts/validate-agents.ts:26-34` (9 LOC); `scripts/validate-bundles.ts:65-79` (15 LOC, `parseFrontmatterBody`, `Set`-based); `scripts/lib/briefing/collect-cost-parser.ts:33-42` (10 LOC, exported `parseFrontmatterBlock`); `scripts/validate-skills.ts:28-36` (9 LOC); `scripts/lib/cost-advisor.ts:35-50` (16 LOC, also returns trailing `body`); `scripts/validate-ux-spec.ts:47-55` (9 LOC); `scripts/lib/build-bundle/inline.ts:20-39` (20 LOC, `ParsedFrontmatter`); plus `scripts/validate-slices.ts:99` and `scripts/lib/agent-registry.ts:44` and `scripts/lib/agent-stats-aggregator.ts:58` (inline one-liner regex extracts, no named function) | 9-20 LOC each | 0 shared parser module; each of the 11 files owns its own copy. Regexes diverge: `/^---\r?\n([\s\S]*?)\r?\n---/` vs `/^---\n([\s\S]*?)\n---/` vs manual `indexOf("\n---")` — i.e. **diverged**, not identical, duplication |
| git subprocess wrapper (`runGit`) | `scripts/lib/branch-cleanup.ts:15-22`; `scripts/lib/briefing/git.ts:51-58`; `scripts/lib/gepa/gepa-killswitch-cmds.ts:51-65` | 8 / 8 / 15 | `branch-cleanup.ts:15-22` and `briefing/git.ts:51-58` are **identical** (same signature, same body, same catch-swallow-to-null pattern — byte-for-byte match on the executable lines). `gepa-killswitch-cmds.ts:51-65` is a third, diverged implementation (sync `spawnSync` returning `{ok,stdout,stderr,status}` instead of async `execFile` returning `string\|null`) |
| Subprocess/CLI spawn wrappers generally (`execFile`/`exec`/`spawn`/`spawnSync`/`execSync`) | 32 files under `scripts/` invoke `node:child_process` directly (list: `scripts/crew.ts`, `scripts/validate-routing-table.ts`, `scripts/validate-badges.ts`, `scripts/validate-backlog-drift.ts`, `scripts/validate-agents.ts`, `scripts/lib/gepa/branch-protection-check.ts`, `scripts/lib/gepa/auto-pr.ts`, `scripts/validate-dispatch-graph.ts`, `scripts/validate-configs.ts`, `scripts/validate-agent-refs.ts`, `scripts/validate-adr-template.ts`, `scripts/lib/agent-stats-aggregator.ts`, `scripts/lib/gepa/gepa-killswitch-cmds.ts`, `scripts/lib/gepa/auto-merge-gate.ts`, `scripts/lib/gepa/eval.ts`, `scripts/render-universal-skills.ts`, `scripts/lib/preflight/checks.ts`, `scripts/validate-workflows.ts`, `scripts/validate-slices.ts`, `scripts/validate-contracts.ts`, `scripts/validate-all.ts`, `scripts/lib/workflow-config.ts`, `scripts/lib/ux-validation/journey-builder.ts`, `scripts/lib/ux-validation/extract-acs.ts`, `scripts/lib/ux-validation/discover-playwright.ts`, `scripts/lib/installer/bun-preflight.ts`, `scripts/lib/briefing/workflow.ts`, `scripts/lib/briefing/git.ts`, `scripts/lib/branch-cleanup.ts`, `scripts/e2e-smoke.ts`, `scripts/lib/agent-registry.ts`, `scripts/e2e-smoke-ux.ts`) | n/a (32 files) | 0 files under `hooks/` do this directly (clean there) |
| Markdown table/section rendering | `scripts/render-routing-table.ts:32-40` (`tableRow`/`renderTable` — one small generic 2-function table builder, reused within that file only); `scripts/lib/dispatch-timing-reader.ts:194-231` (`renderDispatchTable`, `renderTokenTable`, `renderGateTable` — 3 separate functions, each hand-writes its own header/separator string literal instead of calling a generic builder); `scripts/lib/cost-watch.ts:170-204` (`renderDispatchSection`, `renderSliceSection`); `scripts/lib/cost-advisor.ts:494` (`renderFindingsSection`); `scripts/lib/cost-judge-aggregator.ts:357` (`renderJudgeCostSection`); `scripts/lib/brief-me/cost-aggregator.ts:141` (`renderBriefMeJudgeCostSection`) | 5-40 LOC each | No shared markdown-table/section builder is imported by more than one file; `render-routing-table.ts`'s generic `renderTable` is never reused outside its own file |
| Line-count / content-length cap enforcement | Not a standalone script (unlike the topic's suggested "content-length style gate"). Implemented inline, independently, in two different validators: `scripts/validate-agents.ts:89-116` (`maxLines` frontmatter override, `MAX_LINES` default, effective-lines check); `scripts/validate-skills.ts:111-114` (separate `maxLines` frontmatter override with its own `Number.parseInt`) | ~28 / ~4 | 2 independent inline implementations of the same "line cap with frontmatter override" idea, no shared helper between the agent and skill validators |
| Manifest validation script | `scripts/validate-manifests.ts:1-159` (`SEMVER_RE` at line 19, checks `plugin.json`/`package.json`/`marketplace.json` version fields at lines 43-47, 79-81) | 159 | Standalone script (`bun run validate:manifests`); no other manifest validator in-repo |
| Version/semver comparison logic | Clean — checked `scripts/validate-agents.ts`, `scripts/validate-manifests.ts`, `scripts/validate-skills.ts`, `scripts/lib/features-service.ts`, `scripts/lib/models/schema.ts`, `scripts/lib/routing/schema.ts` (6 files matching `semver`/`version`). All 6 only *format-validate* a semver string (regex `^\d+\.\d+\.\d+...$`); none perform version **comparison** (no `>`, sort, or gating logic). dev-team carries no `MIN_*_VERSION` pin constant anywhere (`grep -rn "MIN_.*_VERSION" **/*.ts` → 0 matches) |
| Self-documented "mirror of runner-plugin" pattern (adjacent to duplication, distinct topic) | `scripts/lib/telemetry/feature-flag-lite.ts:1-20` — comment explicitly states this file duplicates `features-service.ts`'s enable/default resolution rule *within dev-team itself* (packaging constraint) and separately "Mirrors runner-plugin's hooks/feature-flag-lite.mjs pattern" (line 15) | 64 total file | Kept in sync only by a parity test (`tests/features-service.test.ts`, per file comment lines 17-19), not by shared code |

## Dimension 2 — Dependency graph (outgoing edges from dev-team)

### Declared package dependencies (real registry, not `file:`/`link:`/`workspace:`)

| Edge | Mechanism | Evidence |
|---|---|---|
| dev-team → `@astragenie/astramem-client` | npm dependency (`^0.1.0`), resolved via `registry.npmjs.org` (overridden from the user's global GitHub-Packages `@astragenie:registry` scope) | `dev-team/package.json:45`; `dev-team/.npmrc:1-3`; `dev-team/bun.lock:29` (resolves to a published `sha512`-hashed tarball, not a workspace symlink) |
| dev-team → `@astragenie/gepa-core` | npm dependency (`0.7.0`), same registry override | `dev-team/package.json:47`; `dev-team/.npmrc:3`; `dev-team/bun.lock:33` |
| dev-team → `@astragenie/astramem-plugin` | git dependency pinned to a commit SHA | `dev-team/package.json:46` |
| dev-team → `@astragenie/astramem-client`, actual import site | Single call site: `resolveWireProvider` | `dev-team/scripts/lib/memory/astramem-provider.ts:14-16` (comment at lines 1-10 explicitly states the module "never shells the CLI... and never hand-rolls an MCP client") |
| dev-team → `@astragenie/gepa-core`, actual import sites | ~15 non-test source files import types/values (`fileStore`, `dailyCapMeter`, `paretoRank`, `validateCandidateSize`, `redactRationale`, `GepaConfigSchema`, etc.) plus 8 files under `evals/` | `dev-team/scripts/lib/gepa/{capture-failure-trial.ts:37-38, run-with-lock.ts:19, optimize-runner.ts:42-43, candidate-generator-aiplugin.ts:43-45, mine-reviewer-bug-corpus.ts:20, load-config.ts:3, gepa-killswitch-cmds.ts:25, history.ts:2, capture-tee.ts:24-25, gepa-optimize-cmd.ts:33, auto-merge-gate.ts:38, adapt-artifact.ts:8}`; `dev-team/evals/{cli.ts:17, lib/with-budget.ts:23-24, lib/run-eval.ts:19, lib/judge.ts:15,30, lib/meter.ts:11-12, providers/{azure-openai,claude-p,bedrock,generic-openai,ollama,gemini,groq}.ts}` |

### Hidden edges — no declared dependency, coupling via filesystem path / CLI-spawn / config convention

| Edge | Mechanism | Evidence |
|---|---|---|
| dev-team `/crew:parallel` → runner-plugin CLI | Slash-command prose instructs the agent to locate and spawn runner-plugin's CLI script as a subprocess: reads `LOOP_ROOT` env var or `~/.claude/plugins/installed_plugins.json`, constructs `${LOOP_ROOT}/scripts/loop.mjs`, and invokes `auto --dry-run`, `dispatch prepare`, `dispatch finalize` verbs | `dev-team/commands/parallel.md:22-26` (path resolution), `:29,35,43` (spawn invocations) |
| dev-team `/crew:orchestrate-slice` Step 2.5 → runner-plugin CLI + stale preset path | Bash-block in the command markdown greps dev-team's own `.claude/loop.json` for a `"preset"` key, then invokes `${LOOP_ROOT}/scripts/loop.mjs resolve-skills --preset ${LOOP_ROOT}/scripts/presets/${PRESET_NAME}.json` three times (fe/be/single variants) | `dev-team/commands/orchestrate-slice.md:139` (`PRESET_NAME` grep), `:149-152`, `:154-157`, `:160-163` (three `loop.mjs resolve-skills --preset scripts/presets/...` spawns) |
| dev-team reads runner-plugin-owned `.claude/loop.json` directly, no shared schema | Direct `fs.readFile`/`JSON.parse` of `.claude/loop.json` from 4 independent sites, each reading a different subset of keys | `dev-team/scripts/lib/models/resolve-model.ts:1-28` (comment-documented deliberate mirror of `runner-plugin/src/scripts/lib/model-router.mts`, consumed via `scripts/crew.ts` per line 19-20); `dev-team/scripts/lib/memory/inject-recall.ts:30,50-55` (`LOOP_CONFIG_PATH`, `loadMemoryConfig`); `dev-team/scripts/lib/cost-watch.ts:112-115` (reads `loop.cost.ceilingUsd`) |
| dev-team `memory` config schema reconciled against runner-plugin's memory-bridge keys, by doc not code | Zod schema comment records a key-collision negotiation with "runner-plugin's live memory-bridge keys" resolved via a cross-repo research doc | `dev-team/scripts/lib/memory/schema.ts:6-10`, pointing at `dev-team/docs/research/2026-07-06-memory-bridge-reconciliation.md` |
| dev-team `feature-flag-lite.ts` mirrors a runner-plugin hook pattern by name | Comment states the resolution logic mirrors `runner-plugin's hooks/feature-flag-lite.mjs` | `dev-team/scripts/lib/telemetry/feature-flag-lite.ts:15` |
| dev-team references open runner-plugin GitHub issues as fix-forward markers (cross-repo issue-tracker coupling, not code) | Comments cite `runner-plugin issue #360` and `runner-plugin#324` as the origin/tracking of behavior this code compensates for | `dev-team/scripts/lib/artifacts/write.ts:758`; `dev-team/scripts/lib/gepa/capture-failure-trial-guard.ts:33`; `dev-team/scripts/lib/gepa/guarded-fire.ts:2`; `dev-team/scripts/lib/memory/astramem-provider.ts:10` |
| dev-team `capture-failure-trial.ts` names `astragenie/plugins-common` as a pending migration target | Comment references the plugins-common repo by name as where GEPA capture logic should eventually move | `dev-team/scripts/lib/gepa/capture-failure-trial.ts:29` |

### Internal layers (within dev-team)

| Edge | Mechanism | Evidence |
|---|---|---|
| `hooks/lib/*` → `scripts/lib/*` | 10 hook-layer files statically import from the `scripts/lib` tree (`features-service.ts`, `cost-hygiene/state.ts`, `cost-hygiene/decide.ts`, `dispatch-timing.ts`, `subagent-return/{check,incomplete-detector}.ts`, `memory/capture-learning.ts`, `preflight/checks.ts`, `models/resolve-model.ts`) | `dev-team/hooks/lib/check-redundant-read.ts:11-13`; `dev-team/hooks/lib/bash-gate-timer-tap.ts:7`; `dev-team/hooks/lib/dispatch-timing-pre-tap.ts:5`; `dev-team/hooks/lib/check-task-update-burst.ts:14`; `dev-team/hooks/lib/check-subagent-return.ts:5-13`; `dev-team/hooks/lib/preflight-shell.ts:5-6`; `dev-team/hooks/lib/model-routing-enforce.ts:35`; `dev-team/hooks/lib/dispatch-handle-store.ts:10`; `dev-team/hooks/lib/record-edit.ts:15-16`; `dev-team/hooks/lib/record-read-content.ts:11-12` |
| `scripts/lib/*` → `hooks/*` or `scripts/lib/*` → `commands/*` (reverse-direction check) | Clean — checked all `.ts` files under `scripts/` for `from "../hooks`, `from "../../hooks`, `from "../commands`, `from "../../commands` patterns: 0 matches |
| `scripts/lib/*` → `scripts/crew.ts` (entry point) (reverse-direction check) | Clean — 0 matches for `from "../crew(.ts)?"` or `from "../../scripts/crew"` under `scripts/lib/` |

### Import cycles

No cycle demonstrated. Cycle detection was limited to the specific pairs above (checked forward and reverse direction for the `hooks/lib` ↔ `scripts/lib` and `scripts/lib` ↔ `commands`/`crew.ts` boundaries only); a full transitive-closure cycle sweep of all ~408 non-`node_modules` TS/JS files was not run in this pass.

## Dimensions 3-5: exception handling, provider seams, DI/testability

<!-- agent: dev-team:err+seams+di -->

This confirms the factory-registry DI pattern. Now I have all evidence needed. Compiling the final report.

## Dimension 3: Exception handling comparison (dev-team)

**Catch-block census** (parsed via brace-matched AST-lite scan over `scripts/`, `hooks/`, `evals/`, `skills/`, `agents/`, `tests/` — the full non-node_modules `.ts`/`.mjs` surface):

- **Total catch blocks: 299** (271 non-test, 28 test)
- **Empty / no-op catch bodies (blank or comment-only): 49** (45 non-test, 4 test) — i.e. ~17% of all catch blocks (~17% of non-test catches) do nothing observable on error.

Representative swallowed catches (non-test, full body is empty or comment-only):
- `dev-team/scripts/lib/telemetry/otel-bridge.ts:102-104` — `catch { // ignore }` around a package-version read.
- `dev-team/scripts/lib/gepa/guarded-fire.ts:56-58` — `catch { // Fire-and-forget: never propagate. }`.
- `dev-team/scripts/lib/artifacts/write.ts:852-854` and `:875-877` — two `catch { // never propagate }` blocks around learning/trial capture calls.
- `dev-team/scripts/lib/memory/capture-learning.ts:50` — empty/comment-only catch.
- `dev-team/scripts/lib/session-cost-scanner.ts:73` — empty/comment-only catch.
- `dev-team/scripts/lib/workflow-state.ts:176`, `:190` — empty/comment-only catches inside lock-release paths.
- `dev-team/hooks/hook-error.ts:20` and 9 more under `dev-team/hooks/lib/*.ts` (`check-redundant-read.ts:31`, `check-subagent-return.ts:49,70`, `check-task-update-burst.ts:64,93`, `dispatch-handle-store.ts:54`, `dispatch-timing-pre-tap.ts:49`, `preflight-shell.ts:24`, `record-edit.ts:34`, `record-read-content.ts:30`) — hook-tap modules whose stated contract is "hooks must never block Claude," so swallowing is the documented intent, not an oversight (see e.g. `dev-team/hooks/pre-tool-use-agent.ts:1-3` header comment "Always exits 0 — never blocks").
- `dev-team/evals/providers/bedrock.ts:85` and `:98` — `catch { /* fall through */ }`.
- `dev-team/scripts/lib/gepa/candidate-generator-aiplugin.ts:75`, `dev-team/scripts/lib/gepa/capture-tee.ts:62`, `dev-team/scripts/lib/gepa/capture-failure-trial.ts:104`, `dev-team/scripts/lib/gepa/gepa-optimize-cmd.ts:170`, `dev-team/scripts/lib/gepa/gepa-killswitch-cmds.ts:244`, `dev-team/scripts/lib/gepa/observability-events.ts:120`, `dev-team/scripts/lib/gepa/soak-dispatcher-hook.ts:150`, `dev-team/scripts/lib/gepa/auto-pr.ts:102` — GEPA-store append paths, all comment-annotated "never propagate"/"fire-and-forget."
- `dev-team/scripts/lib/telemetry/feature-flag-lite.ts:58`, `dev-team/scripts/lib/dispatch/resolve-token.ts:52`, `dev-team/scripts/lib/dispatch-timing-reader.ts:181`, `dev-team/scripts/lib/cost-hygiene/state.ts:189`, `dev-team/scripts/lib/cost-judge-aggregator.ts:130,287`, `dev-team/scripts/lib/cost-advisor.ts:169`, `dev-team/scripts/lib/cost-advisor-rules.ts:467`, `dev-team/scripts/render-universal-skills.ts:112,352`, `dev-team/scripts/validate-routing-table.ts:121`, `dev-team/scripts/validate-slices.ts:60` — remaining non-test empty catches.

Non-empty (log-and-continue / wrap / rethrow / fallback-value) catches are the majority (~83%). Spot-checked non-empty examples: `dev-team/scripts/lib/claims.ts:134-138` (`catch (err) { ... if (nodeErr.code !== "EEXIST") { throw err; } ... }` — rethrow-on-condition), `dev-team/scripts/lib/workflow-state.ts:387-389` (`catch (e) { return err(e instanceof Error ? e : new Error(String(e))); }` — wrap-to-Result), `dev-team/scripts/lib/memory/astramem-provider.ts:231-234` (`catch { return []; }` — fallback value, comment "Best-effort: never throw from recall()").

**Custom error classes** — 14 distinct classes found, every one independently `extends Error` (no shared base/taxonomy class):
- `dev-team/evals/lib/with-budget.ts:32` — `BudgetExceededError`
- `dev-team/evals/lib/model-profile.ts:44` — `ModelProfileError`
- `dev-team/scripts/render-universal-skills.ts:28` — `SourceSkillNotFoundError`
- `dev-team/scripts/render-universal-skills.ts:38` — `RenderedBodyTooLargeError`
- `dev-team/scripts/lib/workflow-config.ts:22,31,38,45,54,69` — `WorkflowConfigNotFoundError`, `WorkflowConfigParseError`, `WorkflowConfigShapeError`, `UnknownWorkflowError`, `UnsupportedSkipExpressionError`, `EnvSubstitutionError` (6 classes in one file)
- `dev-team/scripts/lib/gepa/auto-pr.ts:80` — `GhAuthError`
- `dev-team/scripts/lib/gepa/branch-protection-check.ts:32,39` — `GhAbsentError`, `GhApiError`
- `dev-team/scripts/lib/telemetry/cost-report-loader.ts:18` — `AggregateReportSkipped`

Call-site counts (grep occurrences of the class names across `.ts`, including definition + throw + catch/instanceof sites; test files included since these classes are asserted-on in tests):
`SourceSkillNotFoundError`/`RenderedBodyTooLargeError` region: `dev-team/scripts/render-universal-skills.ts` 13 occurrences + `dev-team/tests/render-universal-skills.test.ts` 6; `workflow-config.ts` errors: 25 occurrences in-file + 13 in `dev-team/tests/scripts/lib/workflow-config.test.ts` + 5 in `dev-team/tests/scripts/lib/workflow-config.env-sub.test.ts`; `GhAuthError`/`auto-pr.ts`: 7 in-file + 7 in `dev-team/tests/gepa/auto-pr-shape.test.ts`; `GhAbsentError`/`GhApiError`/`branch-protection-check.ts`: 14 in-file + 8 in `dev-team/tests/gepa/branch-protection-missing.test.ts`; `AggregateReportSkipped`/`cost-report-loader.ts`: 5 in-file + 4 in `dev-team/tests/telemetry-cost-report-loader.test.ts`; `BudgetExceededError`/`with-budget.ts`: 4 in-file + 7 in `dev-team/tests/evals/with-budget.test.ts` + 3 in `dev-team/tests/evals/cross-pipeline-cap.test.ts`; `ModelProfileError`/`model-profile.ts`: 10 in-file + 7 in `dev-team/tests/model-profile.test.ts`.

**String throws**: `throw "..."` / `throw 'literal'` — zero matches across `.ts` source (`grep -R "throw ['\"\`]" --glob=*.ts` returned no matches).

**Exit-code discipline**: `process.exit(N)` non-test occurrences: 68 total across `.ts` (via grep). All are in files that are genuine CLI/hook entry points guarded by a `main()`-style invocation or an `isMainEntry()` check, e.g.:
- `dev-team/scripts/crew.ts` (23 call sites, e.g. lines 524,540,555,571,584,729,746,759,802,883,928,935,1235,1320,1334,1347,1361,1370,1383,1394,1403) — the CLI entrypoint.
- `dev-team/hooks/*.ts` (13 files, one `process.exit(0)` each, e.g. `dev-team/hooks/pre-push-verifier.ts:198` — comment "hook errors must never block Claude") — hook shims, one per file.
- `dev-team/scripts/validate-*.ts` (9 files: `validate-ux-spec.ts`, `validate-syntheses.ts`, `validate-slices.ts`, `validate-contracts.ts`, `validate-bundles.ts`, `validate-backlog-drift.ts`, `validate-all.ts`, `validate-adr-template.ts`, `validate-agents.ts` via `validate-manifests.ts` wrapper) — standalone CI-gate scripts.
- `dev-team/scripts/lib/parallel-gates.ts:157` — inside `if (isMainEntry())` guard (`:146-151` checks `process.argv[1]` basename before allowing `process.exit`), so the exported functions (`aggregateGateExitCodes`, `emitParallelGatesBlock`) themselves never call `process.exit`.
- `dev-team/scripts/lib/installer/templates.ts:405,412,422,428,434` — these five `process.exit(0)` calls are **not live dev-team code**; they sit inside a template-literal string (`GIT_GATE_REMINDER_TEMPLATE`, opened at `dev-team/scripts/lib/installer/templates.ts:298`) that the installer writes out verbatim as a *target repo's* hook script. Citing this distinctly so it isn't miscounted as a `scripts/lib/` violation.

dev-team has no written rule banning `process.exit` in library functions (unlike runner-plugin's CLAUDE.md); no counter-evidence of a stated-and-violated rule was found — every located `process.exit` sits behind a main-entry guard.

**Result-shaped returns vs exceptions — files mixing both styles**: `dev-team/scripts/lib/result.ts:1-23` defines the shared `Result<T,E>` type with a documented policy in its header comment (`:1-9`: "Use for: validation errors... Do NOT use for: infrastructure errors... those still throw and are caught at the CLI entrypoint"). Real call sites importing `ok`/`err`: `dev-team/scripts/lib/workflow-state.ts:17`, `dev-team/scripts/lib/deployment-guidance/write.ts:6-7`, `dev-team/scripts/lib/claims.ts:3`, `dev-team/scripts/lib/artifacts/write.ts:9-10`, `dev-team/scripts/lib/approvals.ts:4`, `dev-team/scripts/lib/installer.ts:9`, `dev-team/scripts/lib/installer/global.ts:16` (7 non-test call sites).

Every one of these 7 files also contains direct `throw new Error(...)` statements in the same file:
- `dev-team/scripts/lib/workflow-state.ts` — Result import at `:17`; throws at `:163,184,334,365,425,470,506,511`. Example: `markWorkflowBadge` (`:357-390`) is typed `Promise<Result<WorkflowRun | null, Error>>` yet its body `throw new Error("Workflow badge is required.")` at `:365`, caught and converted at `:387-389` (`catch (e) { return err(...); }`) — a deliberate throw-internally/convert-at-boundary pattern, not incoherent mixing.
- `dev-team/scripts/lib/claims.ts` — Result import at `:3`; `toRepoRelative` (`:104-111`) throws a plain `Error` at `:108`; `acquireClaimsLock` throws at `:137,153`. `claimFiles` (`:232-285`, typed `Promise<Result<ClaimResult, Error>>`) calls `toRepoRelative` internally and converts any throw to `err(...)` at `:282-284` — same boundary-conversion pattern.
- `dev-team/scripts/lib/artifacts/write.ts` — Result import at `:9-10`; throws at `:696` (`Unsupported artifact kind`).
- `dev-team/scripts/lib/installer.ts` — Result import at `:9`; throws at `:76,92`.

No file was found where a Result-returning function propagates an *uncaught* throw to its own caller (i.e., the mixing observed is consistently the "throw inside, catch-and-wrap at the function boundary" idiom, not a leaking mix).

## Dimension 4: Provider / integration-seam usage (dev-team)

**astramem seams — two distinct seams for two distinct consumers:**

1. **Code-level (memory-capture subsystem)**: `dev-team/scripts/lib/memory/astramem-provider.ts:15` imports `resolveWireProvider` from the shared `@astragenie/astramem-client` package. Header comment at `:1-13` states explicitly: "Provider resolution is delegated to the shared `@astragenie/astramem-client` package's `resolveWireProvider()` ... this module no longer hand-rolls dynamic imports of astramem-plugin's provider factories ... Never shells the CLI ... and never hand-rolls an MCP client." `dev-team/scripts/lib/memory/resolve-provider.ts:8,20-24` routes `provider: "astramem"` config to `astramemProvider()`. Package dependency declared at `dev-team/package.json:45` (`"@astragenie/astramem-client": "^0.1.0"`) — resolves via a real registry (`dev-team/bun.lock:29` shows a `sha512-...` integrity hash, not a `file:`/`link:` spec), with `dev-team/.npmrc:1-4` overriding the `@astragenie` scope to `https://registry.npmjs.org/` so this package resolves off GitHub Packages. No junction workaround needed for this dependency in this repo.
   - DI test seam: `AstramemProviderOptions.__resolveRemote` (`dev-team/scripts/lib/memory/astramem-provider.ts:50-58,176`) — optional injectable override used only by tests (`dev-team/tests/memory-provider-astramem.test.ts:225,288,315`).
   - `dev-team/tests/memory-provider-astramem.test.ts:35,56,66` also imports `_resetResolveCache` directly from `@astragenie/astramem-client` to reset the client's own process-lifetime cache between tests.

2. **Agent-prompt-level (LLM-facing memory discipline)**: `dev-team/skills/universal/memory-keeper/SKILL.md:28-31` instructs agents to "reach it via the MCP tools (or `/astramem:recall` / `/astramem:remember`), never a raw `astramem` CLI." Referenced also in `dev-team/agents/document-writer.md` and `dev-team/skills/universal/builder-mindset/SKILL.md`. This is a prose/prompt-level seam, not code — separate contract surface from seam 1.

**crew ↔ runner-plugin coupling (hidden edges, dev-team side)** — dev-team explicitly documents that it has no importable dependency on runner-plugin and instead hand-mirrors logic:
- `dev-team/scripts/lib/models/resolve-model.ts:1-28` — header states "dev-team has no npm/workspace dependency on runner-plugin — they are separate plugin repos with no shared package boundary today ... This module is a deliberate, minimal, self-contained MIRROR of that resolver's semantics ... If runner-plugin's model-router semantics change, mirror the change here too rather than let the two drift apart silently." Also cites `runner-plugin/src/scripts/lib/model-router.mts` by path (`:8`).
- `dev-team/tests/resolve-model.test.ts:4-5` repeats the same cross-repo citation.
- `dev-team/scripts/lib/memory/schema.ts:7` references "the collision between runner-plugin's live memory-bridge keys."
- `dev-team/scripts/lib/memory/inject-recall.ts:11` — "Format: reuses/extends the runner-plugin bridge's EXISTING [format]."
- `dev-team/scripts/lib/telemetry/feature-flag-lite.ts:15` — "Mirrors runner-plugin's hooks/feature-flag-lite.mjs pattern."
- `dev-team/scripts/lib/artifacts/write.ts:758` and `dev-team/scripts/lib/gepa/guarded-fire.ts:1-2` and `dev-team/scripts/lib/gepa/capture-failure-trial-guard.ts:33` and `dev-team/tests/gepa/write-artifact-capture-guard.test.ts:1` and `dev-team/tests/gepa/guarded-fire.test.ts:1` — all cite "runner-plugin issue #360" as the origin of a fix (cross-repo GitHub issue tracking, not code coupling).
- `dev-team/scripts/lib/memory/astramem-provider.ts:9-10` — "shared verbatim with runner-plugin's memory-transport... stale per runner-plugin#324."
- `dev-team/scripts/validate-syntheses.ts:7` — comment referencing "runner:close (runner-plugin, out of S1a scope)."

No occurrence of the literal strings `astramemory-plugin` or `plugins-common` inside dev-team's `.ts` source outside of `@astragenie/*` package names and the one gepa-core forward-looking comment below; no direct filesystem path reads/greps into sibling-repo trees were found (only prose comments citing issue numbers/paths, and one npm dependency).

**Forward cross-repo dependency intent (not yet realized)**: `dev-team/scripts/lib/gepa/capture-failure-trial.ts:13-30` — comment documents that `@astragenie/gepa-core`'s `TrialSchema` (pinned `dev-team/package.json:47` at `0.7.0`) lacks a `"production"` enum value, works around it via `input.capture_origin`, and says "Follow-up: extend gepa-core's Trial.source enum with 'production' upstream (astragenie/plugins-common, cross-repo) and switch this module over once that ships" — a documented pending upstream ask against the plugins-common package itself.

**Agent-dispatch / LLM-provider seams:**
- **Eval judge provider abstraction** — a genuine interface-based seam: `dev-team/evals/lib/judge.ts:15` re-exports `LLMJudge` from `@astragenie/gepa-core`; `:30` defines `JudgeProvider` as `LLMJudge & {...}` (marked `@deprecated` compat alias, `:21-25`); `:91` defines `JudgeFactory`; `:139-142` defines `JUDGE_REGISTRY: Record<string, (config?) => Promise<JudgeProvider>>` with ≥7 factory entries (comment at `:136` — "AC1 (SLICE-B3): Object.keys(JUDGE_REGISTRY).length >= 7"). Seven concrete implementations under `dev-team/evals/providers/`: `claude-p.ts` (244 lines, `spawn`s `claude -p` subprocess per header comment `:1-3` — "Subscription-billed; no API key needed"), `bedrock.ts` (179 lines), `azure-openai.ts` (148 lines), `gemini.ts` (84 lines), `generic-openai.ts` (70 lines), `groq.ts` (80 lines), `ollama.ts` (71 lines) — each implements the shared `JudgeProvider`/`LLMJudge` contract (`dev-team/evals/providers/claude-p.ts:18-19` imports both types). Each provider file's header repeats "Module boundary: MUST NOT import from agents/, scripts/, src/, hooks/, commands/" (e.g. `dev-team/evals/providers/claude-p.ts:4`, `dev-team/evals/lib/langfuse-emit.ts:3`) — an enforced-by-comment (not by tooling, per what was observed) module-boundary rule.
- **Langfuse** — bespoke, no SDK: `dev-team/evals/lib/langfuse-emit.ts:1-23` header states "raw fetch, no SDK dependency," posts to 4 REST endpoints directly, auth via HTTP Basic from `LANGFUSE_PUBLIC_KEY`/`LANGFUSE_SECRET_KEY` env vars (`:18`), host from `LANGFUSE_HOST` env (`:19`). No shared HTTP-client wrapper reused from elsewhere in the repo for this — a standalone bespoke integration.
- **Peer-agent dispatch (Claude Code `Agent` tool, not an HTTP/SDK seam)**: `dev-team/scripts/lib/dispatch/peer_
dispatch-allowlist.ts` — `dev-team/scripts/lib/dispatch/peer-dispatch-allowlist.ts:16-27` is a single `PEER_DISPATCH_ALLOWLIST` `Set` of agent names that may hold the `Agent` tool; header comment `:1-10` states this used to be hand-duplicated in `dev-team/scripts/validate-agents.ts` and `dev-team/scripts/validate-dispatch-graph.ts` "with a 'must be kept in sync' comment as the only enforcement" before being consolidated here (both validators now import it — an intra-repo dedup, not a cross-repo one).
- **`crew:<name>` token resolution**: `dev-team/scripts/lib/dispatch/resolve-token.ts:1-105` — single `createTokenResolver()` seam consumed by validators; header (`:1-20`) documents the same "two ground truths for one concept" history (validate-agent-refs.ts and validate-configs.ts previously hand-rolled divergent resolvers) that peer-dispatch-allowlist.ts documents, now consolidated to one file.
- Agent dispatch itself (i.e., actually invoking a subagent) is not a dev-team code-level API call anywhere found — it is performed by Claude Code's own `Agent`/`Task` tool at runtime; dev-team's code only computes *which* dispatch is legal (`resolve-token.ts`, `peer-dispatch-allowlist.ts`) and times it (`dev-team/hooks/lib/dispatch-timing-pre-tap.ts`, `dev-team/scripts/lib/dispatch-timing.ts`), it never wraps or abstracts the dispatch call itself.

## Dimension 5: Dependency injection & testability (dev-team)

**How modules receive dependencies — mixed, three patterns coexist:**

1. **Parameter passing (dominant pattern in `scripts/lib/`)** — most functions take `repoPath: string` and an options object as explicit arguments rather than reading global state, e.g. `dev-team/scripts/lib/memory/resolve-provider.ts:14` (`resolveProvider(rawConfig, repoPath)`), `dev-team/scripts/lib/memory/astramem-provider.ts:169-171` (`astramemProvider(repoPath, options)`), `dev-team/scripts/lib/claims.ts:232-236` (`claimFiles(repoPath, filePaths, options)`).

2. **Factory + injectable-override seam (explicit test-only escape hatch)** — `dev-team/scripts/lib/memory/astramem-provider.ts:50-58` — `AstramemProviderOptions.__resolveRemote?: () => Promise<RemoteHandle | null>` is documented (`:50-58`) as "Internal test seam ... Never set by production callers." Consumed only from `dev-team/tests/memory-provider-astramem.test.ts:288,315`. Same pattern name reused/cross-referenced at `dev-team/scripts/lib/artifacts/write.ts:759` ("Mirrors the `__resolveRemote` seam in astramem-provider.ts").

3. **Registry-of-factories (async, lazy-loaded)** — `dev-team/evals/lib/judge.ts:139-154` `JUDGE_REGISTRY` maps provider-id strings to async factory functions that dynamically `import()` the concrete provider module only when invoked (`dev-team/evals/lib/judge.ts:97-101` `loadGeneric()` example) — comment at `:97` states the reason is "Lazy imports to keep this file below 120 lines and avoid top-level await."

**Module-scope mutable singletons (test-visibility via backdoor getter, not DI):**
- `dev-team/scripts/lib/artifact-cache.ts:9` — `const _cache = new Map<string, CachedArtifact>();` at module scope, mutated by `getCachedArtifact()` (`:27-39`), with no way to inject an alternate cache instance into a consumer — only a test-only escape hatch `_cacheForTesting()` (`:41-43`) that reaches into the live singleton, consumed by `dev-team/tests/artifact-cache.test.ts:7,33`.
- `dev-team/scripts/lib/dir-cache.ts:4` — identical pattern (`const _cache = new Map(...)`, `_cacheForTesting()` at `:43`), consumed by `dev-team/tests/dir-cache.test.ts:7,18,33`.
- Duplicate `.mjs` copies of both exist: `dev-team/scripts/lib/artifact-cache.mjs:12` and `dev-team/scripts/lib/dir-cache.mjs:10`, each with their own `const _cache = new Map()`.

**Worst import-time side effect found**: none of the actual executed modules (`scripts/lib/**`, `hooks/**`, `evals/**`) perform I/O or process-environment reads at module top level outside a function body — every hook entry point (`dev-team/hooks/pre-tool-use-agent.ts:12-26`, `dev-team/hooks/record-edit.ts:14-25`, `dev-team/hooks/otel-stop.ts:22-...`, `dev-team/hooks/pre-push-verifier.ts:24-...`) gates all work inside an `async function main()` invoked once at file bottom via `main().catch(...)`. The only top-level side-effecting code resembling an import-time read (`const input = JSON.parse(process.env.HOOK_PAYLOAD || "{}")` at what would be `dev-team/scripts/lib/installer/templates.ts:403`, plus `require("node:fs")`/`require("node:path")` at `:307-308`) is **not live code** — it is text inside the `GIT_GATE_REMINDER_TEMPLATE` template-literal string (opens `dev-team/scripts/lib/installer/templates.ts:298`) that the installer writes out to a *target* repo's hook file; `templates.ts` itself has no import-time side effect.

**Test coping strategy:**
- Real filesystem in OS temp dirs is the dominant strategy: `mkdtempSync`/`mkdtemp(` appears in 115 test files (`grep -rl "mkdtempSync\|mkdtemp(" tests/`). Shared helper: `dev-team/tests/helpers/cli-fixtures.ts:12-14` — `makeTempDir(prefix)` wraps `fs.mkdtemp(path.join(os.tmpdir(), prefix))`; also exports a `crew.ts` CLI-spawn helper (`:8-10`, `execFile`+`cliPath`) for out-of-process integration-style tests, and `loadState()` (`:16-22`) that reads back `.claude/state/crew/workflow-state.json` from a temp repo.
- `mock()`/`vi.mock`/`jest.mock` usage is comparatively rare (4 files match), concentrated in HTTP-boundary tests: `dev-team/tests/evals-langfuse-emit.test.ts:125,146,173,202,233,251` (mocks `globalThis.fetch`), `dev-team/tests/evals-cloud-providers.test.ts:45,100,179,207`, `dev-team/tests/evals-providers.test.ts:26,32,105,190,313,321,369,373` (mocks both `fetch` and `LLMJudge.evaluate`/`judge` methods directly).
- Explicit DI test seams (as opposed to temp-dir integration or fetch-mocking) exist but are narrow: `__resolveRemote` (memory) and gepa-core's own `_resetResolveCache` (imported directly from the package in `dev-team/tests/memory-provider-astramem.test.ts:35,56,66`) are the only two found; most `scripts/lib/` unit-sized logic (e.g. `claims.ts`, `workflow-state.ts`, `approvals.ts`) is instead tested by driving the real function against a temp-dir repo rather than injecting fakes for its `fs` calls — i.e. missing FS-level DI forces integration-style tests for logic that is otherwise pure aside from the `fs` calls.

**`plugin-kernel`**: dev-team has no dependency on, and no reference to, a `plugin-kernel` package anywhere in its `package.json`, `bun.lock`, or `.ts` source (`grep -rn "plugin-kernel" dev-team` outside this instruction file returns nothing) — clean, checked `package.json`, `bun.lock`, and all `.ts` source under `scripts/`, `hooks/`, `evals/`, `tests/`. No basis in this repo to answer the "does plugin-kernel behave like a framework" question; that requires evidence from `plugins-common` itself, out of this assignment's scope.

## Dimensions 6-8: boundaries, bad practices, toggles/config/churn

<!-- agent: dev-team:bounds+practices+config -->

## Dimension 6 — Modularization & boundaries (dev-team)

### Fan-out: `scripts/crew.ts` COMMANDS registry

`scripts/crew.ts` is a 1520-line CLI entry point. Lines 713–1479 define a `COMMANDS` registry object (`dev-team/scripts/crew.ts:713-1479`, comment at `:710-712` calling it "the table [that] replaces a 240-line else-if chain") containing **46 command handlers**, each dynamically importing from a distinct lib module. Total `await import(...)` call sites inside `crew.ts`: **57** (`dev-team/scripts/crew.ts`, counted via grep). The imported modules span domains with no shared abstraction between them:

- repo lifecycle: `./lib/installer.ts` (`crew.ts:716,720,725,735`)
- file coordination: `./lib/claims.ts` (`:740,751,764,768`), `./lib/approvals.ts` (`:773,784,793`)
- reporting: `./lib/briefing.ts` (`:812`), `./lib/fleet.ts` (`:829`), `./lib/scope-estimate.ts` (`:816`)
- deployment metadata: `./lib/deployment-guidance/{read,write}.ts` (`:836,840`)
- workflow-state mutation: `./lib/workflow-state.ts` (`:866,871`)
- artifact writing: `./lib/artifacts/write.ts` — imported **8 separate times** across distinct handlers (`:656,889,961,1008,1037,1076,1104,1138`)
- build bundling: `./lib/build-bundle/assemble.ts` (`:629,916`)
- cost accounting (3 separate subsystems): `./lib/cost-advisor.ts` (`:473,1171`), `./lib/cost-watch.ts` (`:1198`), `./lib/cost-setup.ts` (`:1211`)
- feature registry: `./lib/features-service.ts` (`:1218,1465`)
- agent telemetry: `./lib/agent-stats-aggregator.ts` (`:1223`), `./lib/agent-registry.ts` (`:1283`)
- GEPA eval/optimize subsystem — **7 distinct subcommands**: `./lib/gepa/history.ts` (`:1312`), `./lib/gepa/eval.ts` (`:1325`), `./lib/gepa/mine-reviewer-bug-corpus.ts` (`:1339`), `./lib/gepa/gepa-optimize-cmd.ts` (`:1352`), `./lib/gepa/gepa-killswitch-cmds.ts` (`:1366,1375,1388,1399`)
- memory/astramem integration: `./lib/memory/inject-recall.ts` (`:1412`), `./lib/memory/astramem-provider.ts` (`:1429`), `./lib/memory/drift-check.ts` (`:1430`)
- model routing: `./lib/models/resolve-model.ts` (`:1464`)

One file dispatches to ~25 unrelated subsystem modules (GEPA optimization, cost accounting, memory injection, file-claim coordination, deployment guidance, artifact writing) with no grouping layer between the CLI parser and the subsystems.

### Fan-in: `scripts/lib/features-service.ts`

Statically imported (`from "..."`) by **11 non-test files**, all under `hooks/`: `dev-team/hooks/pre-tool-use-model-enforce.ts`, `hooks/lib/check-subagent-return.ts`, `hooks/pre-tool-use-bash-gate.ts`, `hooks/pre-push-verifier.ts`, `hooks/post-tool-use-bash-gate.ts`, `hooks/lib/check-task-update-burst.ts`, `hooks/lib/record-read-content.ts`, `hooks/lib/preflight-shell.ts`, `hooks/lib/record-edit.ts`, `hooks/lib/check-redundant-read.ts`, plus `scripts/crew.ts` (dynamic import, `:1465`) — 12 consumers total, plus `tests/features-service.test.ts`.

### Dead exports (zero call sites anywhere in `scripts/`, `hooks/`, `tests/`, `evals/`)

Found via exhaustive cross-check of every `export {function,const,class,type,interface}` declaration in `scripts/lib/**/*.ts` (642 unique exported names) against whole-repo word-boundary occurrence counts. 9 names occur exactly once — only at their own declaration site:

| Export | Location |
|---|---|
| `GATE_AGENTS` | `dev-team/scripts/lib/dispatch/peer-dispatch-allowlist.ts:49-54` |
| `LegacyBuilderName` (type) | `dev-team/scripts/lib/build-bundle/types.ts:14` (sibling value `LEGACY_BUILDER_NAMES` at `:13` IS consumed, at `scripts/validate-bundles.ts:9,25`) |
| `ParallelDispatch` (type) | `dev-team/scripts/lib/workflow-config.ts:240` |
| `ReviewArtifact` (type) | `dev-team/scripts/lib/schemas.ts:156` |
| `ValidationArtifact` (type) | `dev-team/scripts/lib/schemas.ts:178` |
| `buildAutoMergePolicy` | `dev-team/scripts/lib/gepa/auto-merge-gate.ts:318` |
| `defaultSoakJsonPath` | `dev-team/scripts/lib/gepa/auto-merge-gate.ts:343` |
| `parseModelsConfig` | `dev-team/scripts/lib/models/schema.ts:38` |
| `startWorkflowRun` | `dev-team/scripts/lib/workflow-state.ts:220` |

(`GATE_AGENTS` sits in the same file/same export block as `PEER_DISPATCH_ALLOWLIST`, which the file's own header comment at `dev-team/scripts/lib/dispatch/peer-dispatch-allowlist.ts:1-9` says is consumed by both `scripts/validate-agents.ts` and `scripts/validate-dispatch-graph.ts` — those two do NOT import `GATE_AGENTS`.)

### Implicit public surface (cross-repo contract points found on the dev-team side)

- `.claude-plugin/plugin.json:3` — `"version": "0.53.0"`. This is the field runner-plugin's `MIN_CREW_VERSION` pins against (per runner-plugin's own `CLAUDE.md`); no schema/type contract, plain JSON field.
- `commands/orchestrate-slice.md:139,151,156,162` — greps `.claude/loop.json` for a `"preset"` key and constructs the path `${LOOP_ROOT}/scripts/presets/${PRESET_NAME}.json` (`:151,156,162`). This is a filesystem-path assumption about another repo's tree, not a declared dependency.
- `docs/routing-table.yaml` / `docs/routing-table.md` — machine-readable source rendered by `scripts/render-routing-table.ts:24-25,191,197`, with a `--check` staleness gate. No consumer outside this repo was verifiable from dev-team alone (assignment scope excludes reading sibling repos).

### Vendored-vs-owned overlap (dead-weight check)

`agents/3rdparty/` contains 9 files, 3 of which name-overlap an owned agent's domain: `agents/3rdparty/frontend-developer.md` (254 lines) vs owned `agents/frontend-dev.md` (234 lines); `agents/3rdparty/refactoring-specialist.md` (282 lines) vs owned `agents/refactor.md` (216 lines). Current state: cross-references exist — `agents/uxdesigner.md:88` routes to `agents/3rdparty/frontend-developer.md`; `docs/routing-table.md:165` does the same. Grepped for the previously-documented "foreign Communication Protocol boilerplate" pattern (`docs/superpowers/specs/2026-07-04-crew-architecture-review-REPORT.md:101`) in the current file contents of `agents/3rdparty/{frontend-developer,mobile-developer,refactoring-specialist,database-architect}.md` — zero matches for `"Communication Protocol"`, `"context-manager"`, `"postgres-pro"`, `"tech-lead"`, `"reference-only"`/`"non-dispatchable"` — the boilerplate strip tracked in `.claude/artifacts/loop/backlog/done/SLICE-198-3rdparty-agent-repair.md` is no longer present in the working tree.

## Dimension 7 — Bad practices sweep (dev-team)

- **`@ts-ignore` / `@ts-nocheck`**: clean — 0 occurrences in any `*.ts` file repo-wide (checked all of `scripts/`, `hooks/`, `tests/`, `evals/`, `.claude/hooks/`).
- **`any`-density in non-test code**: checked `scripts/`, `hooks/`, `evals/` (34,772 total lines, excluding `*.test.ts`) for `: any`, `<any>`, `as any`. 2 real occurrences: `dev-team/scripts/crew.ts:891` (`const fields: any = {`) and `dev-team/scripts/lib/telemetry/otel-bridge.ts:129` (`resource: resource as any`). (A third grep hit, `dev-team/scripts/lib/workflow-config.ts:166`, is a comment substring "any_FAIL", not a type annotation — excluded.)
- **Repeated magic string — artifact-path prefix**: the literal path fragment `.claude/artifacts/crew` (as a string or as path-segment array `[".claude","artifacts","crew"]`) appears **52 times across 36 non-test files** (grep count on `scripts/`, `hooks/`, excluding `*.test.ts`), with each module defining its own local copy rather than importing a shared root. Examples: `dev-team/scripts/lib/artifacts/write.ts:705` (`const ARTIFACT_ROOT = [".claude", "artifacts", "crew"];`), `dev-team/scripts/lib/cost-advisor.ts:13-14` (`REPORTS_DIR_PARTS`, `LEGACY_REPORTS_DIR_PARTS`, both re-deriving the same prefix), `dev-team/scripts/lib/gepa/auto-pr.ts:275-276` (inlines the literal directly with no named constant at all). No shared `ARTIFACTS_ROOT`/`CREW_ARTIFACTS_DIR` constant exists anywhere in `scripts/lib` (grep for those names: 0 hits).
- **Badge-name strings**: centrally defined once in `dev-team/scripts/lib/workflow-state.ts:258` (`BADGE_TABLE`) and `:595-611` (`PENDING_BADGE_SPECS`, badges `review_required`, `validation_expected`, `dev_deploy_expected`, `prod_deploy_expected`, `blocked`, `escalated_to_dispatcher`). These same literal strings (`"review_required"`, `"validation_expected"`, `"dev_deploy_expected"`) also appear hardcoded in `dev-team/scripts/lib/installer/templates.ts` (template-scaffolding content for new repos, not logic duplication).
- **Silent config fallback masking misconfiguration**: `dev-team/scripts/lib/features-service.ts:149-162` (`isEnabled`) — when a feature name isn't found in the `FEATURES` registry, the fallback expression `FEATURES[feature as FeatureName]?.default ?? true` (`:162`) resolves to `true`. A misspelled/unregistered feature name silently evaluates as **enabled**, with no distinguishing signal from a correctly-registered feature defaulting to `true`. The function does emit a stderr diagnostic line (`:166`) but the diagnostic text is identical for "registered feature, default true" and "unregistered/typo'd feature name" cases.
- **Same toggle, two independent gate mechanisms** (self-documented in the registry's own descriptions): `otel-telemetry` requires BOTH `crew.json features["otel-telemetry"].enabled` AND the env var `CREW_OTEL_ENABLED=1` — stated at `dev-team/scripts/lib/features-service.ts:77` and enforced at `dev-team/scripts/lib/telemetry/config.ts:109` (`cfg.enabled === true && env["CREW_OTEL_ENABLED"] === "1"`). `bash-gate-telemetry` requires the registry flag to be true AND is separately short-circuited by `CREW_BASH_GATE_LOG=0` — stated at `features-service.ts:86`, enforced at `dev-team/hooks/post-tool-use-bash-gate.ts:16`, `hooks/pre-tool-use-bash-gate.ts:16`, and read again independently in `dev-team/scripts/lib/bash-gate-timer.ts:32`, `scripts/lib/cost-hygiene/cost-slice-handler.ts:118`, `scripts/lib/cost-hygiene/emit-cost-report.ts:39`.
- **Hand-authored `.mjs` beyond sanctioned scope**: not evaluated — dev-team has no equivalent "sanctioned exceptions" list to check against (that convention is runner-plugin-specific per its own `CLAUDE.md`); dev-team's own source is TypeScript-first (`scripts/*.ts`), with historical `scripts/*.mjs` files showing up only in 3-month git-log churn as deletions (see Dimension 8 churn table — `scripts/crew.mjs`, `scripts/lib/artifacts.mjs`, etc. no longer exist in the working tree, last touched 2026-06-07 to 2026-06-12).

## Dimension 8 — Feature-toggle / config audit + churn/stability (dev-team)

### Toggle inventory

| Toggle surface | File | Mechanism |
|---|---|---|
| `FEATURES` registry (11 flags: `cost-hygiene`, `redundant-read-stop`, `shell-preflight`, `subagent-inline-warn`, `push-verify`, `git-gate-block`, `otel-telemetry`, `bash-gate-telemetry`, `task-update-burst-warn`, `event-emit`, `model-routing`) | `dev-team/scripts/lib/features-service.ts:19-118` | typed const object, each with `version`/`default`/`scope`/`owner`/`since`; read via `isEnabled()` (`:149`) against `.claude/crew.json` `features.<name>.enabled` |
| `.claude/crew.json` | `dev-team/.claude/crew.json:1-6` | current repo instance sets `redundant-read-stop: false`, `subagent-inline-warn: true`, `shell-preflight: true` |
| `gepa.config.json` | `dev-team/gepa.config.json:1-40+` | separate JSON surface: `capture.enabled`, `runner.backend`, `judge.provider`/`model`, `optimize.paused`, `policy.*` thresholds — independent of `crew.json` |
| `models.yaml` | `dev-team/models.yaml:16-21` | `default_profile`, `profiles.claude.{reasoning,standard,light}` tier map; consumed at install-time by `scripts/apply-model-profile.ts` and at eval-dispatch time via env var `CREW_MODEL_PROFILE` (per file header comment `models.yaml:8-9`) |
| Env-var escape hatches, independent of the registry above | `CREW_OTEL_ENABLED` (`dev-team/scripts/lib/telemetry/config.ts:109`), `CREW_BASH_GATE_LOG=0` (`dev-team/hooks/post-tool-use-bash-gate.ts:16`, `hooks/pre-tool-use-bash-gate.ts:16`, `scripts/lib/bash-gate-timer.ts:32`) | raw `process.env[...]` reads, parallel to but not routed through `features-service.ts` |
| Other env vars read directly (no registry) | `CREW_DISPATCH_TIMING_LOG`, `CREW_PROJECTS_ROOT`, `CREW_SLICE_LINT_REPO`, `CREW_VALIDATE_BUNDLES_REPO`, `CREW_VALIDATE_ROUTING_TABLE`, `CREW_VALIDATE_ROUTING_TABLE_FILE`, `CREW_VALIDATE_ROUTING_TABLE_PLUGINS_JSON`, `CREW_VALIDATE_ROUTING_TABLE_REPO_ROOT` | grep across `scripts/`, `hooks/` (`process.env.<NAME>` pattern, non-test) |

4 distinct config-file surfaces exist in this one repo (`crew.json`, `gepa.config.json`, `models.yaml`, plus the installed `.claude/loop.json` from runner-plugin), each with its own read path and its own default-handling convention.

### Ad-hoc optional-chain-with-default reads

Pattern `expr?.a?.b ?? default` (1+ optional-chain hops before `??`), counted in `scripts/`, `hooks/`, excluding `*.test.ts`: **53 occurrences across 19 files**. Top offenders:

| File | Count |
|---|---|
| `dev-team/scripts/lib/briefing/render.ts` | 11 (e.g. `:297` `workflow?.pendingBadges ?? []`, `:298`, `:299`, `:345`, `:362`, `:459`) |
| `dev-team/scripts/lib/ux-validation/verdict.ts` | 6 |
| `dev-team/scripts/lib/gepa/auto-merge-gate.ts` | 4 |
| `dev-team/scripts/lib/gepa/gepa-optimize-cmd.ts` | 3 |
| `dev-team/scripts/lib/gepa/capture-tee.ts` | 3 |
| `dev-team/scripts/lib/gepa/auto-pr.ts` | 3 |
| `dev-team/scripts/lib/cost-advisor-rules.ts` | 3 |
| `dev-team/scripts/lib/briefing.ts` | 3 |
| `dev-team/scripts/lib/artifacts/write.ts` | 3 |

### Churn — per top-level directory, last 3 months (`git -C dev-team log --since="3 months ago" --name-only`)

| Directory | File-touch count |
|---|---|
| `docs/` | 892 |
| `scripts/` | 884 |
| `agents/` | 862 |
| `tests/` | 742 |
| `skills/` | 537 |
| `commands/` | 276 |
| `.claude-plugin/` | 221 |
| `evals/` | 153 |
| `hooks/` | 114 |
| `.claude/` | 67 |

`scripts/lib/` sub-area breakdown (3rd path segment, 653 total touches): `installer` 49, `gepa` 48, `briefing` 47, `ux-validation` 37, `cost-hygiene` 34, `artifacts` 32, `memory` 28, `telemetry` 15 (plus now-deleted `.mjs` predecessors: `artifacts.mjs` 29, `briefing.mjs` 25, `wakeup.mjs` 23, `installer.mjs` 21, `workflow-state.mjs` 20, `session-cost.mjs` 19, `cost-advisor.mjs` 19 — all removed from the working tree, last touched 2026-06-07–2026-06-12, consistent with a TS-source migration).

### 10 most-changed files, last 3 months, with last-change date

| File | Changes (3mo) | Last changed |
|---|---|---|
| `package.json` | 150 | (release-cadence artifact) |
| `CHANGELOG.md` | 147 | (release-cadence artifact) |
| `.claude-plugin/plugin.json` | 108 | (release-cadence artifact) |
| `README.md` | 76 | 2026-07-0x range |
| `docs/routing-table.md` | 65 | 2026-07-06 |
| `agents/reviewer.md` | 49 | 2026-07-05 |
| `agents/fullstack-dev.md` | 42 | 2026-07-06 |
| `agents/architect.md` | 41 | 2026-07-05 |
| `scripts/crew.ts` | 38 (git-log --oneline count for this file alone: 40) | 2026-07-07 |
| `CLAUDE.md` | 35 | (repo-root doc) |

Boundary-relevant modules cited in Dimension 6, with churn/stability data:

| Module | Changes (3mo) | Last change |
|---|---|---|
| `scripts/crew.ts` | 40 | 2026-07-07 |
| `scripts/lib/artifacts/write.ts` | 22 | 2026-07-07 |
| `scripts/lib/workflow-state.ts` | 11 | 2026-07-07 |
| `scripts/lib/features-service.ts` | 6 | 2026-07-06 |
| `scripts/lib/schemas.ts` | 4 | 2026-07-04 |
| `scripts/lib/workflow-config.ts` | 3 | 2026-06-19 |
| `scripts/lib/build-bundle/types.ts` | 3 | 2026-06-21 |
| `scripts/lib/fs-utils.ts` | 3 | 2026-06-10 |
| `scripts/lib/gepa/auto-merge-gate.ts` | 1 | 2026-07-02 |
| `scripts/lib/models/schema.ts` | 1 | 2026-07-04 |
| `scripts/lib/dispatch/peer-dispatch-allowlist.ts` | 1 | 2026-07-04 |

Deleted-but-recently-live agent role files (churn history, no longer present): `agents/lead.md` (77 touches in 3mo, deleted, last existed 2026-06-22), `agents/builder.md` (44 touches, deleted, last existed 2026-06-12), `agents/validator.md` (35 touches, deleted, last existed 2026-06-12), `agents/builder-be.md` (21 touches, deleted, last existed 2026-06-12).

---

# REPO: astramemory-plugin

## Dimensions 1-2: duplication census + dependency edges

<!-- agent: astramemory-plugin:dup+graph -->

## 1. Duplication census — astramemory-plugin inventory

| Topic | file:line-span | approx LOC | call-site count (this repo) |
|---|---|---|---|
| Clerk PKCE helper (JS twin) | `astramemory-plugin/lib/pkce.mjs:1-18` | 18 | 1 (`bin/memory-login` extensionless shim) |
| Clerk PKCE helper (TS twin) | `astramemory-plugin/lib/pkce.ts:1-18` | 18 | 2 (`bin/memory-login.ts`, `tests/pkce.test.ts`) |
| Cross-platform `openBrowser` spawn wrapper (JS twin) | `astramemory-plugin/lib/openBrowser.mjs:1-19` | 19 | 1 (`bin/memory-login`) |
| Cross-platform `openBrowser` spawn wrapper (TS twin) | `astramemory-plugin/lib/openBrowser.ts:1-19` | 19 | 1 (`bin/memory-login.ts`) |
| Clerk OAuth config resolver (JS twin) | `astramemory-plugin/lib/clerkConfig.mjs:1-22` | 22 | 1 (`bin/memory-login`) |
| Clerk OAuth config resolver (TS twin) | `astramemory-plugin/lib/clerkConfig.ts:1-32` | 32 | 1 (`bin/memory-login.ts`) |
| Clerk auth-file read/write (JS twin) | `astramemory-plugin/lib/clerkAuthFile.mjs:1-32` | 32 | 2 (`bin/memory-login`, `bin/memory-refresh`) |
| Clerk auth-file read/write (TS twin) | `astramemory-plugin/lib/clerkAuthFile.ts:1-41` | 41 | 4 (`bin/memory-login.ts`, `bin/memory-refresh.ts`, `src/providers/saas.ts`, plus 2 test files) |
| Profile/token resolver (JS twin) | `astramemory-plugin/lib/profileResolver.mjs:1-129` | 129 | 1 (`bin/memory-connect`) |
| Profile/token resolver (TS twin) | `astramemory-plugin/lib/profileResolver.ts:1-141` | 141 | 1 (`bin/memory-connect.ts`) |
| Config load/save + dot-path get/set/unset (with legacy-path one-time migration) | `astramemory-plugin/src/lib/config.ts:1-147` | 147 | 8 (`src/lib/local-url.ts`, `src/cli/config-cmd.ts`, `src/cli/connect.ts`, `bin/memory-connect.ts`, plus 4 test files) |
| Fail-silent JSONL append log w/ size-based rotation (10 MB → `.1`) + tail-read | `astramemory-plugin/src/lib/log.ts:1-76` | 76 | 4 (`src/lib/pending.ts`, `src/lib/scrub.ts` consumers indirectly, `src/cli/doctor.ts` via tail read, `tests/lib/log.test.ts`) |
| Offline retry queue — per-file JSON (not JSONL), enqueue/drain/cap-evict/reject | `astramemory-plugin/src/lib/pending.ts:1-307` | 307 | 4 (`src/cli/ingest-transcript.ts`, `tests/lib/pending.test.ts`, `tests/cli/ingest-transcript.test.ts`, re-exports `TransientError`/`DeterministicError`) |
| Data/config dir resolver incl. legacy-path fallback (XDG / `%APPDATA%`) | `astramemory-plugin/src/lib/datadir.ts:1-43` | 43 | 13 files import it |
| Env-var resolution (canonical + alias + deprecation tracking) | `astramemory-plugin/src/lib/env.ts:1-115` | 115 | 10 files |
| Env-var spec table (names/aliases/defaults) | `astramemory-plugin/src/lib/env-specs.ts:1-122` | 122 | 8 files |
| Local daemon URL resolver (env → config → hard-coded default `http://127.0.0.1:7777`) | `astramemory-plugin/src/lib/local-url.ts:1-57` | 57 | 2 files |
| Provider selector (local vs saas vs auto) | `astramemory-plugin/src/lib/selector.ts:1-338` | 338 | 7 files |
| Wire-version compatibility probe | `astramemory-plugin/src/lib/wire-probe.ts:1-243` | 243 | 3 files |
| Secret scrubbing (bearer/API-key redaction) | `astramemory-plugin/src/lib/scrub.ts:1-237` | 237 | 8 files |
| Local bearer secret reader | `astramemory-plugin/src/lib/secrets.ts:1-67` | 67 | 3 files |
| Abort/timer helpers (`unrefTimer`, `linkSignals`) | `astramemory-plugin/src/lib/abort.ts:1-58` | 58 | 4 files |
| Custom error classes (`TransientError`, `DeterministicError`) | `astramemory-plugin/src/lib/errors.ts:1-44` | 44 | 10 files |
| Cross-platform browser-open spawn wrapper (see also mjs/ts twin rows above) | `astramemory-plugin/lib/openBrowser.ts:5-19` | 15 | 1 |
| `spawnSync`-based subprocess wrapper (delegates to `memory-refresh.ts`, swallows/re-emits exit code) | `astramemory-plugin/bin/memory-token.ts:1-13` | 13 | 1 |
| Manual CLI argv-parsing loop (`for`/`switch` over `args[i]`, no shared parser) | `astramemory-plugin/src/cli/recall.ts:41-83` (approx), `astramemory-plugin/src/cli/remember.ts:31-60` (approx), `astramemory-plugin/src/cli/ingest-transcript.ts:48-90` (approx), `astramemory-plugin/bin/memory-connect:61-75` | ~35 each × 4 sites | 4 independent hand-rolled loops, 0 shared helper |
| Near-duplicate Claude-Code hook shell shims (capture side) | `astramemory-plugin/hooks/scripts/subagent-stop-capture.sh:1-69`, `astramemory-plugin/hooks/scripts/pre-compact-capture.sh:1-66`, `astramemory-plugin/hooks/scripts/session-end-summary.sh:1-67` | 66-69 each | 3 files, ~90% identical (diffs limited to event name, env-var prefix, one jq filter) |

Notes on drift status:
- `lib/*.mjs` vs `lib/*.ts` pairs (`pkce`, `openBrowser`, `clerkConfig`, `clerkAuthFile`, `profileResolver`) are **diverged-in-form-only** — logically identical, `.mjs` is the untyped copy consumed by the extensionless `node`-shebang shims (`bin/memory-login`, `bin/memory-refresh`, `bin/memory-connect`), `.ts` is consumed by the `bun`-shebang `.ts` shims (`bin/memory-login.ts`, `bin/memory-refresh.ts`, `bin/memory-connect.ts`). Confirmed via `diff` at `astramemory-plugin/lib/pkce.mjs` vs `astramemory-plugin/lib/pkce.ts`, etc. — no logic divergence found in any of the 5 pairs.
- The 3 hook shell shims are **diverged only in parameterization**, confirmed via `diff astramemory-plugin/hooks/scripts/subagent-stop-capture.sh astramemory-plugin/hooks/scripts/pre-compact-capture.sh` (10 line-diff hunks, all cosmetic/parametric) and `diff astramemory-plugin/hooks/scripts/subagent-stop-capture.sh astramemory-plugin/hooks/scripts/session-end-summary.sh` (same pattern).
- config loading/parsing, JSONL append/rotate, artifact-path resolution, frontmatter parse/write, git-worktree helpers, and markdown table/section generation from the prompt's suspect list: only config-loading and JSONL-append/rotate have concrete implementations in this repo (rows above). No frontmatter parser exists in this repo — clean, checked all 74 `.ts`/`.mjs` source files under `bin/`, `lib/`, `src/`, `hooks/` via `grep -rn "frontmatter\|gray-matter"`, zero hits. No git-worktree helper code exists in this repo (only a test-file mention) — clean, checked via `grep -rln "worktree"` across `.ts`/`.mjs`/`.sh`, single hit is `astramemory-plugin/tests/e2e/plugin-daemon-roundtrip.test.ts` (prose comment, no worktree-manipulating code). No markdown-table/section generator exists — clean, checked via `grep -rln "generateTable\|joinTable"` plus manual review of `src/cli/doctor.ts` (its only tabular-ish output is plain `console.log` lines, not a generated table). No standalone validation scripts (`validate-*`) exist in this repo — clean, checked via `find . -iname "validate-*"` (zero hits outside `node_modules`).
- No semver/version-comparison helper exists in this repo — clean, checked via `grep -rln "semver\|compareVersions\|MIN_.*VERSION"` across source; only hits are test/log noise (`astramemory-plugin/tests/contracts/transcript-wire.test.ts` references `WIRE_VERSION`, a string constant, not a semver comparator).

## 2. Dependency graph — outgoing edges from astramemory-plugin

| Edge type | From | To | Evidence |
|---|---|---|---|
| Package manifest dependency | `astramemory-plugin/package.json` | (none — no `plugins-common` package) | `astramemory-plugin/package.json:1-40`: only dep is `zod@^3.23.0`; no `file:`/`link:`/`workspace:` entries. Confirmed via `grep -n "file:|link:|workspace:" package.json` → zero hits. No `bun.lock`/lockfile reference to `plugins-common`, `astramem-client`, `gepa-core`, or `plugin-kernel` — checked via `grep -rn "@astragenie" astramemory-plugin/package.json` → only self (`@astragenie/astramem-plugin`). |
| Type-only intra-repo layer edge (`lib/` → `cli/`) | `astramemory-plugin/src/lib/pending.ts:44` | `astramemory-plugin/src/cli/ingest-transcript.ts` | `import type { TranscriptProvider } from '../cli/ingest-transcript.ts';` — a `lib/` module type-importing from the `cli/` (entry/command) layer. Type-only (erased at compile time, no runtime import), but the direction is inverted relative to `lib/` being the lower layer. |
| Documentation-only mention (no code edge) | `astramemory-plugin/README.md:272` | runner-plugin | `- [runner-plugin](https://github.com/astragenie/runner-plugin) — Engineering OS runner plugin;` — external link in prose, not a code dependency. |
| Documentation-only mention (no code edge) | `astramemory-plugin/README.md:274` | dev-team/crew | `- [crew / GEPA loop](https://github.com/astragenie/crew) — dev-team crew plugin whose` — external link in prose, not a code dependency. |
| Test-fixture string value (no code/path coupling) | `astramemory-plugin/tests/cli/recall.test.ts:57,61,68`, `tests/cli/remember.test.ts:63,67`, `tests/providers/local.test.ts:110,114` | n/a | `--project`/`agent` CLI flags exercised with literal example values `'runner-plugin'` and `'crew:reviewer'` — these are arbitrary test data for a generic `project`/`agent` string field, not a reference to the sibling repo's filesystem or API. |
| External (fifth, out-of-scope) repo coupling via env var | `astramemory-plugin/tests/e2e/plugin-daemon-roundtrip.test.ts:11,18,56,61-67,330` | `astramemory-local` (separate repo, not one of the 4 under review) | `const DIST_ROOT = process.env['ASTRAMEM_LOCAL_DIST_PATH'];` (line 56) with doc comment `ASTRAMEM_LOCAL_DIST_PATH: the astramemory-local repo ROOT` (line 11) and example `'C:\work\mega\astramemory-local'` (line 18) — an opt-in, env-gated E2E test that shells out to a sibling repo's build output; skips cleanly if unset. |
| External (fifth, out-of-scope) repo comment references, no runtime coupling | `astramemory-plugin/src/contracts/wire.ts:101`, `astramemory-plugin/src/providers/saas.ts:7,135` | `C:\work\mega\memory` (backend API repo, not one of the 4 under review) | Comments mirroring a C# request/query shape, e.g. `// Mirrors C:\work\mega\memory\src\AstraMemory.Modules.Search\Application\SearchQuery.cs` — documentation only, no import or path read. |
| Absolute `C:/work` path in local settings (not source) | `astramemory-plugin/.claude/settings.local.json:4` | n/a | `"Bash(rm -rf C:/work/mega/__TRACKED_VAR__)"` — a permission-allowlist entry, not application code. |
| `../../` relative imports | throughout `astramemory-plugin/tests/**` and `astramemory-plugin/src/providers/saas.ts:52` | n/a (intra-repo only) | All `../../` escapes checked (`grep -rn "\.\./\.\./" src lib bin tests`) resolve to paths inside `astramemory-plugin` itself (e.g. `src/providers/saas.ts:52: import { readAuth } from '../../lib/clerkAuthFile.ts';`) — no cross-repo path escape found. |
| Subprocess spawn (intra-repo only) | `astramemory-plugin/bin/memory-token.ts:9` | `astramemory-plugin/bin/memory-refresh.ts` | `spawnSync('bun', [join(__dirname, 'memory-refresh.ts')], ...)` — spawns a sibling script in the same repo, not another repo's tooling. |
| `plugins-common` string search | n/a | n/a | clean — checked all `.ts`/`.mjs`/`.json`/`.md` files (excluding `node_modules`, `.git`, `.claude/worktrees`, `.claude/logs`, `.claude/state`) via `grep -rln "plugins-common"`; zero hits anywhere in the repo. |
| `astramem-client` package consumption | n/a | n/a | clean (as expected — this repo IS astramem, not a consumer) — checked via `grep -rln "astramem-client"`; only hits are inside `.claude/artifacts/crew/runs/` and `.claude/logs/` (agent-session bookkeeping, not source). |

**Violations found**: one type-only inverted-layer import (`src/lib/pending.ts:44` → `src/cli/ingest-transcript.ts`), no import cycles found (single-direction `lib/` ← `cli/` ← `bin/` ← `providers/` fan-in observed throughout the sampled files, no back-edge from `lib/` into `providers/` or `bin/` besides the one type import). No cycles demonstrated with concrete evidence.

**Clean**: no `file:`/`link:`/`workspace:` dependency on any plugins-common package (`astramem-client`, `gepa-core`, `plugin-kernel`) exists in `astramemory-plugin/package.json`; no CLI spawn of another of the four repos' scripts found (checked `grep -rln "spawnSync\|spawn("` across non-test `.ts`/`.mjs`, 3 hits total, all intra-repo — `astramemory-plugin/bin/memory-token.ts`, `astramemory-plugin/lib/openBrowser.mjs`, `astramemory-plugin/lib/openBrowser.ts`); no reference to `crew.json`, `.claude/loop.json`, or any runner-plugin/dev-team internal artifact path found in source.

## Dimensions 3-5: exception handling, provider seams, DI/testability

<!-- agent: astramemory-plugin:err+seams+di -->

Good, line numbers confirmed. Now producing the final evidence report.

## 3. Exception handling comparison

**Scope**: `astramemory-plugin/src/**`, `astramemory-plugin/lib/**`, `astramemory-plugin/bin/**` (excludes `tests/**`, `node_modules/`, `.claude/`).

**Counts**: 60 `try { } catch` blocks + 4 `Promise.catch()` handlers = 64 total catch sites, across 21 files.

| File | try/catch blocks | Promise `.catch()` |
|---|---|---|
| `astramemory-plugin/src/lib/pending.ts` | 14 (lines 87,117,139,143,182,194,197,209,257,268,283,294,299 + 1 more) | 0 |
| `astramemory-plugin/src/providers/local.ts` | 4 (65,139,144,203,208) | 0 |
| `astramemory-plugin/src/providers/saas.ts` | 5 (83,203,207,272,276) | 0 |
| `astramemory-plugin/src/lib/selector.ts` | 4 (163,212,284,351 — file offsets shift slightly per version; see body citations below) | 0 |
| `astramemory-plugin/src/cli/ingest-transcript.ts` | 6 (119,166,282,315,390,406) | 0 |
| `astramemory-plugin/src/cli/doctor.ts` | 3 (96,121,146) | 0 |
| `astramemory-plugin/src/cli/connect.ts` | 4 (47,62,121,156) | 0 |
| `astramemory-plugin/src/cli/health.ts` | 2 (51,80) | 0 |
| `astramemory-plugin/src/cli/recall.ts` | 2 (89,109) | 0 |
| `astramemory-plugin/src/cli/remember.ts` | 3 (44,96,105) | 0 |
| `astramemory-plugin/src/cli/config-cmd.ts` | 1 (54) | 0 |
| `astramemory-plugin/src/lib/local-url.ts` | 1 (51) | 0 |
| `astramemory-plugin/src/lib/log.ts` | 3 (50,57,72) | 0 |
| `astramemory-plugin/src/lib/secrets.ts` | 1 (32) | 0 |
| `astramemory-plugin/src/lib/wire-probe.ts` | 1 (145) | 0 |
| `astramemory-plugin/lib/clerkAuthFile.ts` | 1 (31) | 0 |
| `astramemory-plugin/lib/profileResolver.ts` | 2 (44,106) | 0 |
| `astramemory-plugin/bin/memory-connect.ts` | 3 (149,173,201) | 2 (142, 219) |
| `astramemory-plugin/bin/memory-login.ts` | 0 | 1 (103) |
| `astramemory-plugin/bin/memory-refresh.ts` | 0 | 1 (55) |

**Catch-block behavior classification** (representative citations per category, not exhaustive):

- **Swallowed (empty body / comment-only, no log, no rethrow)** — 26 sites, e.g. `astramemory-plugin/src/cli/config-cmd.ts:52-56`, `astramemory-plugin/src/cli/connect.ts:118-123`, `astramemory-plugin/src/lib/pending.ts:116-119` (`catch { return {...,mtime:0,size:0} }`), `astramemory-plugin/src/lib/pending.ts:139-141`, `astramemory-plugin/src/providers/local.ts:142-146` (`// Silently absorb — ingest is fire-and-forget.`), `astramemory-plugin/src/providers/saas.ts:205-209`, `astramemory-plugin/src/cli/ingest-transcript.ts:118-120`, `astramemory-plugin/src/cli/ingest-transcript.ts:281-282` (`/* ignore */`).
- **Swallow-with-default-return** — `astramemory-plugin/src/lib/log.ts:66-74` (`readIngestLogTail` returns `[]`), `astramemory-plugin/src/lib/pending.ts:277-285` (`listPendingFiles` returns `[]`), `astramemory-plugin/src/lib/selector.ts` `defaultHealthProbe` catch returns `{ok:false, latency_ms}`.
- **Log-and-continue (no propagation)** — `astramemory-plugin/src/lib/pending.ts:87-90,143-145,209-211,294-299` (all route through `appendIngestLog`), `astramemory-plugin/src/cli/doctor.ts:96-98,121-123,146-148` (pushes error text into the report, `runDoctor` always returns 0), `astramemory-plugin/src/cli/ingest-transcript.ts:314-319,390-393,405-415` (log + conditional `enqueue()` on transient cause via `isTransientCause()` heuristic at line 429-441).
- **Caught, converted to Result-shaped return (no throw crosses the CLI boundary)** — every `src/cli/*.ts` subcommand (`config-cmd.ts`, `connect.ts`, `doctor.ts`, `health.ts`, `recall.ts`, `remember.ts`, `ingest-transcript.ts`) catches provider/selector errors and returns a `Promise<number>` exit code instead of rethrowing, e.g. `astramemory-plugin/src/cli/health.ts:51-62,80-91`, `astramemory-plugin/src/cli/recall.ts:89-92,109-112`, `astramemory-plugin/src/cli/remember.ts:96-99,105-108`.
- **Rethrow-unless-ENOENT** (consistent pattern, 3 sites, same shape in two different files) — `astramemory-plugin/lib/clerkAuthFile.ts:28-34`, `astramemory-plugin/lib/profileResolver.ts:41-48` (`readProfiles`), `astramemory-plugin/lib/profileResolver.ts:103-110` (`readTokens`).
- **Wrap into custom error** — `astramemory-plugin/src/providers/local.ts:62-69` and `astramemory-plugin/src/providers/saas.ts:80-87` both wrap `fetch` failures into `new TransientError(...)` inside a `fetchWithTimeout` helper that is duplicated verbatim (comment at `saas.ts:70-71` says "parallel to local.ts — no shared dependency per Track A scope").
- **Conditional rethrow (type-checked)** — `astramemory-plugin/src/lib/selector.ts:162-171` (`enforceWireCompat`): rethrows only if `err instanceof WireIncompatibilityError`, otherwise swallows with a stderr warning. `astramemory-plugin/src/lib/pending.ts:196-206` (`drain`): branches on `e instanceof DeterministicError` vs. transient.
- **Log-and-exit** (entry points) — `astramemory-plugin/bin/memory-connect.ts:148-154,172-177,200-206` combine `emitLog()` (structured JSON to stderr) with `process.stderr.write` + `process.exit(N)`.

**Error types**: exactly 3 custom error classes, one hierarchy — `astramemory-plugin/src/lib/errors.ts:15-27` (`DeterministicError extends Error`), `astramemory-plugin/src/lib/errors.ts:30-44` (`TransientError extends Error`), and `astramemory-plugin/src/lib/wire-probe.ts:101-107` (`WireIncompatibilityError extends DeterministicError`). No bare `throw new Error(...)` string/message-only throws found in `src/lib`, `src/providers`, `src/cli` except the SaaS config-guard at `astramemory-plugin/src/lib/selector.ts:247-251` (`throw new Error(...)`, plain, inside `resolveAuto()`) and `astramemory-plugin/src/lib/selector.ts` header comment area — one bare-`Error` throw site confirmed. Zero string-literal throws (`throw 'x'`) anywhere (`grep -rnE "throw ['\"\`]"` → 0 hits).

A second, structurally different "typed error" idiom exists in parallel to `errors.ts`, used only in the `bin/memory-connect` device-flow path: a plain `Error` object is cast to an ad-hoc interface and tagged with a numeric field, not a class — `astramemory-plugin/lib/profileResolver.ts:50-52` (`interface ProfileResolveError extends Error { exitCode: number }`, constructed at lines 64-69 and 73-78 via `new Error(...) as ProfileResolveError; err.exitCode = 4;`) and `astramemory-plugin/bin/memory-connect.ts:98-100` (`interface ProfileError extends Error { exitCode?: number }`, read back at `bin/memory-connect.ts:220-226`). This is a second, unrelated error-tagging convention living beside the `DeterministicError`/`TransientError` class hierarchy — two taxonomies, not three, but they do not overlap or share a base type.

**Exit-code discipline**: `process.exit(N)` appears in 15 call sites, all confined to `astramemory-plugin/bin/*.ts` (`memory-connect.ts:61,80,138,145,153,176,225,229`; `memory-login.ts:94,103`; `memory-refresh.ts:11,22,36,55`; `memory-token.ts:12`). Zero `process.exit` calls found in `src/lib/**`, `src/providers/**`, or `src/cli/**` — those layers consistently return `Promise<number>` instead (verified: `grep -rn "process\.exit" src/` → 0 hits). `astramemory-plugin/bin/memory-token.ts:9-12` calls `process.exit()` from **top-level module scope** (not inside a `main()` guard) — the only entry script where exit-on-import is unconditional rather than gated behind an async `main()` wrapper (contrast with `memory-connect.ts:218-230` and `memory-login.ts:103`, which gate all exits inside `main().catch(...)`).

**Result-shaped vs. exceptions — do any files mix both?** No single file mixes styles internally in a way that produces ambiguity: every `src/cli/*.ts` subcommand catches at its own boundary and returns a plain `number`; every `src/providers/*.ts` and `src/lib/pending.ts`/`selector.ts` module always throws/propagates typed errors (`DeterministicError`/`TransientError`) rather than returning `{ ok, error }` objects. The layering is consistent — CLI layer = Result-shaped return codes, lib/provider layer = typed exceptions — checked across all 21 files with catch blocks; no counter-example found.

## 4. Provider / integration-seam usage

**astramem access** — this repo *is* the astramem provider-selector plugin, so "access to astramem" here means the seams by which the plugin's own surfaces (hooks, slash commands, MCP registration) reach the backend. Four distinct, non-unified seams found:

| Seam | Mechanism | Citation |
|---|---|---|
| MCP server registration | Direct HTTP MCP server pointed at `${MEMORY_API_URL}/mcp` with a templated `Authorization: Bearer ${MEMORY_BEARER}` header — bypasses the CLI, the provider selector, and the wire-compat probe entirely | `astramemory-plugin/.mcp.json:1-11` |
| CLI dispatcher (`bin/astramem`) | `resolveProvider()` selector → `LocalProvider`/`SaasProvider` classes implementing `MemoryProvider` | `astramemory-plugin/bin/astramem:1-11`, `astramemory-plugin/src/lib/selector.ts:182-217`, `astramemory-plugin/src/contracts/provider.ts:5-48` |
| Claude Code hooks (bash) | Subprocess spawn of the CLI: `exec bun "${CLAUDE_PLUGIN_ROOT}/bin/astramem" ingest-transcript ...` / `recall ...` | `astramemory-plugin/hooks/scripts/subagent-stop-capture.sh:53-69`, `astramemory-plugin/hooks/scripts/session-start-recall.sh:49` |
| Slash commands (`/recall`, `/remember`) | Prose instruction telling the assistant to shell out: `bun ${CLAUDE_PLUGIN_ROOT}/bin/astramem recall --query ...` — despite this plugin registering its own MCP server for the same backend, the shipped commands do not invoke an MCP tool call | `astramemory-plugin/commands/recall.md:14-24`, `astramemory-plugin/commands/remember.md:61-70` |

No file in `src/`, `lib/`, or `bin/` imports an `astramem-client` package or any `plugins-common` package — confirmed via `grep -rn "plugins-common\|astramem-client" --include="*.ts" --include="*.json"` returning zero hits outside `.claude/` runtime artifacts/logs. `package.json` (`astramemory-plugin/package.json:1-30`) declares only `zod` as a runtime dependency — no `file:`/`link:`/`workspace:` entries.

**crew / dev-team access** — zero code-level coupling. No import, no CLI spawn, no version pin, no path-grep into `dev-team` or `runner-plugin` trees found in any `.ts`/`.mjs`/`.sh` file (checked `src/`, `lib/`, `bin/`, `hooks/`). The only "crew"/"dev-team" references in the repo are this repo's *own* dogfooded workflow artifacts under `astramemory-plugin/.claude/artifacts/crew/**` (review results, run briefs) and `astramemory-plugin/.claude/state/crew/workflow-state.json` — evidence this repo *uses* the crew methodology as an operator, not evidence of a code dependency on the crew plugin's internals. No `MIN_CREW_VERSION`-equivalent pin exists anywhere in this repo.

**Agent-dispatch seams** — none. `grep -rn "dispatchAgent\|Agent(subagent_type\|Task("` over `src/`, `lib/`, `bin/`, `hooks/` returns zero hits. This repo has no agent-dispatch code path of its own; it is purely a memory-backend selector, CLI, and Claude Code hook set. "Is 'provider' ever abstracted?" — yes, but only for the memory backend (the `MemoryProvider` interface, `astramemory-plugin/src/contracts/provider.ts:5-48`), and that abstraction is itself bypassed by the `.mcp.json` seam above, so the plugin ships one abstracted seam and one unabstracted seam to the same backend concept.

## 5. Dependency injection & testability

**How modules receive dependencies** — three distinct, non-interoperating patterns observed in the same codebase:

1. **Constructor-parameter DI (providers only)** — `LocalProvider`/`SaasProvider` classes accept an optional `baseUrl` override in their constructors, falling back to a module-scope `resolveBaseUrl()` free-function call when omitted: `astramemory-plugin/src/providers/local.ts:111-116,278-281`, `astramemory-plugin/src/providers/saas.ts:179-184,378-381`. All other dependencies inside these classes (bearer reading, scrub, error types) are reached via top-of-file `import` statements, not injected — e.g. `astramemory-plugin/src/providers/local.ts:32-35` imports `readLocalBearer`, `resolveEnv`, `scrubWithLabels` directly.
2. **Opts-based test injection at the CLI-function boundary** — every `src/cli/*.ts` entry point accepts an `opts._provider` (or `opts._providerName`) escape hatch used only by tests to bypass `resolveProvider()`: `astramemory-plugin/src/cli/health.ts:9-14,43-50`, `astramemory-plugin/src/cli/recall.ts:10-13,83-88`, `astramemory-plugin/src/cli/remember.ts:10-13,90-95`, `astramemory-plugin/src/cli/ingest-transcript.ts:26-31,380-389`.
3. **Module-level mutable singleton + `NODE_ENV==='test'`-gated function-pointer swap** — `astramemory-plugin/src/lib/selector.ts:54-81` (`_healthCache` Map, `_healthProbeFn`, guarded setters `_setHealthProbeFn`/`_resetHealthCache`, both no-op unless `process.env.NODE_ENV === 'test'`) and `astramemory-plugin/src/lib/selector.ts:106-129` (`_wireCompatFn`, `_setWireCompatFn`, `_resetWireCompatFn`, same guard). The identical guard idiom recurs in `astramemory-plugin/src/lib/env.ts:41-45,111-115` (`_warnedAliases` Set, `_hitCounts` Map, `_resetEnvState()`).

**Worst import-time side effect**: `astramemory-plugin/bin/memory-token.ts:1-13` — at module top level (outside any function, no `main()` guard), the file synchronously `spawnSync`s a child `bun` process running `memory-refresh.ts` and conditionally calls `process.exit()`, all as a consequence of the module simply being loaded/imported (lines 8-12). Every other `bin/*.ts` entry point gates its side effects inside an async `main()` invoked at the bottom of the file (e.g. `astramemory-plugin/bin/memory-connect.ts:218-230`); `memory-token.ts` does not.

A second-tier import-time concern: `astramemory-plugin/src/lib/datadir.ts:20-26` (`unifiedConfigDir()`) and `astramemory-plugin/lib/profileResolver.ts:17-19` (`astraMemoryDir()`) read `process.env.APPDATA`/`homedir()` directly inside plain functions with no injectable base-path parameter — neither module exposes a way to override the resolved directory short of mutating global `process.env` or `vi.mock()`-replacing the whole module.

**Test coping strategies** — two different workarounds for the same missing-DI gap coexist:
- **Global-env monkeypatching**: `astramemory-plugin/tests/lib/pending.test.ts:16-31` (`isolate()`/`restore()` helpers directly overwrite `process.env.APPDATA`/`process.env.HOME` to redirect `datadir.ts`'s real, un-injectable logic into a `mkdtempSync` temp dir).
- **Whole-module mocking**: `astramemory-plugin/tests/lib/selector.test.ts:12-16` (`vi.mock('../../src/lib/datadir.ts', () => ({ unifiedConfigDir: () => tempDir, ... }))`) plus `vi.mock` of the entire `providers/local.ts` and `providers/saas.ts` modules at lines 30-37 to install mock provider classes, because `selector.ts`'s `loadProvider()` uses a hardcoded dynamic `import('../providers/local.ts')` (`astramemory-plugin/src/lib/selector.ts:299-309`) rather than an injected factory.
- **Global-function monkeypatching for network**: the shared provider contract suite swaps `globalThis.fetch` directly and restores it in a `finally` block, once per test — `astramemory-plugin/tests/providers/_contract.ts:174-184,187-199,201-223` (repeated ~10 times in the same file) — because neither `LocalProvider` nor `SaasProvider` accepts an injected `fetch` implementation.
- **Parameterized shared contract suite** (a genuine DI-friendly test seam, the strongest testability artifact found): `astramemory-plugin/tests/providers/_contract.ts:99-331` (`runProviderContract(name, makeProvider, opts)`) is invoked once per provider so both `LocalProvider` and `SaasProvider` are exercised against one behavioral contract rather than duplicated test bodies.

**`plugin-kernel`**: not applicable — `astramemory-plugin` does not import `plugin-kernel` or any other `plugins-common` package (confirmed by grep in Dimension 4 above); no evidence in this repo bears on that package's shape.

## Dimensions 6-8: boundaries, bad practices, toggles/config/churn

<!-- agent: astramemory-plugin:bounds+practices+config -->

I now have comprehensive, cited evidence across all three assigned dimensions.

## 6. Modularization & boundaries

**God objects / mixed responsibilities**

| File | LOC | Fan-out (imports) | Mixed responsibilities (cited) |
|---|---|---|---|
| `astramemory-plugin/src/cli/ingest-transcript.ts` | 442 | 11 | CLI arg parsing (`parseArgs`, lines 48-102) + plugin-version file I/O (`readClientVersion`, 108-122) + JSONL transcript parsing (`extractTurnsFromJsonl`/`extractTextFromBlocks`, 142-215) + char-budget truncation (`truncateToMaxChars`, 221-232) + scrub orchestration + envelope assembly (334-378) + provider resolution + pending-queue drain (380-399) + a bespoke transient-failure heuristic (`isTransientCause`, 429-441) — eight distinct concerns in one file with no internal submodules. |
| `astramemory-plugin/src/lib/selector.ts` | 338 | 9 | Production provider-resolution logic (`resolveProvider`, line 190) is interleaved with four test-only backdoor exports that mutate module-level singleton state: `_resetHealthCache` (67), `_setHealthProbeFn` (76), `_setWireCompatFn` (117), `_resetWireCompatFn` (126) — 4 of the file's 6 top-level exports exist solely to inject test doubles into shared module state, not to serve callers. |

Fan-out counts for the rest of `src/`, `bin/`, `lib/` top out at 11 (`src/providers/saas.ts`, `src/cli/ingest-transcript.ts`) and fall off quickly (`src/providers/local.ts` 9, `src/lib/selector.ts` 9, `src/cli/doctor.ts` 9, `src/lib/pending.ts` 7, `bin/memory-login.ts` 6) — no file breaches an excessive-fan-out threshold on count alone; the two flagged above are cited for responsibility-mixing, not size.

Fan-in (files referencing the module, approx., via `grep -rl`, includes tests): `src/contracts/provider.ts` 24, `src/lib/config.ts` 19, `src/contracts/config.ts` 19, `src/lib/env.ts` 18, `src/contracts/wire.ts` 18, `src/providers/local.ts` 18, `src/lib/datadir.ts` 13, `src/providers/saas.ts` 11. None of these show cyclic or inverted-layer coupling (`src/lib/` files import only `node:*`, `./contracts/*`, and sibling `lib/*` — never `src/cli/*`).

**Duplicate directory-resolution logic across module boundaries (still-live, not legacy-only)**

Two independently-written functions resolve `~/.astramemory` with no shared import between them:
- `astramemory-plugin/lib/profileResolver.ts:17-18` — `astraMemoryDir()`: `process.env['ASTRAMEMORY_HOME'] ?? join(homedir(), '.astramemory')`, used by the live Clerk OAuth flow (`bin/memory-connect.ts`, `bin/memory-login`).
- `astramemory-plugin/src/lib/datadir.ts:41-43` — `legacyAstramemPath()`: `join(homedir(), '.astramemory')` (no env override), documented as "only consulted during one-time migration" (datadir.ts:38-40) and consumed by `src/lib/config.ts:36`.

Both target the literal same path for two structurally different concerns (OAuth tokens/profiles vs. unified app config), authored in unrelated modules with no shared helper — an implicit boundary the two subsystems (Clerk-auth CLI vs. config/provider CLI) don't actually share despite pointing at the same directory string.

**Implicit public surface**

`astramemory-plugin/package.json:6-12` declares an `exports` map (`.`, `./providers/local`, `./providers/saas`, `./contracts`, `./selector`) pointing directly at `src/*.ts` source files — this is the package's only declared external consumer contract. `src/contracts/index.ts` (the `.` entry) has zero internal fan-in (`grep` finds no other file in this repo importing it) — consistent with it being purely an external-consumer barrel, not dead code. No cross-repo consumer was found from this repo's side (this repo does not read/spawn/path-grep into `runner-plugin`, `dev-team`, or `plugins-common` trees — checked via `grep -rn "runner-plugin|dev-team|plugins-common|C:/work/mega"` across non-worktree source; the only hits are string literals in test fixtures for a `--project runner-plugin` CLI filter value (`tests/cli/recall.test.ts:57-69`, `tests/cli/remember.test.ts:63-67`, `tests/providers/local.test.ts:110-114`) and prose links in `README.md:272-274`).

**Dead weight — whole duplicate files with zero references**

`astramemory-plugin/bin/` contains two parallel implementations of the same three CLI entry points, both present simultaneously:
- Extensionless, untyped originals: `bin/memory-connect` (7869 bytes), `bin/memory-login` (3603 bytes), `bin/memory-refresh` (1738 bytes), `bin/memory-token` (594 bytes) — each `#!/usr/bin/env node`, importing the sibling `lib/*.mjs` files (e.g. `bin/memory-login:4-7` imports `../lib/clerkConfig.mjs`, `../lib/pkce.mjs`, `../lib/clerkAuthFile.mjs`, `../lib/openBrowser.mjs`).
- Typed `.ts` twins: `bin/memory-connect.ts`, `bin/memory-login.ts`, `bin/memory-refresh.ts`, `bin/memory-token.ts` — these are the ones wired into `package.json:15-18` (`"memory-login": "./bin/memory-login.ts"`, etc.) and into the `astramem-*.ts` alias wrappers (`bin/astramem-connect.ts:3` — `await import('./memory-connect.ts')`).

Confirmed via `grep -rn "bin/memory-connect\b"` (and equivalents for login/refresh/token) across all non-`.git` file types in the repo: the extensionless files are referenced nowhere except the files themselves — no manifest, no `package.json` field, no doc, no hook — making all four extensionless originals dead code with zero call sites.

`astramemory-plugin/.claude/worktrees/v0.5.2-local-first/` is a live git worktree (`git worktree list` confirms `[feat/v0.5.2-local-first]`, gitdir at `.git/worktrees/v0.5.2-local-first`) nested inside the main repo's tracked tree, containing a full parallel copy of `bin/`, `lib/`, `src/`, `tests/` — excluded from all line-level counts above per the assignment's generated-artifact exclusion, but flagged here as a boundary oddity: a second checkout living under the primary repo's own working directory.

## 7. Bad practices sweep

- **`@ts-ignore` / `@ts-nocheck`**: 0 occurrences anywhere in the repo (checked all `.ts`/`.mjs` under `src/`, `bin/`, `lib/`, `tests/`, excluding `node_modules` and the worktree) — clean.
- **`any` density in non-test code**: 0 occurrences of `: any`, `<any>`, or `as any` in `src/`, `bin/`, `lib/` (checked via grep against all `.ts` files in those three trees). `tsconfig.json:5` sets `"strict": true`. Clean.
- **Hand-authored `.mjs`/extensionless duplicates beyond a single canonical source**: `astramemory-plugin/lib/` carries five `.mjs`/`.ts` pairs that are the same logic hand-duplicated in two files: `clerkAuthFile.{mjs,ts}`, `clerkConfig.{mjs,ts}`, `openBrowser.{mjs,ts}`, `pkce.{mjs,ts}`, `profileResolver.{mjs,ts}` (line counts nearly identical per pair, e.g. `pkce.mjs` 18 lines vs `pkce.ts` 18 lines; `profileResolver.mjs` 129 vs `profileResolver.ts` 141). Diffed pairwise — the `.mjs` files are the untyped runtime twin of the `.ts` source (same logic, types stripped, e.g. `lib/clerkAuthFile.mjs:9` vs `lib/clerkAuthFile.ts:9-18`). The four extensionless `bin/memory-*` files described under dimension 6 compound this: three parallel forms of the same four CLI entry points (extensionless-JS, `.mjs`-importing extensionless, and canonical `.ts`) coexist in the tree.
- **Magic-string / naming inconsistency — env-var prefix**: `astramemory-plugin/src/lib/env-specs.ts` is documented as "single source of truth for env-var canonical names + aliases" (env-specs.ts:2, with an explicit "Do NOT scatter process.env reads across the codebase — add them here instead" directive at line 5) yet mixes two canonical prefixes within its own registry: `ASTRAM_`-style (`ASTRAM EM_PROVIDER`, env-specs.ts:56) vs. `MEMORY_`-style (`MEMORY_API_URL_LOCAL` 34, `MEMORY_API_URL_SAAS` 46, `MEMORY_BEARER` 67/77, `MEMORY_SESSIONEND_MAX_TURNS` 83, `MEMORY_SESSIONEND_MAX_CHARS` 90, `MEMORY_PRECOMPACT_MAX_TURNS` 97, `MEMORY_PRECOMPACT_MAX_CHARS` 104, `MEMORY_SUBAGENT_MAX_TURNS` 111, `MEMORY_SUBAGENT_MAX_CHARS` 118), plus a third `ASTRAMEMORY_`-style alias prefix (`ASTRAMEMORY_API_URL` 35/47, `ASTRAMEMORY_API_KEY` 68/78). Three call sites bypass the registry's own "don't scatter" rule entirely with a fourth spelling family: `ASTRAMEMORY_ENV` (`bin/memory-connect.ts:108,223,227`), `ASTRAMEMORY_HOME` (`lib/profileResolver.ts:18`), `ASTRAMEM_HOOK_DEBUG` (`src/cli/ingest-transcript.ts:275`) — none of these three appear in `env-specs.ts`'s `ENV` registry.
- **Product-name spelling inconsistency in code (not just docs)**: grep across `src/`, `bin/`, `lib/` `.ts` files for the product name found four live spellings: `astramem` (78 occurrences), `Astramem` (23), `astramemory` (11), `AstraMemory` (9). Concrete non-comment examples: `src/lib/datadir.ts:23` writes to a directory literally named `'Astramem'` while `lib/profileResolver.ts:18` and `src/lib/datadir.ts:42` both target `'.astramemory'` — i.e. the on-disk directory name itself differs by spelling depending on which module resolves it (`%APPDATA%\Astramem` vs `~/.astramemory`), not merely prose drift.
- **Silent-fallback / opt-out-doesn't-disable-behavior pattern** (analogous to the `marathonCheckpointEvery` trap named in the prompt): `astramemory-plugin/src/lib/env.ts:80-85` — setting `MEMORY_DEPRECATION_OPT_OUT=1` only suppresses the one-shot stderr deprecation warning; it does **not** stop the deprecated alias from being read and used (the alias resolution and hit-count increment at `env.ts:72-78` run unconditionally before the opt-out check). An operator who sets the opt-out var to "silence the noise" gets zero further signal that they are still on a deprecated env var, with no separate control to actually disable alias fallback.
- **Config precedence documentation vs. reality**: not flagged as a defect — `src/lib/selector.ts:1-20` explicitly documents its 4-level precedence chain (flag → env → config → auto-probe) and `src/lib/env.ts` documents canonical-wins-over-alias ordering; both are the one instance in this repo of config-toggle logic that is self-documenting rather than silently masked, noted for contrast with the item above.

## 8. Feature-toggle / config audit + churn/stability signals

**Toggle inventory**

| Toggle | Kind | Values / default | Citation |
|---|---|---|---|
| `provider` | enum, config file | `'local'\|'saas'\|'auto'`, default `'auto'` | `astramemory-plugin/src/contracts/config.ts:16` |
| `ASTRAM EM_PROVIDER` env | enum, env var (overrides config) | `local\|saas\|auto` | `astramemory-plugin/src/lib/env-specs.ts:55-58`, consumed at `src/lib/selector.ts:199` |
| `--provider` CLI flag | enum, highest precedence | `local\|saas\|auto` | `astramemory-plugin/src/lib/selector.ts:190-195` |
| `logging.level` | enum, config file | `debug\|info\|warn\|error\|silent`, default `'info'` | `astramemory-plugin/src/contracts/config.ts:25-27` |
| `MEMORY_DEPRECATION_OPT_OUT` | boolean env, opt-out | `'1'` to silence | `astramemory-plugin/src/lib/env.ts:8,80` |
| `ASTRAMEM_HOOK_DEBUG` | boolean env, debug switch | `'1'` enables extra stderr diagnostics | `astramemory-plugin/src/cli/ingest-transcript.ts:275-286` |
| `NODE_ENV` gate on test-only resets | env-gated behavior branch | test-only no-op unless `'test'` | `astramemory-plugin/src/lib/env.ts:111-115`, `src/lib/selector.ts:67-75,117-137` |
| `ASTRAMEMORY_HOME` | path override env | overrides `~/.astramemory` | `astramemory-plugin/lib/profileResolver.ts:17-18` |
| `--max-turns` / `--max-chars` (ingest-transcript) | numeric, CLI-overridable | defaults `20` / `12000` | `astramemory-plugin/src/cli/ingest-transcript.ts:55-56,86-97`; same defaults re-declared per hook event as env vars `MEMORY_SESSIONEND_MAX_TURNS`/`_CHARS`, `MEMORY_PRECOMPACT_MAX_TURNS`/`_CHARS`, `MEMORY_SUBAGENT_MAX_TURNS`/`_CHARS` at `src/lib/env-specs.ts:82-121` (same toggle *kind* — turn/char budget — implemented three times, once per hook event, each with its own env-var pair) |
| `client_scrub_applied` / scrub | always-on, not actually toggleable | no env/config gate found to disable scrubbing | grep for a scrub-disable toggle returned no matches — noted as clean (no toggle exists to turn off PII scrubbing) |

**Ad-hoc `?? default` / optional-chain-with-default reads**

Total `??` occurrences in non-test `src/`, `bin/`, `lib/`: **61** (`grep -c` across those trees). Of these, 6 combine optional chaining with a fallback in the same expression (`?.` immediately followed by `??`): `src/lib/selector.ts:168`, `src/lib/wire-probe.ts:153`, `src/providers/local.ts:82`, `src/providers/saas.ts:101,169`, `lib/profileResolver.ts:117`. Config/env-specific fallback reads (not error-message fallbacks) account for roughly 15 of the 61, e.g. `src/cli/connect.ts:30` (`config.local.url ?? 'http://127.0.0.1:7777'`), `src/providers/local.ts:45` (`resolveEnv(ENV.apiUrlLocal).value ?? DEFAULT_LOCAL_URL`), `bin/memory-connect.ts:108` (`envArg ?? process.env['ASTRAMEMORY_ENV'] ?? 'prod'`), `lib/profileResolver.ts:18` (`process.env['ASTRAMEMORY_HOME'] ?? join(homedir(), '.astramemory')`).

**Churn (last 3 months, `git log --since="3 months ago"`, repo has 118 commits total in that window)**

Per-directory commit counts touching each top-level dir:

| Dir | Commits (3mo) |
|---|---|
| tests | 47 |
| src | 29 |
| .claude-plugin | 15 |
| hooks | 16 |
| bin | 13 |
| lib | 9 |
| docs | 9 |
| commands | 3 |

10 most-changed non-test source files (3 months) with commit count and last-change date:

| File | Commits (3mo) | Last changed |
|---|---|---|
| `.claude-plugin/plugin.json` | 13 | 2026-07-07 |
| `src/providers/saas.ts` | 8 | 2026-07-05 |
| `src/contracts/wire.ts` | 8 | 2026-07-05 |
| `hooks/scripts/session-end-summary.sh` | 8 | 2026-07-01 |
| `src/providers/local.ts` | 7 | 2026-07-05 |
| `hooks/scripts/pre-compact-capture.sh` | 7 | 2026-07-01 |
| `bin/astramem` | 7 | 2026-07-01 |
| `src/cli/ingest-transcript.ts` | 6 | 2026-07-01 |
| `src/lib/selector.ts` | 5 | 2026-07-06 |
| `hooks/scripts/subagent-stop-capture.sh` | 5 | 2026-07-01 |

Two files that ranked in the top commit-count set no longer exist in the working tree — `hooks/scripts/_ingest-transcript.sh` (9 commits, deleted per `git log --oneline -- hooks/scripts/_ingest-transcript.sh` showing `ae92cd3 feat(hooks): rewrite hook shims as thin Bun-CLI invokers; delete legacy bash plumbing`) and `hooks/scripts/_load-env.sh` (3 commits, same deletion wave) — both superseded by the current 4-script `hooks/scripts/*.sh` set.

**Stability classification**: every file in the top-10 churn table last changed within the last 6 days of the 3-month window (2026-07-01 through 2026-07-07), i.e. every extraction-adjacent module in this repo (`src/providers/saas.ts`, `src/providers/local.ts`, `src/contracts/wire.ts`, `src/lib/selector.ts`, `src/cli/ingest-transcript.ts`) is currently churning, not stable — none qualifies under the dimension-8 stability bar of "unchanged ≥1 month."

---

# REPO: plugins-common

## Dimensions 1-2: duplication census + dependency edges

<!-- agent: plugins-common:dup+graph -->

Now I have all the evidence needed. Let me compile the final report.

## 1. Duplication census — inventory (plugins-common)

Method: `Grep`/`Read` across `plugins-common/packages/{astramem-client,gepa-core,plugin-kernel}` for the suspect topics; `find`/`wc -l` for sizing; call-site counts via `grep -rl` over `packages/**/*.ts`.

| Topic | File:line-span | Approx LOC | Call-site count (within this repo) |
|---|---|---|---|
| JSONL append/read (trial store) | `plugins-common/packages/gepa-core/src/store/file-store.ts:13-31` (`jsonlPathFor`, `readJsonlSafe`) | 19 | 5 files reference `fileStore` (index export, own test `tests/store/file-store.test.ts`, `tests/store/file-store-crash.test.ts`, `src/index.ts` re-export, `src/interfaces.ts` type import) |
| JSONL-line validation (independent parse loop, not reusing `file-store.ts`'s reader) | `plugins-common/packages/gepa-core/src/validators/validate-trial-corpus.ts:58-85` | 28 | 3 files (`src/validators/validate-trial-corpus.ts`, `src/index.ts` re-export, `tests/validators/validate-trial-corpus.test.ts`) |
| File-backed lock manager (PID + heartbeat staleness) | `plugins-common/packages/gepa-core/src/lock/file-lock-manager.ts:1-181` | 181 | 4 files (`src/index.ts`, `src/interfaces.ts` (`LockManager` type), own test `tests/lock/file-lock-manager.test.ts`) |
| JSON state load/save with fallback-on-parse-failure (budget meter persistence) | `plugins-common/packages/gepa-core/src/budget/daily-cap-meter.ts:26-42` (`load`/`save`) | 17 | 8 files reference `dailyCapMeter` (index export, both budget tests, `judge-cost-shape.test.ts`, interfaces import, etc.) |
| Config schema (zod) for a plugin-consumed root config file (`gepa.config.json`) | `plugins-common/packages/gepa-core/src/types/gepa-config.ts:1-81` | 81 | 4 files (`resolve-judge.ts` type import, `src/index.ts`? — not re-exported directly but imported by `resolve-judge.ts`/`types/index.ts`, `tests/types/zod-roundtrip.test.ts`, `tests/providers/resolve-judge.test.ts`) |
| Provider/judge config resolution (agent-override-over-default pattern) | `plugins-common/packages/gepa-core/src/providers/resolve-judge.ts:68-102` | 35 | 3 files (`src/index.ts`, own test, `types/gepa-config.ts` type dep) |
| Markdown parsing into criteria list (H2-heading / top-level-bullet extraction) | `plugins-common/packages/gepa-core/src/providers/load-rubric.ts:46-84` (`parseRubricMarkdown`, `collectH2Headings`, `collectTopLevelBullets`) | 39 | 3 files (`src/index.ts`, own test `tests/providers/load-rubric.test.ts`) |
| Provider/vendor wrapper set (5 near-identical `LLMJudge` adapters: ollama/generic-openai/groq/gemini/azure-openai) | `plugins-common/packages/gepa-core/src/providers/{ollama,generic-openai,groq,gemini,azure-openai}/index.ts` | 93+186+136+174+210 = 799 total | Each is imported once from `src/index.ts`'s package-export map (`plugins-common/packages/gepa-core/package.json:16-32`, subpath exports) plus its own test file — no in-repo cross-calls between the 5 |
| Subprocess/CLI spawn wrapper (`where`/`which astramem` PATH probe) | `plugins-common/packages/astramem-client/src/resolve.ts:131-153` (`probeCliPath`) | 23 | 2 files (`src/resolve.ts` itself, `tests/resolve.test.ts`) — sole spawn call in the whole repo (confirmed via `grep -rn "Bun\.spawn\|child_process\|execFile\|spawnSync" packages --include=*.ts`, 1 hit total) |
| Provider resolution / fail-silent wire-provider seam (4-step fallback: injected → dep-selector → dep-provider-probe → runtime plugin-root discovery) | `plugins-common/packages/astramem-client/src/resolve.ts:1-215` | 215 | 4 files (`src/index.ts` re-export, `src/calls.ts` consumer, own test `tests/resolve.test.ts`) |
| Wallclock-capped fail-silent call wrappers (`remember`/`recall`) | `plugins-common/packages/astramem-client/src/calls.ts:23-84` | 62 | 3 files (`src/index.ts`, own test `tests/calls.test.ts`) |
| Semver/breaking-change diff helper | `plugins-common/packages/gepa-core/scripts/check-semver.ts:1-13` (`describeBreakingChanges`) | 13 | 2 files (script itself, `tests/scripts/check-semver.test.ts`) — no `semver` package or version-string comparator exists anywhere in this repo; this is an export-set diff, not a `MIN_X_VERSION` string comparator |
| Validation-gate scripts (grep-style CI gates) | `plugins-common/packages/gepa-core/scripts/check-no-env-reads.ts:1-75` | 75 | 1 (wired only via `packages/gepa-core/package.json:44` script `check:no-env`; no test file covers it, unlike `check-semver.ts`) |

Checked and found **clean** (no implementation in this repo) for the remaining suspects:
- **`.claude/loop.json` / `crew.json` / plugin `.local.md` settings readers** — clean, checked all 36 non-test `.ts` source files under `packages/*/src`; zero hits for `loop.json`, `crew.json`, or `.local.md` (`grep -rln "loop\.json\|crew\.json\|readConfig\|loadConfig\|\.local\.md" packages/*/src --include=*.ts` → 0 files). `gepa-config.ts` is a distinct root config (`gepa.config.json`), not one of these three.
- **Artifact-path resolution helpers (`.claude/artifacts/**` writers)** — clean, checked 36 source files; only one literal string hit, a schema default value (`plugins-common/packages/gepa-core/src/types/gepa-config.ts:15`, `file_root: z.string().default(".claude/artifacts/crew/gepa/trials")`) — a config default, not a path-resolution function.
- **Frontmatter parse/write (FEAT/slice/agent markdown)** — clean, checked 36 source files; zero hits for `frontmatter`, `gray-matter`, or a `---`-delimited-block parser.
- **Git worktree helpers** — clean, checked 36 source files; the only "worktree" occurrence is a doc comment (`plugins-common/packages/gepa-core/src/interfaces.ts:149`, "Lockfile coordinator — prevents concurrent … (worktree-parallel safety)") describing why `LockManager` exists, not a worktree-creation/management implementation.
- **Markdown table/section generation (snapshot/brief/retro style)** — clean, checked 36 source files; `load-rubric.ts` only *parses* markdown into a string array, it does not *generate* markdown tables or sections.

## 2. Dependency graph — outgoing edges from plugins-common

Method: inspected all three `package.json` files, root `package.json`, `bun.lock`, `.npmrc`, and all three `.github/workflows/*.yml`; grepped all `.ts` source under `packages/` for `dev-team`, `runner-plugin`, `astramemory`, `crew`, `../..`-style escapes, and absolute `C:/work` / `/c/work` paths.

| Edge | Type | Evidence |
|---|---|---|
| `packages/astramem-client` → `@astragenie/astramem-plugin` | npm `peerDependencies` (optional), registry-resolved — NOT a file/path dependency on the sibling `astramemory-plugin` repo checkout | `plugins-common/packages/astramem-client/package.json:26-31` |
| `packages/gepa-core` → `@azure/openai`, `@google/generative-ai` | npm `peerDependencies` (optional) | `plugins-common/packages/gepa-core/package.json:52-61` |
| `packages/astramem-client/src/resolve.ts` → `@astragenie/astramem-plugin` (runtime) | Dynamic `import()` of a joined-fragment specifier (not a static import), resolved only if the peer package is actually installed | `plugins-common/packages/astramem-client/src/resolve.ts:40-43,91-100,113-129` |
| `packages/astramem-client/src/resolve.ts` → installed astramem plugin's on-disk source tree (`<root>/src/lib/selector.ts`, `<root>/src/providers/local.ts`) | Runtime filesystem discovery + `file://` dynamic import, gated by `CLAUDE_PLUGIN_ROOT_MEMORY` env var or a `where/which astramem` PATH probe | `plugins-common/packages/astramem-client/src/resolve.ts:155-189` |
| Internal workspace edges: `@astragenie/astramem-client`, `@astragenie/gepa-core`, `@astragenie/plugin-kernel` | `workspace:` protocol, resolved only to sibling package dirs inside this same repo (`packages/*`) | `plugins-common/bun.lock:61-65`; `plugins-common/package.json:6-8` |

No edges found for:
- `file:`/`link:` deps to `dev-team`, `runner-plugin`, or `astramemory-plugin` checkouts — `grep -n "file:\|link:" bun.lock` matched nothing pointing outside `packages/*`.
- CLI spawns of another repo's scripts — the sole `spawn` call in the repo (`plugins-common/packages/astramem-client/src/resolve.ts:139`) invokes the OS `where`/`which` binary to locate `astramem` on PATH, not a sibling-repo script directly.
- Cross-repo file-path reads/greps of `dev-team`/`runner-plugin`/`astramemory` source trees — all matches for those literal strings in `.ts` files are provenance/attribution comments describing where code was *ported from* (e.g. `plugins-common/packages/gepa-core/src/providers/ollama/index.ts:5`, `plugins-common/packages/plugin-kernel/src/index.ts:4-10`, `plugins-common/packages/astramem-client/src/resolve.ts:1-31`), not executable path coupling.
- CI-workflow checkouts of sibling repos — `plugins-common/.github/workflows/ci.yml`, `peer-dep-matrix.yml`, and `release.yml` each run a single `actions/checkout@v4` with no `repository:` override, and operate entirely within `packages/gepa-core` / `packages/*`.
- Upward path escapes (`../..`) that cross a repo boundary — every `../../` hit found is intra-package (`tests/**` → `src/**` within the same package), e.g. `plugins-common/packages/gepa-core/tests/store/file-store.test.ts:5`. None cross into another package or another repo.

**Internal layer check**: `plugins-common/packages/gepa-core/src/index.ts:1-67` is the sole public barrel; `grep -rn "from \"\.\./index\.ts\"\|from \"\.\./\.\./src/index" packages/gepa-core/src` returns zero hits — no internal module imports the public barrel back (no inverted-layer edge found within this repo's packages).

## Dimensions 3-5: exception handling, provider seams, DI/testability

<!-- agent: plugins-common:err+seams+di -->

## 3. Exception handling comparison — plugins-common

**Scope checked**: all non-test `*.ts` under `packages/*/src/` (astramem-client: `resolve.ts`, `calls.ts`, `types.ts`, `index.ts`; gepa-core: 25 files under `src/`) plus the two `scripts/*.ts` CLI entry points. Zero `.mjs`/`.mts` in this repo — it's pure `.ts`.

### Catch-block census

| File | Catch blocks | Behavior |
|---|---|---|
| `packages/astramem-client/src/resolve.ts` | 7 (lines 97, 108, 118, 125, 149, 177, 185) | all swallow → return `null`/`false` or fall through to next strategy |
| `packages/astramem-client/src/calls.ts` | 2 try/catch (lines 56, 81) + 1 promise `.catch()` (line 29) | all swallow → resolve `false`/`null` fallback |
| `packages/gepa-core/src/validators/validate-trial-corpus.ts` | 2 (lines 61, 72) | line 61: swallow → `emptyReport()`; line 72: log-and-continue (`tally.tornLines++`) |
| `packages/gepa-core/src/scorer/rubric-scorer.ts` | 1 (line 46) | catches, converts to string message (`lastFailureReason`), no rethrow — retried, then folded into a returned `ScoreResult` |
| `packages/gepa-core/src/store/file-store.ts` | 1 (line 26, inside `readJsonlSafe`) | swallow — comment says "drop silently (crash-recovery invariant)" |
| `packages/gepa-core/src/runner/sequential-runner.ts` | 1 (line 20) | swallow → `sizeOk = false` |
| `packages/gepa-core/src/providers/ollama/index.ts` | 1 (line 61) | wrap — catches fetch failure, rethrows `new Error("OllamaJudge: connection to ${url} failed...")` |
| `packages/gepa-core/src/providers/gemini/index.ts` | 1 (line 86) | wrap — catches fetch failure, rethrows `new Error("GeminiJudge: fetch failed: ${msg}")` |
| `packages/gepa-core/src/providers/generic-openai/index.ts` | 1 (line 101, inside `parseChatResponse`) | swallow-to-default — JSON.parse failure produces a fallback `{pass:false,score:0,rationale:"failed to parse..."}` object |
| `packages/gepa-core/src/providers/azure-openai/index.ts` | 1 (line 191, inside `parseChatResponse`) | same swallow-to-default pattern as generic-openai (duplicated, not shared) |
| `packages/gepa-core/src/lock/file-lock-manager.ts` | 5 (lines 29, 58, 102, 142, 173) | line 29 (`isPidAlive`): swallow → `false`; line 58 (`tryAtomicWrite`): **mixed** — swallow only for `EEXIST`, `throw err` otherwise; lines 102, 142, 173: swallow + side-effecting cleanup (`rmSync`/`clearInterval`/`continue`) |
| `packages/gepa-core/src/budget/daily-cap-meter.ts` | 1 (line 35, inside `load`) | swallow → default `{day, spent:0, reservations:[]}` state |

**Total: 24 try/catch blocks + 1 promise-`.catch()`.** Swallowed (no rethrow, ever): 21 of the 24. Wrap-and-rethrow: 2 (`ollama/index.ts:61`, `gemini/index.ts:86`). Conditional swallow-or-rethrow in the same catch: 1 (`file-lock-manager.ts:58`).

### Error types

- **Custom error classes: zero.** `grep -rn "class \w+.*(Error|extends Error)"` across `packages/` returns no matches.
- **Bare `Error` throws: 13** across `packages/gepa-core/src/providers/{azure-openai,generic-openai,gemini,groq,ollama}/index.ts` (HTTP-status / connection-failure guards) and `packages/gepa-core/src/providers/resolve-judge.ts:80-83` (`resolveJudge: no factory registered for provider "..."`).
- **String throws: zero.** `grep -rn 'throw \`|throw "'` returns no matches.
- **Zod as a third, undeclared error channel**: `TrialSchema.parse(...)` (throwing form) appears at `packages/gepa-core/src/store/file-store.ts:25` (wrapped in try/catch, swallowed) **and** `file-store.ts:46` inside `put()` (**not** wrapped — a caller of `fileStore(root).put()` can receive an uncaught `ZodError` rejection). Every other Zod validation call site in the repo uses the non-throwing `.safeParse()` form: `daily-cap-meter.ts:29`, `file-lock-manager.ts:95,167`, `validate-trial-corpus.ts:76`. So the same package uses two different Zod idioms (`.parse` vs `.safeParse`) for the same "is this JSON valid" question, and only one call site (`file-store.ts:46`) can throw uncaught.

No coherent taxonomy anywhere: the ecosystem inside plugins-common alone already mixes (a) bare `Error` throws, (b) Zod's thrown `ZodError` (one call site), (c) Zod's `Result`-shaped `safeParse` (four call sites), and (d) hand-rolled `{ok, ...}` / `null`-on-failure returns (astramem-client, `BudgetMeter.reserve`, `LockManager.acquire`).

### Exit-code discipline

- `grep -rn "process\.exit\b"` across `packages/` (excluding the plain `process.exitCode` assignment) returns **zero matches**.
- The one `process.exitCode = 1` assignment is `packages/gepa-core/scripts/check-no-env-reads.ts:71`, inside a standalone CLI script (`scripts/`, invoked via `bun run scripts/check-no-env-reads.ts`), not a `src/` library module — consistent with the "no `process.exit(N)` from library functions" convention cited from runner-plugin's `CLAUDE.md`.

### Result-shaped returns vs exceptions — files that mix both

- **`packages/gepa-core/src/lock/file-lock-manager.ts`**: the public `LockManager.acquire()` contract is `Promise<{released}|null>` (Result-shaped, documented as never needing a catch by callers) — but `tryAtomicWrite` (line 54-65), called directly from `acquire()` with no wrapping try/catch (line 126), rethrows any non-`EEXIST` filesystem error. That rethrow is not caught anywhere in `acquire()`, so it propagates out of a function whose stated contract is "returns `null`, doesn't throw."
- **`packages/gepa-core/src/store/file-store.ts`**: `recall()`/`invalidate()` never throw (guarded reads, silently drop malformed lines via the wrapped `.parse()` at line 25), but `put()` calls the throwing `TrialSchema.parse(trial)` unwrapped (line 46) — the one write path in an otherwise defensively-swallowing file.
- **`packages/gepa-core/src/scorer/rubric-scorer.ts`**: `score()` never rejects (catches, retries, always resolves a `ScoreResult`), but the judge instances it's handed (`LLMJudge.evaluate()`) are all throw-based (`azure-openai`, `gemini`, `generic-openai`, `ollama` — see above) — the file quietly converts a throw-based dependency contract into a Result-shaped one via its own single catch.

## 4. Provider / integration-seam usage — plugins-common

### astramem seam

One seam, and only one: `packages/astramem-client` is itself the shared seam other repos are meant to consume (per its docblock, `resolve.ts:1-21`, citing FEAT-188 / dev-team#172). Within this repo nothing else touches astramem — no direct file reads, no CLI spawns outside this package.

| Mechanism | Citation | Notes |
|---|---|---|
| Test-injection seam | `resolve.ts:63-66` (`_setWireProvider`), `70-74` (`_resetResolveCache`) | no-op outside test env (`isTestEnv()`, line 76-80) |
| Dep-mode selector import | `resolve.ts:91-100` (`resolveViaSelectorDep`) | dynamic `import("@astragenie/astramem-plugin/selector")`, built from joined string fragments (line 41) specifically so `tsc --noEmit` doesn't descend into the optional peer |
| Dep-mode local/saas factory probe | `resolve.ts:113-129` (`resolveViaProviderDep`) | imports `@astragenie/astramem-plugin/providers/{local,saas}`, probes `health()` |
| Runtime plugin-root discovery (no package dep) | `resolve.ts:131-153` (`probeCliPath`, `where`/`which astramem`), `156-163` (`candidateRoots`, `CLAUDE_PLUGIN_ROOT_MEMORY` env), `165-189` (`resolveFromRoot`, file-URL `import()` of `<root>/src/lib/selector.ts` or `<root>/src/providers/local.ts`) | |
| Capped call wrappers | `calls.ts:40-59` (`rememberSilent`), `65-84` (`recallSilent`) | wraps whichever provider `resolveWireProvider()` returns; `DEFAULT_CAP_MS = 2000` (`calls.ts:14`) |
| Package coupling declaration | `packages/astramem-client/package.json` `peerDependencies["@astragenie/astramem-plugin"]` marked `optional: true` | no `file:`/`link:`/`workspace:` dependency on the sibling astramemory-plugin repo anywhere in `plugins-common` |

### crew / dev-team seam

No import, no path grep, no CLI spawn of dev-team or crew anywhere in `plugins-common`. The only artifact is a **structural type mirror**: `packages/gepa-core/src/types/crew-artifact.ts:1-20` (`CrewArtifactSchema`) reproduces crew's artifact JSON shape (`phase: enum(["build","review","validate","ship"])`, `dispatched_at`) by field-name convention only — no compile-time or runtime dependency on the dev-team repo. Comments in `packages/gepa-core/src/interfaces.ts:105,108-109,118,140` reference "Langfuse emission" and dev-team's `evals/cli.ts` as consumers, but these are prose notes, not code coupling. `grep -rn "dev-team|crew" packages/gepa-core/src` surfaces only these comment/type-name hits — no import statements.

### Agent-dispatch seams

Two abstraction points exist, both caller-injected (no bespoke dispatch call inside gepa-core itself):

| Seam | Citation | Shape |
|---|---|---|
| `BinaryDispatcher` | `packages/gepa-core/src/scorer/binary-scorer.ts:3-9` | `dispatch(opts): Promise<{pass,cost_usd,latency_ms,rationale?}>` — caller supplies the implementation; `binaryScorer()` (line 11) only wires it into the `Scorer` interface |
| `JudgeRegistry` / `JudgeFactory` | `packages/gepa-core/src/providers/resolve-judge.ts:52-56` | `Record<providerName, (config) => LLMJudge>` — caller supplies one factory per provider name; `resolveJudge()` (lines 68-85) is the only place that looks one up, and throws (bare `Error`) if the resolved `provider` string has no registered factory |

Below that seam, the five concrete judge providers (`azure-openai`, `generic-openai`, `gemini`, `groq`, `ollama`) are **five independent hand-rolled native-`fetch` clients** — no shared HTTP client, no shared retry policy, and inconsistent timeout handling within the same package:

- `azure-openai/index.ts:135-161` (`callAzure`): `AbortController` + `linkSignal()` (lines 205-210) + `setTimeout(timeoutMs)`.
- `gemini/index.ts:63-97` (`callGemini`) and `ollama/index.ts:47-72` (`callOllama`): `AbortSignal.timeout(timeoutMs)`, no external-signal linking.
- `generic-openai/index.ts:64-90` (`callChatCompletions`): **no timeout and no `AbortSignal` parameter at all** — the only one of the four fetch-based providers with no cancellation/timeout mechanism.
- `groq/index.ts:51-66,72-79` extends `GenericOpenAIJudge`, inheriting the no-timeout behavior; its own rate-limit header parser (`parseRateLimitHeaders`, lines 40-49) is called with a fresh empty `new Headers()` (line 77) rather than the real response headers — "future wire-up when fetch interception is implemented" (comment, line 76) — i.e. `lastRateLimit` is currently always empty.

"Provider" is abstracted only at the `LLMJudge` interface boundary (`packages/gepa-core/src/interfaces.ts:111-146`) and the `JudgeRegistry` factory-lookup boundary; every concrete adapter under it is bespoke.

## 5. Dependency injection & testability — plugins-common

### How modules receive dependencies

| Pattern | Citation | Example |
|---|---|---|
| Factory function taking config/root as parameter | `packages/gepa-core/src/store/file-store.ts:43` (`fileStore(root)`), `src/lock/file-lock-manager.ts:78` (`fileLockManager(locksDir)`), `src/budget/daily-cap-meter.ts:58` (`dailyCapMeter(capUsd, persistPath)`) | no module-scope state; each call returns an independent closure-scoped instance |
| Constructor-injected config, no env reads | `src/providers/{azure-openai,generic-openai,gemini,groq,ollama}/index.ts` constructors | enforced by CI gate `packages/gepa-core/scripts/check-no-env-reads.ts` (greps `src/providers/**/*.ts` for `process.env` access, `process.exitCode = 1` on any hit, lines 17-74) |
| Explicit factory-registry DI | `resolve-judge.ts:52-56,68-85` (`JudgeRegistry`), `binary-scorer.ts:3-9,11-28` (`BinaryDispatcher`) | caller wires the concrete implementation in; the core module never constructs one itself |
| Module-scope singleton + guarded test seam | `packages/astramem-client/src/resolve.ts:56-58` (`let _cache`, `let _injected`), test-only override at `63-66`/`70-74` gated by `isTestEnv()` (line 76-80) | the one place in the repo with persistent module-level state; state is written only inside function bodies (no import-time execution) |

### Worst import-time side effect

None found in any `src/` library module — `grep` for top-level (non-function-scoped) `spawn`/`readFileSync`/`readdirSync`/`console.*`/immediate `import()` across all `packages/*/src/**/*.ts` returns zero matches; `resolveWireProvider`'s module-scope `_cache`/`_injected` (`resolve.ts:56-58`) are declared but never populated except inside function bodies. The only top-level executing code in the repo is in the two CLI scripts: `packages/gepa-core/scripts/check-no-env-reads.ts:40-74` (directory walk + grep executed unconditionally at module scope) and `scripts/check-semver.ts` (comment-only CLI stub, lines 15-17) — both are `scripts/` entry points invoked via `bun run`, not files any other module imports.

### Test strategy

- **Real filesystem in temp dirs**: `packages/gepa-core/tests/lock/file-lock-manager.test.ts:9-15` (`mkdtempSync(join(tmpdir(),"gepa-locks-"))`, cleaned in `afterEach`); `packages/gepa-core/tests/store/file-store.test.ts:10-16` (same `tmpdir()` pattern); `packages/astramem-client/tests/resolve.test.ts:87,95-101,119-129` (`fs.mkdtemp` builds a throwaway fake plugin root with `selector.ts`/`local.ts` files on disk to test the runtime file-URL-import discovery path).
- **Hand-written fakes, no mocking library**: `packages/astramem-client/tests/resolve.test.ts:11-15` (`fakeProvider: WireProvider`) and `tests/calls.test.ts:27-33,43-49` (inline `WireProvider` object literals with throwing `remember`/`recall` to exercise the swallow paths), injected via `_setWireProvider`; `packages/gepa-core/tests/judge/llm-judge-contract.test.ts:28-55` (`class MockLLMJudge implements LLMJudge`); `packages/gepa-core/tests/scorer/binary-scorer.test.ts:6-12,30-32` (inline `BinaryDispatcher` object passed directly as a constructor argument to `binaryScorer(...)`).
- **Env-var-driven test isolation**: `resolve.test.ts:21-22` and `calls.test.ts:16-17` both set `ASTRAMEM_DISABLE_PATH_PROBE=1` and clear `CLAUDE_PLUGIN_ROOT_MEMORY` in `beforeEach` to prevent the runtime-discovery path from reaching a real daemon/CLI on the test machine — a manual env-based seam rather than a code-level DI override for that one dependency (`probeCliPath`, `resolve.ts:134-135`).
- No dependency-injection container, no test double library (`sinon`/`vitest.mock`/etc.) anywhere in the repo — all substitution is either explicit factory/constructor parameters or the one purpose-built test-seam pair in astramem-client.

### `plugin-kernel`: framework or library?

`packages/plugin-kernel/src/index.ts` is, in full, a 24-line design comment followed by `export {}` (line 26) — there is no shipped implementation. Its only test is `packages/plugin-kernel/tests/smoke.test.ts:4-7`, which asserts `import * as kernel from "../src/index.ts"` doesn't throw. `package.json` marks it `"private": true`, version `0.0.1`.

Answered explicitly: **today it is neither a library nor a framework — it is an empty scaffold.** There is no IoC container, no lifecycle hook, no mandatory-adoption surface in the current code to classify. What exists is design *language* in the docblock (`index.ts:8-23`) stating it "will own" the workflow-state machine wholesale ("moved wholesale from dev-team's workflow-state.ts"), "one lock implementation shared by both plugins" (replacing two independent implementations), transactional ID minting, and a canonical typed-event envelope "feeding the event spine" — i.e., the stated intent already describes a single shared state machine + lock + ID authority that two consumer plugins would be expected to adopt wholesale rather than compose piecemeal, which is framework-shaped language, but as of this citation nothing in `plugin-kernel` enforces or exhibits that behavior yet.

## Dimensions 6-8: boundaries, bad practices, toggles/config/churn

<!-- agent: plugins-common:bounds+practices+config -->

## 6. Modularization & boundaries

**Package-to-package coupling: zero.** Grep across `package.json` files in the workspace for `astramem-client`, `gepa-core`, `plugin-kernel` shows each of the three packages' manifest only self-references — no package imports another (`plugins-common/package.json`, `plugins-common/packages/*/package.json`). Confirmed no `import`/`from` statements crossing package boundaries in `packages/*/src/**/*.ts` (grep for cross-package relative paths returned nothing). No fan-in/fan-out violation possible between the three packages because there is no edge at all yet.

**No layer violations found.** `packages/gepa-core/scripts/*.ts` (entry-point validation scripts) are not imported by anything under `packages/gepa-core/src/**` (checked via grep for `scripts/` inside `src/`); `src/` does not import `scripts/`. No inverted-layer edges detected in any of the three packages.

**Internal fan-in (within gepa-core):** `packages/gepa-core/src/interfaces.ts` is imported by 8 files (`budget/daily-cap-meter.ts`, `index.ts`, `lock/file-lock-manager.ts`, `providers/resolve-judge.ts`, `runner/sequential-runner.ts`, `scorer/binary-scorer.ts`, `scorer/rubric-scorer.ts`, `store/file-store.ts`) — expected for a shared-contracts file, not cited as a violation. `packages/gepa-core/src/types/gepa-config.ts` has 2 in-package importers (`providers/resolve-judge.ts`, `types/index.ts`).

**`packages/plugin-kernel/src/index.ts` (26 lines, `plugins-common/packages/plugin-kernel/src/index.ts:1-26`) is an empty scaffold** — its only executable statement is `export {}` (line 26). The file's doc-comment (lines 1-24) describes a public surface it does not yet implement: "Workflow-state machine," "Locks," "ID registry," "Artifact IO," "Typed events" (lines 9-21), referencing an external plan document not present in this repo. The package's `package.json` description (`packages/plugin-kernel/package.json:5`) repeats the same aspirational scope: "workflow-state machine, locks, ID registry, artifact IO, typed events." The only test (`packages/plugin-kernel/tests/smoke.test.ts:1-8`) asserts `expect(kernel).toBeDefined()` against the empty module.

**Dead exports: none found.** Traced every named export in `packages/gepa-core/src/index.ts:1-67` (18 export statements) and `packages/astramem-client/src/index.ts:5-18` (3 export groups) — every symbol (`dominates`, `containsSecretShape`, `parseRubricMarkdown`, `detectEvalDriftFromSplits`, `resolveJudgeConfig`, `_resetResolveCache`, `_setWireProvider`, `resolveWireProvider`, `DEFAULT_CAP_MS`, `rememberSilent`, `recallSilent`, etc.) has at least one non-trivial reference in its package's own `tests/` directory (e.g. `packages/gepa-core/tests/pareto/rank.test.ts:2,47-88` for `dominates`; `packages/astramem-client/tests/resolve.test.ts:8,36-89` for `resolveWireProvider`/`_setWireProvider`). No zero-call-site export identified (external-repo call sites are out of scope for this assignment — see dimension-2 owner for cross-repo consumption counts).

**Implicit public surface:** the `plugin-kernel` doc-comment (`packages/plugin-kernel/src/index.ts:9-21`) names a design document path (`docs/ai-loop/.../20260704T131500Z-plan-phase2-kernel-event-spine.md`) that does not exist inside this repo (`find . -name "*kernel-event-spine*"` returns nothing under `plugins-common`) — the contract for what this package will become lives outside plugins-common.

## 7. Bad practices sweep

- **`@ts-ignore` / `@ts-nocheck`: 0 occurrences** anywhere in `packages/**/*.ts` (test or non-test) — `grep -rn "@ts-ignore\|@ts-nocheck" packages --include="*.ts"` returned no matches. Clean — checked all 84 tracked `.ts`/`.md`/`.json` files.
- **`any` density: 0 occurrences** of `: any`, `<any>`, or `as any` in non-test or test code across all three packages (`grep -rno ':\s*any\b\|<any>\|as any\b' packages --include="*.ts"` → 0 matches). Clean.
- **Repeated magic-string enum, single file:** `packages/gepa-core/src/types/gepa-config.ts:31` and `packages/gepa-core/src/types/gepa-config.ts:43` both hard-code the identical 5-provider literal-string list `["ollama", "azure-openai", "gemini", "groq", "generic-openai"]` (once for `judge.provider`, once for `judge_per_agent[*].provider`) instead of sharing one constant. The file's own comment at `gepa-config.ts:26-29` names the exact risk ("a provider missing from this enum makes valid configs fail safeParse, which silently no-ops the entire capture pipeline downstream") — and that risk materialized: commit `de7dc45` ("fix(config): add groq + generic-openai to judge provider enum (#4)", 2026-07-02) patched exactly this duplicated enum after `git show --stat de7dc45` shows only `src/types/gepa-config.ts` and a new roundtrip test changed, with the commit body stating the bug was "Found live 2026-07-02 wiring judge overrides for the capture canary (dev-team feat/210-gepa-canary had to substitute gemini)."
- **Naming inconsistency for the same "optional config bag" concept across the two published packages:** `packages/gepa-core` uses an `*Opts` type suffix consistently — 6 distinct types: `RubricScorerOpts` (`scorer/rubric-scorer.ts:18,23`), `ValidateCorpusOpts` (`validators/validate-trial-corpus.ts:36,56`), `DetectDriftOpts` (`validators/detect-eval-drift.ts:38,53,79`), `ResolveJudgeOpts` (`providers/resolve-judge.ts:58,72`), `RedactRationaleOpts` (`providers/redact-rationale.ts:18,50`), `LoadRubricOpts` (`providers/load-rubric.ts:25,35`), all re-exported from `src/index.ts:16,24,30,38,43,48`. `packages/astramem-client` instead uses `CallOptions` (`calls.ts:16,42,67`, re-exported at `index.ts:18`) for the equivalent concept. 19 non-test parameters named `opts` vs 1 named `options` (`grep -rn "opts:" / "options:"`), confirming the type-suffix split tracks a real naming split, not incidental phrasing.
- **Ad-hoc per-provider default-application, 5 independent copies:** every one of the 5 LLM-judge provider constructors hand-rolls its own `config?.field ?? DEFAULT_X` pattern rather than sharing one defaulting helper or a zod-parsed schema (contrast with `GepaConfigSchema` in `gepa-config.ts`, which *is* zod-validated with `.default(...)`): `providers/ollama/index.ts:81-84` (4 fields), `providers/azure-openai/index.ts:77-79` (3 fields), `providers/gemini/index.ts:121-124` (4 fields), `providers/generic-openai/index.ts:131` (1 field), `providers/groq/index.ts:63-64` (2 fields, partially mitigated — `groq/index.ts:17` reuses `GenericOpenAIConfig` by composition rather than redefining it).
- **Swallowed (comment-only, no logging, no counter) catch blocks:** `packages/astramem-client/src/resolve.ts:118-120` (`// Fall through to saas.`), `resolve.ts:124-126` (`// Unavailable.`), `resolve.ts:176-178` (`// Fall through to the local-provider factory.`), `resolve.ts:184-186` (`// Unavailable at this root.`) — 4 instances, all in the same file, all by explicit fail-silent design (package description: "fail-silent client seam," `astramem-client/package.json:5`). `packages/gepa-core/src/store/file-store.ts:25-27` (`// Torn or malformed line — drop silently (crash-recovery invariant).`) is a true no-op swallow with zero telemetry, in contrast to the structurally similar `packages/gepa-core/src/validators/validate-trial-corpus.ts:70-73`, which catches the same "torn JSONL line" condition but increments a `tornLines` counter (`validate-trial-corpus.ts:72`) instead of dropping silently — same failure mode, two different swallow disciplines in the same package.
- **Hand-authored non-`.mts` entry scripts:** `packages/gepa-core/scripts/check-no-env-reads.ts` and `packages/gepa-core/scripts/check-semver.ts` are `.ts` (not `.mjs`) validation entry points; both correctly use `process.exitCode = 1` (`check-no-env-reads.ts:71`) rather than `process.exit()` — no exit-code discipline violation found in this repo's own scripts (`grep -rn "process.exit"` → only the one `exitCode` assignment).
- **Custom error taxonomy: none exists.** `grep -rn "extends Error\|class.*Error"` across all three packages returns 0 matches — every thrown error in the repo is a bare `new Error(...)` (9 call sites, all in `packages/gepa-core/src/providers/*` and `lock/file-lock-manager.ts:63`, `providers/resolve-judge.ts:80-82`). No string-throws found (`throw "..."` pattern: 0 matches).

## 8. Feature-toggle / config audit + churn/stability signals

**Toggle inventory:**

| Toggle | Kind | Citation |
|---|---|---|
| `capture.enabled` | boolean, zod default `true` | `packages/gepa-core/src/types/gepa-config.ts:7` |
| `capture.exclude` | array (per-agent disable list) | `gepa-config.ts:8` |
| `storage.backend` | enum `"file"\|"astramem"`, default `"file"` | `gepa-config.ts:14` |
| `runner.backend` | enum `"sequential"\|"wave"`, default `"sequential"` | `gepa-config.ts:21` |
| `judge.provider` | enum, 5 values, default `"ollama"` | `gepa-config.ts:30-32` |
| `judge_per_agent[*].provider` | same 5-value enum, per-agent override, no default | `gepa-config.ts:43` |
| `optimize.paused` | boolean, default `false` | `gepa-config.ts:59-60` |
| `policy.allow_cost_regression` | boolean, default `false` | `gepa-config.ts:74` |
| `policy.allow_latency_regression` | boolean, default `false` | `gepa-config.ts:75` |
| `champion_frozen` | array (agent-id block-list) | `gepa-config.ts:80` |
| `NODE_ENV===test` / `BUN_TEST` / `VITEST` | env-var composite, test-mode gate for two test seams | `packages/astramem-client/src/resolve.ts:76-80`, consumed by `_setWireProvider` (`resolve.ts:63-64`) and `_resetResolveCache` (`resolve.ts:70-71`) |
| `ASTRAMEM_DISABLE_PATH_PROBE` | env-var boolean (raw truthy check, no explicit `=== "true"` parse) | `resolve.ts:135` |
| `CLAUDE_PLUGIN_ROOT_MEMORY` | env-var path override | `resolve.ts:158` |

All 10 `gepa-config.ts` toggles route through one zod schema with typed defaults (`GepaConfigSchema`, `gepa-config.ts:4-81`) — a single mechanism. The 3 `astramem-client` toggles are raw `process.env.X` reads with no shared parsing helper across the file, and no zod/typed-accessor layer — a second, different toggle mechanism, both present in the same monorepo.

**Ad-hoc optional-chain-with-default reads:** 53 occurrences of `??` and 28 occurrences of `?.` across non-test `.ts` files (`grep -rno '??' / '?\.' packages --include="*.ts" | grep -v /tests/ | wc -l`). Full line listing captured; concentration is in the 5 provider constructors and 6 validator/scorer option-defaulting sites (dimension 7 above lists the provider-constructor subset by file:line).

**Churn / stability:**

- Repo total history: 21 commits, full lifetime 2026-06-27 → 2026-07-07 (11 days) — every commit falls inside the "last 3 months" window (`git log --since="3 months ago" --oneline | wc -l` = 21, equal to total).
- Commit list (`git log --pretty=format:"%h %ad %s" --date=short`) shows `gepa-core` versioned 0.1.0 → 0.7.0 in that same 11-day span (7 version bumps: `5a13eaa`, `db194b0`/`8b3d84c`, `1214233`, `1609183`, `db9529e`, `92fd333`/`3013d0b`).
- Per-path commit touch-counts (`git log --since="3 months ago" --oneline -- <path> | wc -l`): `packages/gepa-core` 4, `.github` 4, `packages/astramem-client` 2, `packages/plugin-kernel` 1, `docs` 0.
- File-level touch counts, top of list (`git log --name-only --since="3 months ago" -- packages | sort | uniq -c | sort -rn`): `packages/gepa-core/package.json` 3 touches, `packages/gepa-core/CHANGELOG.md` 2, `packages/astramem-client/package.json` 2; every other tracked file shows exactly 1 touch in the window — the repo's source files were added once each rather than iteratively edited (bulk/scaffold commits), except the one landmine fix already cited (`de7dc45` touching `src/types/gepa-config.ts` a second time after its initial addition in `1214233`/`1609183`-era commits).
- `packages/plugin-kernel` stability classification: **churning-by-absence** — 1 touch total (scaffold commit `175a85c`, 2026-07-04, "Convert to Bun-workspaces monorepo; scaffold @astragenie/plugin-kernel"), zero implementation, zero external call sites possible (package body is `export {}` — `plugin-kernel/src/index.ts:26`). Not evaluable as stable or churning in the ordinary sense because there is no public API surface yet to churn.
- `packages/gepa-core/src/types/gepa-config.ts` stability classification: **churning** — 2 distinct commits touching schema shape in an 11-day window (initial authorship + the `de7dc45` provider-enum bugfix 3 days later), i.e. a same-file second-touch rate of 1 revision per ~5.5 days observed, against a repo lifetime of only 11 days total.
