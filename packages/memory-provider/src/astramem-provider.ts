// @astragenie/memory-provider — astramem-provider.ts
//
// The source-of-truth writer. Provider resolution is delegated to
// `@astragenie/astramem-client`'s `resolveWireProvider()` — this module
// never shells the astramem CLI and never hand-rolls an MCP client.
//
// Unpaired (resolveWireProvider() resolves null) always falls back to
// fileProvider — best-effort, never throws.
//
// Adapted from dev-team's scripts/lib/memory/astramem-provider.ts
// (FEAT-188 S4) — astragenie/plugins-common W3a. One dependency change from
// the source: IngestPayload/RecallHit are now imported from
// `@astragenie/astramem-client` (which already re-exports its own
// structural mirrors of these wire shapes — see that package's types.ts)
// instead of `@astragenie/astramem-plugin/contracts`. This drops the need
// for a peerDependency on astramem-plugin entirely; astramem-client's
// mirrors exist for exactly this "no compile-time dependency on the plugin"
// case.
import { randomUUID } from "node:crypto";
import {
  type IngestPayload,
  type RecallHit,
  type WireProvider,
  feedbackSilent,
  profileSilent,
  resolveWireProvider,
} from "@astragenie/astramem-client";
import { type FileProviderOptions, fileProvider } from "./file-provider.ts";
import {
  type MemoryEntry,
  type MemoryEntryInput,
  MemoryEntrySchema,
  MemoryKindSchema,
  type MemorySeverity,
} from "./schema.ts";
import type { MemoryProvider, RecallQuery } from "./types.ts";

const MAX_SUMMARY_LENGTH = 280;
const DEFAULT_K = 5;
const DEFAULT_MAX_TOKENS = 800;
const CHARS_PER_TOKEN = 4;

