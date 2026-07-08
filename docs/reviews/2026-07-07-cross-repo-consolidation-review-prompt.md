# Prompt: Brutally Honest Cross-Repo Architecture Review → plugins-common Consolidation Plan

> Self-prompt for Claude Code. Not yet dispatched. Run from `C:\work\mega\plugins-common`
> (or any of the four repos) with full read access to all sibling paths.
> **v2** — phased execution, prioritization formula, dependency graph, ownership analysis.

---

## Role and stance

You are reviewing four TypeScript/Bun repos that I (the operator) own. You have **zero
obligation to be nice**. I want the review a staff engineer gives when they think nobody's
career is on the line: name the bad code, quantify the duplication, call out the
copy-paste drift, and say plainly where we cargo-culted a pattern instead of designing one.

Rules of engagement:

- **No praise padding.** One sentence of "what's healthy" per repo maximum, then problems.
- **Every claim cites evidence** — `repo/path/file.mts:line`. No vibes. If you can't cite
  it, don't say it.
- **"It works" is not a defense.** Judge maintainability, consistency, and cost of the
  next change, not whether tests pass today.
- **Call out my decisions too.** If a DEC/ADR in any repo locked in a bad pattern, say so
  and name the decision id.
- **Never solve hypothetical future problems.** No extraction based on anticipated
  reuse. Current duplication across **at least two mature call sites** is required,
  unless an accepted architecture decision already mandates the abstraction. If you feel
  the urge to propose `plugin-utils`, `shared-runtime`, or any grab-bag package, that is
  the signal to stop and re-check the evidence.
- **Read-only.** This run produces reports + a consolidation plan. No source edits, no
  commits.

## Repos under review

| Repo | Path | What it is |
|---|---|---|
| runner-plugin (loop) | `C:\work\mega\runner-plugin` | Wiggin-Loop methodology layer on top of crew. Bun, `src/scripts/*.mts`, backlog/slice ceremony, snapshot generation. |
| dev-team (crew) | `C:\work\mega\dev-team` | Crew plugin — agents, skills, hooks, GEPA evals, langfuse. runner-plugin's hard upstream dependency (`MIN_CREW_VERSION`). |
| astramemory-plugin | `C:\work\mega\astramemory-plugin` | astramem MCP memory plugin — `bin/`, `lib/`, `src/`, MCP server surface. |
| plugins-common | `C:\work\mega\plugins-common` | Shared-package workspace. Existing packages: `astramem-client`, `gepa-core`, `plugin-kernel`. This is the consolidation target. |

Context worth knowing before you start:

- `packages/astramem-client` was created as the single consumer seam for astramem —
  landing chain dated 2026-07-07. Check who actually imports it vs. who still hand-rolls
  resolution; verify compliance in all repos.
- runner-plugin pins crew via `src/scripts/lib/plugin-identity.mts::MIN_CREW_VERSION`.
  Cross-plugin contracts also live in `docs/upstream-requests/` and the halt-badge
  registry (`docs/halt-badges.md`, SPEC-003). Treat these as the existing "shared
  contract" mechanisms and judge whether they should become code in plugins-common
  instead of prose.
- All repos run Bun, ESM-only, Biome. Windows is a first-class host — Bun `file:`/`link:`
  deps fail with EPERM; the workaround is `mklink /J` junctions with absolute targets.
  Every new shared package raises install friction. Factor this into migration risk.

## Phased execution — do NOT run as one monolithic pass

Quality degrades when evidence gathering, comparison, and planning share one context.
Run three phases; each writes its artifact to
`plugins-common/docs/reviews/` before the next begins. Phases may be separate
sessions — each phase's input is only the prior phase's artifact plus targeted
re-reads for verification.

- **Phase 1 — Evidence gathering** (dimensions 1–8 below). Fan out read-only subagents
  per repo × dimension. Subagents return **citations and counts only** — no verdicts, no
  recommendations. Output: `...-review-phase1-evidence.md`.
- **Phase 2 — Cross-repo comparison + verdicts.** Only the synthesizer sees all four
  repos side-by-side; all verdicts happen here. Spot-check ≥20% of Phase 1 citations
  before trusting them; discard any that don't verify. Output:
  `...-review-phase2-findings.md` (scorecard, dependency graph, findings,
  convention verdicts).
- **Phase 3 — Consolidation plan.** Takes Phase 2 findings; produces the ranked,
  costed extraction plan + greenfield comparison. Output:
  `...-review-phase3-plan.md`.

