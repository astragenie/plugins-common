import { afterEach, describe, expect, test } from "bun:test";
import { PLUGIN_ID, createAstramemOpenClawPlugin } from "../src/index.ts";
import type {
  CommandDefinition,
  HookRegistrationOptions,
  OpenClawPluginApi,
} from "../src/plugin-api-types.ts";
import { jsonResponse, mockFetch, mockFetchReject } from "./test-utils.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function fakeApi(pluginConfig?: Record<string, unknown>): {
  api: OpenClawPluginApi;
  hooks: Map<
    string,
    { handler: (event: unknown) => unknown; opts?: HookRegistrationOptions | undefined }
  >;
  commands: Map<string, CommandDefinition>;
} {
  const hooks = new Map<
    string,
    { handler: (event: unknown) => unknown; opts?: HookRegistrationOptions | undefined }
  >();
  const commands = new Map<string, CommandDefinition>();
  const api: OpenClawPluginApi = {
    on: (name, handler, opts) => {
      hooks.set(name, { handler, opts });
    },
    registerCommand: (def) => {
      commands.set(def.name, def);
    },
    pluginConfig,
  };
  return { api, hooks, commands };
}

describe("createAstramemOpenClawPlugin", () => {
  test("has the expected id/name and registers both hooks + all three commands", () => {
    const plugin = createAstramemOpenClawPlugin();
    expect(plugin.id).toBe(PLUGIN_ID);
    expect(plugin.name).toBeTruthy();

    const { api, hooks, commands } = fakeApi();
    plugin.register(api);

    expect(hooks.has("before_prompt_build")).toBe(true);
    expect(hooks.has("agent_end")).toBe(true);
    expect([...commands.keys()].sort()).toEqual(["forget", "recall", "remember"]);
  });

  test("before_prompt_build hook returns a joined prependContext from recall + profile", async () => {
    mockFetch((req) => {
      if (req.url.endsWith("/recall")) {
        return jsonResponse({
          hits: [{ id: "1", type: "fact", text: "recalled fact", score: 0.5 }],
        });
      }
      if (req.url.includes("/agents/")) {
        return jsonResponse({
          agent: "openclaw:agent-1",
          counts: {},
          total: 1,
          first_seen: null,
          last_active: null,
          top_lessons: [
            { id: "l1", text: "profile lesson", importance: 0.5, usefulness: 0.5, created_at: 1 },
          ],
          recent_decisions: [],
          corrections: [],
        });
      }
      return jsonResponse({}, 404);
    });

    const plugin = createAstramemOpenClawPlugin();
    const { api, hooks } = fakeApi({ profileEveryNTurns: 1 });
    plugin.register(api);

    const result = (await hooks.get("before_prompt_build")?.handler({
      prompt: "what did we decide",
      agentId: "agent-1",
      sessionKey: "sess-1",
    })) as { prependContext?: string };

    expect(result.prependContext).toContain("recalled fact");
    expect(result.prependContext).toContain("profile lesson");
  });

  test("agent_end hook captures without throwing even when the daemon is unreachable", async () => {
    mockFetchReject(new Error("ECONNREFUSED"));

    const plugin = createAstramemOpenClawPlugin();
    const { api, hooks } = fakeApi();
    plugin.register(api);

    await expect(
      hooks.get("agent_end")?.handler({ userMessage: "hi", assistantReply: "hello" }),
    ).resolves.toBeUndefined();
  });

  test("registered commands are wired to the config resolved at register() time", async () => {
    mockFetch(() => jsonResponse({ id: "mem-1", ok: true }));
    const plugin = createAstramemOpenClawPlugin();
    const { api, commands } = fakeApi({ baseUrl: "http://127.0.0.1:9999" });
    plugin.register(api);

    const result = await commands.get("remember")?.handler({ args: "remember this" });
    expect(result?.text).toContain("mem-1");
  });
});
