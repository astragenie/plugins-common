# Changelog

## [0.5.0] — 2026-07-08

**MINOR (0.x, may include breaking changes) — `runGit` spawn wrapper
(FEAT-007 SLICE-05).**

- New `git` module (root re-export + `@astragenie/plugin-std/git` subpath,
  matching the `jsonl` / `http` / `frontmatter` export convention):
  `runGit(args, opts?) => Promise<{ok, stdout, stderr, status}>`, backed by
  `node:child_process`'s `execFile("git", args, ...)`.
- Seed: dev-team's `briefing/git.ts:51-58` (byte-identical twin in
  `branch-cleanup.ts` — both die at extraction) and the diverged sync
  `gepa-killswitch-cmds.ts:51-65` variant (cross-repo consolidation review,
  2026-07-07 Phase 3 plan §1.7).
- Scope guard: spawn ONLY — no worktree logic, no branch policy, no
  merge/prune, no retry/backoff. Callers build those on top.
- Error policy (matches `jsonl.ts` / `http.ts`): a non-zero git exit is a
  normal `{ok: false, status, stderr}` result, not a thrown error — most
  git subcommands use exit status as a documented signal. Only a genuine
  spawn failure (missing binary, `EACCES`, etc.) throws a typed
  `TransientError` (`E_GIT_SPAWN`).
- No in-repo consumer yet — dev-team/runner adopt cross-repo,
  opportunistically, per the plan's migration guidance. Frozen API at
  extraction.

## [0.4.0] — 2026-07-08

**MINOR (0.x, may include breaking changes) — pinned frontmatter parse/serialize
core (FEAT-004 SLICE-04).**

- New `frontmatter` module (root re-export + `@astragenie/plugin-std/frontmatter`
  subpath, matching the `jsonl` / `http` export convention): `parseFrontmatter` /
  `serializeFrontmatter` for `---\n<yaml>\n---\n<body>` fenced blocks, backed by
  the `yaml` package instead of a line-oriented regex.
- Closes the documented CRLF bug class (seed: runner
  `src/scripts/lib/frontmatter.mts`, plan §1.4/§8.2): input is BOM-stripped and
  CRLF/CR normalized to LF before the fence is located, so LF-only, CRLF, and
  BOM-prefixed copies of the same file all parse to the identical result.
- Malformed frontmatter (an unterminated `---` fence, or unparsable YAML inside
  a well-formed fence) throws a typed `DeterministicError`
  (`E_FRONTMATTER_UNTERMINATED` / `E_FRONTMATTER_YAML`) instead of returning
  silent empty/partial data — consistent with `jsonl.ts` / `http.ts`'s
  throw/Result policy.
- Scope: parse/serialize CORE only, per the plan's stability caution (seed
  churned 2 days before the plan date) — no runner-specific
  backlog-frontmatter key conventions ship here; those stay in runner.
  Enforced by an import-boundary test in `tests/frontmatter.test.ts`.
- New dependency: `yaml` (`^2.6.0`) — no existing YAML parser was present
  anywhere in the workspace; a real parser was required per the plan's
  "do not hand-roll a fragile regex-only YAML parser" guidance.

## [0.3.0] — 2026-07-07

**MINOR — jsonl + http utils (FEAT-002 / FEAT-005 lineage); errors + Result
base (FEAT-001 lineage); package renamed from `plugin-kernel`.**

- `jsonl`: `append` / `appendBatch` / `readSafe` / `tail` / `rotate` (root
  re-export + `@astragenie/plugin-std/jsonl` subpath).
- `http`: `fetchWithTimeout` / `fetchJson` / `withTimeoutSignal` (root
  re-export + `@astragenie/plugin-std/http` subpath).
- `errors`: `PluginError` base + `DeterministicError` / `TransientError`.
- `result`: `Result<T, E>` + `ok` / `err` / `map` / `flatMap` / `unwrap`.

(Recorded retroactively — no CHANGELOG file existed prior to 0.4.0.)
