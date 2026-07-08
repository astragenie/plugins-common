// AstramemDaemonClient — direct daemon HTTP client. Mocked-fetch coverage
// for happy paths, the deterministic (4xx) / transient (5xx/network/timeout)
// error bands, and Idempotency-Key handling on ingestTranscript.

import { afterEach, describe, expect, test } from "bun:test";

import type { CanonicalIngestEnvelope } from "../src/daemon-types.ts";
import { AstramemDaemonClient, DaemonError } from "../src/index.ts";

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

interface CapturedRequest {
  url: string;
  method: string | undefined;
  headers: Headers;
  body: unknown;
}

function mockFetch(handler: (req: CapturedRequest) => Response): CapturedRequest[] {
  const calls: CapturedRequest[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    // biome-ignore lint: HeadersInit isn't a global type without lib "dom" in this project's tsconfig.
    const headers = new Headers(init?.headers as any);
    const bodyText = typeof init?.body === "string" ? init.body : undefined;
    const captured: CapturedRequest = {
      url: String(url),
      method: init?.method,
      headers,
      body: bodyText ? JSON.parse(bodyText) : undefined,
    };
    calls.push(captured);
    return handler(captured);
  }) as typeof fetch;
  return calls;
}

/** Awaits `p`, asserting it rejects, and returns the rejection reason. */
async function rejection(p: Promise<unknown>): Promise<unknown> {
  try {
    await p;
  } catch (err) {
    return err;
  }
  throw new Error("expected promise to reject, but it resolved");
}

const envelope: CanonicalIngestEnvelope = {
  event: "session_end",
  session_id: "s1",
  project_id: "p1",
  captured_at: new Date().toISOString(),
  turns: [{ role: "user", text: "hello" }],
  client_scrub_applied: true,
  client_scrub_hits: 0,
  client_version: "test",
  client_scrub_version: "test",
  wire_version: "v1.0",
};

