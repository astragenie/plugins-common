# Task Handoff: SLICE-02 (FEAT-002) — jsonl utility module + gepa-core first-consumer adoption

- Created: 2026-07-08T16:31:52Z
- From: fullstack-dev (builder)
- To: crew:reviewer / crew:verifier (parent loop drives dispatch)
- Objective: Add a shared jsonl utility module (`append` / `appendBatch` /
  `readSafe` / `tail` / `rotate`) to `@astragenie/plugin-std` and prove
  first-consumer adoption by migrating gepa-core's guarded jsonl read/append
  in `file-store.ts` onto it — closing the "two-swallow-disciplines" torn-line
  defect (M2) by making torn-line counting the default in the shared module.
- Allowed Scope: `packages/plugin-std/**`, `packages/gepa-core/**` (in this
  repo only)
- Forbidden Scope: runner-plugin, dev-team, astramem-plugin (separate repos)
  — their rogue-site jsonl migrations are companion FEATs elsewhere; not
  attempted
- Deliverable: bounded code change + passing scoped tests, evidence captured
  below
- Confidence: high

## Changed Files

- `packages/plugin-std/src/jsonl.ts` — new. Exports `append`, `appendBatch`,
  `readSafe`, `tail`, `rotate` (all async, `node:fs/promises`-backed).
  Error policy matches `result.ts`'s documented throw/Result split: every op
  is infrastructure (filesystem), so failures throw a typed `PluginError`
  (`DeterministicError` for a non-JSON-serializable record, `TransientError`
  for fs failures) rather than returning a `Result` — `readSafe` is the one
  deliberate exception (a torn/malformed line is an *expected* crash-recovery
  outcome, not a failure, so it's counted via `skipped` instead of thrown).
  `append`/`appendBatch` create the parent directory as needed (single
  `appendFile` call per batch — "atomic-ish": one syscall, so a concurrent
  reader never observes an interleaved partial record from that batch).
  `tail` is a thin wrapper over `readSafe` + slice. `rotate` is opt-in
  (`maxBytes` threshold, or unconditional) and renames the file out of the
  way rather than truncating, so no data is lost on rotation.
- `packages/plugin-std/src/index.ts` — re-exports `./jsonl.ts` from the
  package root barrel; updated the module-surface docblock.
- `packages/plugin-std/package.json` — added `"./jsonl"` to `exports` (own
  subpath, alongside the root barrel, per "importable piecemeal" library
  semantics); version `0.1.0` → `0.2.0` (new module, non-breaking).
- `packages/plugin-std/tests/jsonl.test.ts` — new. Happy-path test per AC-1
  for each of `append`, `appendBatch`, `readSafe`, `tail`, `rotate`
  (11 tests total), plus the AC-2 torn-final-line test (deliberately
  truncated fixture line via `writeFileSync` appending a no-trailing-newline
  partial JSON object) and a custom-parser test showing schema violations
  also count as skipped lines (the shape gepa-core needs for `TrialSchema`).
- `packages/gepa-core/src/store/file-store.ts` — AC-3: deleted the local
  guarded-read implementation (`readJsonlSafe`'s `readFileSync` + manual
  split/try-catch loop, `existsSync`/`appendFileSync` for the single-line
  write path). `put()` now calls `append()`; `readJsonlSafe` (still a
  private per-file helper, 2 call sites in `recall()`/`invalidate()`,
  unchanged externally) now delegates to `readSafe(path, (raw) =>
  TrialSchema.parse(JSON.parse(raw)))` and returns `readonly Trial[]`
  (`recall`/`invalidate` both await it now — was previously sync).
  `mkdirSync`/`existsSync`/`readdirSync`/`writeFileSync` imports from
  `node:fs` remain for the parts jsonl.ts doesn't own (directory
  precreation for `jsonlPathFor`, directory listing, `invalidate()`'s
  filtered-rewrite).
- `packages/gepa-core/package.json` — version `0.8.0` → `0.8.1` (patch:
  internal refactor, `TrialStore` public surface unchanged).
- `packages/gepa-core/CHANGELOG.md` — `0.8.1` entry documenting the
  internal-only nature of the change (no consumer-visible signature change).

No gepa-core test files needed direct edits: `file-store.test.ts` and
`file-store-crash.test.ts` exercise `fileStore()`'s public `put`/`recall`/
`invalidate` API, which now runs through the shared jsonl module
internally — including the crash-recovery torn-line test, which passes
unchanged against the new implementation.

## AC Evidence

- AC-1 (jsonl module ships `append`/`appendBatch`/`readSafe`/`tail`/`rotate`,
  each with a happy-path unit test): PASS — `packages/plugin-std/tests/jsonl.test.ts`,
  11 passing tests covering the documented happy path of each export
  (nested-dir creation, successive appends, batch write, empty-batch no-op,
  missing-file empty result, tail slicing incl. count > length, rotate with
  archivePath, rotate below `maxBytes` no-op, rotate on missing file no-op).
