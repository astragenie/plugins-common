import { afterEach, describe, expect, test } from "bun:test";
import { handleForget, handleRecall, handleRemember } from "../src/commands.ts";
import { jsonResponse, mockFetch, mockFetchReject, testConfigBase } from "./test-utils.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const ctx = { agentId: "agent-1", channel: "chan-1", args: "" };

describe("/remember", () => {
  test("stores a note and reports the id", async () => {
    const calls = mockFetch(() => jsonResponse({ id: "mem-1", ok: true }));
    const result = await handleRemember(testConfigBase, { ...ctx, args: "the sky is blue" });
    expect(calls[0]?.url).toBe("http://127.0.0.1:7777/remember");
    expect(result.text).toContain("mem-1");
  });

  test("reports usage when args are empty", async () => {
    const result = await handleRemember(testConfigBase, { ...ctx, args: "  " });
    expect(result.text).toContain("Usage");
  });

  test("is fail-visible on daemon failure", async () => {
    mockFetchReject(new Error("ECONNREFUSED"));
    const result = await handleRemember(testConfigBase, { ...ctx, args: "hello" });
    expect(result.text).toContain("astramem: /remember failed");
    expect(result.text).toContain("ECONNREFUSED");
  });
});

describe("/recall", () => {
  test("formats hits", async () => {
    mockFetch(() =>
      jsonResponse({
        hits: [{ id: "1", type: "fact", text: "we use bun", score: 0.75, source: "vec" }],
      }),
    );
    const result = await handleRecall(testConfigBase, { ...ctx, args: "bun" });
    expect(result.text).toContain("we use bun");
  });

  test("reports no memories found", async () => {
    mockFetch(() => jsonResponse({ hits: [] }));
    const result = await handleRecall(testConfigBase, { ...ctx, args: "nothing" });
    expect(result.text).toBe("No memories found.");
  });

  test("reports usage when args are empty", async () => {
    const result = await handleRecall(testConfigBase, { ...ctx, args: "" });
    expect(result.text).toContain("Usage");
  });
});

describe("/forget", () => {
  test("invalidates by default", async () => {
    const calls = mockFetch(() => jsonResponse({ ok: true }));
    const result = await handleForget(testConfigBase, { ...ctx, args: "mem-1 no longer true" });
    expect(calls[0]?.url).toBe("http://127.0.0.1:7777/memory/mem-1/invalidate");
    expect((calls[0]?.body as Record<string, unknown>).reason).toBe("no longer true");
    expect(result.text).toContain("Invalidated");
  });

  test("erases permanently with --hard", async () => {
    const calls = mockFetch(() => jsonResponse({ ok: true }));
    const result = await handleForget(testConfigBase, {
      ...ctx,
      args: "--hard mem-1 gdpr request",
    });
    expect(calls[0]?.method).toBe("DELETE");
    expect(calls[0]?.url).toBe("http://127.0.0.1:7777/memory/mem-1");
    expect(result.text).toContain("Erased memory mem-1 permanently");
  });

  test("reports usage when args are empty", async () => {
    const result = await handleForget(testConfigBase, { ...ctx, args: "" });
    expect(result.text).toContain("Usage");
  });

  test("is fail-visible on daemon failure", async () => {
    mockFetchReject(new Error("ECONNREFUSED"));
    const result = await handleForget(testConfigBase, { ...ctx, args: "mem-1" });
    expect(result.text).toContain("astramem: /forget failed");
  });
});