Effort split guidance: ~60% Phase 1, ~25% Phase 2, ~15% Phase 3. If a dimension turns
up clean, say "clean, checked X files" — do not manufacture findings to fill quota.

## Phase 1 — Evidence dimensions (all mandatory)

### 1. Duplication census

Find concrete duplicated or near-duplicated code across the four repos. Expected suspects
(verify, don't assume):

- config loading/parsing (`.claude/loop.json`, `crew.json`, plugin `.local.md` settings)
- JSONL append/read/rotate helpers (audit logs, telemetry, learnings, trials)
- artifact path resolution (`.claude/artifacts/**` writers in runner vs crew)
- frontmatter parse/write (FEAT/slice/agent markdown)
- git worktree helpers (runner wave mode vs crew:parallel vs astramemory worktrees)
- subprocess/CLI spawn wrappers (Bun spawn, exit-code handling, stderr capture)
- version/semver comparison (MIN_CREW_VERSION vs any other pin checks)
- markdown table/section generation (snapshot, briefs, retros)
- validation scripts (manifest, content-length style gates — diverged copies?)

For each duplicate: table row with locations, line counts, call-site counts per repo,
drift status (identical / diverged / diverged-with-bugfix-on-one-side-only), and which
copy is the best seed.

### 2. Dependency graph

Highest-value structural artifact. Produce:

- **Current graph** — nodes: the four repos + the three plugins-common packages +
  notable internal layers (`lib/`, `commands/`, `hooks/`, entry scripts). Edges: real
  imports, `file:`/`workspace:` deps, CLI spawns of another repo's scripts, and
  cross-repo file-path reads/greps (these are hidden edges — hunt them; runner's DEC-069
  `orchestrate-slice.md` preset-path grep is one known instance, find the rest).
- **Violations** — cycles, inverted layers (`lib/` importing entry/command layers),
  edges that exist only via filesystem path coupling instead of a declared dependency.
- **Desired graph** — allowed edges after consolidation, stated as rules
  (e.g. "plugins-common packages import nothing from plugin repos, ever").

Mermaid diagram + edge table with evidence per edge.

### 3. Exception handling comparison

- try/catch density; catch-block behavior — rethrow, wrap, log-and-continue, swallow.
  Count swallowed catches (`catch {}` or equivalent) per repo.
- Error types: custom error classes vs bare `Error` vs string throws. Coherent taxonomy
  anywhere? Three taxonomies anywhere?
- Exit-code discipline: runner-plugin bans `process.exit(N)` in library functions — do
  the other repos violate the equivalent? Does runner itself?
- Result-shaped returns (`{ ok, error }`) vs exceptions — where do repos disagree; does
  any single file mix both styles?

### 4. Provider / integration-seam usage

- astramem access per repo: MCP tools, `astramem-client`, hand-rolled CLI spawn, direct
  file reads? Map every seam; flag single-seam violations.
- crew access per repo: version pin, path greps into the other plugin's tree, prose
  upstream-requests.
- Agent-dispatch seams: runner `dispatchAgent`, crew's dispatch, GEPA model calls,
  langfuse wiring. Is "provider" ever abstracted, or is every integration bespoke?

### 5. Dependency injection & testability

- How modules get dependencies: module-scope singletons, parameter passing, factories,
  import-time side effects. Cite the worst import-time side effect per repo.
- Test coping strategies: real FS in temp dirs, mocking, DI seams. Flag where missing DI
  forces integration-style tests for unit-sized logic.
- `plugin-kernel`: what does it provide today? **Does it already behave like a framework
  rather than a library** (inversion of control, lifecycle hooks, mandatory adoption
  surface)? Answer explicitly — accidental frameworks are how shared packages rot.

### 6. Modularization & boundaries

- Files violating stated architectural rules, god objects (mixed responsibilities),
  excessive fan-in, excessive fan-out — cite worst offenders per repo with import
  counts. (Do NOT report "largest files" as a finding; size alone is not a violation.)
- Implicit public surface: anything one repo reads from another's tree (paths, schemas,
  markdown contracts). Anything consumed by ≥2 repos is a package candidate — list them.
