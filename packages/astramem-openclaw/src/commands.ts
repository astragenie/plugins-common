// /remember /recall /forget slash commands. Registered via
// `api.registerCommand()` per docs.openclaw.ai/plugins/sdk-overview
// ("Commands register via api.registerCommand(def), which bypasses LLM
// routing... Plugin commands can return { continueAgent: true } or
// { suppressReply: true }") and the concrete field names confirmed from
// openclaw/openclaw's docs/tools/slash-commands.md (name, description,
// acceptsArgs, requireAuth, handler(ctx) => { text }).
//
// Fail-visible by design (unlike capture/recall/profile): a command is an
// explicit user action, so daemon failures are reported back as command
// output instead of being swallowed.

import { scopeAgent, scopeProjectId } from "./capture.ts";
import type { AstramemOpenClawConfig } from "./config.ts";
import { createDaemonClient } from "./daemon.ts";
import type { CommandContext, CommandResult } from "./plugin-api-types.ts";

function errorText(prefix: string, err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return `${prefix}: ${message}`;
}

export async function handleRemember(
  config: AstramemOpenClawConfig,
  ctx: CommandContext,
): Promise<CommandResult> {
  const text = (ctx.args ?? "").trim();
  if (!text) return { text: "Usage: /remember <text to remember>" };

  const client = createDaemonClient(config);
  try {
    const { id } = await client.remember({
      text,
      type: "note",
      agent: scopeAgent(ctx),
      project: scopeProjectId(config, ctx),
    });
    return { text: `Remembered (id: ${id}).` };
  } catch (err) {
    return { text: errorText("astramem: /remember failed", err) };
  }
}

export async function handleRecall(
  config: AstramemOpenClawConfig,
  ctx: CommandContext,
): Promise<CommandResult> {
  const query = (ctx.args ?? "").trim();
  if (!query) return { text: "Usage: /recall <search query>" };

  const client = createDaemonClient(config);
  try {
    const { hits } = await client.recall({
      query,
      k: config.recallK,
      filters: { agent: scopeAgent(ctx), project: scopeProjectId(config, ctx) },
    });
    if (hits.length === 0) return { text: "No memories found." };
    const lines = hits.map((h) => `- [${h.type}] ${h.text} (score ${h.score.toFixed(2)})`);
    return { text: lines.join("\n") };
  } catch (err) {
    return { text: errorText("astramem: /recall failed", err) };
  }
}

/**
 * `/forget <id> [reason]` invalidates (soft-delete, provenance kept) by
 * default. `/forget --hard <id> [reason]` erases permanently. Invalidate is
 * the default because provenance retention is this plugin's differentiator
 * from a cloud memory that just deletes on request.
 */
export async function handleForget(
  config: AstramemOpenClawConfig,
  ctx: CommandContext,
): Promise<CommandResult> {
  const raw = (ctx.args ?? "").trim();
  if (!raw) {
    return {
      text: "Usage: /forget <memory-id> [reason]  (or: /forget --hard <memory-id> [reason] to erase permanently)",
    };
  }

  const parts = raw.split(/\s+/);
  const client = createDaemonClient(config);
  try {
    if (parts[0] === "--hard") {
      const id = parts[1];
      if (!id) return { text: "Usage: /forget --hard <memory-id> [reason]" };
      const reason = parts.slice(2).join(" ") || undefined;
      await client.erase(id, reason);
      return { text: `Erased memory ${id} permanently.` };
    }
    const id = parts[0];
    if (!id) return { text: "Usage: /forget <memory-id> [reason]" };
    const reason = parts.slice(1).join(" ") || undefined;
    await client.invalidate(id, reason);
    return { text: `Invalidated memory ${id}. (Use "/forget --hard ${id}" to erase permanently.)` };
  } catch (err) {
    return { text: errorText("astramem: /forget failed", err) };
  }
}
