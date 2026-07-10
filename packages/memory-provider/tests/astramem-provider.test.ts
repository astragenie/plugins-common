import * as assert from "node:assert/strict";
// tests/astramem-provider.test.ts
// astramemProvider: unpaired-fallback to fileProvider and contract-parity
// vs fileProvider. No live astramem daemon exists in CI (and
// @astragenie/astramem-plugin is not installed anywhere in this monorepo),
// so resolveWireProvider() naturally resolves null here — the env-var
// scaffold below is retained from the source test for defense-in-depth in
// case a future astramem-plugin devDependency changes that.
//
// Ported from dev-team tests/memory-provider-astramem.test.ts (FEAT-188 S4)
// — import paths only. Paired-mode tests use the `__resolveRemote` test
// seam (a pure in-memory fake `RemoteHandle`, no socket) — see
// astragenie/dev-team#170 for why the earlier real-daemon-over-loopback
// version of these tests flaked in the full suite.
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { _resetResolveCache } from "@astragenie/astramem-client";
import { type RemoteHandle, astramemProvider } from "../src/astramem-provider.ts";
import { fileProvider } from "../src/file-provider.ts";

const UNREACHABLE_LOCAL_URL = "http://127.0.0.1:1";

async function makeTempRepo(prefix: string) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function cleanup(dir: string) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function withUnpairedEnv<T>(fn: () => Promise<T>): Promise<T> {
  const priorLocal = process.env.MEMORY_API_URL_LOCAL;
  const priorSaas = process.env.MEMORY_API_URL_SAAS;
  const priorSaasAlias = process.env.MEMORY_API_URL;
  process.env.MEMORY_API_URL_LOCAL = UNREACHABLE_LOCAL_URL;
  process.env.MEMORY_API_URL_SAAS = undefined;
  process.env.MEMORY_API_URL = undefined;
  _resetResolveCache();
  try {
    return await fn();
  } finally {
    if (priorLocal === undefined) process.env.MEMORY_API_URL_LOCAL = undefined;
    else process.env.MEMORY_API_URL_LOCAL = priorLocal;
    if (priorSaas === undefined) process.env.MEMORY_API_URL_SAAS = undefined;
    else process.env.MEMORY_API_URL_SAAS = priorSaas;
    if (priorSaasAlias === undefined) process.env.MEMORY_API_URL = undefined;
    else process.env.MEMORY_API_URL = priorSaasAlias;
    _resetResolveCache();
  }
}

test("astramemProvider describes itself as astramem", () => {
  assert.deepEqual(astramemProvider("/tmp/whatever").describe(), { provider: "astramem" });
});

test("astramemProvider falls back to fileProvider when unpaired — capture + recall never throw", async () => {
  const repo = await makeTempRepo("memory-astramem-unpaired-");
  try {
    await withUnpairedEnv(async () => {
      const provider = astramemProvider(repo);
      await assert.doesNotReject(
        provider.capture({
          kind: "failure",
          severity: "high",
          summary: "unpaired capture should fall back to file",
          source: "test",
        }),
      );
      const results = await provider.recall({ k: 5 });
      assert.equal(results.length, 1);
      assert.equal(results[0]?.summary, "unpaired capture should fall back to file");
    });
  } finally {
    await cleanup(repo);
  }
});

test("astramemProvider contract-parity: recall() ranks/truncates identically to fileProvider when unpaired", async () => {
  const repoA = await makeTempRepo("memory-astramem-parity-a-");
  const repoB = await makeTempRepo("memory-astramem-parity-b-");
  try {
    await withUnpairedEnv(async () => {
      const astramem = astramemProvider(repoA);
      const file = fileProvider(repoB);

      const now = Date.now();
      const entries = [
        {
          id: "old-low",
          ts: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
          kind: "lesson",
          severity: "low",
          summary: "old and low severity",
          source: "t",
        },
        {
          id: "fresh-critical",
          ts: new Date(now - 60 * 1000).toISOString(),
          kind: "failure",
          severity: "critical",
          summary: "fresh and critical",
          source: "t",
        },
      ] as const;

      for (const entry of entries) {
        await astramem.capture(entry);
        await file.capture(entry);
      }

      const astramemResults = await astramem.recall({ k: 5 });
      const fileResults = await file.recall({ k: 5 });

      assert.deepEqual(
        astramemResults.map((r) => r.id),
        fileResults.map((r) => r.id),
        "unpaired astramemProvider ranking must match fileProvider exactly",
      );
      assert.equal(astramemResults[0]?.id, "fresh-critical");
    });
  } finally {
    await cleanup(repoA);
    await cleanup(repoB);
  }
});

