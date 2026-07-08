---
slice: SLICE-03
feature: FEAT-005
title: plugin-std http util + gepa-core judge provider migration
owner: fullstack-dev
status: implementation-complete
requires_validation: true
---

# Handoff: SLICE-03 (FEAT-005) — http transport-policy util

## Objective

Extract a thin transport-policy http util into `@astragenie/plugin-std`
(`fetchWithTimeout` / `fetchJson`, timeout-via-`AbortSignal` with
external-signal linking) and migrate gepa-core's 5 judge providers onto it —
including adding a timeout to `generic-openai` / `groq`, which previously had
none at all (a never-responding endpoint hung forever).

## Scope

- IN SCOPE and touched: `packages/plugin-std/**`, `packages/gepa-core/**`.
- OUT OF SCOPE and untouched (verified via `git status`): astramem-plugin,
  runner-plugin, dev-team. Zero diff outside `plugin-std` + `gepa-core`.
- Deferred per plan §8.2: astramem's `local.ts`/`saas.ts` half of the same
  `fetchWithTimeout` seed is mid-churn adopting `astramem-contracts` — resume
  only after that work settles. Not touched this slice.

## What changed

### `packages/plugin-std` (new `./http` subpath, frozen API at extraction)
- `src/http.ts` (new): `withTimeoutSignal(timeoutMs, external?)` — generalizes
  gepa-core azure-openai's `linkSignal(external, internal)` pattern into a
  reusable helper; `fetchWithTimeout(input, init)` — `fetch` + linked
  timeout, throws `TransientError` (`E_HTTP_FETCH`) on any failure incl.
  timeout/external-abort; `fetchJson<T>(input, init)` — `fetchWithTimeout` +
  `res.ok` check (`E_HTTP_STATUS`) + JSON decode (`E_HTTP_PARSE`), all via
  typed `TransientError` per the repo's throw-for-infra policy (matches
  `jsonl.ts` / `result.ts`'s header convention — no third convention
  invented).
- `tests/http.test.ts` (new, 13 tests): branch coverage for timeout-fires,
  external-signal-fires, success-before-timeout (asserts `clearTimeout` is
  called — no leaked timer), JSON-parse-failure, non-2xx status, and direct
  `withTimeoutSignal` signal-linking assertions (timeout only, external only,
  external already-aborted at call time, `clear()` prevents a late fire).
- `package.json`: added `"./http"` export entry; version `0.2.0` → `0.3.0`.
- `src/index.ts`: docstring updated to list `http` in "Current surface" (not
  re-exported from the barrel — same subpath-only pattern as `jsonl`).

### `packages/gepa-core` (all 5 judge providers migrated)
- `azure-openai/index.ts`: replaced local `linkSignal` + manual
  `setTimeout`/`clearTimeout` with `fetchWithTimeout`; dead `linkSignal`
  function removed.
- `generic-openai/index.ts`: added `timeoutMs?: number` to
  `GenericOpenAIConfig` (default 60000 ms — **previously no timeout at
  all**); `callChatCompletions` now takes `timeoutMs` + `signal` and calls
  `fetchWithTimeout`; `evaluate()` forwards `opts.signal`.
- `groq/index.ts`: added `timeoutMs?: number` to `GroqConfig`, forwarded to
  `GenericOpenAIJudge` via `super()` (Groq had no timeout, inherited from
  generic-openai).
- `gemini/index.ts` / `ollama/index.ts`: swapped local `AbortSignal.timeout()`
  for `fetchWithTimeout`; both now also forward `opts.signal` (previously
  silently ignored — the external cancellation now actually works).
- `package.json`: version `0.8.1` → `0.9.0`; `CHANGELOG.md`: new `[0.9.0]`
  entry documenting the migration and the behavior changes.
- `tests/providers/generic-openai.test.ts` / `groq.test.ts`: added a
  never-responding-mock-fetch + short-`timeoutMs` test per provider (AC-2) —
  proves the request now aborts instead of hanging forever.

## Error-policy note (resolves the cross-slice inconsistency called out in the
dispatch)

`http.ts` throws typed `TransientError` for all infra/timeout/parse
failures — matching `jsonl.ts` (SLICE-02) and `result.ts`'s documented
"Result for domain errors, THROW for infra" policy. Did NOT copy SLICE-01's
`file-lock-manager` `err()`-returning deviation (that's a known,
separately-tracked inconsistency, not something to propagate).

## Evidence

```
bun run --filter '@astragenie/plugin-std' typecheck   → exit 0
bun run --filter '@astragenie/plugin-std' lint         → Checked 8 files, exit 0
bun run --filter '@astragenie/plugin-std' test         → 26 pass / 0 fail (3 files)

bun run --filter '@astragenie/gepa-core' typecheck     → exit 0
bun run --filter '@astragenie/gepa-core' lint          → Checked 58 files, exit 0
bun run --filter '@astragenie/gepa-core' test          → 212 pass / 0 fail (27 files)
  (210 baseline + 2 new AC-2 timeout tests; zero regressions —
  azure-openai/gemini/generic-openai/groq/ollama provider tests all green)
bun run --filter '@astragenie/gepa-core' check:no-env  → PASS, zero process.env reads

bun run --filter '*' typecheck (workspace-wide)        → plugin-std, astramem-client,
  astramem-openclaw, gepa-core all exit 0
```

`git status` confirms zero diff under `packages/astramem-plugin`,
`packages/runner-plugin`, or `packages/dev-team` (AC-3).

## Acceptance criteria

- AC-1 PASS — `fetchWithTimeout`/`fetchJson` shipped, timeout-via-AbortSignal
  with external-signal linking generalizing azure-openai's `linkSignal`;
  branch-covered unit tests including both-fire and either-fire cases.
- AC-2 PASS — `generic-openai` and `groq` migrated; never-resolving mock
  fetch + short timeout test added per provider, both green.
- AC-3 PASS — zero changes outside `plugin-std` + `gepa-core`; astramem's
  half explicitly deferred (not touched).
- AC-4 PASS — all 5 providers import `fetchWithTimeout`; gepa-core's 210
  baseline tests pass unchanged; only the 2 new timeout tests are additions.

## Notes for reviewer / validator

- Pre-existing uncommitted diffs in `packages/gepa-core/src/interfaces.ts`,
  `lock/file-lock-manager.ts`, `store/file-store.ts`, their tests, and the
  `CHANGELOG.md` `[0.8.0]`/`[0.8.1]` entries predate this slice (SLICE-01
  Gate Zero + SLICE-02 jsonl adoption) — not part of this dispatch's work,
  left as-is.
- No commits were made (implementation-only dispatch per instructions).
  Reviewer/verifier dispatch intentionally skipped per instructions — not
  run in this session.
