import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { maybeProfileBlock } from "../src/profile.ts";
import { _resetTurnCounters } from "../src/turn-counter.ts";
import { jsonResponse, mockFetch, mockFetchReject, testConfigBase } from "./test-utils.ts";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  _resetTurnCounters();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("maybeProfileBlock", () => {
  test("does not call the daemon before the Nth turn", async () => {
    const calls = mockFetch(() => jsonResponse({ agent: "openclaw:agent-1" }));
    const config = { ...testConfigBase, profileEveryNTurns: 3 };
    const ctx = { sessionKey: "sess-1", agentId: "agent-1" };

    expect(await maybeProfileBlock(config, ctx)).toBeUndefined();
    expect(await maybeProfileBlock(config, ctx)).toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  test("fetches and formats the profile on the Nth turn", async () => {
    const calls = mockFetch(() =>
      jsonResponse({
        agent: "openclaw:agent-1",
        counts: { lesson: 2 },
        total: 2,
        first_seen: 1,
        last_active: 2,
        top_lessons: [
          { id: "l1", text: "prefer bun", importance: 0.5, usefulness: 0.8, created_at: 1 },
        ],
        recent_decisions: [{ id: "d1", text: "use fastify", importance: 0.5, created_at: 1 }],
        corrections: [],
      }),
    );
    const config = { ...testConfigBase, profileEveryNTurns: 2 };
    const ctx = { sessionKey: "sess-1", agentId: "agent-1" };

    expect(await maybeProfileBlock(config, ctx)).toBeUndefined();
    const block = await maybeProfileBlock(config, ctx);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("http://127.0.0.1:7777/agents/openclaw%3Aagent-1/profile");
    expect(block).toContain("prefer bun");
    expect(block).toContain("use fastify");
  });

  test("returns undefined when the daemon reports the agent has no profile (404)", async () => {
    mockFetch(() => jsonResponse({ error: "not found" }, 404));
    const config = { ...testConfigBase, profileEveryNTurns: 1 };
    expect(await maybeProfileBlock(config, { sessionKey: "sess-1" })).toBeUndefined();
  });

  test("swallows a daemon failure on the Nth turn without throwing", async () => {
    mockFetchReject(new Error("ECONNREFUSED"));
    const config = { ...testConfigBase, profileEveryNTurns: 1 };
    await expect(maybeProfileBlock(config, { sessionKey: "sess-1" })).resolves.toBeUndefined();
  });
});
