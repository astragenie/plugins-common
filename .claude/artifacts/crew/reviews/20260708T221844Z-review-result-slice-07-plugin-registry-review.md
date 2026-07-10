---
findings: "🔴:1,🟡:1,❓:1"
status: completed
decision: rejected
---
# Review Result: Review Result

- Created: 2026-07-08T22:22:53.205Z
- Reviewer: reviewer
- Decision: rejected
- Status: completed
- Summary: CRITICAL: opts.plugin/sourcePlugin is never validated (no isUnsafeName check, no schema pattern) -- reproduced with a PoC that wrote agents.json outside the given outputDir and embedded the raw traversal string as sourcePlugin in the manifest; AC-2 write-ordering, AC-4 log line, DEC-002 throw-for-infra, and schema-loader path resolution all verified correct otherwise.
- Evidence Checked:
  - PoC (generateRegistry({plugin:'../../evil-escaped'
  - ...})) wrote C:\Users\serge\AppData\Local\evil-escaped\agents.json (outside outputDir=...\poc-outputdir-jlXtCt) with sourcePlugin:'../../evil-escaped' verbatim in the JSON body. generate.ts:180 pluginOutDir=join(opts.outputDir
  - opts.plugin); generate.ts:135 stamps sourcePlugin:plugin with zero validation; cli.ts parseArgs applies no check to --plugin; schema/agents.schema.json + skills.schema.json sourcePlugin property has type+minLength only
  - no pattern. bun test tests/ = 38 pass
  - 0 fail (384ms). AC-2 write ordering confirmed correct: agentErrors+skillErrors both validated (generate.ts:165-176) before either writeFileSync (184-185). AC-4 try/finally with no catch confirmed: outcome defaults 'failure'
  - flips to 'success' only at try-block end
  - emitRegistryLog called exactly once in finally
  - error rethrows automatically. schema-loader.ts '../schema/<file>' resolves correctly from both src/ and dist/ (tsconfig.build.json outDir=./dist rootDir=./src
  - package.json files:[dist
  - schema]).
- Files Reviewed:
  - packages/plugin-registry/src/generate.ts
  - src/cli.ts
  - src/unsafe-name.ts
  - src/json-schema.ts
  - src/schema-loader.ts
  - src/log.ts
  - src/errors.ts
  - src/index.ts
  - schema/agents.schema.json
  - schema/skills.schema.json
  - tests/generate.test.ts
  - tests/unsafe-name.test.ts
  - tests/json-schema.test.ts
  - tests/cli.test.ts
  - tests/log.test.ts
- Test Adequacy: 38/38 tests pass covering AC-1/2/4/5 happy paths and the regex-recognized unsafe-name categories; no test exercises a malicious --plugin/sourcePlugin value (the actual bypass) nor the null-byte/leading-dash/bare-absolute-path/homoglyph name categories that isUnsafeName's own regex misses (schema pattern is the real backstop for those, untested at that boundary).
- Risks: Live path-traversal / arbitrary-file-write: any caller of generateRegistry or the CLI that passes an unsanitized --plugin (e.g. from a CI variable, branch name, or config file) can write registry files outside the intended outputDir and inject an arbitrary sourcePlugin string into the manifest that other plugins' CI gates consume. Not yet wired into any real CI script in this repo, so current blast radius is zero, but the ADR's SLICE-2/3 plan is to wire this generator into release CI, at which point the gap becomes live.
- Required Follow-up: BLOCKING: validate opts.plugin (and mirror in the sourcePlugin schema property with a pattern matching name's) before it is used in join(opts.outputDir, opts.plugin) or stamped into entries -- reuse isUnsafeName + throw RegistryUnsafeNameError, with a regression test using a traversal value. NON-BLOCKING follow-ups: broaden UNSAFE_NAME_PATTERN (null byte, leading dash, bare absolute path, unicode) and add matching tests, even though the schema pattern already backstops the write; consider documenting or closing the narrow inter-write I/O-failure window between agents.json and skills.json writes.

