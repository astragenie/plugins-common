// @astragenie/astramem-openclaw — OpenClaw plugin entry point.
//
// Shape matches the documented `definePluginEntry({ id, name, description,
// register(api) {...} })` pattern (docs.openclaw.ai/plugins/building-plugins)
// structurally (see plugin-api-types.ts for why we don't import the real
// helper). `createAstramemOpenClawPlugin()` is exported separately from the
// default export so tests can construct a fresh instance and register it
// against a mock `api` without touching module-level state.

import { captureTurn } from "./capture.ts";
import { handleForget, handleRecall, handleRemember } from "./commands.ts";
import { resolveConfig } from "./config.ts";
import type {
  HookContext,
  OpenClawPluginApi,
  OpenClawPluginDefinition,
} from "./plugin-api-types.ts";
import { maybeProfileBlock } from "./profile.ts";
import { recallForPrompt } from "./recall.ts";

export const PLUGIN_ID = "astramem";

export function createAstramemOpenClawPlugin(): OpenClawPluginDefinition {
  return {
    id: PLUGIN_ID,
    name: "Astramem (local memory)",
    description:
      "Local-first, encrypted memory for OpenClaw agents — auto-capture, auto-recall, and agent-profile injection backed by the astramem-local daemon. No cloud, no subscription.",
    register(api: OpenClawPluginApi) {
      // Read once at registration time, not per-hook-call — see config.ts.
      const config = resolveConfig(api.pluginConfig);

      api.on(
        "before_prompt_build",
        async (event: unknown) => {
          const ctx = (event ?? {}) as HookContext & { prompt?: string };
          const [recall, profile] = await Promise.all([
            recallForPrompt(config, ctx),
            maybeProfileBlock(config, ctx),
          ]);
          const blocks = [recall.prependContext, profile].filter((block): block is string =>
            Boolean(block),
          );
          return blocks.length > 0 ? { prependContext: blocks.join("\n\n") } : {};
        },
        { priority: 10 },
      );

      api.on(
        "agent_end",
        async (event: unknown) => {
          const ctx = (event ?? {}) as HookContext;
          await captureTurn(config, event, ctx);
        },
        { priority: 10 },
      );

      api.registerCommand({
        name: "remember",
        description: "Save a note to astramem's local memory.",
        acceptsArgs: true,
        handler: (ctx) => handleRemember(config, ctx),
      });

      api.registerCommand({
        name: "recall",
        description: "Search astramem's local memory.",
        acceptsArgs: true,
        handler: (ctx) => handleRecall(config, ctx),
      });

      api.registerCommand({
        name: "forget",
        description: "Invalidate (or --hard erase) a memory by id.",
        acceptsArgs: true,
        handler: (ctx) => handleForget(config, ctx),
      });
    },
  };
}

export default createAstramemOpenClawPlugin();

export type { AstramemOpenClawConfig, RawPluginConfig } from "./config.ts";
export type {
  CommandContext,
  CommandDefinition,
  CommandResult,
  HookContext,
  OpenClawPluginApi,
  OpenClawPluginDefinition,
} from "./plugin-api-types.ts";
