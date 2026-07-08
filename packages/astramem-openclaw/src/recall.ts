// Before-turn auto-recall. Wired to the `before_prompt_build` hook (see
// index.ts) — "add dynamic context or system prompt" per docs.openclaw.ai/
// plugins/hooks, which returns `{ prependContext?, appendContext?, ... }`.
// Fail-silent throughout: an unreachable daemon must not block or alter the
// model call.

import { scopeAgent, scopeProjectId } from "./capture.ts";
import type { AstramemOpenClawConfig } from "./config.ts";
import { createDaemonClient } from "./daemon.ts";
import type { HookContext } from "./plugin-api-types.ts";

export interface PromptBuildEvent extends HookContext {
  prompt?: string | undefined;
}

export interface PromptBuildResult {
  prependContext?: string | undefined;
}

function formatHits(hits: Array<{ type: string; text: string }>): string {
  const lines = hits.map((h) => `- [${h.type}] ${h.text}`);
  return ["Relevant memories from astramem:", ...lines].join("\n");
}

export async function recallForPrompt(
  config: AstramemOpenClawConfig,
  event: PromptBuildEvent,
): Promise<PromptBuildResult> {
  if (!config.recallEnabled) return {};
  const query = event.prompt?.trim();
  if (!query) return {};

  try {
    const client = createDaemonClient(config);
    const { hits } = await client.recall({
      query,
      k: config.recallK,
      filters: { agent: scopeAgent(event), project: scopeProjectId(config, event) },
    });
    if (hits.length === 0) return {};
    return { prependContext: formatHits(hits) };
  } catch {
    return {};
  }
}
