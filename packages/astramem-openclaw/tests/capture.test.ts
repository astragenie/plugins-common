import { afterEach, describe, expect, test } from "bun:test";
import { captureTurn } from "../src/capture.ts";
import { jsonResponse, mockFetch, mockFetchReject, testConfigBase } from "./test-utils.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("captureTurn", () => {
  test("posts a canonical v1.0 envelope mapped from an agent_end event", async () => {
    const calls = mockFetch(() =>
      jsonResponse({
        ok: true,
        summary_memory_id: "m1",
        session_id: "sess-1",
        idempotent: false,
      }),
    );

    const event = {
      sessionId: "sess-1",
      agentId: "agent-1",
      channelId: "chan-1",
      messages: [
        { role: "user", text: "remember X" },
        { role: "assistant", text: "noted X" },
      ],
    };

    await captureTurn(testConfigBase, event, event);

    expect(calls).toHaveLength(1);
    const req = calls[0];
    expect(req?.url).toBe("http://127.0.0.1:7777/ingest/transcript");
    expect(req?.method).toBe("POST");
    expect(req?.headers.get("Authorization")).toBe("Bearer test-bearer");
    const body = req?.body as Record<string, unknown>;
    expect(body.event).toBe("session_end");
    expect(body.session_id).toBe("sess-1");
    expect(body.project_id).toBe("openclaw:chan-1");
    expect(body.agent_type).toBe("openclaw:agent-1");
    expect(body.wire_version).toBe("v1.0");
    expect(body.turns).toEqual([
      { role: "user", text: "remember X" },
      { role: "assistant", text: "noted X" },
    ]);
  });

  test("skips the daemon call entirely when no turn text is extractable", async () => {
    const calls = mockFetch(() => jsonResponse({ ok: true }));
    await captureTurn(testConfigBase, { nothingUseful: true }, {});
    expect(calls).toHaveLength(0);
  });

  test("is a no-op when captureEnabled is false", async () => {
    const calls = mockFetch(() => jsonResponse({ ok: true }));
    await captureTurn(
      { ...testConfigBase, captureEnabled: false },
      { userMessage: "hi", assistantReply: "hello" },
      {},
    );
    expect(calls).toHaveLength(0);
  });

  test("swallows a daemon network failure without throwing", async () => {
    mockFetchReject(new Error("ECONNREFUSED"));
    await expect(
      captureTurn(testConfigBase, { userMessage: "hi", assistantReply: "hello" }, {}),
    ).resolves.toBeUndefined();
  });

  test("swallows a daemon 500 without throwing", async () => {
    mockFetch(() => jsonResponse({ error: "boom" }, 500));
    await expect(
      captureTurn(testConfigBase, { userMessage: "hi", assistantReply: "hello" }, {}),
    ).resolves.toBeUndefined();
  });
});