- Dead weight: exports with zero call sites, deprecated queues kept "just in case"
  (runner's `pending-dispatch/` marker queue per DEC-011), vendored 3rdparty agents
  duplicating owned ones.

### 7. Bad practices sweep (per repo)

Severity-tagged list per repo: `@ts-ignore`/`@ts-nocheck` counts and justification,
`any` density in non-test code, copy-pasted magic strings (artifact paths, badge names,
frontmatter keys) that should be shared constants, silent fallbacks masking
misconfiguration (runner's `marathonCheckpointEvery` opt-out trap is the known
example — find the pattern elsewhere), inconsistent naming for one concept across repos
(slice/task/run/dispatch), hand-authored `.mjs` drifting beyond the sanctioned list.

### 8. Feature-toggle / config audit + stability signals

- Inventory boolean/enum behavior toggles across repos (`loop.json` keys, crew config
  flags, astramem settings, env vars). Same *kind* of toggle implemented N ways?
- Count ad-hoc `config?.x?.y ?? default` chains per repo — that count is the evidence
  for or against a shared typed-accessor util.
- **Churn/stability**: for every module that later becomes an extraction candidate,
  record `git log --oneline --since="3 months ago" -- <path> | wc -l` and last-change
  date. Also classify each candidate's public API: stable (unchanged ≥1 month, ≥2
  external call sites) vs churning. Volatile code and weekly-changing APIs do NOT get
  extracted — they get a "revisit when stable" tag.

## Phase 2 — Comparison + verdicts

1. **Scorecard** — per repo, per dimension, 1–5, one-line justification. No inflation:
   3 = typical unreviewed internal code; 5 requires evidence.
2. **Dependency graph deliverable** (dimension 2 output, finalized).
3. **Findings** — severity-tagged (`BLOCKER`/`MAJOR`/`MINOR`), cited.
4. **Convention verdicts** — the ONE exception-handling style, DI pattern, and toggle
   pattern the ecosystem converges on. Interface sketch + one usage example each (what
   plugins-common would ship to enforce it) — not full implementations.
5. **Package boundary reassessment** — do not assume the three existing packages are
   correctly shaped. Should any two merge? Should any split? Is any package sited wrong
   entirely? If plugins-common's own packages exhibit the diseases this review hunts
   (e.g. astramem-client and gepa-core disagreeing on error style), lead with that —
   the consolidation target must not inherit the problems it exists to fix.

## Phase 3 — Consolidation plan

### Prioritization — mandatory scoring, no equal treatment

Score every extraction candidate 1–5 on:

- **Impact** — maintenance cost removed, bug-class eliminated, coupling reduced
- **Frequency** — call sites × repos touching it × churn rate
- **Migration cost** — code moves, import rewrites, junction/install friction, test
  migration
- **Risk** — regression probability, blast radius if the shared version ships a bug

`Priority = (Impact × Frequency) / Migration Cost`, with Risk as a tie-breaker/veto.
Rank the plan by Priority. A markdown-table helper must not outrank a provider seam
because it was easier to find.

### Per-candidate requirements

Every candidate entry MUST include:

- Proposed package/module + siting (existing package vs new — justify new)
- Seed copy (repo+path) and consuming repos **with call-site counts** (≥2 mature call
  sites or an accepted DEC/ADR, else it goes on the do-NOT-extract list)
- **Principle satisfied** — at least one of: reduces coupling, improves testability,
  improves API stability, removes duplication, clarifies ownership, reduces maintenance
  cost, improves version compatibility. Name it. "The files look similar" is not a
  principle.
- **Ownership** — which repo/team defines behavior, who may evolve the API, who may
  not. A package nobody owns is a junk drawer with a version number.
- **Effort estimate** — S/M/L/XL, plus: regression probability (low/med/high),
  dependencies on other candidates, tests required before + after move
- **Stability gate** — churn data from dimension 8; churning modules get "revisit when
  stable", not extraction
- Migration risk narrative (include Bun-Windows junction friction)

### Do-NOT-extract list

Explicit, with reasons: used-once utils, still-churning code, repo-specific policy
dressed up as a util, anything justified only by anticipated future reuse.

### Versioning strategy

Recommend how plugins-common is versioned and consumed: `workspace:` / npm registry /
git tag pin; lockstep vs independent per-package versions. Justify against the actual
release cadence observed in git history and the Windows junction constraint.

### If we started today (anti-anchoring)

Ignore existing package names and historical decisions. Design the smallest package
graph you would create today for these four repos. Then diff it against reality and
explain only the highest-value differences. If an existing package would not exist in
the greenfield design, say so plainly and state what to do about it.

### Open questions

Anything requiring an operator decision (e.g. does plugin-kernel absorb kernel-ish
utils, or does a new package earn its existence?).
