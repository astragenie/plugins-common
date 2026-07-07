# @astragenie/astramem-client

Shared fail-silent client seam for the [astramem](https://github.com/astragenie/astramem-plugin)
memory plugin. Extracted from the two consumer implementations that grew
independently during FEAT-188:

- dev-team `scripts/lib/memory/astramem-provider.ts` (S4) — dep-mode provider
  loading with a hand-rolled local-then-saas health probe,
- runner-plugin `src/scripts/lib/memory-transport.mts` (S1b) — dep-free runtime
  discovery of the installed plugin.

Both strategies now live behind one resolution chain (see `src/resolve.ts`):

1. injected provider (test seam),
2. dep-mode `@astragenie/astramem-plugin/selector` → `resolveProvider()`,
3. dep-mode `providers/local` + `providers/saas` factory probe (older plugin shas),
4. runtime plugin-root discovery (`CLAUDE_PLUGIN_ROOT_MEMORY` env, or the
   `astramem` CLI's PATH location → plugin root) with file-URL imports.

## API

```ts
import { rememberSilent, recallSilent, resolveWireProvider } from "@astragenie/astramem-client";

// Fire-and-forget capture — true when accepted, false on ANY failure.
const ok = await rememberSilent({ id, type: "lesson", text, metadata });

// Capped recall — response or null, never throws.
const res = await recallSilent({ query: "worktree", k: 5, agent: "crew:builder" });
```

Contracts:

- **Never throws.** Every failure — plugin absent, daemon down, wire drift —
  resolves `false` / `null`.
- **Wallclock-capped.** Resolution + call share one envelope
  (`DEFAULT_CAP_MS` = 2000; override per call via `{ capMs }`).
- **Cached.** First successful resolution is cached for the process lifetime.
- **Test seams.** `_setWireProvider(fake | null)` and `_resetResolveCache()`.
- **No CLI shelling.** The `astramem` binary is only used to *locate* the
  installed plugin root — capture/recall never spawn it (dev-team#172).

`@astragenie/astramem-plugin` is an **optional** peer: consumers that carry it
get dep-mode resolution; consumers without it (e.g. CI) degrade cleanly.

Keep this package import-cheap — it sits on hot ceremony paths in consumers
(see runner-plugin#360 for what a cold multi-second import does there).
