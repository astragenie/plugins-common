// Daemon access for this plugin. Most calls go through
// @astragenie/astramem-client's AstramemDaemonClient (typed, throws
// DaemonError on failure — callers here decide fail-silent vs fail-visible).
//
// One exception: GET /agents/:agent/profile (astramemory-local
// src/server/routes/agents.ts) is NOT wrapped by AstramemDaemonClient as of
// @astragenie/astramem-client 0.2.0 — daemon-client.ts has no
// `agentProfile()` method. `fetchAgentProfile` below calls it directly with
// the same baseUrl/bearer convention rather than reaching into that
// package's internals. Follow-up: upstream an `agentProfile()` method to
// astramem-client and delete this function.

import { type AstramemDaemonClient, createAstramemDaemonClient } from "@astragenie/astramem-client";
import type { AstramemOpenClawConfig } from "./config.ts";

export function createDaemonClient(config: AstramemOpenClawConfig): AstramemDaemonClient {
  // AstramemDaemonClientOptions.bearer is `bearer?: string` (no `| undefined`
  // in its own type), so under this repo's exactOptionalPropertyTypes the
  // key must be omitted entirely rather than set to `undefined`.
  return createAstramemDaemonClient(
    config.bearer === undefined
      ? { baseUrl: config.baseUrl }
      : { baseUrl: config.baseUrl, bearer: config.bearer },
  );
}

export interface AgentProfileLesson {
  id: string;
  text: string;
  importance: number;
  usefulness: number;
  created_at: number;
}

export interface AgentProfileDecision {
  id: string;
  text: string;
  importance: number;
  created_at: number;
}

export interface AgentProfileCorrection {
  id: string;
  type: string;
  text: string;
  action: "invalidated" | "superseded";
  reason: string | null;
  superseded_by: string | null;
  superseding_text: string | null;
  corrected_at: number;
}

/** Mirrors astramemory-local src/server/queries/agent-profile.ts AgentProfile. */
export interface AgentProfileResponse {
  agent: string;
  counts: Record<string, number>;
  total: number;
  first_seen: number | null;
  last_active: number | null;
  top_lessons: AgentProfileLesson[];
  recent_decisions: AgentProfileDecision[];
  corrections: AgentProfileCorrection[];
}

const DEFAULT_PROFILE_TIMEOUT_MS = 5000;

/**
 * GET /agents/:agent/profile. Resolves `null` on a 404 (agent has zero
 * memories), any non-2xx status, or any transport failure — never throws.
 * This function is only ever called from fail-silent background paths
 * (profile.ts), so swallowing here keeps every caller trivial.
 */
export async function fetchAgentProfile(
  config: AstramemOpenClawConfig,
  agent: string,
  opts: { timeoutMs?: number } = {},
): Promise<AgentProfileResponse | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? DEFAULT_PROFILE_TIMEOUT_MS);
  timer.unref?.();
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (config.bearer) headers.Authorization = `Bearer ${config.bearer}`;
    const base = config.baseUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/agents/${encodeURIComponent(agent)}/profile`, {
      method: "GET",
      headers,
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as AgentProfileResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
