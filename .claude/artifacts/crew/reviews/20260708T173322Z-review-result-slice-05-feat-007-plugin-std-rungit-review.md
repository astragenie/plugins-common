---
findings: "🔴:0,🟡:2,❓:1"
status: completed
decision: approved_with_notes
---
# Review Result: Review Result

- Created: 2026-07-08T17:36:44.516Z
- Reviewer: reviewer
- Decision: approved_with_notes
- Status: completed
- Summary: runGit's core spawn/exit-code discrimination is correct and empirically verified (ENOENT, real git non-zero exits, pre/post-spawn AbortSignal all probed on this Windows box); one real gap: maxBuffer overflow (default 1MB, hittable with no opts at all on e.g. verbose git log/diff) is mismapped into the throw-TransientError 'failed to spawn' path even though the process ran fine, and is completely untested.
- Evidence Checked:
  - git.ts:86-99 discrimination logic verified against live Node probes: invalid cwd -> error.code='ENOENT' (string
  - no signal) -> throws TransientError (matches AC-2 spawn-failure test
  - git.test.ts:81-94
  - VALID proxy); real non-zero git exit (rev-parse --verify HEAD empty repo
  - unknown subcommand) -> error.code=128/1 (number) -> resolves ok:false (matches AC-1/AC-2 tests); pre-aborted AbortSignal -> error.code='ABORT_ERR' (string
  - no signal) -> throws TransientError (matches git.test.ts:98-104); post-spawn abort -> also 'ABORT_ERR'/no signal -> throws (same path
  - untested but consistent); timeoutMs kill -> error.code=null
  - error.signal='SIGTERM' -> resolves ok:false
  - status:-1 (deterministic
  - but git.test.ts:106-119 only asserts 'settled'
  - not the actual outcome); maxBuffer exceeded -> error.code='ERR_CHILD_PROCESS_STDIO_MAXBUFFER' (string
  - no signal) -> falls through to final reject at git.ts:101-106
  - throwing TransientError with message 'failed to spawn git ...' even though the process spawned and ran -- contradicts the module's own documented policy (JSDoc git.ts:57-61
  - 15-22) that TransientError is reserved for spawn failures a retry could fix; retrying the same maxBuffer deterministically fails again. No test in git.test.ts exercises maxBuffer at all. Independently reran gates: bun run --filter '@astragenie/plugin-std' test -> 52 pass/0 fail; bun run --filter '@astragenie/plugin-std' typecheck -> exit 0; bun run --filter '*' typecheck -> 4/4 exit 0 (astramem-client
  - plugin-std
  - astramem-openclaw
  - gepa-core). git status confirms only packages/plugin-std/** is new/changed for this slice; other pending diffs (gepa-core
  - plugin-kernel rename) predate this slice per handoff.
- Files Reviewed:
  - packages/plugin-std/src/git.ts
  - packages/plugin-std/tests/git.test.ts
  - packages/plugin-std/src/index.ts
  - packages/plugin-std/src/errors.ts
  - packages/plugin-std/package.json
- Test Adequacy: 12 tests cover AC-1 success paths, AC-2 non-zero-exit (no throw) and genuine-spawn-failure (throw) paths, plus loose signal/timeout coverage; hermetic via mkdtemp/rm in beforeEach/afterEach against a temp dir, never the real repo tree. Gap: maxBuffer option has zero test coverage, and the timeout test only asserts the call 'settles' rather than pinning the now-verified deterministic ok:false/status:-1 outcome.
- Risks: maxBuffer overflow (Node's default 1MB applies even when the caller never sets opts.maxBuffer) throws a mislabeled TransientError for what is actually a deterministic, non-retryable condition -- a caller that blindly retries TransientError could spin on a large git log/diff without making progress. Low likelihood for the current dev-team/runner adoption pattern but real for any large-repo git output.
- Required Follow-up: HIGH (isolated, non-blocking): in git.ts's final else-branch (~101-106), add a check for error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' before the generic reject -- either resolve as {ok:false, status:-1, stdout, stderr} (consistent with the signal-kill branch's 'process ran but couldn't fully report' semantics) or throw a distinctly-coded non-transient error; add a maxBuffer-exceeded test. MEDIUM: tighten git.test.ts:106-119's timeout test to assert the verified deterministic outcome (ok:false, status:-1) instead of accepting either throw or resolve. LOW: git.ts:82-85's comment implies 'string or absent code' uniformly means spawn failure; actual behavior is more nuanced (OS signal-kill resolves ok:false via the separate error.signal branch, while AbortSignal surfaces as ABORT_ERR with no signal and does throw) -- reword for precision.

