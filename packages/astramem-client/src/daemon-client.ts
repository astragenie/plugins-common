// Typed HTTP client for the astramem-local daemon (astramemory-local
// src/server/routes/*.ts). Distinct from resolve.ts/calls.ts in this
// package: those resolve a WireProvider from the astramem-plugin peer dep
// and cap+swallow failures for fire-and-forget capture. This client talks
// to the daemon's REST surface directly, always with a caller-supplied
// baseUrl + bearer, and always throws a typed DaemonError on failure — it
// is the building block a provider/plugin integration wraps, not a
// fail-silent seam itself.
//
// Error model mirrors astramemory-plugin's src/providers/local.ts bands:
// 4xx -> DaemonError{band:'deterministic'} (do not retry), 5xx/network/
// timeout -> DaemonError{band:'transient'} (safe to retry). No retries by
// default; ingestTranscript retries once on a transient failure when
// `retryIngestOnTransient` is set at construction.

import { DaemonError } from "./daemon-error.ts";
import type {
  CanonicalIngestEnvelope,
  ConsolidateSummary,
  ConsolidationProposal,
  ConsolidationRunOpts,
  HealthResponse,
  HistoryResponse,
  IngestTranscriptResponse,
  ListProposalsResponse,
  MemoryScopeInput,
  OkResponse,
  RecallRequest,
  RecallResponse,
  RememberRequest,
  RememberResponse,
  SearchParams,
  SearchResponse,
  SessionDigest,
  VersionResponse,
  WhyReceipt,
} from "./daemon-types.ts";

export interface AstramemDaemonClientOptions {
  /** Daemon base URL, e.g. "http://127.0.0.1:7777". Trailing slash tolerated. */
  baseUrl: string;
  /** Bearer token (daemon's MEMORY_BEARER). Omit only against a daemon with auth disabled. */
  bearer?: string;
  /** Per-request timeout in ms, covering the whole request/response cycle. Default 5000. */
  timeoutMs?: number;
  /** Retry ingestTranscript once on a transient (5xx/network/timeout) failure. Default false. */
  retryIngestOnTransient?: boolean;
}

export interface RequestOpts {
  signal?: AbortSignal;
}

export interface IngestOpts extends RequestOpts {
  /** SHA-256(stable-stringify(body)) idempotency key — same key + same body replays; same key + different body -> 409. */
  idempotencyKey?: string;
}

const DEFAULT_TIMEOUT_MS = 5000;

function joinList(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value.join(",") : value;
}

export class AstramemDaemonClient {
  private readonly baseUrl: string;
  private readonly bearer: string | undefined;
  private readonly timeoutMs: number;
  private readonly retryIngestOnTransient: boolean;

  constructor(opts: AstramemDaemonClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.bearer = opts.bearer;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retryIngestOnTransient = opts.retryIngestOnTransient ?? false;
  }

