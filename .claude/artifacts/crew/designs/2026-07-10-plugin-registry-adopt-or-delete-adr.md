---
id: ADR-FEAT-009-REGISTRY-ADOPTION
title: "packages/plugin-registry — adopt (publish), delete, or defer"
status: proposed
slice: null
introduced_at: 2026-07-10
related_decisions: [DEC-002]
related_feat: FEAT-009
---

# ADR: packages/plugin-registry — adopt, delete, or defer

## Context

FEAT-009 (closed 2026-07-08) built a generated, versioned registry of
agent/skill names in `packages/plugin-registry` to close the FEAT-240 class
of bug: a cross-plugin rename (crew's inspector→reviewer, builder→*-dev)
silently passing a consumer's hand-frozen allowlist `Set` instead of failing
CI. The package ships a generator CLI (`plugin-registry-gen`), a JSON Schema
pair (`schema/agents.schema.json`, `schema/skills.schema.json`), a reader
helper (`readRegistry`/`resolveName`), and a `stale_registry` semver
comparator — all implemented and unit-tested (`packages/plugin-registry/tests/`
covers cli/generate/json-schema/log/read/unsafe-name, plus fixtures for a
valid plugin, an unterminated-frontmatter plugin, and an unsafe-name plugin).

The binding cross-repo design is
`.claude/artifacts/crew/designs/2026-07-08-feat-009-slice-2-registry-publish-model-adr.md`:
push model (producer CI opens a PR into plugins-common), producer's own
semver as the version field, `semver.lt` staleness comparator, one
`registry/<plugin>/agents.json` + `skills.json` file pair per producer.

FEAT-009's close note is explicit that only the **plugins-common side**
shipped: "Cross-repo producer/consumer migration deferred to companion
FEATs (dev-team + runner-plugin) per
`docs/companion-feats-registry-adoption.md`." That doc drafts two companion
FEATs — crew (dev-team) as producer, runner-plugin's
`validate-agent-refs.mts` as consumer — as suggestions with a suggested
`/runner:intake` path, not filed backlog items.

This ADR was requested as part of a broader wave-0 cleanup task to decide
the package's fate now that FEAT-009's in-repo scope has sat closed for two
days with zero consumer adoption, rather than let an unpublished,
unconsumed package linger indefinitely without a recorded decision.

## Current shape

- `packages/plugin-registry/package.json` — versioned `0.1.0`, `name:
  @astragenie/plugin-registry`, has `publishConfig` pointing at
  registry.npmjs.org and a `bin: plugin-registry-gen` entry, but has never
  been published: `npm view @astragenie/plugin-registry version` returns a
  live `E404` (confirmed 2026-07-10, this session).
- `packages/plugin-registry/src/` — `index.ts`, `cli.ts`, `generate.ts`,
  `read.ts`, `json-schema.ts`, `schema-loader.ts`, `log.ts`,
  `errors.ts`, `unsafe-name.ts`. Fully implemented per FEAT-009 AC-1..AC-5
  (schema-validated output, `E_REGISTRY_SOURCE_INVALID` /
  `E_REGISTRY_UNSAFE_NAME` `DeterministicError` aborts per DEC-002,
  structured JSON log line per run, path-traversal / shell-metacharacter
  name rejection).
- `packages/plugin-registry/tests/` — 6 test files + 3 fixture plugin dirs;
  covers the generator, reader, schema validation, unsafe-name rejection,
  and structured logging in isolation.
- No `registry/` directory exists anywhere in this repo's working tree —
  the "self-dogfood... produce `registry/plugins-common/*.json`" language
  in the SLICE-2 ADR's slice decomposition was not committed as a checked-in
  artifact; the self-dogfood proof lives only inside the test suite's
  fixtures, not as a real registry entry for plugins-common's own
  (nonexistent) `agents/`/`skills/` directories.
- `docs/companion-feats-registry-adoption.md` — drafts, but does not file,
  the two companion FEATs. Confirmed (this session) that neither
  `/c/work/mega/dev-team/.claude/artifacts/loop/backlog/` nor
  `/c/work/mega/runner-plugin/.claude/artifacts/loop/backlog/` contains any
  FEAT referencing "registry" — the companion FEATs were never filed.
- Consumer search (this session): `grep -rn "plugin-registry"` across
  dev-team, runner-plugin, and this repo's own non-artifact source finds
  zero code imports of `@astragenie/plugin-registry` — every hit is either
  this repo's own `packages/plugin-registry/` source, or artifact/log
  files (`.claude/logs/payloads/*.json`, `.claude/state/*.json`,
  `.claude/artifacts/**`) that reference the FEAT-009 work itself, not a
  runtime dependency on the package. `runner-plugin`'s
  `validate-agent-refs.mts` (the concrete consumer named in FEAT-009's own
  description) still carries its original hand-frozen allowlist `Set` —
  unmigrated.
- `.github/workflows/release.yml` — per-package tag-triggered publish
  (`<pkg>-v*` → `npm publish --provenance`); `plugin-registry-v*` has never
  been pushed, consistent with the npm 404 above.
- `.claude/artifacts/loop/backlog/done/FEAT-009.md` close note also flags a
  follow-up FEAT-012 for "multi-producer merge/collision +
  readManifestFile error-branch tests" — further unshipped scope stacked
  on top of a package with no live consumer yet.

## Proposed shape

Not applicable in the usual sense — this ADR is a disposition decision for
existing code, not a design for new code. The three options considered are:

1. **ADOPT** — publish `plugin-registry-v0.1.0` now, wire it into the
   release cadence, and file the two companion FEATs in dev-team and
   runner-plugin in the same pass so the producer/consumer sides land
   immediately after.
2. **DELETE** — remove `packages/plugin-registry` entirely: no consumer,
   no companion FEATs filed, and unpublished code carries maintenance
   surface (CI runs its lint/typecheck/test on every push per the
   `bun --filter '*'` root scripts) for zero current benefit.
3. **DEFER** — keep the package in-tree, unpublished, exactly as FEAT-009
   left it. Revisit publish once a companion FEAT (dev-team producer or
   runner-plugin consumer) is actually filed and ready to consume a
   pinned version.

## Trade-offs

| Option | Pro | Con |
|---|---|---|
| ADOPT now | Closes the loop FEAT-009 started; unblocks the companion FEATs immediately; the design work (SLICE-2 ADR) is already done | Publishing a `0.1.0` with zero real consumers means the FIRST integration (whichever companion FEAT lands first) will drive breaking-change discovery post-publish, not pre-publish — semver-safe evolution is harder once a public npm tag exists; the two companion FEATs (producer CI job in dev-team, consumer migration in runner-plugin) are each nontrivial cross-repo work this task is explicitly scoped NOT to do (per the dispatch: "ADR + ci.yml change... do NOT publish or delete") |
| DELETE now | Removes unconsumed code + its CI cost immediately; avoids maintaining a package with a contract (JSON Schema, CLI flags, `stale_registry` comparator) nobody has exercised end-to-end via a real cross-repo publish yet | Throws away validated, tested, reviewed work (FEAT-009 SLICE-1/SLICE-3 both passed review+validation gates per the close note) and a binding design decision (the SLICE-2 ADR) that correctly answers 4 real sub-decisions (push vs pull, versioning, staleness comparator, aggregation shape); the underlying problem (FEAT-240-class stale-rename bugs) is real and already occurred twice, so deletion likely means re-deriving the same design later |
| DEFER | Zero-risk: no publish commitment before a real consumer exists to validate the contract; no destructive loss of already-reviewed work; matches the FEAT-009 close note's own stated deferral shape (companion FEATs are a known follow-on, not an abandoned thread); this task's own dispatch instructions ("do NOT publish or delete the package in this task") already point at a decision that keeps both options open | Package sits unpublished indefinitely unless something actively revisits it — needs an explicit trigger, not a vague "someday", or it becomes exactly the kind of stale unowned code DELETE would have avoided |

## Recommendation

**DEFER.** Keep `packages/plugin-registry` in-tree, unpublished, at its
current `0.1.0`, and do not file the companion FEATs speculatively.

Rationale: ADOPT is premature — publishing before either companion FEAT is
filed means shipping a public npm contract with no consumer lined up to
exercise it, and the actual integration work (dev-team's release-CI
generator invocation + PR-open credentials, runner-plugin's
`validate-agent-refs.mts` migration) is real cross-repo effort this task is
explicitly out of scope to start. DELETE is too aggressive against work
that already passed review + validation gates and correctly resolved a
real, twice-occurred bug class's design questions (the SLICE-2 ADR) — reversing
that would likely mean re-deriving the same four sub-decisions later at
strictly higher cost than leaving tested code in place.

DEFER is not a passive "ignore it" — it needs an explicit trigger so it does
not silently rot, matching this repo's own established pattern (see
`CLAUDE.md`-equivalent guidance in dev-team: FEAT-005/FEAT-009-style
deferrals are only revisited "when X observed", not on a vague timer).
**Trigger for revisiting:** either (a) a companion FEAT is filed in
dev-team or runner-plugin (via `/runner:intake`) referencing FEAT-009's
registry design, at which point publish `plugin-registry-v0.1.0` as a
prerequisite for that FEAT's own slice-1, or (b) a third FEAT-240-class
stale-rename incident occurs before a companion FEAT is filed, which
should be treated as a signal to file the companion FEATs proactively
rather than waiting further.