const SEVERITY_TO_IMPORTANCE: Record<MemorySeverity, number> = {
  critical: 1,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

export interface RemoteHandle {
  provider: WireProvider;
  name: "local" | "saas";
}

export interface AstramemProviderOptions extends FileProviderOptions {
  /** When true, also mirror every capture/supersede into the local JSONL
   * (the "2 parallel providers" mode — astramem is source of truth, the
   * JSONL is the derived duplicate). */
  dualWrite?: boolean;
  /**
   * Internal test seam. Overrides the default resolver
   * (`defaultResolveRemote()`, wrapping astramem-client's
   * `resolveWireProvider()`) so tests can inject a pure in-memory fake
   * `RemoteHandle` instead of standing up a real daemon. Never set by
   * production callers. Underscore-prefixed to signal "not part of the
   * public contract."
   */
  __resolveRemote?: () => Promise<RemoteHandle | null>;
}

function toStoredEntry(input: MemoryEntryInput, supersedesOverride?: string): MemoryEntry {
  return MemoryEntrySchema.parse({
    id: input.id ?? randomUUID(),
    ts: input.ts ?? new Date().toISOString(),
    kind: input.kind,
    severity: input.severity,
    agent: input.agent ?? null,
    tags: input.tags ?? [],
    summary: input.summary.slice(0, MAX_SUMMARY_LENGTH),
    detail: input.detail,
    source: input.source,
    supersedes: supersedesOverride ?? input.supersedes,
  });
}

function toIngestPayload(entry: MemoryEntry): IngestPayload {
  return {
    id: entry.id,
    type: entry.kind,
    text: entry.summary,
    source: entry.source,
    importance: SEVERITY_TO_IMPORTANCE[entry.severity],
    metadata: {
      tags: entry.tags,
      ts: entry.ts,
      ...(entry.agent ? { agent: entry.agent } : {}),
      ...(entry.supersedes ? { supersedes: entry.supersedes } : {}),
    },
  };
}

/**
 * Default remote resolver — wraps astramem-client's `resolveWireProvider()`
 * into this module's `RemoteHandle` shape.
 *
 * Compromise: the shared resolver deliberately does not report which
 * backend (local vs saas) it paired with. `name` is therefore a best-effort
 * "local" default; it is surfaced to callers for display purposes only —
 * no code in this module or its callers branches on it.
 */
async function defaultResolveRemote(): Promise<RemoteHandle | null> {
  const provider = await resolveWireProvider();
  return provider ? { provider, name: "local" } : null;
}

/**
 * Public one-shot resolver — resolution of the paired astramem backend, if
 * any (subject to astramem-client's process-lifetime resolution cache).
 * Available to any one-shot caller that needs a RemoteHandle without
 * standing up a full astramemProvider (e.g. a drift-check CLI).
 */
export async function resolveAstramemRemote(): Promise<RemoteHandle | null> {
  return defaultResolveRemote();
}

/**
 * Best-effort mapping of the astramem wire recall response into our
 * MemoryEntry shape. RecallHit carries no timestamp or tags, so this path
 * ranks by the server-provided score alone — a degraded-fidelity fallback
 * used only for the paired + dualWrite:false case. dualWrite:true
 * (recommended) reads the local JSONL instead, which carries full recency x
 * severity ranking fidelity (see recall() below).
 */
function mapHitsToEntries(
  hits: RecallHit[],
  query: RecallQuery,
  defaultMaxTokens: number,
): MemoryEntry[] {
  const k = query.k ?? DEFAULT_K;
  const maxTokens = query.maxTokens ?? defaultMaxTokens;
  const sorted = [...hits].sort((a, b) => b.score - a.score).slice(0, k);

  const entries: MemoryEntry[] = [];
  let remainingBudget = maxTokens;
  for (const hit of sorted) {
    const summary = hit.text.slice(0, MAX_SUMMARY_LENGTH);
    const cost = Math.max(1, Math.ceil(summary.length / CHARS_PER_TOKEN));
    if (cost > remainingBudget) break;
    remainingBudget -= cost;
    const kindResult = MemoryKindSchema.safeParse(hit.type);
    entries.push(
      MemoryEntrySchema.parse({
        id: hit.id,
        ts: new Date().toISOString(),
        kind: kindResult.success ? kindResult.data : "lesson",
        severity: "medium",
        tags: [],
        summary,
        source: hit.source ?? "astramem",
      }),
    );
  }
  return entries;
}

/**
 * astramemProvider — the source-of-truth writer. Paired: writes go to
 * astramem via remember() (fire-and-forget, best-effort). Unpaired:
 * transparently falls back to fileProvider so capture/recall never throw
 * and never silently drop data.
 */
export function astramemProvider(
  repoPath: string,
  options: AstramemProviderOptions = {},
): MemoryProvider {
  const dualWrite = options.dualWrite ?? false;
  const defaultMaxTokens = options.recall?.maxTokens ?? DEFAULT_MAX_TOKENS;
  const fallbackOptions: FileProviderOptions = {
    ...(options.recall ? { recall: options.recall } : {}),
    ...(options.storePath ? { storePath: options.storePath } : {}),
    ...(options.normalizeRow ? { normalizeRow: options.normalizeRow } : {}),
  };
  const fallback = fileProvider(repoPath, fallbackOptions);
  const resolveRemote = options.__resolveRemote ?? defaultResolveRemote;

  async function writeThrough(entry: MemoryEntryInput, supersedesOverride?: string): Promise<void> {
    const stored = toStoredEntry(entry, supersedesOverride);
    const remote = await resolveRemote();

    if (!remote) {
      // Unpaired -> fall back to file entirely (best-effort, never throw).
      await fallback.capture(stored).catch(() => {
        /* fire-and-forget: never propagate */
      });
      return;
    }

    // Paired: astramem is the primary write. Fire-and-forget — errors are
    // absorbed here, never propagated to the caller (capture() contract).
    void remote.provider.remember(toIngestPayload(stored)).catch(() => {
      /* fire-and-forget: never propagate */
    });

    if (dualWrite) {
      await fallback.capture(stored).catch(() => {
        /* fire-and-forget: never propagate */
      });
    }
  }

  return {
    describe: () => ({ provider: "astramem" }),

    async capture(entry: MemoryEntryInput): Promise<void> {
      await writeThrough(entry);
    },

    async recall(query: RecallQuery): Promise<MemoryEntry[]> {
      const remote = await resolveRemote();

      if (!remote || dualWrite) {
        // Unpaired, or dualWrite:true — the local JSONL is either the only
        // copy (unpaired) or the ranking-complete derived duplicate
        // (dualWrite) — always read from there for full ranking fidelity
        // and contract parity with fileProvider.
        return fallback.recall(query);
      }

      // Paired + dualWrite:false — no local duplicate exists; read straight
      // from astramem (degraded-fidelity passthrough — see mapHitsToEntries).
      try {
        const q = query.tags?.join(" ") || query.agent || "recent";
        const res = await remote.provider.recall({
          query: q,
          k: query.k ?? DEFAULT_K,
          ...(query.agent ? { agent: query.agent } : {}),
        });
        return mapHitsToEntries(res.hits, query, defaultMaxTokens);
      } catch {
        // Best-effort: never throw from recall().
        return [];
      }
    },

    async supersede(id: string, replacement: MemoryEntryInput): Promise<void> {
      await writeThrough(replacement, replacement.supersedes ?? id);
    },

    async invalidate(id: string): Promise<void> {
      // No wire-level tombstone concept in astramem's remember()/IngestPayload
      // contract — the supersede/invalidate chain is consumer-side ranking
      // state (rankAndTruncate), which only ever operates over the local
      // JSONL. So invalidate always targets the fallback store, regardless
      // of dualWrite; harmless no-op if the id was never mirrored locally.
      await fallback.invalidate(id).catch(() => {
        /* fire-and-forget: never propagate */
      });
    },

    // Profile + feedback ride the daemon's REST surface (GET
    // /agents/:agent/profile, POST /memory/:id/used) via astramem-client's
    // fail-silent wrappers — NOT the WireProvider recall/remember seam,
    // which does not expose those endpoints. Both resolve null/false when
    // unpaired or on any failure; there is no fileProvider fallback (a local
    // JSONL has no cross-session per-agent usefulness signal to synthesize a
    // profile from).
    async profile(agent: string) {
      return profileSilent(agent);
    },

    async feedback(atomId: string, opts: { used: boolean }): Promise<boolean> {
      // Positive-only: the daemon's /used verb records usefulness; there is
      // no "not used" endpoint, so a used:false call is a deliberate no-op.
      if (!opts.used) return false;
      return feedbackSilent(atomId);
    },
  };
}
