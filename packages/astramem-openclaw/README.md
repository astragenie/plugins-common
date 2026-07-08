# @astragenie/astramem-openclaw

An [OpenClaw](https://docs.openclaw.ai) plugin for [astramem](https://github.com/astragenie/astramem-plugin) —
local-first, encrypted, provenance-tracked memory backed by the
[astramem-local](https://github.com/astragenie/astramemory-local) daemon.

**Privacy statement:** by default this plugin talks only to
`http://127.0.0.1:7777` — a daemon that runs on your own machine, encrypts its
SQLite store, and is not reachable from the network unless you expose it
yourself. Nothing is sent to any Astragenie or third-party server. This is
the local-first counterpart to cloud memory plugins (e.g.
`@supermemory/openclaw-supermemory`, which requires a paid Supermemory Pro
account and sends conversation content to Supermemory's cloud).

## What it does

| Capability | Mechanism |
|---|---|
| Auto-capture after every turn | `agent_end` hook → `POST /ingest/transcript` (canonical v1.0 envelope) |
| Auto-recall before every turn | `before_prompt_build` hook → `POST /recall`, injected as `prependContext` |
| Periodic agent-profile injection | every `profileEveryNTurns` turns (default 50) → `GET /agents/:agent/profile`, injected alongside recall |
| `/remember <text>` | `POST /remember` |
| `/recall <query>` | `POST /recall`, formatted as command output |
| `/forget <id> [reason]` | `POST /memory/:id/invalidate` (soft-delete, keeps provenance) |
| `/forget --hard <id> [reason]` | `DELETE /memory/:id` (permanent erase) |

Capture, recall, and profile injection are **fail-silent**: if the daemon is
down, slow, or rejects a request, the turn proceeds unaffected and nothing is
surfaced to the user. Commands are **fail-visible**: a daemon error is
reported back as command output, since the user explicitly asked for that
action.

## Install / config

```
openclaw plugins install @astragenie/astramem-openclaw
```

Config (plugin config in `~/.openclaw/openclaw.json` under
`plugins.entries.astramem.config`, or env vars — plugin config wins):

| Key | Env var | Default |
|---|---|---|
| `baseUrl` | `ASTRAMEM_BASE_URL` | `http://127.0.0.1:7777` |
| `bearer` | `ASTRAMEM_BEARER` | *(none — only needed if the daemon enforces auth)* |
| `projectId` | `ASTRAMEM_PROJECT_ID` | derived from the OpenClaw channel |
| `profileEveryNTurns` | — | `50` |
| `captureEnabled` | — | `true` |
| `recallEnabled` | — | `true` |
| `recallK` | — | `5` |

Because `agent_end` capture reads conversation content, the docs describe an
operator opt-in requirement for non-bundled plugins. Add this to your own
`openclaw.json` (not shipped in this plugin's manifest — see "Verified vs
assumed" below for why):

```json
{
  "plugins": {
    "entries": {
      "astramem": {
        "hooks": { "allowConversationAccess": true }
      }
    }
  }
}
```

## Verified vs. assumed (read this before relying on capture)

This package was built primarily from `docs.openclaw.ai` (fetched
2026-07-08), not from a compiled dependency on OpenClaw's actual plugin SDK
(the SDK is "typed contracts accessed through scoped subpaths of
`openclaw/plugin-sdk/*`", not one importable package — there is nothing to
`bun install` and compile against from this monorepo). Confidence by piece:

**Verified against public docs (cited):**
- Plugin entry shape — `definePluginEntry({ id, name, description,
  register(api) {...} })` from `openclaw/plugin-sdk/plugin-entry`
  ([Building plugins](https://docs.openclaw.ai/plugins/building-plugins)).
- Hook registration — `api.on(name, handler, opts?)` with `priority` /
  `timeoutMs`, and the existence + one-line purpose of `before_prompt_build`
  (returns `{ prependContext?, appendContext?, systemPrompt?, ... }`) and
  `agent_end` ("observe final messages and run outcome")
  ([Plugin hooks](https://docs.openclaw.ai/plugins/hooks)).
- `allowConversationAccess` / `allowPromptInjection` / per-hook `timeoutMs`
  as *operator*-side config under `plugins.entries.<id>.hooks.*`, not plugin
  manifest content ([Plugin hooks](https://docs.openclaw.ai/plugins/hooks)).
- Manifest (`openclaw.plugin.json`) schema — `id`, `configSchema`,
  `activation`, and that it's discovery/validation metadata only, never
  runtime behavior ([Plugin manifest](https://docs.openclaw.ai/plugins/manifest)).
- `api.registerCommand(def)` bypasses LLM routing; handlers may return
  `{ continueAgent: true }` / `{ suppressReply: true }`
  ([Plugin SDK overview](https://docs.openclaw.ai/plugins/sdk-overview)).
  Concrete field names (`name`, `description`, `acceptsArgs`, `requireAuth`,
  `handler(ctx) => { text }`, and `ctx.{senderId,channel,isAuthorizedSender,
  args,commandBody,config}`) confirmed via
  [openclaw/openclaw `docs/tools/slash-commands.md`](https://github.com/openclaw/openclaw/blob/main/docs/tools/slash-commands.md).

**Assumed / best-effort (marked in source):**
- The exact field(s) on the `agent_end` event carrying the completed turn's
  message content. Public docs confirm the *hook* exists and that reading
  raw conversation content from it requires `allowConversationAccess`, but
  do not publish a field-level payload type at time of writing. `src/
  turn-adapter.ts` sniffs several plausible shapes (`messages[]` with
  `role`/`text` or `role`/`content`, `finalMessages[]`, or flat
  `userMessage`/`assistantReply`-style fields) and **skips capture silently**
  (returns `[]`) if none match, rather than guessing wrong and shipping bad
  data. If you confirm the real shape, replace that file's sniffing with a
  direct field read.
- `GET /agents/:agent/profile` — this is a **real, verified** astramem-local
  daemon route (`astramemory-local/src/server/routes/agents.ts`), but
  `@astragenie/astramem-client` (0.2.0) does not wrap it yet, so `src/
  daemon.ts`'s `fetchAgentProfile` calls it directly with the same
  `baseUrl`/`bearer` convention as the rest of the client. Follow-up:
  upstream an `agentProfile()` method to `astramem-client` and delete that
  function.
- The daemon's `event` field on `POST /ingest/transcript` is a closed enum —
  `pre_compact | session_end | subagent_stop`
  (`astramemory-local/src/server/routes/ingest.ts:68`) — inherited from its
  original Claude Code integration. OpenClaw has no equivalent per-turn
  lifecycle concept, so every OpenClaw turn capture is mapped to
  `session_end` (closest fit: "this transcript slice is complete, distill it
  now"). This is a deliberate compatibility choice, not a claim that
  OpenClaw's turn model matches Claude Code's.
- Whether OpenClaw's real plugin object needs to satisfy more than the
  `{ id, name, description, register(api) }` shape used here (loader
  duck-types the returned object at runtime, per
  [Plugin internals](https://docs.openclaw.ai/plugins/architecture); local
  types live in `src/plugin-api-types.ts`, not imported from `openclaw`).

None of the above found evidence that OpenClaw's plugin surface is
MCP-only or otherwise fundamentally different from what's implemented here —
the native hook/command/manifest model described above is current as of the
cited fetch date.

## Package layout

- `src/index.ts` — plugin entry (`register(api)` wiring)
- `src/config.ts` — config resolution (plugin config → env → default)
- `src/daemon.ts` — `AstramemDaemonClient` factory + `fetchAgentProfile`
- `src/capture.ts` — after-turn capture (`agent_end`)
- `src/recall.ts` — before-turn recall (`before_prompt_build`)
- `src/profile.ts` — every-N-turns profile injection
- `src/commands.ts` — `/remember` `/recall` `/forget`
- `src/turn-adapter.ts` — best-effort turn-text extraction (see above)
- `src/turn-counter.ts` — in-memory per-session turn counter
- `src/plugin-api-types.ts` — local structural types for the OpenClaw plugin
  API surface this package uses

## Testing

```
bun test
```

All daemon interaction is covered via mocked `fetch` (same convention as
`@astragenie/astramem-client`'s own tests) — no live daemon or live OpenClaw
gateway required.
