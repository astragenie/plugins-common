// Unified astramem wire-provider resolution (FEAT-188, dev-team#172).
//
// Consolidates the two consumer-side resolution strategies that grew
// independently in dev-team (`scripts/lib/memory/astramem-provider.ts`, S4)
// and runner-plugin (`src/scripts/lib/memory-transport.mts`, S1b):
//
//   1. Injected provider — test seam (`_setWireProvider`).
//   2. Dep-mode selector: `@astragenie/astramem-plugin/selector` →
//      `resolveProvider()` (full precedence: flag → env → config → auto
//      health probe + wire-compat probe). Available when the consumer
//      carries the plugin as a package dependency AND the installed sha
//      exports "./selector" (astramem-plugin #23 follow-up).
//   3. Dep-mode provider probe: older plugin shas without the selector
//      export — import `./providers/local` + `./providers/saas` factories
//      and probe local-then-saas via `health()` (dev-team S4's wrapper,
//      ported here so dev-team can delete its copy).
//   4. Runtime plugin-root discovery: no package dep at all — locate the
//      installed plugin via `CLAUDE_PLUGIN_ROOT_MEMORY` env or the
//      `astramem` CLI's PATH location (`<root>/bin/astramem` → `<root>`),
//      then file-URL import the selector (runner-plugin S1b's strategy,
//      ported here so runner can delete its copy).
//
// Every step is fail-silent; the first success is cached for the process
// lifetime. `resolveWireProvider()` NEVER throws — it resolves the provider
// or null.
//
// Dynamic-import specifiers for the optional peer are built from joined
// fragments (not string literals) so `tsc --noEmit` does not descend into
// the plugin's sources — this package must typecheck when the peer is
// absent, and the plugin does not enable this repo's stricter compiler
// flags (see dev-team S4's note on the same trick).

import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import type { WireProvider } from "./types.ts";

const PLUGIN_PKG = "@astragenie/astramem-plugin";
const SELECTOR_SPECIFIER = [PLUGIN_PKG, "selector"].join("/");
const PROVIDERS_LOCAL_SPECIFIER = [PLUGIN_PKG, "providers/local"].join("/");
const PROVIDERS_SAAS_SPECIFIER = [PLUGIN_PKG, "providers/saas"].join("/");

interface SelectorModule {
  resolveProvider(opts?: Record<string, unknown>): Promise<{ provider: WireProvider }>;
}
interface LocalProviderModule {
  createLocalProvider(opts?: { url?: string }): WireProvider;
}
interface SaasProviderModule {
  createSaasProvider(opts?: { url?: string }): WireProvider;
}

// Module-scope cache: null = unresolved, false = confirmed unavailable.
let _cache: WireProvider | false | null = null;
// Test seam: undefined = not injected; null = simulate absence.
let _injected: WireProvider | null | undefined;

/** Test seam: inject a fake provider (or null to simulate plugin absence).
 * No-op outside test runs (mirrors astramem-plugin's own seam convention —
 * see its selector.ts `_setHealthProbeFn`). */
export function _setWireProvider(p: WireProvider | null): void {
  if (!isTestEnv()) return;
  _injected = p;
}

/** Test seam: clear the resolution cache and any injected provider. No-op
 * outside test runs. */
export function _resetResolveCache(): void {
  if (!isTestEnv()) return;
  _cache = null;
  _injected = undefined;
}

function isTestEnv(): boolean {
  return (
    process.env.NODE_ENV === "test" || Boolean(process.env.BUN_TEST) || Boolean(process.env.VITEST)
  );
}

function isProvider(value: unknown): value is WireProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as WireProvider).remember === "function"
  );
}

/** Step 2 — dep-mode selector import. */
async function resolveViaSelectorDep(): Promise<WireProvider | null> {
  try {
    const mod = (await import(SELECTOR_SPECIFIER)) as SelectorModule;
    if (typeof mod.resolveProvider !== "function") return null;
    const { provider } = await mod.resolveProvider();
    return isProvider(provider) ? provider : null;
  } catch {
    return null;
  }
}