describe("AstramemDaemonClient — happy paths", () => {
  test("health() parses the response and sends the bearer", async () => {
    const calls = mockFetch(() =>
      jsonResponse({
        ok: true,
        version: "0.2.1",
        wire_versions_supported: ["v1.0"],
        contract_schema_version: "1",
        schema_version: 12,
        security: { redaction: true, encryption: false },
        usefulness: { served_7d: 0, used_7d: 0, rate_7d: null },
      }),
    );
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777", bearer: "tok123" });

    const health = await client.health();

    expect(health.ok).toBe(true);
    expect(health.version).toBe("0.2.1");
    expect(calls[0]?.url).toBe("http://127.0.0.1:7777/health");
    expect(calls[0]?.headers.get("Authorization")).toBe("Bearer tok123");
  });

  test("version() hits GET /version", async () => {
    mockFetch(() =>
      jsonResponse({
        name: "astramemory-local",
        version: "0.2.1",
        wire_versions_supported: ["v1.0"],
        contract_schema_version: "1",
        schema_version: 12,
        ts: 1720000000000,
      }),
    );
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const version = await client.version();

    expect(version.name).toBe("astramemory-local");
  });

  test("ingestTranscript() posts the canonical envelope and forwards Idempotency-Key", async () => {
    const calls = mockFetch(() =>
      jsonResponse({
        ok: true,
        summary_memory_id: "t1",
        session_id: "s1",
        idempotent: false,
        extraction_job_id: "j1",
      }),
    );
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const res = await client.ingestTranscript(envelope, { idempotencyKey: "abc123" });

    expect(res.summary_memory_id).toBe("t1");
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.headers.get("Idempotency-Key")).toBe("abc123");
    expect(calls[0]?.body).toEqual(envelope);
  });

  test("recall() posts query/k/filters and returns hits", async () => {
    const calls = mockFetch(() =>
      jsonResponse({
        hits: [{ id: "m1", type: "lesson", text: "prior lesson", score: 0.9, source: "both" }],
      }),
    );
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const res = await client.recall({
      query: "worktree",
      k: 3,
      filters: { agent: "crew:builder", since: 100 },
    });

    expect(res.hits).toHaveLength(1);
    expect(calls[0]?.url).toBe("http://127.0.0.1:7777/recall");
    expect(calls[0]?.body).toEqual({
      query: "worktree",
      k: 3,
      filters: { agent: "crew:builder", since: 100 },
    });
  });

  test("search() builds the query string from filter params, joining list values", async () => {
    const calls = mockFetch(() => jsonResponse({ hits: [] }));
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    await client.search({ q: "worktree", repo: "plugins-common", project: ["a", "b"], limit: 10 });

    const [first] = calls;
    if (!first) throw new Error("expected one fetch call");
    const url = new URL(first.url);
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("q")).toBe("worktree");
    expect(url.searchParams.get("repo")).toBe("plugins-common");
    expect(url.searchParams.get("project")).toBe("a,b");
    expect(url.searchParams.get("limit")).toBe("10");
  });

  test("remember() nests repo/project/branch/agent/importance/confidence under metadata", async () => {
    const calls = mockFetch(() => jsonResponse({ id: "m1", ok: true }));
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const res = await client.remember({
      text: "prefer bun",
      type: "preference",
      repo: "plugins-common",
    });

    expect(res.id).toBe("m1");
    expect(calls[0]?.body).toEqual({
      text: "prefer bun",
      type: "preference",
      metadata: {
        repo: "plugins-common",
        project: undefined,
        branch: undefined,
        agent: undefined,
        importance: undefined,
        confidence: undefined,
      },
    });
  });

  test("lifecycle calls hit the expected verbs/paths", async () => {
    const calls = mockFetch((req) => {
      if (req.url.endsWith("/history")) return jsonResponse({ id: "m1", history: [] });
      return jsonResponse({ ok: true });
    });
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    await client.invalidate("m1", "stale");
    await client.supersede("m1", "m2");
    await client.promote("m1", "team");
    await client.restore("m1");
    await client.markUsed("m1");
    await client.history("m1");
    await client.erase("m1", "user requested");

    expect(calls.map((c) => [c.method, new URL(c.url).pathname])).toEqual([
      ["POST", "/memory/m1/invalidate"],
      ["POST", "/memory/m1/supersede"],
      ["POST", "/memory/m1/promote"],
      ["POST", "/memory/m1/restore"],
      ["POST", "/memory/m1/used"],
      ["GET", "/memory/m1/history"],
      ["DELETE", "/memory/m1"],
    ]);
    expect(calls[1]?.body).toEqual({ new_id: "m2" });
    expect(calls[2]?.body).toEqual({ scope: "team" });
  });

  test("sessionDigest() and whyMemory() hit the provenance routes", async () => {
    mockFetch((req) => {
      if (req.url.includes("/digest")) {
        return jsonResponse({
          session_id: "s1",
          status: "ready",
          poison_jobs: 0,
          counts: {},
          memories: [],
        });
      }
      return jsonResponse({
        id: "m1",
        type: "lesson",
        text: "t",
        importance: 0.5,
        confidence: 0.5,
        evidence: null,
        session: null,
        transcript_ref: null,
        created_at: 1,
        history: [],
      });
    });
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const digest = await client.sessionDigest("s1");
    const receipt = await client.whyMemory("m1");

    expect(digest.status).toBe("ready");
    expect(receipt.id).toBe("m1");
  });

  test("consolidation: run/list/accept/reject", async () => {
    const calls = mockFetch((req) => {
      if (req.url.endsWith("/run")) {
        return jsonResponse({
          groupsScanned: 1,
          groupsSkipped: [],
          merged: [],
          proposed: [],
          autoAcceptedProposals: [],
          staleRejectedProposals: [],
        });
      }
      if (req.url.includes("/proposals?status=pending")) {
        return jsonResponse({
          proposals: [
            {
              id: "p1",
              kind: "merge",
              winner_id: "w",
              loser_id: "l",
              similarity: 0.9,
              status: "pending",
              created_at: 1,
              resolved_at: null,
            },
          ],
        });
      }
      return jsonResponse({
        id: "p1",
        kind: "merge",
        winner_id: "w",
        loser_id: "l",
        similarity: 0.9,
        status: "accepted",
        created_at: 1,
        resolved_at: 2,
      });
    });
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const summary = await client.runConsolidation({ merge_threshold: 0.9 });
    const { proposals } = await client.listConsolidationProposals("pending");
    const accepted = await client.acceptProposal("p1");

    expect(summary.groupsScanned).toBe(1);
    expect(proposals).toHaveLength(1);
    expect(accepted.status).toBe("accepted");
    expect(calls[0]?.body).toEqual({ merge_threshold: 0.9 });
  });
});