## Risks

- Deferring twice (FEAT-009's own producer/consumer scope was already
  deferred once) compounds the risk that this becomes permanent dead code
  disguised as "temporarily unpublished." Mitigation: the explicit trigger
  above, plus this ADR itself as the durable record so a future session
  does not have to re-investigate whether the package has consumers from
  scratch — it can start from this file's evidence.
- The self-dogfood gap (no committed `registry/plugins-common/*.json`,
  despite the SLICE-2 ADR's slice decomposition describing it) means this
  repo has never actually run the generator against a real plugin
  end-to-end outside the test suite's fixtures. If DEFER is later
  reversed to ADOPT, re-running that dogfood step against a real producer
  plugin (this repo has no `agents/`/`skills/` of its own to dogfood
  against — the first real end-to-end run would necessarily be a
  companion FEAT's producer-side integration) should happen before the
  first real npm publish, not be assumed already proven.
- CI cost of carrying unpublished code: `bun run lint` / `typecheck` /
  `test` already run against `packages/plugin-registry` via the root
  `bun --filter '*'` scripts on every push — this is a small, fixed,
  already-paid cost, not a reason on its own to prefer DELETE over DEFER.

## References

- FEAT: `.claude/artifacts/loop/backlog/done/FEAT-009.md`
- SLICE-2 design (binding cross-repo contract):
  `.claude/artifacts/crew/designs/2026-07-08-feat-009-slice-2-registry-publish-model-adr.md`
- Companion FEAT drafts (not filed):
  `docs/companion-feats-registry-adoption.md`
- `packages/plugin-registry/package.json`, `packages/plugin-registry/src/index.ts`
- `.github/workflows/release.yml` (per-package tag-triggered publish pattern)
- DEC-002: `.claude/artifacts/loop/decisions/DEC-002.md`
