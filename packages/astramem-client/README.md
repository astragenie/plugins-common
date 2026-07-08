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

## AstramemDaemonClient — direct daemon HTTP client

A second, unrelated export: a typed client that talks to the astramem-local
daemon's REST surface directly, given an explicit `baseUrl` + `bearer` (no
provider resolution, no fail-silent swallowing — every failure throws a typed
`DaemonError`). Use this when the caller already knows which daemon to talk to
(e.g. a plugin provider implementation) rather than needing the
resolve/probe chain above.

Hand-written from `astramemory-local`'s route handlers
(`src/server/routes/*.ts`) — **not** imported from that repo, so this package
has no build-time dependency on the daemon. Follow-up: adopt
`@astragenie/astramem-contracts` once it ships published types for these
shapes; until then, drift surfaces as a rejected call, not a silent mismatch.

```ts
import { AstramemDaemonClient, DaemonError } from "@astragenie/astramem-client";

const client = new AstramemDaemonClient({
  baseUrl: "http://127.0.0.1:7777",
  bearer: process.env.MEMORY_BEARER,
  timeoutMs: 5000, // optional, default 5000
});

const health = await client.health();

// Canonical v1.0 ingest envelope, with idempotency support.
await client.ingestTranscript(envelope, { idempotencyKey: "sha256-of-body" });

const { hits } = await client.recall({ query: "worktree", k: 5, filters: { agent: "crew:builder" } });
const { hits: searchHits } = await client.search({ q: "worktree", repo: "plugins-common", limit: 10 });
const { id } = await client.remember({ text: "prefer bun over npm here", type: "preference" });

// Lifecycle
await client.invalidate(id, "superseded by newer note");
await client.supersede(oldId, newId);
await client.promote(id, "team");
await client.restore(id);
await client.markUsed(id);
const { history } = await client.history(id);
await client.erase(id, "user requested erasure");

// Provenance
const digest = await client.sessionDigest(sessionId);
const receipt = await client.whyMemory(id);

// Consolidation
const summary = await client.runConsolidation({ merge_threshold: 0.92 });
const { proposals } = await client.listConsolidationProposals("pending");
await client.acceptProposal(proposals[0].id);
await client.rejectProposal(proposals[1].id);

try {
  await client.recall({ query: "" });
} catch (err) {
  if (err instanceof DaemonError && err.isDeterministic) {
    // 4xx — the request itself was rejected; retrying unchanged won't help.
  }
}
```

Error model (mirrors `astramem-plugin`'s `src/providers/local.ts` bands):

- **4xx** → `DaemonError` with `band: "deterministic"` (`isDeterministic`) — do not retry.
- **5xx / network / timeout** → `DaemonError` with `band: "transient"` (`isTransient"`) — safe to retry.
- **No retries by default.** `ingestTranscript` retries once on a transient
  failure when the client is constructed with `retryIngestOnTransient: true`.
  No other method retries.

Every exported type from `daemon-types.ts` that would otherwise collide with
the structural `WireProvider` mirrors above (`HealthResponse`,
`RecallRequest`, `RecallHit`, `RecallResponse`) is re-exported under a
`Daemon`-prefixed alias (`DaemonHealthResponse`, `DaemonRecallRequest`, ...)
— the two type families describe different things (a minimal fail-silent
surface vs. the daemon's actual wire shapes) and are not interchangeable.
