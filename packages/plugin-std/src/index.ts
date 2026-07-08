/**
 * @astragenie/plugin-std
 *
 * Shared standard library for the crew / runner / astramem plugin ecosystem.
 * Library semantics only: import the piece you need, no lifecycle, no IoC, no
 * mandatory-adoption surface. Repurposed from the former `plugin-kernel`
 * scaffold per the cross-repo consolidation review (2026-07-07, decision Q1).
 *
 * Current surface:
 *   - errors: `PluginError` base + `DeterministicError` / `TransientError`
 *   - result: `Result<T, E>` + `ok` / `err` / `map` / `flatMap` / `unwrap`
 *   - jsonl: `append` / `appendBatch` / `readSafe` / `tail` / `rotate` (frozen
 *     API at extraction — see `docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md` §1.2)
 *   - http (also subpath `@astragenie/plugin-std/http`): `fetchWithTimeout` /
 *     `fetchJson` / `withTimeoutSignal` — timeout-via-AbortSignal with
 *     external-signal linking (frozen API at extraction — see plan §1.5)
 *   - frontmatter (also subpath `@astragenie/plugin-std/frontmatter`):
 *     `parseFrontmatter` / `serializeFrontmatter` — a `---\n<yaml>\n---\n<body>`
 *     fence parser backed by a real YAML parser, with BOM/CRLF/LF-agnostic
 *     normalization (frozen parse/serialize core at extraction — see plan
 *     §1.4/§8.2; runner-specific key conventions are NOT included)
 *   - git (also subpath `@astragenie/plugin-std/git`): `runGit` — a minimal
 *     git subprocess spawn wrapper (spawn only; no worktree logic, no
 *     policy — frozen API at extraction, see plan §1.7)
 *
 * Additional modules (flags) land per the ranked plan in
 * `docs/reviews/2026-07-07-cross-repo-consolidation-review-phase3-plan.md`.
 */

export * from "./errors.ts";
export * from "./result.ts";
export * from "./jsonl.ts";
export * from "./http.ts";
export * from "./frontmatter.ts";
export * from "./git.ts";
