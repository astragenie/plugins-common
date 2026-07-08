---
id: SLICE-07
title: Registry JSON Schema + local generator CLI (reuse plugin-std frontmatter)
status: completed
feature: FEAT-009
phase: null
priority: P1
target_release: null
requires_validation: true
risk: high
created: 2026-07-08
updated: 2026-07-08
effort_points: 5
completed_at: 2026-07-08
---
# SLICE-07: Registry JSON Schema + local generator CLI (reuse plugin-std frontmatter)

Implements FEAT-009. See [feature file](../../../backlog/in-progress/FEAT-009.md) for product context.

## Objective

Shared cross-plugin agent/skill name registry in plugins-common. Today each plugin (crew, runner, ...) hand-maintains its own idea of which agent/skill names exist — runner's validate-agent-refs.mts carries a frozen local allowlist Set. When crew renames an agent (inspector->reviewer per runner FEAT-240; builder->*-dev per #371), nothing propagates to consumers: runner keeps emitting the phantom name and its CI gate stays SILENT because the stale name is still allowlisted. Root-cause fix: a generated, versioned registry published in plugins-common (e.g. registry/agents.json + registry/skills.json) listing each plugin's agent and skill names, produced from each plugin's OWN agents/*.md and skills/**/SKILL.md frontmatter at release time. Consumers (validate-agent-refs.mts, any cross-namespace dispatch check) resolve against the manifest instead of a hand-maintained Set, so a future rename fails CI immediately. Must work WITHOUT the sibling plugin installed at CI time — a committed/published manifest, not a live-install lookup (same shared-seam pattern as @astragenie/astramem-client). Producers: crew (dev-team), runner. Consumers: runner validate-agent-refs plus any plugin dispatching cross-namespace agents.

## In scope

- bullet 1
- bullet 2

## Out of scope

- bullet 1

## Acceptance criteria

- [ ] AC-1: Given a plugin's `agents/*.md` and `skills/**/SKILL.md` files with valid YAML frontmatter, parsed via `parseFrontmatter<T>` from `@astragenie/plugin-std` (packages/plugin-std/src/frontmatter.ts), When the registry generator CLI runs against that plugin's `agents/` and `skills/` directories, Then it emits `registry/agents.json` and `registry/skills.json`, each containing one entry per file shaped `{ name, sourcePlugin, version, generatedAt }`, and each output validates against a committed JSON Schema before being written to disk.
- [ ] AC-2: Given an `agents/*.md` file whose frontmatter fence is unterminated (parseFrontmatter throws `DeterministicError` with code `E_FRONTMATTER_UNTERMINATED` per packages/plugin-std/src/frontmatter.ts), When the registry generator processes that plugin's agent directory, Then the generator aborts the publish for that plugin with a non-zero exit code and an `E_REGISTRY_SOURCE_INVALID` error naming the offending file path, and does NOT write a partial or corrupt `registry/agents.json`.
- [ ] AC-3: Given a published `registry/agents.json` whose `generatedAt`/version stamp predates a consuming plugin's currently-installed release tag (the exact staleness shape that let FEAT-240's stale `inspector` allowlist entry mask a real crew rename), When a reader resolves an agent name against the registry, Then it surfaces a `stale_registry` warning rather than a silent pass, with a unit test fixture reproducing the FEAT-240 stale-entry scenario asserting the warning fires instead of a false-negative resolve.
- [ ] AC-4 (observability -- targets the 0.574-avg weak dimension): Given the registry generator CLI runs (locally or in a plugin's release CI job), When it completes, whether success or failure, Then it emits one structured JSON log line recording `{ plugin, agentCount, skillCount, durationMs, outcome }`, so a registry-publish failure is observable in CI logs instead of a silent no-op -- closing the exact observability gap that let the FEAT-240 class of bug ship unnoticed.
- [ ] AC-5 (security -- targets the 0.64-avg weak dimension): Given an `agents/*.md` or `skills/**/SKILL.md` frontmatter `name` field contains path-traversal characters (`../`) or shell metacharacters, When the registry generator serializes that entry into `registry/agents.json`, Then the generator rejects the entry (does not write it), records an `E_REGISTRY_UNSAFE_NAME` validation error citing the source file, and a unit test asserts no unsanitized value ever reaches the committed manifest consumed by other plugins' CI gates.

## Done When

- all acceptance criteria PASS with evidence per `01-loop-control/EVIDENCE_RULES.md`
- build / test commands per `.claude/loop.json` pass
- feature FEAT-009 moved from `in-progress/` to `done/`
- Crew `final-synthesis` artifact written
- (pure refactors / mechanical changes: set `requires_validation: false` in frontmatter
   above to waive the validation gate — no badge needed at close time)

## Reviewer ladder

- Reviewer A: ...
- Reviewer B: ...