  private headers(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.bearer) headers.Authorization = `Bearer ${this.bearer}`;
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    return headers;
  }

  private async fetch(path: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    // Node/Bun timers keep the event loop alive by default — don't let an
    // abandoned deadline timer outlive a caller that already gave up.
    timer.unref?.();
    const onExternalAbort = () => ctrl.abort();
    signal?.addEventListener("abort", onExternalAbort);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, { ...init, signal: ctrl.signal });
      return res;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        if (signal?.aborted) {
          throw new DaemonError("Request aborted by caller signal", {
            band: "transient",
            cause: err,
          });
        }
        throw new DaemonError(`Request timed out after ${this.timeoutMs}ms`, {
          band: "transient",
          cause: err,
        });
      }
      throw new DaemonError(`Network error: ${(err as Error)?.message ?? String(err)}`, {
        band: "transient",
        cause: err,
      });
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onExternalAbort);
    }
  }

  /** Parse a response body as JSON when present, tolerating an empty/non-JSON body (e.g. a 204 or plaintext error page). */
  private async readBody(res: Response): Promise<unknown> {
    const text = await res.text().catch(() => undefined);
    if (text === undefined || text.length === 0) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async assertOk(res: Response, context: string): Promise<void> {
    if (res.ok) return;
    const body = await this.readBody(res);
    const statusText = res.statusText || String(res.status);
    const band = res.status >= 400 && res.status < 500 ? "deterministic" : "transient";
    throw new DaemonError(`${context}: ${res.status} ${statusText}`, {
      band,
      status: res.status,
      body,
    });
  }

  private async requestJson<T>(
    path: string,
    init: RequestInit,
    context: string,
    signal?: AbortSignal,
  ): Promise<T> {
    const res = await this.fetch(path, init, signal);
    await this.assertOk(res, context);
    return (await this.readBody(res)) as T;
  }

  private buildQuery(params: Record<string, string | number | undefined>): string {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) qs.set(key, String(value));
    }
    const s = qs.toString();
    return s ? `?${s}` : "";
  }

  // -------------------------------------------------------------------------
  // Health / version
  // -------------------------------------------------------------------------

  async health(opts: RequestOpts = {}): Promise<HealthResponse> {
    return this.requestJson<HealthResponse>(
      "/health",
      { method: "GET", headers: this.headers() },
      "health",
      opts.signal,
    );
  }

  async version(opts: RequestOpts = {}): Promise<VersionResponse> {
    return this.requestJson<VersionResponse>(
      "/version",
      { method: "GET", headers: this.headers() },
      "version",
      opts.signal,
    );
  }

  // -------------------------------------------------------------------------
  // Ingest
  // -------------------------------------------------------------------------

  async ingestTranscript(
    envelope: CanonicalIngestEnvelope,
    opts: IngestOpts = {},
  ): Promise<IngestTranscriptResponse> {
    const attempt = () =>
      this.requestJson<IngestTranscriptResponse>(
        "/ingest/transcript",
        {
          method: "POST",
          headers: this.headers(opts.idempotencyKey),
          body: JSON.stringify(envelope),
        },
        "ingest/transcript",
        opts.signal,
      );

    if (!this.retryIngestOnTransient) return attempt();

    try {
      return await attempt();
    } catch (err) {
      if (err instanceof DaemonError && err.isTransient && !opts.signal?.aborted) {
        return attempt();
      }
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // Recall / search / remember
  // -------------------------------------------------------------------------

  async recall(req: RecallRequest, opts: RequestOpts = {}): Promise<RecallResponse> {
    return this.requestJson<RecallResponse>(
      "/recall",
      { method: "POST", headers: this.headers(), body: JSON.stringify(req) },
      "recall",
      opts.signal,
    );
  }

  async search(params: SearchParams, opts: RequestOpts = {}): Promise<SearchResponse> {
    const query = this.buildQuery({
      q: params.q,
      limit: params.limit,
      type: params.type?.join(","),
      repo: params.repo,
      project: joinList(params.project),
      agent: joinList(params.agent),
      agentMode: params.agentMode,
      since: params.since,
      as_of: params.as_of,
      entity: params.entity,
    });
    return this.requestJson<SearchResponse>(
      `/search${query}`,
      { method: "GET", headers: this.headers() },
      "search",
      opts.signal,
    );
  }

  async remember(req: RememberRequest, opts: RequestOpts = {}): Promise<RememberResponse> {
    const body = {
      text: req.text,
      type: req.type,
      metadata: {
        repo: req.repo,
        project: req.project,
        branch: req.branch,
        agent: req.agent,
        importance: req.importance,
        confidence: req.confidence,
      },
    };
    return this.requestJson<RememberResponse>(
      "/remember",
      { method: "POST", headers: this.headers(), body: JSON.stringify(body) },
      "remember",
      opts.signal,
    );
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  async invalidate(id: string, reason?: string, opts: RequestOpts = {}): Promise<OkResponse> {
    return this.requestJson<OkResponse>(
      `/memory/${encodeURIComponent(id)}/invalidate`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(reason !== undefined ? { reason } : {}),
      },
      "memory/invalidate",
      opts.signal,
    );
  }

  async supersede(id: string, newId: string, opts: RequestOpts = {}): Promise<OkResponse> {
    return this.requestJson<OkResponse>(
      `/memory/${encodeURIComponent(id)}/supersede`,
      { method: "POST", headers: this.headers(), body: JSON.stringify({ new_id: newId }) },
      "memory/supersede",
      opts.signal,
    );
  }

  async promote(id: string, scope: MemoryScopeInput, opts: RequestOpts = {}): Promise<OkResponse> {
    return this.requestJson<OkResponse>(
      `/memory/${encodeURIComponent(id)}/promote`,
      { method: "POST", headers: this.headers(), body: JSON.stringify({ scope }) },
      "memory/promote",
      opts.signal,
    );
  }

  async restore(id: string, opts: RequestOpts = {}): Promise<OkResponse> {
    return this.requestJson<OkResponse>(
      `/memory/${encodeURIComponent(id)}/restore`,
      { method: "POST", headers: this.headers(), body: "{}" },
      "memory/restore",
      opts.signal,
    );
  }

  async erase(id: string, reason?: string, opts: RequestOpts = {}): Promise<OkResponse> {
    return this.requestJson<OkResponse>(
      `/memory/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: this.headers(),
        body: JSON.stringify(reason !== undefined ? { reason } : {}),
      },
      "memory/erase",
      opts.signal,
    );
  }

  async markUsed(id: string, opts: RequestOpts = {}): Promise<OkResponse> {
    return this.requestJson<OkResponse>(
      `/memory/${encodeURIComponent(id)}/used`,
      { method: "POST", headers: this.headers(), body: "{}" },
      "memory/used",
      opts.signal,
    );
  }

  async history(id: string, opts: RequestOpts = {}): Promise<HistoryResponse> {
    return this.requestJson<HistoryResponse>(
      `/memory/${encodeURIComponent(id)}/history`,
      { method: "GET", headers: this.headers() },
      "memory/history",
      opts.signal,
    );
  }

  // -------------------------------------------------------------------------
  // Provenance
  // -------------------------------------------------------------------------

  async sessionDigest(sessionId: string, opts: RequestOpts = {}): Promise<SessionDigest> {
    return this.requestJson<SessionDigest>(
      `/sessions/${encodeURIComponent(sessionId)}/digest`,
      { method: "GET", headers: this.headers() },
      "sessions/digest",
      opts.signal,
    );
  }

  async whyMemory(id: string, opts: RequestOpts = {}): Promise<WhyReceipt> {
    return this.requestJson<WhyReceipt>(
      `/memory/${encodeURIComponent(id)}/why`,
      { method: "GET", headers: this.headers() },
      "memory/why",
      opts.signal,
    );
  }

  // -------------------------------------------------------------------------
  // Consolidation
  // -------------------------------------------------------------------------

  async runConsolidation(
    runOpts: ConsolidationRunOpts = {},
    opts: RequestOpts = {},
  ): Promise<ConsolidateSummary> {
    return this.requestJson<ConsolidateSummary>(
      "/consolidation/run",
      { method: "POST", headers: this.headers(), body: JSON.stringify(runOpts) },
      "consolidation/run",
      opts.signal,
    );
  }

  async listConsolidationProposals(
    status?: "pending" | "accepted" | "rejected",
    opts: RequestOpts = {},
  ): Promise<ListProposalsResponse> {
    const query = this.buildQuery({ status });
    return this.requestJson<ListProposalsResponse>(
      `/consolidation/proposals${query}`,
      { method: "GET", headers: this.headers() },
      "consolidation/proposals",
      opts.signal,
    );
  }

  async acceptProposal(id: string, opts: RequestOpts = {}): Promise<ConsolidationProposal> {
    return this.requestJson<ConsolidationProposal>(
      `/consolidation/proposals/${encodeURIComponent(id)}/accept`,
      { method: "POST", headers: this.headers(), body: "{}" },
      "consolidation/accept",
      opts.signal,
    );
  }

  async rejectProposal(id: string, opts: RequestOpts = {}): Promise<ConsolidationProposal> {
    return this.requestJson<ConsolidationProposal>(
      `/consolidation/proposals/${encodeURIComponent(id)}/reject`,
      { method: "POST", headers: this.headers(), body: "{}" },
      "consolidation/reject",
      opts.signal,
    );
  }
}

export function createAstramemDaemonClient(
  opts: AstramemDaemonClientOptions,
): AstramemDaemonClient {
  return new AstramemDaemonClient(opts);
}
