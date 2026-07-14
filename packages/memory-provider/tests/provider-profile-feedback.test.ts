// profile() / feedback() across the three providers.
// - noop + file: null / false (no per-agent usefulness signal to serve).
// - astramem: delegates to astramem-client's profileSilent/feedbackSilent,
//   which hit the daemon REST surface — mocked here via globalThis.fetch
//   (no socket, no daemon).
import * as assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, test } from "node:test";
import { astramemProvider } from "../src/astramem-provider.ts";
import { fileProvider } from "../src/file-provider.ts";
import { noopProvider } from "../src/noop-provider.ts";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
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
  }) as unknown as typeof fetch;
  return calls;
}

const PROFILE = {
  agent: "crew:reviewer",
  counts: { lesson: 1 },
  total: 1,
  first_seen: 1,
  last_active: 2,
  top_lessons: [{ id: "l1", text: "x", importance: 0.8, usefulness: 0.9, created_at: 3 }],
  recent_decisions: [],
  corrections: [],
};

async function tmpRepo() {
  return fs.mkdtemp(path.join(os.tmpdir(), "mp-profile-"));
}

test("noopProvider.profile() -> null, feedback() -> false", async () => {
  const p = noopProvider();
  assert.equal(await p.profile?.("crew:reviewer"), null);
  assert.equal(await p.feedback?.("atom-1", { used: true }), false);
});

test("fileProvider.profile() -> null, feedback() -> false", async () => {
  const repo = await tmpRepo();
  try {
    const p = fileProvider(repo);
    assert.equal(await p.profile?.("crew:reviewer"), null);
    assert.equal(await p.feedback?.("atom-1", { used: true }), false);
  } finally {
    await fs.rm(repo, { recursive: true, force: true });
  }
});

test("astramemProvider.profile() returns the daemon receipt (fetch mocked)", async () => {
  const repo = await tmpRepo();
  try {
    const calls = mockFetch(() => jsonResponse(PROFILE));
    const p = astramemProvider(repo);
    const profile = await p.profile?.("crew:reviewer");
    assert.equal(profile?.agent, "crew:reviewer");
    assert.equal(profile?.top_lessons[0]?.id, "l1");
    assert.ok(calls[0]?.url.endsWith("/agents/crew%3Areviewer/profile"));
  } finally {
    await fs.rm(repo, { recursive: true, force: true });
  }
});

test("astramemProvider.profile() -> null on daemon 404 / error (fail-silent)", async () => {
  const repo = await tmpRepo();
  try {
    mockFetch(() => jsonResponse({ error: "not found" }, 404));
    const p = astramemProvider(repo);
    assert.equal(await p.profile?.("nobody"), null);
  } finally {
    await fs.rm(repo, { recursive: true, force: true });
  }
});

test("astramemProvider.feedback({used:true}) -> true on 200 markUsed", async () => {
  const repo = await tmpRepo();
  try {
    const calls = mockFetch(() => jsonResponse({ ok: true }));
    const p = astramemProvider(repo);
    assert.equal(await p.feedback?.("atom-1", { used: true }), true);
    assert.ok(calls[0]?.url.endsWith("/memory/atom-1/used"));
  } finally {
    await fs.rm(repo, { recursive: true, force: true });
  }
});

test("astramemProvider.feedback({used:false}) is a no-op -> false, no call", async () => {
  const repo = await tmpRepo();
  try {
    const calls = mockFetch(() => jsonResponse({ ok: true }));
    const p = astramemProvider(repo);
    assert.equal(await p.feedback?.("atom-1", { used: false }), false);
    assert.equal(calls.length, 0);
  } finally {
    await fs.rm(repo, { recursive: true, force: true });
  }
});

test("astramemProvider.feedback() -> false on daemon error (fail-silent)", async () => {
  const repo = await tmpRepo();
  try {
    mockFetch(() => jsonResponse({ error: "boom" }, 500));
    const p = astramemProvider(repo);
    assert.equal(await p.feedback?.("atom-1", { used: true }), false);
  } finally {
    await fs.rm(repo, { recursive: true, force: true });
  }
});
