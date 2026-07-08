---
findings: "🔴:0,🟡:1,❓:2"
status: completed
decision: approved_with_notes
---
# Review Result: Review Result

- Created: 2026-07-08T17:02:40.737Z
- Reviewer: reviewer
- Decision: approved_with_notes
- Status: completed
- Summary: AC-1 through AC-4 verified PASS with both test suites green (26/26 plugin-std, 212/212 gepa-core matching claimed counts); one MEDIUM listener-leak finding in withTimeoutSignal not caught by the parallel ts-review needs a follow-up fix.
- Evidence Checked:
  - bun run --filter '@astragenie/plugin-std' test: 26 pass/0 fail (3 files). bun run --filter '@astragenie/gepa-core' test: 212 pass/0 fail (27 files) = 210 baseline + 2 new AC-2 timeout tests
  - zero regressions. Both typecheck+lint green. git status confirms zero diff outside plugin-std/gepa-core (root bun.lock/package.json changes are the expected new @astragenie/plugin-std workspace dependency for gepa-core
  - not scope creep); astramem/runner-plugin/dev-team untouched.
- Files Reviewed:
  - packages/plugin-std/src/http.ts
  - packages/plugin-std/tests/http.test.ts
  - packages/plugin-std/src/index.ts
  - packages/plugin-std/package.json
  - packages/gepa-core/src/providers/{azure-openai
  - gemini
  - generic-openai
  - groq
  - ollama}/index.ts
  - packages/gepa-core/tests/providers/{generic-openai
  - groq}.test.ts
  - packages/gepa-core/package.json
  - packages/gepa-core/CHANGELOG.md
- Test Adequacy: 13 new http.ts unit tests cover timeout/external-signal/success/parse-failure branches plus 2 new provider-level never-responding-fetch tests for AC-2 (generic-openai, groq); gap: zero test asserts the external-signal listener is actually removed after a non-aborting completion, and zero provider-level test covers the gemini/ollama external-signal-now-honored behavior change called out in the CHANGELOG.
- Risks: MEDIUM (packages/plugin-std/src/http.ts:57-71): withTimeoutSignal registers 'external.addEventListener("abort", ..., {once:true})' but clear() (line 71) only calls clearTimeout — it never calls external.removeEventListener. {once:true} only prevents the SAME listener firing twice; it does NOT deregister the listener before it fires. gepa-core's sequentialRunner (src/runner/sequential-runner.ts:9,27) passes ONE shared AbortSignal across an entire run's candidates x cases, and every evaluate() call funnels into fetchWithTimeout, so every completed judge call permanently leaves a listener (closing over its own AbortController) attached to that shared signal for the run's remaining lifetime -- unbounded listener/closure accumulation proportional to judge-call count in long optimization runs. Confirmed pre-existing: azure-openai's original linkSignal (git show HEAD:packages/gepa-core/src/providers/azure-openai/index.ts:205-210) had the identical gap, so this is not a new regression, but the refactor centralizes and broadens it (now also flows through gemini/ollama, which previously had zero external-signal wiring). The parallel typescript-reviewer artifact (20260708T165816Z) asserted 'no listener leak' for this exact code -- that conclusion is incorrect. LOW: gemini.test.ts / ollama.test.ts have zero 'signal' references despite the CHANGELOG explicitly documenting that these two providers now honor an externally-passed AbortSignal that was previously silently dropped -- no regression test protects this behavior change. LOW (pre-existing, confirmed via git diff, not introduced by this slice): all 5 providers still hand-roll 'res.ok' check + raw throw new Error + unsound '(await res.json()) as ChatResponse' instead of using the new fetchJson<T> helper purpose-built to remove this duplication -- missed consolidation opportunity, not a functional defect.
- Required Follow-up: Follow-up fix: store the external-abort listener reference in withTimeoutSignal and call external.removeEventListener in clear(); add a test asserting listener count / no-leak on the external signal across repeated non-aborting calls. Add at least one provider-level test (gemini or ollama) exercising opts.signal cancellation end-to-end. Both are isolated, low-risk fixes -- do not need to block this slice from landing.