test("astramemProvider.invalidate excludes an entry from future recall() calls (unpaired)", async () => {
  const repo = await makeTempRepo("memory-astramem-invalidate-");
  try {
    await withUnpairedEnv(async () => {
      const provider = astramemProvider(repo);
      await provider.capture({
        id: "bad-entry",
        kind: "lesson",
        severity: "high",
        summary: "turned out to be wrong",
        source: "t",
      });
      let results = await provider.recall({ k: 5 });
      assert.ok(results.some((r) => r.id === "bad-entry"));

      await provider.invalidate("bad-entry");
      results = await provider.recall({ k: 5 });
      assert.ok(!results.some((r) => r.id === "bad-entry"));
    });
  } finally {
    await cleanup(repo);
  }
});

test("astramemProvider.supersede resolves the chain when unpaired — only the latest entry is returned", async () => {
  const repo = await makeTempRepo("memory-astramem-supersede-");
  try {
    await withUnpairedEnv(async () => {
      const provider = astramemProvider(repo);
      await provider.capture({
        id: "v1",
        kind: "decision",
        severity: "medium",
        summary: "original",
        source: "t",
      });
      await provider.supersede("v1", {
        id: "v2",
        kind: "decision",
        severity: "medium",
        summary: "revised",
        source: "t",
      });

      const results = await provider.recall({ k: 5 });
      const ids = results.map((r) => r.id);
      assert.ok(ids.includes("v2"));
      assert.ok(!ids.includes("v1"));
    });
  } finally {
    await cleanup(repo);
  }
});

test("resolveProvider wires provider:astramem to astramemProvider", async () => {
  const { resolveProvider } = await import("../src/resolve-provider.ts");
  const repo = await makeTempRepo("memory-astramem-wiring-");
  try {
    await withUnpairedEnv(async () => {
      const provider = resolveProvider({ provider: "astramem", enabled: "auto" }, repo);
      assert.deepEqual(provider.describe(), { provider: "astramem" });
      await assert.doesNotReject(
        provider.capture({
          kind: "lesson",
          severity: "low",
          summary: "wired via resolveProvider",
          source: "t",
        }),
      );
    });
  } finally {
    await cleanup(repo);
  }
});

// --- paired mode (in-memory fake wire provider) — exercises the branch the
// unpaired tests above cannot reach: a "healthy" resolveRemote() + a
// remember() call — with NO real socket. Injected via the `__resolveRemote`
// test seam on AstramemProviderOptions (src/astramem-provider.ts);
// production callers never set this option.

interface FakeWireDaemon {
  rememberCalls: number;
  resolveRemote: () => Promise<RemoteHandle | null>;
}

function makeFakeWireDaemon(): FakeWireDaemon {
  let rememberCalls = 0;
  const handle: RemoteHandle = {
    name: "local",
    provider: {
      async recall() {
        return { hits: [] };
      },
      async remember(): Promise<void> {
        rememberCalls += 1;
      },
      async health() {
        return { ok: true, version: "test-fake" };
      },
    },
  };
  return {
    get rememberCalls() {
      return rememberCalls;
    },
    resolveRemote: async () => handle,
  };
}

/**
 * remember() is intentionally fire-and-forget (not awaited by capture()) —
 * poll briefly instead of asserting immediately, since the in-memory
 * increment is not guaranteed to have landed the instant capture() resolves
 * (it still goes through a microtask hop via the fire-and-forget promise
 * chain in writeThrough()).
 */
async function waitForRememberCalls(
  daemon: FakeWireDaemon,
  expected: number,
  timeoutMs = 2000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (daemon.rememberCalls >= expected) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(
    daemon.rememberCalls,
    expected,
    `remember() call count did not reach ${expected} within ${timeoutMs}ms`,
  );
}

test("astramemProvider (paired, dualWrite:true) writes BOTH the fake remote AND the local JSONL", async () => {
  const repo = await makeTempRepo("memory-astramem-paired-dualwrite-");
  const daemon = makeFakeWireDaemon();
  try {
    const provider = astramemProvider(repo, {
      dualWrite: true,
      __resolveRemote: daemon.resolveRemote,
    });
    await provider.capture({
      kind: "failure",
      severity: "high",
      summary: "paired dual-write capture",
      source: "test",
    });

    await waitForRememberCalls(daemon, 1);

    const fileResults = await fileProvider(repo).recall({ k: 5 });
    assert.equal(
      fileResults.length,
      1,
      "dualWrite:true must also mirror the entry into the local JSONL",
    );
    assert.equal(fileResults[0]?.summary, "paired dual-write capture");
  } finally {
    await cleanup(repo);
  }
});

test("astramemProvider (paired, dualWrite:false) writes ONLY the fake remote — no local JSONL mirror", async () => {
  const repo = await makeTempRepo("memory-astramem-paired-nodual-");
  const daemon = makeFakeWireDaemon();
  try {
    const provider = astramemProvider(repo, { __resolveRemote: daemon.resolveRemote });
    await provider.capture({
      kind: "failure",
      severity: "high",
      summary: "paired single-write capture",
      source: "test",
    });

    await waitForRememberCalls(daemon, 1);

    const fileResults = await fileProvider(repo).recall({ k: 5 });
    assert.equal(fileResults.length, 0, "dualWrite:false must NOT mirror into the local JSONL");
  } finally {
    await cleanup(repo);
  }
});
