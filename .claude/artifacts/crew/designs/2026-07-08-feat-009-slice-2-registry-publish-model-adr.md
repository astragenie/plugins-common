---
id: ADR-FEAT-009-SLICE-2
title: "Cross-repo publish model for the shared agent/skill name registry"
status: proposed
slice: FEAT-009-SLICE-2
introduced_at: 2026-07-08
related_decisions: [DEC-002]
related_feat: FEAT-009
---

# ADR: Cross-repo publish model for the shared agent/skill name registry

## Context

FEAT-009 wants a generated, versioned registry of agent/skill names hosted in
plugins-common so a cross-plugin rename (crew's inspector to reviewer,
FEAT-240; builder to *-dev, #371) fails a consumer's CI
(runner-plugin's validate-agent-refs.mts) immediately instead of silently
passing a hand-frozen Set allowlist. Producers (crew/dev-team, runner) each
own agents/*.md + skills/**/SKILL.md in their OWN repos - plugins-common has
no checkout of those repos and must not acquire one at CI time (the FEAT says
"must work WITHOUT the sibling plugin installed at CI time - a
committed/published manifest, not a live-install lookup").

The declared precedent is @astragenie/astramem-client
(packages/astramem-client/README.md, packages/astramem-client/src/index.ts):
consumers get a versioned, resolvable artifact without a live sibling
checkout. Reading that package's actual mechanics matters because "manifest"
is doing a lot of work in the FEAT title.

astramem-client is not a generated data file. It is hand-written TypeScript,
npm-published under its own tag prefix (astramem-client-v*,
.github/workflows/release.yml line 8 and 32), and consumers pin it as an
ordinary semver dependency - confirmed live: runner-plugin/package.json line
29 pins @astragenie/astramem-client "0.1.0" against plugins-common's 0.2.0
(.claude/artifacts/crew/designs/2026-07-08-phase3-plan-review-addendum.md
lines 22-24). Its "no sibling installed" property comes from an optional peer
dependency plus a fail-silent resolution chain (resolveWireProvider degrades
through 4 strategies), not from any cross-repo data-generation pipeline.

The one part of that precedent that DOES transfer: a versioned, pinned
artifact consumers pull deliberately (semver dependency or a pinned git ref),
never a live unpinned fetch of a moving target (e.g. main's raw GitHub URL at
CI time) - that would silently re-introduce staleness risk of a different
shape. Everything else - schema shape, generation trigger, aggregation,
staleness comparator - is a fresh design question this ADR must answer,
because astramem-client never solved a multi-producer aggregation problem: it
has exactly one upstream (astramem-plugin), not N producer plugins writing
independently.

packages/plugin-std/src/frontmatter.ts (parseFrontmatter, DeterministicError
codes E_FRONTMATTER_UNTERMINATED / E_FRONTMATTER_YAML) is the parser the
generator (SLICE-1) reuses per AC-1/AC-2. DEC-002
(.claude/artifacts/loop/decisions/DEC-002.md) is the binding error policy for
anything this ADR's design touches: infra failure throws a typed PluginError,
domain/expected outcomes return Result. The FEAT's own AC-2/AC-5 already
write validation failures as thrown, non-zero-exit, no-partial-write errors
(E_REGISTRY_SOURCE_INVALID, E_REGISTRY_UNSAFE_NAME) - that is a
domain/contract violation of the producer's own source files, not an infra
fault, but the "abort, don't partially write" shape matches DEC-002's spirit:
a DeterministicError thrown by the generator process, caught at the CLI
boundary, converted to a non-zero exit - never a silently-partial Result.

Scope guard: this repo's own buildable slices (SLICE-1 generator, SLICE-3
reader + self-dogfood) do NOT include writing the producer-side CI jobs in
dev-team/runner-plugin that actually invoke the generator and push its
output - the FEAT explicitly defers that to companion FEATs filed in those
repos (FEAT-009 note, line 52). This ADR decides the CONTRACT those companion
FEATs must honor (push mechanics, file layout, comparator), not their
implementation.

## Current shape

- .claude/artifacts/loop/backlog/triaged/FEAT-009.md:47-51 - AC-1..AC-5, the
  binding contract this ADR must satisfy.
- packages/plugin-std/src/frontmatter.ts:56-95 - parseFrontmatter, throws
  DeterministicError (E_FRONTMATTER_UNTERMINATED / E_FRONTMATTER_YAML) on
  malformed input; the generator's per-file parse step.
- packages/plugin-std/src/errors.ts:29-74 - PluginError / DeterministicError /
  TransientError taxonomy the generator's own errors must extend.
- .claude/artifacts/loop/decisions/DEC-002.md - throw-for-infra /
  Result-for-domain split; binding for the generator/reader.
- packages/astramem-client/README.md:12-19,43-48 - the actual shared-seam
  mechanics (optional peer + fail-silent resolution chain over a published
  npm artifact), not a generated manifest.
- packages/astramem-client/src/index.ts - one producer, hand-written client;
  no aggregation-across-N-producers precedent exists in this repo today.
- .github/workflows/release.yml:3-9,26-34 - per-package tag-triggered
  release; each plugins-common package publishes independently. No workflow
  in this repo currently accepts pushes/PRs from another repo's CI.
- packages/plugin-std/package.json:14-35 - subpath-export convention
  (./jsonl, ./http, ./frontmatter, ./git) the registry schema/generator
  should follow if it lands as a new plugin-std subpath or sibling package.
- No registry/, docs/adr/, or existing registry-shaped code exists yet in
  this repo (confirmed via grep - the only "registry" hits are npm
  publishConfig.registry fields and one unrelated GEPA provider file).

## Proposed shape

Text-diagram (ASCII, no box-drawing to keep this file plain-text safe):

producer repo (crew/dev-team, runner-plugin) -- OUT OF SCOPE for this repo
  release CI: bun x @astragenie/plugin-registry-gen ...
    reads OWN agents/*.md + skills/**/SKILL.md
    stamps { name, sourcePlugin, version: <own semver>, generatedAt }
    validates against committed JSON Schema (fail-closed)
    opens PR against plugins-common:
      registry/<plugin>/agents.json
      registry/<plugin>/skills.json
  --> PR (per-producer path, no shared-file write race with other producers)

plugins-common (THIS repo -- SLICE-1/SLICE-3 buildable scope)
  registry/<plugin>/agents.json   -- one file per producer plugin
  registry/<plugin>/skills.json
  registry/schema/agents.schema.json  (SLICE-1, committed)
  registry-gen CLI (SLICE-1) -- reusable, invoked BY producer CI
  registry-read helper (SLICE-3) -- merges registry/*/agents.json,
    detects name collisions across plugins, applies staleness rule
    (semver compare entry.version vs consumer-supplied expectedVersion)
    -> stale_registry warning, never silent pass
  self-dogfood: plugins-common runs its OWN generator against its
    own agents/ + skills/ (if any) as registry/plugins-common/*.json
  --> npm-publish (existing tag-prefix pattern) OR consumer clones/pins a
      ref of THIS repo -- never an unpinned fetch of a moving main

consumer repo (runner-plugin's validate-agent-refs.mts -- OUT OF SCOPE here)
  reads registry/*/agents.json from a pinned dependency/ref, resolves names,
  surfaces stale_registry warning per AC-3 comparator

- registry/<plugin>/agents.json, registry/<plugin>/skills.json (new,
  SLICE-1 output shape) - one file pair per producer plugin, not one flat
  merged file across all producers.
- registry/schema/agents.schema.json + skills.schema.json (new, SLICE-1) -
  committed JSON Schema each generator run validates against before writing
  (AC-1).
- Generator CLI (new - SLICE-1; land as a plugin-std subpath, e.g.
  @astragenie/plugin-std/registry-gen, or a new sibling package if it grows
  its own CLI-only dependency surface plugin-std's own package.json
  description ("no lifecycle, no IoC") shouldn't carry - a packaging call for
  SLICE-1, not this ADR) - reuses parseFrontmatter, throws
  DeterministicError subclasses E_REGISTRY_SOURCE_INVALID /
  E_REGISTRY_UNSAFE_NAME per DEC-002, emits the AC-4 structured JSON log line
  on every run (success or failure).
- Reader helper (new - SLICE-3) - reads one or more registry/<plugin>/*.json
  files, exposes a resolve-by-name function, and the semver staleness
  comparator (AC-3).
- Companion FEATs (deferred, other repos) - own the actual CI job that
  invokes the generator at producer release time and opens the PR into
  plugins-common; own the migration of validate-agent-refs.mts off its local
  Set. Neither is this ADR's or this repo's slice to build, but this ADR's
  file-layout/comparator contract is what those FEATs must target.

## Trade-offs

### 1. Push vs pull

| Option | Pro | Con |
|---|---|---|
| A - Producer CI pushes (PR) into plugins-common at release time | Fires exactly when the rename happens (closes the FEAT-240 window at the source); no cross-repo checkout needed by plugins-common; producer owns accuracy of its own data | Needs a scoped bot token with PR-open rights into plugins-common from each producer's CI; N producers pushing independently - needs a layout that avoids write races (addressed via per-producer path, not a shared merge) |
| B - plugins-common pulls/polls producer repos on a schedule | Single write path, no cross-repo push credentials to manage, no race between producers | Requires plugins-common to have read/checkout access to producer repos (crew/dev-team, runner-plugin) it doesn't have today; polling cadence reintroduces exactly the staleness window this FEAT exists to close - a rename lands in the producer's main but isn't reflected until the next poll, unless triggered by a producer-side webhook, which is push-B-in-disguise with extra latency |
| C - plugins-common pulls on-demand at consumer CI time (live install-adjacent lookup) | Always fresh | This is the exact "live-install lookup" the FEAT explicitly rules out ("must work WITHOUT the sibling plugin installed at CI time") - not a real option, listed for completeness |

Option C is not a real trade-off - the FEAT text forecloses it, so it is not
scored further.

### 2. Versioning

| Option | Pro | Con |
|---|---|---|
| A - producer plugin's own semver (its package.json/manifest version at generation time) | Consumers already reason about producer versions this way (npm dependency ranges, e.g. runner-plugin/package.json:29's astramem-client pin); gives AC-3's "predates a consuming plugin's currently-installed release tag" a precise, total-order comparator (semver.lt) that's repo-agnostic | Requires each producer plugin to actually carry a semver - true for npm-published packages, needs confirming for crew/runner-plugin which may version by git tag only, not package.json |
| B - monotonic registry-wide counter | Simple, no dependency on producer versioning discipline | Meaningless to a consumer holding a specific producer release - "registry entry #47" tells a consumer nothing about whether it's ahead of or behind their installed crew version; fails AC-3's requirement that staleness compares against "a consuming plugin's currently-installed release tag" |
| C - git SHA of the producer commit that generated the entry | Exact provenance, no versioning-discipline dependency | Consumers don't hold a SHA to compare against, they hold a release tag/version; SHA ordering isn't a total order without walking history - can't cheaply answer "is mine ahead or behind" |

### 3. Staleness comparator (AC-3)

| Option | Pro | Con |
|---|---|---|
| A - semver comparison: registry entry.version vs consumer-supplied expectedVersion | Deterministic, repo-agnostic, immune to clock skew across independent CI runners in different timezones/repos; directly reproduces FEAT-240 (crew bumped past the entry's stamped version -> stale_registry fires) | Consumer must know and pass its own installed producer version (already true - that's the dependency it's checking against) |
| B - generatedAt timestamp vs consumer's installed-release timestamp, with a freshness window | No version-string plumbing needed | Timestamps across independently-scheduled CI jobs in different repos are exactly the kind of signal clock skew and checkout-timing jitter corrupt; a window-based threshold either fires false positives (CI just hasn't re-run yet) or false negatives (window too generous) - weaker guarantee than a total order |

generatedAt is retained in the schema (AC-1 requires it) and surfaced in the
AC-4 log line for human debugging ("how old is this entry"), but is NOT the
staleness gate.

### 4. Aggregation shape

| Option | Pro | Con |
|---|---|---|
| A - per-producer file (registry/<plugin>/agents.json) | Each producer's PR only ever touches its own path - zero write-conflict surface between concurrent producer publishes; one producer's E_REGISTRY_SOURCE_INVALID abort (AC-2) cannot corrupt or block another producer's already-committed file; matches SLICE-1's own scope ("generator CLI" runs against ONE plugin's directories, per AC-1's wording) | Reader (SLICE-3) must glob + merge multiple files instead of reading one; cross-plugin name collisions are a read-time check, not a write-time one |
| B - one flat merged registry/agents.json across all producers | Single read, no merge step for the reader | Every producer publish becomes a merge/rebase against a shared file - real write races when two producers release close together; a malformed entry from one producer risks corrupting (or blocking, via merge conflict) the whole file, defeating AC-2's "does NOT write a partial or corrupt registry/agents.json" per-producer guarantee |

### 5. Failure semantics (align with DEC-002)

Not a real trade-off - DEC-002 already fixes this repo's policy. The only
question was whether registry-generation failures are "domain" (Result) or
"infra" (throw). An unsafe name or unterminated frontmatter is a contract
violation of the producer's own source files - not a domain/expected outcome
like lock contention, and not an infra fault like ENOENT - but per DEC-002's
boundary rule ("unexpected infrastructure failure -> throw a typed error,
caught at the boundary") and the FEAT's own AC-2/AC-5 wording ("aborts ...
with a non-zero exit code"), the correct shape is: generator internals throw
DeterministicError subclasses (E_REGISTRY_SOURCE_INVALID,
E_REGISTRY_UNSAFE_NAME) exactly like parseFrontmatter already does; the CLI
entrypoint catches at its own boundary and converts to a non-zero process
exit. No Result return type belongs on the generator's per-file validation
path - that would let a caller silently ignore ok:false and move on to
writing a partial file, which is precisely what AC-2 forbids.

## Recommendation

Push (Option A), producer semver as the version field (Option A), semver
comparator for staleness (Option A), per-producer file aggregation (Option
A), throw/non-zero-exit failure semantics matching DEC-002.

Push wins because pull's only way to avoid re-introducing the FEAT-240
staleness window is a producer-side release webhook - which is push with
extra hops and latency, not a genuinely different model. Per-producer semver
as the version field is the only option that lets AC-3's comparator be a real
total order instead of a fragile timestamp-window heuristic, and it matches
how consumers already reason about producer versions
(runner-plugin/package.json:29's literal semver pin on astramem-client).
Per-producer file aggregation is the only option that gives AC-2's
"no-partial-write, no cross-contamination" guarantee for free from the file
layout itself, rather than needing merge-conflict-resolution logic invented
from scratch. None of these four sub-decisions have a real second contender
once AC-2/AC-3's exact wording is taken literally - the trade-off tables
above are real for sub-decisions 1-2 but sub-decisions 3-5 have one option
that dominates on the FEAT's own stated constraints.

Consumption mechanics (not itself one of the five questions, but required for
"push" to be buildable): the committed registry/<plugin>/*.json files should
be consumed the same way astramem-client already is - a PINNED artifact
(either published as part of a versioned plugins-common package a consumer
depends on, or a consumer-pinned git ref/tag of this repo), never an unpinned
fetch of plugins-common's moving main at CI time. That decision is deferred
to the companion consumer-side FEAT (validate-agent-refs.mts migration), but
this ADR records it as a hard constraint that FEAT must honor, since an
unpinned live-main fetch would quietly recreate the same "consumer's world
can silently diverge from truth" failure mode this whole FEAT exists to
close, just moved one hop over.

## Slice decomposition

Already fixed by FEAT-009's own proposed slices; this ADR does not change
slice boundaries, only fills in the design SLICE-1 and SLICE-3 must target:

- SLICE-1 (5 pts, buildable now): schema (registry/schema/*.schema.json) +
  generator CLI producing registry/<plugin>/agents.json +
  registry/<plugin>/skills.json shaped { name, sourcePlugin, version,
  generatedAt }, reusing parseFrontmatter, throwing
  E_REGISTRY_SOURCE_INVALID / E_REGISTRY_UNSAFE_NAME per AC-2/AC-5, emitting
  the AC-4 structured log line, atomic whole-file write (validate-all-then-
  write, never partial).
- SLICE-2 (3 pts, this document): closed by this ADR.
- SLICE-3 (5 pts): reader helper that globs registry/*/agents.json (+
  skills), merges across producers, detects cross-plugin name collisions,
  implements the semver staleness comparator (AC-3) with a unit-test fixture
  reproducing the FEAT-240 stale-inspector scenario, and dogfoods by running
  the SLICE-1 generator against plugins-common's own agents/skills (if
  present) to produce registry/plugins-common/*.json as a self-consuming
  proof the round trip works end to end inside one repo before any
  cross-repo producer FEAT is filed.

## Acceptance criteria

- [ ] SLICE-1's generator emits registry/<plugin>/agents.json +
      registry/<plugin>/skills.json per invocation, one file pair per
      producer plugin (not one merged file across producers) - satisfies
      AC-1 and the per-producer aggregation decision above.
- [ ] SLICE-1's generator validates all entries against the committed JSON
      Schema and performs a single whole-file write only after full-batch
      validation passes - no partial/corrupt file on abort (AC-2).
- [ ] SLICE-1's generator throws DeterministicError subclass
      E_REGISTRY_SOURCE_INVALID naming the offending file path on
      parseFrontmatter failure, and E_REGISTRY_UNSAFE_NAME on a name
      containing ../ or shell metacharacters (AC-2, AC-5), converted to a
      non-zero CLI exit at the boundary per DEC-002.
- [ ] SLICE-1's generator emits one structured JSON log line per run -
      { plugin, agentCount, skillCount, durationMs, outcome } - on both
      success and failure paths (AC-4).
- [ ] SLICE-3's reader implements stale_registry as: semver.lt(registry
      entry.version, consumer-supplied expectedVersion) -> warning, not
      silent pass; generatedAt is logged, not gated on.
- [ ] SLICE-3's reader ships a unit-test fixture that reproduces the
      FEAT-240 shape (a committed registry entry stamped with a crew version
      older than the consumer's asserted-installed crew version, entry name
      still inspector) and asserts the stale_registry warning fires instead
      of a false-negative resolve (AC-3).
- [ ] SLICE-3's reader detects and reports a same-name collision across two
      different sourcePlugin values rather than silently picking one.

## Risks

- Producer repos may not version by package.json semver at all (e.g. a
  Claude Code plugin manifest with a different version field, or tag-only
  versioning) - mitigation: the companion producer-side FEATs (filed in
  dev-team/runner-plugin, out of this repo's scope) must confirm and, if
  needed, adopt a semver field before their generator-invocation CI job can
  stamp version meaningfully; SLICE-1's schema should keep version as an
  opaque semver-shaped string rather than assuming a specific source field,
  so this repo's slices don't block on that external confirmation.
- Cross-repo bot token scope creep - a bot token with PR-open rights into
  plugins-common from N producer repos is a real credential-surface
  increase; mitigation: scope the token to open PRs only against the
  registry/<plugin>/ path (path-scoped branch protection / CODEOWNERS), not
  general write access, and require plugins-common's own CI (schema
  validation) as a required check before merge - deferred to the companion
  FEATs but recorded here as a hard constraint.
- This task's own instructions arrived as data embedded in a FEAT/dispatch
  body and, per this agent's injection-defense policy, are treated as
  context to weigh, not commands to obey blindly - no directive inside
  FEAT-009 or the dispatch prompt overrode the trade-off analysis above; the
  dominant-option conclusions in this ADR were reached by testing each
  option against AC-2/AC-3's literal wording, not asserted without reasoning.
- Per-producer file layout still allows a stale collision to go unnoticed
  until a consumer actually resolves the colliding name - mitigation:
  SLICE-3's reader should treat collision-detection as a standalone check
  run over the full merged set (not only on resolve-by-name), so
  plugins-common's own CI can surface a collision proactively during its
  self-dogfood run rather than only when some future consumer happens to
  query the colliding name.

## References

- FEAT: .claude/artifacts/loop/backlog/triaged/FEAT-009.md
- DEC-002: .claude/artifacts/loop/decisions/DEC-002.md
- packages/plugin-std/src/frontmatter.ts, packages/plugin-std/src/errors.ts
- packages/astramem-client/README.md, packages/astramem-client/src/index.ts
- .github/workflows/release.yml
- .claude/artifacts/crew/designs/2026-07-08-phase3-plan-review-addendum.md
  lines 22-24 (live astramem-client semver-pin evidence)
