// After-turn auto-capture. Wired to the `agent_end` hook (see index.ts) —
// "observe final messages and run outcome" per docs.openclaw.ai/plugins/
// hooks. Fail-silent throughout: a daemon that is down, slow, or rejecting
// must never affect the user-visible OpenClaw turn.

import type { DaemonCanonicalIngestEnvelope } from "@astragenie/astramem-client";
import type { AstramemOpenClawConfig } from "./config.ts";
import { createDaemonClient } from "./daemon.ts";
import type { HookContext } from "./plugin-api-types.ts";
import { extractTurnText } from "./turn-adapter.ts";

const CLIENT_VERSION = "astramem-openclaw/0.1.0";

export function scopeProjectId(config: AstramemOpenClawConfig, ctx: HookContext): string {
  return config.projectId ?? `openclaw:${ctx.channelId ?? ctx.channel ?? "default"}`;
}

export function scopeAgent(ctx: HookContext): string {
  return `openclaw:${ctx.agentId ?? "default"}`;
}

/**
 * Fail-silent after-turn capture: extracts the turn's text (best-effort —
 * see turn-adapter.ts), builds a canonical v1.0 ingest envelope, and POSTs
 * it to the daemon. Resolves (never rejects) whether or not capture
 * actually happened.
 *
 * Event-vocabulary note: the daemon's `event` field is a closed enum
 * (`pre_compact` | `session_end` | `subagent_stop` — astramemory-local
 * src/server/routes/ingest.ts:68) inherited from its original Claude Code
 * integration; OpenClaw has no equivalent per-turn lifecycle concept. Every
 * OpenClaw turn is mapped to `session_end` as the closest fit ("this
 * transcript slice is complete, distill it now") — not a claim that
 * OpenClaw's turn model matches Claude Code's.
 */
export async function captureTurn(
  config: AstramemOpenClawConfig,
  event: unknown,
  ctx: HookContext,
): Promise<void> {
  if (!config.captureEnabled) return;
  const extracted = extractTurnText(event);
  if (extracted.length === 0) return;

  const envelope: DaemonCanonicalIngestEnvelope = {
    event: "session_end",
    session_id: ctx.sessionId ?? ctx.sessionKey ?? ctx.runId ?? "unknown-session",
    project_id: scopeProjectId(config, ctx),
    agent_type: scopeAgent(ctx),
    captured_at: new Date().toISOString(),
    turns: extracted.map((t) => ({ role: t.role, text: t.text })),
    tool: "openclaw",
    client_scrub_applied: false,
    client_scrub_hits: 0,
    client_version: CLIENT_VERSION,
    client_scrub_version: "none",
    wire_version: "v1.0",
  };

  try {
    const client = createDaemonClient(config);
    await client.ingestTranscript(envelope);
  } catch {
    // Fail-silent by design — capture must never break a turn.
  }
}