/** Probe one provider instance; true only when health().ok. */
async function healthOk(provider: WireProvider): Promise<boolean> {
  try {
    const res = await provider.health();
    return res?.ok === true;
  } catch {
    return false;
  }
}

/** Step 3 — dep-mode local-then-saas factory probe (dev-team S4 wrapper). */
async function resolveViaProviderDep(): Promise<WireProvider | null> {
  try {
    const localMod = (await import(PROVIDERS_LOCAL_SPECIFIER)) as LocalProviderModule;
    const local = localMod.createLocalProvider();
    if (isProvider(local) && (await healthOk(local))) return local;
  } catch {
    // Fall through to saas.
  }
  try {
    const saasMod = (await import(PROVIDERS_SAAS_SPECIFIER)) as SaasProviderModule;
    const saas = saasMod.createSaasProvider();
    if (isProvider(saas) && (await healthOk(saas))) return saas;
  } catch {
    // Unavailable.
  }
  return null;
}

/** Resolve the `astramem` CLI binary path from PATH. Skipped entirely under
 * ASTRAMEM_DISABLE_PATH_PROBE (test-isolation hygiene shared with
 * runner-plugin's memory-bridge). */
async function probeCliPath(): Promise<string | null> {
  if (process.env.ASTRAMEM_DISABLE_PATH_PROBE) return null;
  const whichCmd = process.platform === "win32" ? "where" : "which";
  return new Promise<string | null>((resolve) => {
    try {
      const proc = spawn(whichCmd, ["astramem"], { stdio: ["ignore", "pipe", "ignore"] });
      let out = "";
      proc.stdout?.on("data", (chunk: Buffer) => {
        out += chunk.toString();
      });
      proc.on("close", (code) => {
        const line = out.split(/\r?\n/)[0]?.trim() ?? "";
        resolve(code === 0 && line.length > 0 ? line : null);
      });
      proc.on("error", () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

/** Candidate installed-plugin roots for runtime discovery. */
async function candidateRoots(): Promise<string[]> {
  const roots: string[] = [];
  const envRoot = process.env.CLAUDE_PLUGIN_ROOT_MEMORY;
  if (envRoot) roots.push(envRoot);
  const cliPath = await probeCliPath();
  if (cliPath) roots.push(path.dirname(path.dirname(cliPath)));
  return roots;
}

/** Step 4 — file-URL import from an installed plugin root. Prefers the
 * selector; falls back to the local-provider factory + health probe for
 * plugin builds predating the selector export. */
async function resolveFromRoot(root: string): Promise<WireProvider | null> {
  const selectorPath = path.join(root, "src", "lib", "selector.ts");
  try {
    await fs.access(selectorPath);
    const mod = (await import(pathToFileURL(selectorPath).href)) as SelectorModule;
    if (typeof mod.resolveProvider === "function") {
      const { provider } = await mod.resolveProvider();
      if (isProvider(provider)) return provider;
    }
  } catch {
    // Fall through to the local-provider factory.
  }
  try {
    const localPath = path.join(root, "src", "providers", "local.ts");
    const mod = (await import(pathToFileURL(localPath).href)) as LocalProviderModule;
    const local = mod.createLocalProvider();
    if (isProvider(local) && (await healthOk(local))) return local;
  } catch {
    // Unavailable at this root.
  }
  return null;
}

async function resolveUncached(): Promise<WireProvider | null> {
  const viaSelector = await resolveViaSelectorDep();
  if (viaSelector) return viaSelector;
  const viaProviders = await resolveViaProviderDep();
  if (viaProviders) return viaProviders;
  for (const root of await candidateRoots()) {
    const viaRoot = await resolveFromRoot(root);
    if (viaRoot) return viaRoot;
  }
  return null;
}

/**
 * Resolve (and cache) an astramem wire provider. Never throws; resolves
 * null when no strategy succeeds. First success is cached for the process
 * lifetime — call `_resetResolveCache()` in tests.
 */
export async function resolveWireProvider(): Promise<WireProvider | null> {
  if (_injected !== undefined) return _injected;
  if (_cache !== null) return _cache === false ? null : _cache;
  const provider = await resolveUncached();
  _cache = provider ?? false;
  return provider;
}