- AC-2 (torn final line: well-formed lines + skipped count, no throw): PASS —
  `jsonl.test.ts` "torn final line: returns well-formed lines plus a skipped
  count, does not throw" writes 2 valid records then appends a truncated
  `{"id":3,"name":"unfinis` (no closing brace/newline) directly to the file,
  wraps `readSafe()` in try/catch, asserts `thrown` is `undefined`,
  `records` is the 2 well-formed rows, `skipped === 1`.
- AC-3 (gepa-core migrated to plugin-std's jsonl module, local guarded-read
  deleted, existing tests re-pointed and pass): PASS — `file-store.ts`'s
  `readJsonlSafe`/append path now calls `readSafe`/`append` from
  `@astragenie/plugin-std`; the previous inline `readFileSync` + manual
  parse-loop implementation no longer exists in the file. All 210 gepa-core
  tests (including `file-store.test.ts`'s 7 tests and
  `file-store-crash.test.ts`'s torn-line-drop test) pass unchanged.
- AC-4 (`plugin-std/package.json` exports the jsonl module; `typecheck` +
  `test` pass for the new module): PASS — `exports["./jsonl"]` added
  alongside the root barrel export; `bun run --filter '@astragenie/plugin-std'
  typecheck` and `test` both green (see Verification Commands below).

## Verification Commands Run (all green)

```
cd packages/plugin-std && bun run build       # tsc -p tsconfig.build.json: clean, dist/ produced (incl. dist/jsonl.js + .d.ts)
cd packages/plugin-std && bun run typecheck   # tsc --noEmit: clean
cd packages/plugin-std && bun run lint        # biome check: clean
cd packages/plugin-std && bun run test        # 13 pass, 0 fail, 21 expect() calls (2 files: smoke + jsonl)
cd packages/gepa-core  && bun run typecheck   # tsc --noEmit: clean (after readJsonlSafe -> readonly Trial[] fix for JsonlReadResult's readonly array)
cd packages/gepa-core  && bun run lint        # biome check: clean (after import-order fix)
cd packages/gepa-core  && bun run build       # tsc -p tsconfig.build.json: clean
cd packages/gepa-core  && bun run test        # 210 pass, 0 fail, 441 expect() calls (full package suite, unbroken)
bun run --filter '*' typecheck                # all 4 workspace packages clean
bun run --filter '*' lint                     # all 4 workspace packages clean
bun run --filter '*' test                     # plugin-std 13, gepa-core 210, astramem-client 33, astramem-openclaw 38 — all pass
```

## Risks / Notes

- The jsonl API is declared frozen at extraction per the phase-3 plan
  (`docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md`
  §1.2/§8.5) — signature choices here (async, throw-for-infra /
  count-for-torn-lines, `JsonlReadResult<T>` shape) become the contract that
  runner-plugin/dev-team/astramem-plugin migrate onto in their own
  out-of-repo companion FEATs (§1.2: "2b jsonl consumer migration").
  Reviewer should scrutinize the signature shapes specifically for that
  reason — a breaking change post-extraction has a wider blast radius than
  usual for a 0.x package.
- `tail()` is implemented as `readSafe()` + slice — O(file size), not a
  true seek-from-end read. No AC or documented performance budget requires
  streaming-from-end; flagging as a known simplification in case a large-file
  consumer (e.g. runner's tail-read call sites, per the plan) needs a
  follow-up FEAT for a true bounded-read tail.
- `rotate()` archives via `rename` (not delete) — deliberately loses no data,
  but also never reclaims disk space; callers own their own archive
  retention/pruning if they need it. Not exercised by any AC beyond the
  opt-in happy path + no-op cases.
- Two 0.x version bumps included: `plugin-std` `0.1.0` → `0.2.0` (new
  additive export) and `gepa-core` `0.8.0` → `0.8.1` (patch — internal
  refactor only, `TrialStore` public interface unchanged). CHANGELOG entry
  added for gepa-core only (plugin-std has no CHANGELOG.md file yet — same
  as it had none for SLICE-01's errors/Result addition either).
- Pre-existing, uncommitted changes from SLICE-01 (FEAT-001) were already in
  the working tree before this dispatch started (`file-lock-manager.ts`,
  `interfaces.ts`, associated tests, `bun.lock`, `.gitignore`, etc. — see
  the SLICE-01 handoff `20260708T161303Z-handoff-slice-01-feat-001-gate-zero-plugin-std-adoption.md`).
  Not touched by this slice; flagging so the reviewer doesn't attribute them
  to this diff. `git status --short` at the time of writing also shows
  untracked `.claude/`, `CLAUDE.md`, and an empty `Implement` file predating
  this dispatch — none created or modified by this slice.
- No commits were created (builder scope is implementation only; parent
  loop / lead owns commit ceremony per constitution).

## Suggested Next Handoff

crew:reviewer + crew:verifier (parent loop dispatches per SLICE-02's
`requires_validation: true`). Reviewer should confirm the frozen-API framing
holds up (no signature choice here should need to change once out-of-repo
consumers start migrating). Verifier should re-run the scoped test commands
above. On PASS, this closes FEAT-002 SLICE-02 and unblocks phase-3 plan item
"2b jsonl consumer migration" (runner-plugin 8 canonical + 8 rogue, dev-team
10 rogue appends + 5 tail-read, astramem 4 call sites) per
`docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md` §1.2/§8.5.
