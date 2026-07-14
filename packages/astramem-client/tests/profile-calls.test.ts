// profileSilent / feedbackSilent — env-resolved, fail-silent agent-profile
// and usefulness-feedback wrappers over the daemon REST client.

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { feedbackSilent, profileSilent, resolveDaemonClient } from "../src/index.ts";

const originalFetch = globalThis.fetch;
const ENV_KEYS = ["ASTRAMEM_BASE_URL", "ASTRAMEM_BEARER", "MEMORY_BEARER"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) Reflect.deleteProperty(process.env, k);
    else process.env[k] = savedEnv[k];
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response): { url: string }[] {
  const calls: { url: string }[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url) });
    return handler(String(url), init);
  }) as typeof fetch;
  return calls;
}

const profile = {
  agent: "crew:reviewer",
  counts: { lesson: 1 },
  total: 1,
  first_seen: 1,
  last_active: 2,
  top_lessons: [{ id: "l1", text: "x", importance: 0.8, usefulness: 0.9, created_at: 3 }],
  recent_decisions: [],
  corrections: [],
};

describe("resolveDaemonClient", () => {
  test("uses ASTRAMEM_BASE_URL + ASTRAMEM_BEARER when set", () => {
    process.env.ASTRAMEM_BASE_URL = "http://example:9999";
    process.env.ASTRAMEM_BEARER = "tok";
    expect(resolveDaemonClient()).not.toBeNull();
  });

  test("falls back to the local default base URL with no env", () => {
    Reflect.deleteProperty(process.env, "ASTRAMEM_BASE_URL");
    Reflect.deleteProperty(process.env, "ASTRAMEM_BEARER");
    Reflect.deleteProperty(process.env, "MEMORY_BEARER");
    expect(resolveDaemonClient()).not.toBeNull();
  });
});

describe("profileSilent", () => {
  test("resolves the profile on 200", async () => {
    const calls = mockFetch(() => jsonResponse(profile));
    const res = await profileSilent("crew:reviewer");
    expect(res?.agent).toBe("crew:reviewer");
    expect(calls[0]?.url.endsWith("/agents/crew%3Areviewer/profile")).toBe(true);
  });

  test("resolves null on 404 (cold agent)", async () => {
    mockFetch(() => jsonResponse({ error: "not found" }, 404));
    expect(await profileSilent("nobody")).toBeNull();
  });

  test("resolves null on a network throw — never rejects", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    expect(await profileSilent("crew:reviewer")).toBeNull();
  });
});

describe("feedbackSilent", () => {
  test("resolves true on a 200 markUsed", async () => {
    const calls = mockFetch(() => jsonResponse({ ok: true }));
    expect(await feedbackSilent("atom-1")).toBe(true);
    expect(calls[0]?.url.endsWith("/memory/atom-1/used")).toBe(true);
  });

  test("resolves false on a non-2xx — never rejects", async () => {
    mockFetch(() => jsonResponse({ error: "boom" }, 500));
    expect(await feedbackSilent("atom-1")).toBe(false);
  });

  test("resolves false on a network throw", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    expect(await feedbackSilent("atom-1")).toBe(false);
  });
});
