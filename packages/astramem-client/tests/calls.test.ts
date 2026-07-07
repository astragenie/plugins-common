// rememberSilent / recallSilent — fail-silent capped call wrappers.

import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  _resetResolveCache,
  _setWireProvider,
  recallSilent,
  rememberSilent,
} from "../src/index.ts";
import type { IngestPayload, RecallRequest, RecallResponse } from "../src/index.ts";

beforeEach(() => {
  _resetResolveCache();
  // Ensure runtime discovery can never reach a real daemon/CLI from tests.
  process.env.ASTRAMEM_DISABLE_PATH_PROBE = "1";
  process.env.CLAUDE_PLUGIN_ROOT_MEMORY = undefined;
});

afterEach(() => {
  _resetResolveCache();
});

describe("rememberSilent", () => {
  test("delivers payload to provider.remember and resolves true", async () => {
    const seen: IngestPayload[] = [];
    _setWireProvider({
      remember: async (req) => {
        seen.push(req);
      },
      recall: async () => ({ hits: [] }),
      health: async () => ({ ok: true }),
    });

    const ok = await rememberSilent({ id: "1", type: "lesson", text: "hello" });

    expect(ok).toBe(true);
    expect(seen).toHaveLength(1);
    expect(seen[0]?.type).toBe("lesson");
  });

  test("resolves false when provider rejects", async () => {
    _setWireProvider({
      remember: async () => {
        throw new Error("daemon down");
      },
      recall: async () => ({ hits: [] }),
      health: async () => ({ ok: true }),
    });

    await expect(rememberSilent({ id: "1", type: "note", text: "t" })).resolves.toBe(false);
  });

  test("resolves false when no provider is resolvable", async () => {
    _setWireProvider(null);
    await expect(rememberSilent({ id: "1", type: "note", text: "t" })).resolves.toBe(false);
  });

  test("caps a hung provider instead of blocking the caller", async () => {
    _setWireProvider({
      remember: () => new Promise(() => {}),
      recall: async () => ({ hits: [] }),
      health: async () => ({ ok: true }),
    });

    const started = Date.now();
    const ok = await rememberSilent({ id: "1", type: "note", text: "t" }, { capMs: 300 });
    const elapsed = Date.now() - started;

    expect(ok).toBe(false);
    expect(elapsed).toBeLessThan(1500);
  });
});

describe("recallSilent", () => {
  const response: RecallResponse = {
    hits: [{ id: "m1", type: "lesson", text: "prior lesson", score: 0.9 }],
    provider: "local",
  };

  test("returns the provider's response", async () => {
    const seen: RecallRequest[] = [];
    _setWireProvider({
      remember: async () => {},
      recall: async (req) => {
        seen.push(req);
        return response;
      },
      health: async () => ({ ok: true }),
    });

    const res = await recallSilent({ query: "worktree", k: 3, agent: "crew:builder" });

    expect(res).toEqual(response);
    expect(seen[0]?.query).toBe("worktree");
    expect(seen[0]?.k).toBe(3);
  });

  test("returns null when provider rejects", async () => {
    _setWireProvider({
      remember: async () => {},
      recall: async () => {
        throw new Error("boom");
      },
      health: async () => ({ ok: true }),
    });

    await expect(recallSilent({ query: "q" })).resolves.toBeNull();
  });

  test("returns null when no provider is resolvable", async () => {
    _setWireProvider(null);
    await expect(recallSilent({ query: "q" })).resolves.toBeNull();
  });

  test("caps a hung recall", async () => {
    _setWireProvider({
      remember: async () => {},
      recall: () => new Promise(() => {}),
      health: async () => ({ ok: true }),
    });

    const started = Date.now();
    const res = await recallSilent({ query: "q" }, { capMs: 300 });

    expect(res).toBeNull();
    expect(Date.now() - started).toBeLessThan(1500);
  });
});
