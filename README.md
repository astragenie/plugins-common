# plugins-common

Monorepo for Astragenie's shared, framework-agnostic TypeScript packages. Bun workspaces,
one package per publishable npm module under `packages/*`.

Formerly the standalone `gepa-core` repo (renamed to `astragenie/plugins-common` 2026-07).
The original package moved to `packages/gepa-core/` with zero functional or API change —
npm consumers of `@astragenie/gepa-core` are unaffected.

## Packages

| Package | npm name | Description |
|---|---|---|
| [`packages/gepa-core`](packages/gepa-core) | `@astragenie/gepa-core` | GEPA reflective prompt evolution toolkit — Pareto-rank prompt candidates, score with pluggable LLM judges, persist trials. |
| [`packages/plugin-kernel`](packages/plugin-kernel) | `@astragenie/plugin-kernel` | Shared kernel for the crew/runner plugin ecosystem — workflow-state machine, locks, ID registry, artifact IO, typed events. Extraction target for Phase 2 (`docs/ai-loop` plan `20260704T131500Z-plan-phase2-kernel-event-spine.md`, item P2.1). Not yet published. |
| [`packages/astramem-client`](packages/astramem-client) | `@astragenie/astramem-client` | Shared fail-silent client seam for the astramem memory plugin — unified provider resolution (dep-mode selector, dep-mode local/saas probe, runtime plugin-root discovery) + wallclock-capped remember/recall. Extracted from dev-team S4 + runner-plugin S1b (FEAT-188). Not yet published. |

## Development

```sh
bun install --frozen-lockfile      # one install for all packages
bun --filter @astragenie/gepa-core test
bun --filter @astragenie/plugin-kernel test
bun run lint                        # biome check, all packages
bun run typecheck                   # tsc --noEmit, all packages
```

Single hoisted `node_modules` and single `bun.lock` at repo root. Shared `biome.json`
and `tsconfig.base.json` live at root; each package may extend or reference them.

## Release

Each package publishes independently on its own tag prefix:

- `gepa-core-v*` → `packages/gepa-core`
- `plugin-kernel-v*` → `packages/plugin-kernel` (once it ships its first public version)
- `astramem-client-v*` → `packages/astramem-client` (once it ships its first public version)

See `.github/workflows/release.yml`.

## License

MIT.