describe("AstramemDaemonClient — error bands", () => {
  test("4xx -> DaemonError{band:'deterministic'}", async () => {
    mockFetch(() => jsonResponse({ error: "invalid" }, 400));
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const err = (await rejection(client.recall({ query: "" }))) as DaemonError;

    expect(err).toBeInstanceOf(DaemonError);
    expect(err.band).toBe("deterministic");
    expect(err.isDeterministic).toBe(true);
    expect(err.status).toBe(400);
  });

  test("404 on a lifecycle route -> deterministic with body preserved", async () => {
    mockFetch(() => jsonResponse({ error: "not found", id: "missing" }, 404));
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const err = (await rejection(client.invalidate("missing"))) as DaemonError;

    expect(err.isDeterministic).toBe(true);
    expect(err.body).toEqual({ error: "not found", id: "missing" });
  });

  test("409 idempotency conflict -> deterministic", async () => {
    mockFetch(() => jsonResponse({ error: "idempotency_conflict" }, 409));
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const err = (await rejection(
      client.ingestTranscript(envelope, { idempotencyKey: "k1" }),
    )) as DaemonError;

    expect(err.isDeterministic).toBe(true);
  });

  test("5xx -> DaemonError{band:'transient'}", async () => {
    mockFetch(() => new Response("boom", { status: 503 }));
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const err = (await rejection(client.health())) as DaemonError;

    expect(err.isTransient).toBe(true);
    expect(err.status).toBe(503);
  });

  test("network error -> transient", async () => {
    globalThis.fetch = (async (
      _url: string | URL | Request,
      _init?: RequestInit,
    ): Promise<Response> => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch;
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const err = (await rejection(client.health())) as DaemonError;

    expect(err.isTransient).toBe(true);
  });

  test("timeout -> transient, and the client does not hang past timeoutMs", async () => {
    globalThis.fetch = ((_url: string | URL | Request, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      })) as typeof fetch;
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777", timeoutMs: 100 });

    const started = Date.now();
    const err = (await rejection(client.health())) as DaemonError;

    expect(err.isTransient).toBe(true);
    expect(Date.now() - started).toBeLessThan(1500);
  });
});

describe("AstramemDaemonClient — ingest retry-on-transient", () => {
  test("retries ingestTranscript once on a transient failure when enabled, then succeeds", async () => {
    let attempts = 0;
    mockFetch(() => {
      attempts += 1;
      if (attempts === 1) return new Response("boom", { status: 503 });
      return jsonResponse({
        ok: true,
        summary_memory_id: "t1",
        session_id: "s1",
        idempotent: false,
      });
    });
    const client = new AstramemDaemonClient({
      baseUrl: "http://127.0.0.1:7777",
      retryIngestOnTransient: true,
    });

    const res = await client.ingestTranscript(envelope);

    expect(res.summary_memory_id).toBe("t1");
    expect(attempts).toBe(2);
  });

  test("does not retry ingestTranscript by default", async () => {
    let attempts = 0;
    mockFetch(() => {
      attempts += 1;
      return new Response("boom", { status: 503 });
    });
    const client = new AstramemDaemonClient({ baseUrl: "http://127.0.0.1:7777" });

    const err = await rejection(client.ingestTranscript(envelope));

    expect(err).toBeInstanceOf(DaemonError);
    expect(attempts).toBe(1);
  });

  test("does not retry a deterministic (4xx) ingest failure even when the flag is set", async () => {
    let attempts = 0;
    mockFetch(() => {
      attempts += 1;
      return jsonResponse({ error: "invalid" }, 400);
    });
    const client = new AstramemDaemonClient({
      baseUrl: "http://127.0.0.1:7777",
      retryIngestOnTransient: true,
    });

    const err = (await rejection(client.ingestTranscript(envelope))) as DaemonError;

    expect(err.isDeterministic).toBe(true);
    expect(attempts).toBe(1);
  });
});
