---
id: FEAT-009
status: triaged
priority: P1
category: feature
target_release: null
created: 2026-07-08
updated: 2026-07-08
depends_on: []
slices: []
derived_from: null
pm_customer_impact: 0.65
pm_effort_estimate: 0.65
pm_strategic_alignment: 0.85
pm_technical_risk: 0.9
pm_dependency_depth: 0.6
pm_composite_priority: P1
pm_autonomous_safe: false
pm_reviewed: 2026-07-08
autonomous_safe: false
triage_notes: "P1, autonomousSafe=false: strategically core to plugins-common's own stated mission (shared cross-plugin kernel, README explicitly frames it as the astramem-client shared-seam pattern) and backed by two independently verified, already-occurred incidents (not speculative demand) -- but technical_risk sits in the 0.9-1.0 band because this establishes a NEW cross-plugin contract with a genuinely undecided publish/versioning design (push vs pull, staleness handling), which is exactly the 'unknowns needing a spike' criterion; effort_estimate 0.65 maps to 8 Fibonacci points (FEAT-167 band 0.6<=x<0.85), tripping the FEAT-168 decomposition gate, satisfied below via proposedSlices (sum=13pts) that scope plugins-common's own buildable slices and explicitly defer producer (crew/dev-team) and consumer (runner-plugin) migration to companion FEATs filed in those repos, matching this repo's own established FEAT-004/FEAT-007 precedent. Recommend an architect pre-flight (runner:architect) on the publish-model decision (SLICE-2 below) before any builder starts SLICE-1."
proposed_slices:
  - id_suffix: -SLICE-1
    title: Registry JSON Schema + local generator CLI (reuse plugin-std frontmatter)
    points: 5
  - id_suffix: -SLICE-2
    title: "Architect ADR: cross-repo publish model (push vs pull, versioning, staleness)"
    points: 3
  - id_suffix: -SLICE-3
    title: Consumer reader helper + self-registry dogfood inside plugins-common
    points: 5
---
## Description

Shared cross-plugin agent/skill name registry in plugins-common. Today each plugin (crew, runner, ...) hand-maintains its own idea of which agent/skill names exist — runner's validate-agent-refs.mts carries a frozen local allowlist Set. When crew renames an agent (inspector->reviewer per runner FEAT-240; builder->*-dev per #371), nothing propagates to consumers: runner keeps emitting the phantom name and its CI gate stays SILENT because the stale name is still allowlisted. Root-cause fix: a generated, versioned registry published in plugins-common (e.g. registry/agents.json + registry/skills.json) listing each plugin's agent and skill names, produced from each plugin's OWN agents/*.md and skills/**/SKILL.md frontmatter at release time. Consumers (validate-agent-refs.mts, any cross-namespace dispatch check) resolve against the manifest instead of a hand-maintained Set, so a future rename fails CI immediately. Must work WITHOUT the sibling plugin installed at CI time — a committed/published manifest, not a live-install lookup (same shared-seam pattern as @astragenie/astramem-client). Producers: crew (dev-team), runner. Consumers: runner validate-agent-refs plus any plugin dispatching cross-namespace agents.

## Intake notes

Created via free-text intake (`/runner:intake "<text>"`). Priority is
unset — this FEAT has not been scored yet. Run `/runner:triage`
(PM scoring + `backlog pm-apply`) to score it before slicing.
## Acceptance criteria (Given-When-Then)

- AC-1: Given a plugin's `agents/*.md` and `skills/**/SKILL.md` files with valid YAML frontmatter, parsed via `parseFrontmatter<T>` from `@astragenie/plugin-std` (packages/plugin-std/src/frontmatter.ts), When the registry generator CLI runs against that plugin's `agents/` and `skills/` directories, Then it emits `registry/agents.json` and `registry/skills.json`, each containing one entry per file shaped `{ name, sourcePlugin, version, generatedAt }`, and each output validates against a committed JSON Schema before being written to disk.
- AC-2: Given an `agents/*.md` file whose frontmatter fence is unterminated (parseFrontmatter throws `DeterministicError` with code `E_FRONTMATTER_UNTERMINATED` per packages/plugin-std/src/frontmatter.ts), When the registry generator processes that plugin's agent directory, Then the generator aborts the publish for that plugin with a non-zero exit code and an `E_REGISTRY_SOURCE_INVALID` error naming the offending file path, and does NOT write a partial or corrupt `registry/agents.json`.
- AC-3: Given a published `registry/agents.json` whose `generatedAt`/version stamp predates a consuming plugin's currently-installed release tag (the exact staleness shape that let FEAT-240's stale `inspector` allowlist entry mask a real crew rename), When a reader resolves an agent name against the registry, Then it surfaces a `stale_registry` warning rather than a silent pass, with a unit test fixture reproducing the FEAT-240 stale-entry scenario asserting the warning fires instead of a false-negative resolve.
- AC-4 (observability -- targets the 0.574-avg weak dimension): Given the registry generator CLI runs (locally or in a plugin's release CI job), When it completes, whether success or failure, Then it emits one structured JSON log line recording `{ plugin, agentCount, skillCount, durationMs, outcome }`, so a registry-publish failure is observable in CI logs instead of a silent no-op -- closing the exact observability gap that let the FEAT-240 class of bug ship unnoticed.
- AC-5 (security -- targets the 0.64-avg weak dimension): Given an `agents/*.md` or `skills/**/SKILL.md` frontmatter `name` field contains path-traversal characters (`../`) or shell metacharacters, When the registry generator serializes that entry into `registry/agents.json`, Then the generator rejects the entry (does not write it), records an `E_REGISTRY_UNSAFE_NAME` validation error citing the source file, and a unit test asserts no unsanitized value ever reaches the committed manifest consumed by other plugins' CI gates.
- Note (explicitly out of scope for this FEAT's slices, tracked as companion FEATs per the FEAT-004/FEAT-007 precedent): (a) crew/dev-team's own release-CI job generating and pushing its manifest into plugins-common -- files in dev-team, not plugins-common; (b) runner-plugin's validate-agent-refs.mts switching from its local allowlist Set to reading the published registry -- files in runner-plugin, not plugins-common.

## Proposed slices (PM decomposition)

- SLICE-1: Registry JSON Schema + local generator CLI (reuse plugin-std frontmatter) (5 pts)
- SLICE-2: Architect ADR: cross-repo publish model (push vs pull, versioning, staleness) (3 pts)
- SLICE-3: Consumer reader helper + self-registry dogfood inside plugins-common (5 pts)
