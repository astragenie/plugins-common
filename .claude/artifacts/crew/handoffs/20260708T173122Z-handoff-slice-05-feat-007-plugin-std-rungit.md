---
slice: SLICE-05
feature: FEAT-007
title: plugin-std runGit spawn wrapper
owner: fullstack-dev
status: implementation-complete
requires_validation: true
---

# Handoff: SLICE-05 (FEAT-007) — `runGit` spawn wrapper

## Objective

Extract a minimal `runGit` git subprocess spawn wrapper into
`@astragenie/plugin-std`. Pure extraction — no in-repo consumer wired up
this slice (dev-team/runner consume cross-repo, explicitly out of scope
per the dispatch).

## Scope

- IN SCOPE and touched: `packages/plugin-std/**` only.
- OUT OF SCOPE and untouched (verified via `git status`): gepa-core,
  astramem, runner, dev-team. Zero diff outside `plugin-std`.
- No worktree logic, no branch policy, no merge/prune, no retry/backoff —
  spawn wrapper only, matching plan §1.7's scope guard.

## What changed

### `packages/plugin-std` (new `./git` subpath, frozen API at extraction)

- `src/git.ts` (new): `runGit(args: string[], opts?: RunGitOptions) =>
  Promise<RunGitResult>` where `RunGitResult = {ok, stdout, stderr,
  status}`. Backed by `node:child_process`'s `execFile("git", args, ...)`
  (no shell — args passed positionally, no injection surface).
  `RunGitOptions` supports `cwd`, `signal` (AbortSignal), `timeoutMs`,
  `maxBuffer`.
- Error policy (matches `jsonl.ts`/`http.ts`'s throw-for-infra convention,
  per dispatch instruction): a non-zero git exit is a **normal**
  `{ok: false, status, stderr}` result — most git subcommands use exit
  status as a documented signal (e.g. `rev-parse --verify` on a missing
  ref, or a bad subcommand). Only a genuine spawn failure — the process
  never ran (missing binary, `EACCES`, cwd doesn't exist) — throws a typed
  `TransientError` (`E_GIT_SPAWN`), distinguished from a real exit by
  `typeof error.code !== "number"` and no `error.signal`.
- `tests/git.test.ts` (new, 12 tests): AC-1 success path (`git --version`;
  `git init` + `rev-parse --is-inside-work-tree` in a temp dir; `cwd`
  passthrough; args passed positionally with shell-metacharacter content
  round-tripping untouched via a commit message test), AC-2 non-zero-exit
  path (`rev-parse --verify HEAD` in a fresh empty repo; unknown
  subcommand) — both assert `ok:false` + non-zero `status` + non-empty
  `stderr` and do NOT throw, spawn-failure path (missing/invalid cwd
  throws `TransientError` with `code: "E_GIT_SPAWN"`), and signal/timeout
  option coverage (pre-aborted signal rejects, short timeout settles
  without hanging).
- Tests are hermetic: `mkdtemp(os.tmpdir())` per test in `beforeEach`,
  `rm(..., {recursive:true, force:true})` in `afterEach` — no git run
  against the real repo working tree.
- `package.json`: added `"./git"` export entry; version `0.4.0` → `0.5.0`.
- `src/index.ts`: `export * from "./git.ts"` added to the root barrel
  (matches jsonl/http/frontmatter's dual root-re-export + subpath
  pattern); docstring updated.
- `CHANGELOG.md`: new `[0.5.0]` entry documenting the module, seed lineage
  (dev-team `briefing/git.ts:51-58` / diverged `gepa-killswitch-cmds.ts`
  sync variant), scope guard, and error policy.

## One TypeScript fix worth flagging for reviewer

`execFile`'s overload resolution widens `stdout`/`stderr` to `string |
Buffer` unless the options object's `encoding` is a statically-known
string literal. Typed `execOpts` explicitly as
`ExecFileOptionsWithStringEncoding` with `encoding: "utf8"` to pin the
string-returning overload — otherwise `tsc --noEmit` fails with 6 "not
assignable" errors on the callback destructure. No runtime behavior
change (git output is always text), just a type-level fix.

## Evidence

```
bun run --filter '@astragenie/plugin-std' test        → 52 pass / 0 fail (5 files)
bun run --filter '@astragenie/plugin-std' typecheck    → exit 0
bun run --filter '@astragenie/plugin-std' lint         → Checked 12 files, exit 0

bun run --filter '*' typecheck (workspace-wide)        → astramem-client, plugin-std,
  astramem-openclaw, gepa-core all exit 0 (4/4)
```

`git status --short` confirms the only new/changed paths are inside
`packages/plugin-std/` (`src/git.ts`, `tests/git.test.ts`,
`package.json`, `src/index.ts`, `CHANGELOG.md`). Pre-existing uncommitted
diffs elsewhere (`packages/gepa-core/**`, root `bun.lock`/`.gitignore`,
the `plugin-kernel` → `plugin-std` rename in flight) predate this slice
and are untouched.

## Acceptance criteria

- AC-1 PASS — `runGit(args, opts?) => Promise<{ok, stdout, stderr,
  status}>` shipped as async `execFile`-backed spawn wrapper, no
  worktree/policy/merge/prune logic; unit tests cover `git --version` and
  `git init` + `rev-parse` in a temp dir, both asserting `ok:true`,
  `status:0`, captured stdout.
- AC-2 PASS — non-zero exit (`rev-parse --verify HEAD` in a fresh empty
  repo; unknown subcommand) returns `ok:false` with the non-zero `status`
  and captured `stderr`, does not throw; genuine spawn failure (invalid
  cwd, standing in for a missing git binary) throws `TransientError`
  (`E_GIT_SPAWN`) — both paths tested.
- AC-3 PASS — exposed via root re-export (`index.ts`) + `./git` subpath
  (`package.json` exports); `bun run --filter '@astragenie/plugin-std'
  test|typecheck|lint` all exit 0; API frozen at extraction (matches
  jsonl/http/frontmatter convention exactly).

## Notes for reviewer / validator

- No in-repo consumer wired up (dev-team/runner adopt cross-repo,
  opportunistically) — this is intentional per the dispatch, not a gap.
- One test originally asserted `rev-parse --is-inside-work-tree` returns
  `ok:false` outside any git repo — removed after discovering this
  machine's `%TEMP%` (`C:\Users\<user>\AppData\Local\Temp`) is itself
  nested under a git-controlled ancestor directory
  (`C:\Users\<user>` has a `.git`), so git legitimately walks up and
  reports `true`. AC-2 coverage is unaffected — `rev-parse --verify HEAD`
  and the unknown-subcommand test both exercise the non-zero-exit path
  without relying on "outside any repo" being true.
- No commits were made (implementation-only dispatch per instructions).
  Reviewer/verifier dispatch intentionally skipped per instructions — not
  run in this session.
