---
findings: "🔴:0,🟡:0,❓:0"
status: completed
decision: approved
---
# Review Result: Review Result

- Created: 2026-07-08T22:35:12.713Z
- Reviewer: reviewer
- Decision: approved
- Status: completed
- Summary: CRITICAL path-traversal via opts.plugin is closed: isUnsafeName(opts.plugin) now runs before join()/resolveVersion/sourcePlugin stamping, the allow-list is a sound anchored ASCII pattern rejecting all previously-missed categories, atomic temp+rename write is in place, and the PoC regression test proves both the throw and that no file is written outside outputDir; no new defect found, and the suspected @scope/: name-collision regression does not exist in this ecosystem
- Evidence Checked:
  - generate.ts:192-196 calls isUnsafeName(opts.plugin) and throws RegistryUnsafeNameError BEFORE resolveVersion (198)
  - join(outputDir
  - opts.plugin) (231)
  - and buildEntries stamping sourcePlugin=plugin (203
  - 205) -- same opts.plugin value covers both path-segment and sourcePlugin uses so one check suffices. unsafe-name.ts SAFE_NAME_PATTERN=/^[A-Za-z0-9][A-Za-z0-9._-]*$/ matches schema/agents.schema.json and schema/skills.schema.json 'name'/'sourcePlugin' pattern exactly (defense-in-depth). cli.ts passes --plugin straight through to generateRegistry with zero bypass path. Atomic write: generate.ts:235-254 writes both files to *.tmp-<pid>-<ts>-<rand> suffixed paths then renameSync's each into place
  - with unlinkSync cleanup of any leftover tmp file in the catch block; the narrow inter-rename failure window (agents.json commits
  - skills.json rename fails) is explicitly documented in a comment (224-230) as a known
  - non-transactional residual -- correct and non-blocking
  - matches prior review's accepted risk. PoC regression test (tests/generate.test.ts:266-315) asserts RegistryUnsafeNameError + E_REGISTRY_UNSAFE_NAME code + message contains '../../evil-escaped' + existsSync(escapedDir)===false. Ran 'bun test': 48 pass
  - 0 fail
  - 88 expect() calls (up from 38 pass in the rejected review -- 10 new tests cover null byte
  - control chars
  - leading dash
  - bare absolute path
  - unicode homoglyph
  - end-to-end via generateRegistry
  - and no-leftover-tmp-files). Ran 'bun run typecheck': clean. Ran 'bun run lint' (biome): clean
  - 16 files. Checked the reviewer-flagged regression hypothesis empirically: real agent/skill frontmatter 'name' fields in this ecosystem (crew plugin cache C:/Users/serge/.claude/plugins/cache/astra/crew/0.46.2/agents/*.md
  - skills/**/SKILL.md) are plain lowercase-hyphenated slugs (e.g. 'architect'
  - 'ai-engineering') with NO colon
  - no '@scope/'
  - no '/'; plugin.json 'name' fields are likewise plain slugs (e.g. 'crew'). The 'crew:reviewer' form seen in Task-tool subagent_type listings is Claude Code's own external dispatch namespacing (plugin-name:agent-name)
  - assembled outside this generator -- it is never the literal frontmatter 'name' value nor a real --plugin value this generator would receive. Version field correctly NOT gated to the strict allow-list (assertSafeVersion only rejects control chars
  - generate.ts:81)
  - so semver like '1.0.0-rc.1+build' passes -- verified by inspection
  - no test regression.
- Files Reviewed:
  - packages/plugin-registry/src/generate.ts
  - packages/plugin-registry/src/unsafe-name.ts
  - packages/plugin-registry/src/errors.ts
  - packages/plugin-registry/src/cli.ts
  - packages/plugin-registry/schema/agents.schema.json
  - packages/plugin-registry/schema/skills.schema.json
  - packages/plugin-registry/tests/generate.test.ts
  - packages/plugin-registry/tests/unsafe-name.test.ts
- Test Adequacy: 48/48 tests pass (up from 38 in the rejected review): new PoC regression test proves the exact CVE class from the prior CRITICAL is closed (throws + no escaped write), plus 10 new unit tests cover every previously-missed unsafe-name category (null byte, control chars, leading dash, bare absolute path, unicode homoglyph) both at the isUnsafeName unit level and end-to-end through generateRegistry
- Risks: none new; the pre-existing, explicitly-documented non-transactional inter-rename window (agents.json commits, skills.json rename fails on disk-full/kill) remains a known LOW residual from the prior review, unchanged and acceptable given generator is not yet wired into live CI (SLICE-2/3 deferred)
- Required Follow-up: none blocking; the fix is ready to merge as-is

