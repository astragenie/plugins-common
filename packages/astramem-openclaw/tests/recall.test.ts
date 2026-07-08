import { afterEach, describe, expect, test } from "bun:test";
import { recallForPrompt } from "../src/recall.ts";
import { jsonResponse, mockFetch, mockFetchReject, testConfigBase } from "./test-utils.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("recallForPrompt", () => {
  test("returns formatted prependContext for non-empty hits", async () => {
    const calls = mockFetch(() =>
      jsonResponse({
        hits: [
          { id: "1", type: "lesson", text: "prefer bun", score: 0.9, source: "vec" },
          { id: "2", type: "decision", text: "use fastify", score: 0.8, source: "fts" },
        ],
      }),
    );

    const result = await recallForPrompt(testConfigBase, {
      prompt: "what build tool do we use",
      agentId: "agent-1",
      channelId: "chan-1",
    });

    expect(calls).toHaveLength(1);
    const req = calls[0];
    expect(req?.url).toBe("http://127.0.0.1:7777/recall");
    const body = req?.body as Record<string, unknown>;
    expect(body.query).toBe("what build tool do we use");
    expect(body.k).toBe(5);
    expect((body.filters as Record<string, unknown>).agent).toBe("openclaw:agent-1");
    expect((body.filters as Record<string, unknown>).project).toBe("openclaw:chan-1");

    expect(result.prependContext).toContain("prefer bun");
    expect(result.prependContext).toContain("use fastify");
  });

  test("returns {} when there are no hits", async () => {
    mockFetch(() => jsonResponse({ hits: [] }));
    const result = await recallForPrompt(testConfigBase, { prompt: "anything" });
    expect(result).toEqual({});
  });

  test("returns {} for an empty/missing prompt without calling the daemon", async () => {
    const calls = mockFetch(() => jsonResponse({ hits: [] }));
    expect(await recallForPrompt(testConfigBase, { prompt: "" })).toEqual({});
    expect(await recallForPrompt(testConfigBase, {})).toEqual({});
    expect(calls).toHaveLength(0);
  });

  test("returns {} when recallEnabled is false", async () => {
    const calls = mockFetch(() => jsonResponse({ hits: [] }));
    const result = await recallForPrompt(
      { ...testConfigBase, recallEnabled: false },
      { prompt: "hi" },
    );
    expect(result).toEqual({});
    expect(calls).toHaveLength(0);
  });

  test("swallows a daemon failure and returns {}", async () => {
    mockFetchReject(new Error("ECONNREFUSED"));
    const result = await recallForPrompt(testConfigBase, { prompt: "hi" });
    expect(result).toEqual({});
  });
});
