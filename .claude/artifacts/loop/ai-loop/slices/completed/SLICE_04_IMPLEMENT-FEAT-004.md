---
id: SLICE-04
title: Implement FEAT-004
status: completed
feature: FEAT-004
phase: null
priority: P1
target_release: null
requires_validation: true
risk: medium
created: 2026-07-08
updated: 2026-07-08
completed_at: 2026-07-08
---
# SLICE-04: Implement FEAT-004

Implements FEAT-004. See [feature file](../../../backlog/in-progress/FEAT-004.md) for product context.

## Objective

Extract a pinned frontmatter parse/serialize core into `@astragenie/plugin-std`. Candidate #4 (M1 fix).

## In scope

- bullet 1
- bullet 2

## Out of scope

- bullet 1

## Acceptance criteria

- [x] AC-1: Given the seed runner frontmatter.mts parse/serialize behavior (plan §1.4, documented CRLF bugfix), When @astragenie/plugin-std ships its frontmatter module, Then it exports a pinned `parseFrontmatter`/`serializeFrontmatter` core API, with unit tests covering LF-only, CRLF, and BOM-prefixed input all parsing to the same normalized result.
- [x] AC-2: Given a markdown file with malformed frontmatter (an unterminated `---` fence), When `parseFrontmatter` is called, Then it returns a typed failure (throw `DeterministicError` per the package's infra/domain policy, consistent with jsonl/http) rather than silently returning empty/partial data — verified by an unterminated-fence fixture.
- [x] AC-3: Given the stability caution (§8.2: seed churned 2 days before plan date), When the core is extracted, Then only parse/serialize are pinned in plugin-std with ZERO imports of runner-specific backlog-frontmatter-key conventions — verified by an import-boundary check in the module's tests.
- [x] AC-4: Given plugin-std's export convention (jsonl/http use both root re-export AND a subpath), When the frontmatter module is added, Then it is exposed via `./frontmatter` subpath + root re-export, and `bun --filter @astragenie/plugin-std test|typecheck` pass including the CRLF/LF/BOM matrix.

## Done When

- all acceptance criteria PASS with evidence per `01-loop-control/EVIDENCE_RULES.md`
- build / test commands per `.claude/loop.json` pass
- feature FEAT-004 moved from `in-progress/` to `done/`
- Crew `final-synthesis` artifact written
- (pure refactors / mechanical changes: set `requires_validation: false` in frontmatter
   above to waive the validation gate — no badge needed at close time)

## Reviewer ladder

- Reviewer A: ...
- Reviewer B: ...
