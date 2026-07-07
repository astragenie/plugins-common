// resolveWireProvider — resolution chain, caching, and runtime discovery.

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { _resetResolveCache, _setWireProvider, resolveWireProvider } from "../src/index.ts";
import type { WireProvider } from "../src/index.ts";

const fakeProvider: WireProvider = {
  remember: async () => {},
  recall: async () => ({ hits: [] }),
  health: async () => ({ ok: true }),
};

let tmpRoot: string | null = null;

beforeEach(() => {
  _resetResolveCache();
  process.env.ASTRAMEM_DISABLE_PATH_PROBE = "1";
  process.env.CLAUDE_PLUGIN_ROOT_MEMORY = undefined;
});

afterEach(async () => {
  _resetResolveCache();
  process.env.CLAUDE_PLUGIN_ROOT_MEMORY = undefined;
  if (tmpRoot) {
    await fs.rm(tmpRoot, { recursive: true, force: true });
    tmpRoot = null;
  }
});

describe("resolution chain", () => {
  test("injected provider wins", async () => {
    _setWireProvider(fakeProvider);
    await expect(resolveWireProvider()).resolves.toBe(fakeProvider);
  });

  test("injected null simulates absence", async () => {
    _setWireProvider(null);
    await expect(resolveWireProvider()).resolves.toBeNull();
  });

  test("resolves null when nothing is discoverable (no dep, no env, no PATH)", async () => {
    // The optional peer is not installed in this workspace, env root is
    // unset, and the PATH probe is disabled — every step must fail-silent.
    await expect(resolveWireProvider()).resolves.toBeNull();
  });

  test("negative result is cached (no re-discovery per call)", async () => {
    await expect(resolveWireProvider()).resolves.toBeNull();
    // Point env at a valid fake root AFTER the negative cache — must still
    // resolve null until the cache is reset.
    process.env.CLAUDE_PLUGIN_ROOT_MEMORY = await writeFakePluginRoot();
    await expect(resolveWireProvider()).resolves.toBeNull();
    _resetResolveCache();
    const resolved = await resolveWireProvider();
    expect(resolved).not.toBeNull();
  });
});

describe("runtime plugin-root discovery", () => {
  test("resolves via CLAUDE_PLUGIN_ROOT_MEMORY selector import", async () => {
    process.env.CLAUDE_PLUGIN_ROOT_MEMORY = await writeFakePluginRoot();

    const provider = await resolveWireProvider();

    expect(provider).not.toBeNull();
    await expect(provider?.remember({ id: "1", type: "note", text: "t" })).resolves.toBe(
      "fake-remember",
    );
  });

  test("falls back to local-provider factory when selector is absent", async () => {
    process.env.CLAUDE_PLUGIN_ROOT_MEMORY = await writeFakePluginRoot({ selector: false });

    const provider = await resolveWireProvider();

    expect(provider).not.toBeNull();
    await expect(provider?.remember({ id: "1", type: "note", text: "t" })).resolves.toBe(
      "fake-local-remember",
    );
  });

  test("resolves null for a root with neither module", async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "astramem-client-empty-"));
    process.env.CLAUDE_PLUGIN_ROOT_MEMORY = tmpRoot;
    await expect(resolveWireProvider()).resolves.toBeNull();
  });
});

/** Write a throwaway fake plugin root with a selector module and/or a
 * local-provider factory module matching the real plugin's layout. */
async function writeFakePluginRoot(opts: { selector?: boolean } = {}): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "astramem-client-root-"));
  tmpRoot = root;
  const libDir = path.join(root, "src", "lib");
  const providersDir = path.join(root, "src", "providers");
  await fs.mkdir(libDir, { recursive: true });
  await fs.mkdir(providersDir, { recursive: true });

  if (opts.selector !== false) {
    await fs.writeFile(
      path.join(libDir, "selector.ts"),
      `export async function resolveProvider() {
  return {
    provider: {
      remember: async () => "fake-remember",
      recall: async () => ({ hits: [] }),
      health: async () => ({ ok: true })
    }
  };
}
`,
    );
  }

  await fs.writeFile(
    path.join(providersDir, "local.ts"),
    `export function createLocalProvider() {
  return {
    remember: async () => "fake-local-remember",
    recall: async () => ({ hits: [] }),
    health: async () => ({ ok: true })
  };
}
`,
  );

  return tmpRoot;
}
