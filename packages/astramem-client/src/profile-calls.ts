// Fail-silent agent-profile + usefulness-feedback calls over the direct
// daemon REST client (AstramemDaemonClient). Distinct from calls.ts, which
// caps+swallows over the plugin-resolved WireProvider (remember/recall):
// the profile + feedback endpoints (GET /agents/:agent/profile,
// POST /memory/:id/used) live only on the daemon's REST surface, which the
// WireProvider seam does not expose. These wrappers resolve the daemon
// baseUrl/bearer from the environment (the ASTRAMEM_BASE_URL / ASTRAMEM_BEARER
// convention shared with astramem-openclaw's config.ts) and NEVER throw —
// they resolve `null` / `false` on any failure, matching recallSilent's
// contract so consumer hot paths stay trivial.

import { DEFAULT_CAP_MS } from "./calls.ts";
import { AstramemDaemonClient } from "./daemon-client.ts";
import type { AgentProfileResponse } from "./daemon-types.ts";

const DEFAULT_BASE_URL = "http://127.0.0.1:7777";

export interface ProfileCallOptions {
  /** Per-request timeout in ms (default 2000, matching the fire-and-forget cap). */
  capMs?: number | undefined;
}

/**
 * Resolve a daemon REST client from the environment, or `null` when no base
 * URL is configured and the default is unreachable-by-convention. Base URL:
 * `ASTRAMEM_BASE_URL` (falls back to the 127.0.0.1:7777 local-daemon default).
 * Bearer: `ASTRAMEM_BEARER`, then `MEMORY_BEARER` (the daemon's own secret
 * name), omitted entirely when neither is set (auth-disabled daemons).
 */
export function resolveDaemonClient(capMs: number = DEFAULT_CAP_MS): AstramemDaemonClient | null {
  try {
    const baseUrl = process.env.ASTRAMEM_BASE_URL ?? DEFAULT_BASE_URL;
    const bearer = process.env.ASTRAMEM_BEARER ?? process.env.MEMORY_BEARER;
    return new AstramemDaemonClient(
      bearer === undefined ? { baseUrl, timeoutMs: capMs } : { baseUrl, bearer, timeoutMs: capMs },
    );
  } catch {
    return null;
  }
}

/**
 * Fetch an agent's profile receipt. Resolves the profile, or `null` on ANY
 * failure — no daemon configured, 404 (agent has zero memories), non-2xx,
 * network error, or timeout. Never throws.
 */
export async function profileSilent(
  agent: string,
  opts: ProfileCallOptions = {},
): Promise<AgentProfileResponse | null> {
  const capMs = opts.capMs ?? DEFAULT_CAP_MS;
  try {
    const client = resolveDaemonClient(capMs);
    if (!client) return null;
    return await client.agentProfile(agent);
  } catch {
    return null;
  }
}

/**
 * Record positive usefulness for one atom (POST /memory/:id/used). Resolves
 * `true` when the daemon accepted it, `false` on ANY failure. Never throws.
 * Positive-only by construction — the daemon has no "not used" verb.
 */
export async function feedbackSilent(
  atomId: string,
  opts: ProfileCallOptions = {},
): Promise<boolean> {
  const capMs = opts.capMs ?? DEFAULT_CAP_MS;
  try {
    const client = resolveDaemonClient(capMs);
    if (!client) return false;
    await client.markUsed(atomId);
    return true;
  } catch {
    return false;
  }
}
