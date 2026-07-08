// Periodic agent-profile injection. Piggybacks on the same
// `before_prompt_build` hook as recall.ts (see index.ts): each call counts
// as one turn, and every `config.profileEveryNTurns` turns for a session we
// fetch GET /agents/:agent/profile and return an extra context block.
//
// This is a deliberate simplification versus a literal "capture at turn N,
// inject on turn N+1" split: doing both the count and the fetch inside
// before_prompt_build avoids depending on OpenClaw's cross-turn injection
// API (`api.session.workflow.enqueueNextTurnInjection`, per
// docs.openclaw.ai/plugins/hooks) whose exact contract this plugin hasn't
// exercised against a live gateway. Net effect for the user is the same:
// roughly every 50th turn carries a profile block.

import { scopeAgent } from "./capture.ts";
import type { AstramemOpenClawConfig } from "./config.ts";
import { type AgentProfileResponse, fetchAgentProfile } from "./daemon.ts";
import type { HookContext } from "./plugin-api-types.ts";
import { bumpAndCheck } from "./turn-counter.ts";

function formatProfile(agent: string, profile: AgentProfileResponse): string {
  const lessons = profile.top_lessons.slice(0, 5).map((l) => `- ${l.text}`);
  const decisions = profile.recent_decisions.slice(0, 3).map((d) => `- ${d.text}`);
  const parts = [`astramem profile for ${agent} (${profile.total} active memories):`];
  if (lessons.length > 0) parts.push("Top lessons:", ...lessons);
  if (decisions.length > 0) parts.push("Recent decisions:", ...decisions);
  return parts.join("\n");
}

/**
 * Fail-silent. Bumps the per-session turn counter and, only on every Nth
 * turn, fetches and formats the agent's profile. Resolves `undefined` on
 * every other turn without making a daemon call.
 */
export async function maybeProfileBlock(
  config: AstramemOpenClawConfig,
  ctx: HookContext,
): Promise<string | undefined> {
  const sessionKey = ctx.sessionKey ?? ctx.sessionId ?? ctx.runId ?? "unknown-session";
  const due = bumpAndCheck(sessionKey, config.profileEveryNTurns);
  if (!due) return undefined;

  const agent = scopeAgent(ctx);
  try {
    const profile = await fetchAgentProfile(config, agent);
    return profile ? formatProfile(agent, profile) : undefined;
  } catch {
    return undefined;
  }
}
