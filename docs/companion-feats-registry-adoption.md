# Companion FEATs — cross-plugin registry adoption (FEAT-009 follow-on)

FEAT-009 (this repo) built only the **plugins-common side**: the `@astragenie/plugin-registry`
generator + JSON Schema (SLICE-1) and the consumer reader helper + self-dogfood (SLICE-3).

The actual FEAT-240-class fix — making a cross-plugin agent/skill rename fail CI instead of
silently passing a stale allowlist — requires changes in **other repos** that cannot be made
from plugins-common. File these two companion FEATs in the owning repos (both are local:
`/c/work/mega/runner-plugin`, `/c/work/mega/dev-team`). Suggested path: `/runner:intake "<text>"`
in each repo, then triage.

Design of record: `.claude/artifacts/crew/designs/2026-07-08-feat-009-slice-2-registry-publish-model-adr.md`
(push model, producer-semver versioning, `semver.lt` staleness comparator, per-producer
`registry/<plugin>/agents.json`+`skills.json`, throw-DeterministicError failures).

---

## Companion FEAT A — dev-team (crew producer): generate + publish manifest

**Repo:** `/c/work/mega/dev-team`
**Title:** crew release CI generates its agent/skill registry manifest and publishes it to plugins-common

**Description:**
crew (dev-team) is a PRODUCER in the shared registry model. On release, its CI must run
`@astragenie/plugin-registry`'s generator against crew's own `agents/*.md` and
`skills/**/SKILL.md`, producing `registry/crew/agents.json` + `registry/crew/skills.json`
stamped with crew's own package.json semver, and PUSH them (commit/PR) into the
plugins-common repo per the push model in the FEAT-009 SLICE-2 ADR. Must abort the release
job with a non-zero exit on any `E_REGISTRY_SOURCE_INVALID` / `E_REGISTRY_UNSAFE_NAME`
(no partial/corrupt manifest). Emit the AC-4 structured log line so a publish failure is
visible in CI logs.

**Acceptance criteria (draft):**
- AC-1: crew's release workflow invokes the generator and produces the two per-producer JSON
  files stamped with crew's semver + generatedAt, schema-valid.
- AC-2: generator abort (invalid/unsafe source) fails the CI job non-zero; no manifest pushed.
- AC-3: successful run opens a PR (or direct commit per agreed policy) into plugins-common
  under `registry/crew/`.
- AC-4: one structured JSON log line `{plugin, agentCount, skillCount, durationMs, outcome}` per run.

---

## Companion FEAT B — runner-plugin (consumer): read published registry, drop frozen allowlist

**Repo:** `/c/work/mega/runner-plugin`
**Title:** validate-agent-refs reads the published cross-plugin registry instead of a frozen local allowlist Set

**Description:**
runner-plugin's `validate-agent-refs.mts` carries a hand-maintained local allowlist `Set` of
agent names. When crew renames an agent (e.g. inspector→reviewer, builder→*-dev), the stale
entry keeps the CI gate SILENT (the exact FEAT-240 bug). Switch the resolver to read the
published `registry/<plugin>/agents.json` + `skills.json` from plugins-common (the committed,
versioned manifest — NOT a live-install lookup, so it works without the sibling plugin
installed at CI time). Use the SLICE-3 reader helper's `stale_registry` WARNING
(`semver.lt(entry.version, expectedVersion)`) so a manifest predating the installed release
surfaces a warning rather than a false-negative pass.

**Acceptance criteria (draft):**
- AC-1: `validate-agent-refs` resolves cross-namespace agent/skill names against the published
  registry; the frozen local allowlist Set is removed.
- AC-2: a name absent from the current registry fails the gate (a real rename is caught immediately).
- AC-3: a registry manifest older than the consumer's installed release tag emits the
  `stale_registry` WARNING (reproducing the FEAT-240 stale-`inspector` scenario), not a silent pass.
- AC-4: works at CI time with NO sibling plugin installed (reads the committed manifest only).
