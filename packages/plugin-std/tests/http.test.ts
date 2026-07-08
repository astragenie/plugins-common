import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { TransientError } from "../src/errors.ts";
import { fetchJson, fetchWithTimeout, withTimeoutSignal } from "../src/http.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** A fetch stand-in that never resolves unless its signal is aborted — mirrors
 * how a real request hangs until the network layer notices the abort. */
function neverRespondingFetch(): typeof fetch {
  return ((_input: string | URL | Request, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    });
  }) as typeof fetch;
}

function okFetch(body: unknown, status = 200): typeof fetch {
  return ((_input: string | URL | Request, _init?: RequestInit) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    )) as typeof fetch;
}

describe("withTimeoutSignal — AC-1 branch coverage", () => {
  test("signal aborts on timeout elapse when no external signal is given", async () => {
    const { signal, clear } = withTimeoutSignal(15);
    expect(signal.aborted).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(signal.aborted).toBe(true);
    clear();
  });

  test("signal aborts when the external signal fires before the timeout", async () => {
    const controller = new AbortController();
    const { signal, clear } = withTimeoutSignal(5000, controller.signal);
    expect(signal.aborted).toBe(false);
    controller.abort();
    expect(signal.aborted).toBe(true);
    clear();
  });

  test("external signal already aborted at call time aborts immediately", () => {
    const controller = new AbortController();
    controller.abort();
    const { signal, clear } = withTimeoutSignal(5000, controller.signal);
    expect(signal.aborted).toBe(true);
    clear();
  });

  test("clear() prevents the timer from firing after the operation settles", async () => {
    const { signal, clear } = withTimeoutSignal(20);
    clear();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(signal.aborted).toBe(false);
  });
});

describe("fetchWithTimeout — AC-1/AC-2 branch coverage", () => {
  test("timeout-fires: a never-responding request aborts after timeoutMs instead of hanging forever", async () => {
    globalThis.fetch = neverRespondingFetch();
    await expect(fetchWithTimeout("https://example.test", { timeoutMs: 20 })).rejects.toThrow(
      TransientError,
    );
  });

  test("external-signal-fires: aborts promptly on external cancellation even with a long timeout", async () => {
    globalThis.fetch = neverRespondingFetch();
    const controller = new AbortController();
    const promise = fetchWithTimeout("https://example.test", {
      timeoutMs: 5000,
      signal: controller.signal,
    });
    controller.abort();
    await expect(promise).rejects.toThrow(TransientError);
  });

  test("success-before-timeout: resolves normally and clears the timer (no leaked timeout)", async () => {
    globalThis.fetch = okFetch({ ok: true });
    const clearSpy = spyOn(globalThis, "clearTimeout");
    const res = await fetchWithTimeout("https://example.test", { timeoutMs: 5000 });
    expect(res.status).toBe(200);
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});

describe("fetchWithTimeout — external signal listener cleanup (regression)", () => {
  test("reusing ONE external AbortSignal across many successful calls does not accumulate abort listeners", async () => {
    globalThis.fetch = okFetch({ ok: true });

    // gepa-core's sequential-runner passes ONE shared AbortSignal across an
    // entire run's candidates x cases. Spy on the signal's own
    // addEventListener/removeEventListener to prove every add is paired with
    // a remove — if withTimeoutSignal's clear() forgets to
    // removeEventListener, adds will keep outpacing removes.
    const controller = new AbortController();
    const addSpy = spyOn(controller.signal, "addEventListener");
    const removeSpy = spyOn(controller.signal, "removeEventListener");

    const CALLS = 50;
    for (let i = 0; i < CALLS; i++) {
      await fetchWithTimeout("https://example.test", {
        timeoutMs: 5000,
        signal: controller.signal,
      });
    }

    const abortAdds = addSpy.mock.calls.filter(([type]) => type === "abort").length;
    const abortRemoves = removeSpy.mock.calls.filter(([type]) => type === "abort").length;

    expect(abortAdds).toBe(CALLS);
    expect(abortRemoves).toBe(CALLS);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

describe("fetchJson — AC-1 branch coverage", () => {
  test("success: decodes a well-formed JSON body", async () => {
    globalThis.fetch = okFetch({ hello: "world" });
    const data = await fetchJson<{ hello: string }>("https://example.test", { timeoutMs: 5000 });
    expect(data).toEqual({ hello: "world" });
  });

  test("non-2xx status throws TransientError with the status attached", async () => {
    globalThis.fetch = okFetch({ error: "boom" }, 500);
    await expect(fetchJson("https://example.test", { timeoutMs: 5000 })).rejects.toMatchObject({
      code: "E_HTTP_STATUS",
      status: 500,
      transient: true,
    });
  });

  test("JSON-parse-failure: a 2xx response with a non-JSON body throws TransientError", async () => {
    globalThis.fetch = ((_input: string | URL | Request, _init?: RequestInit) =>
      Promise.resolve(new Response("not json", { status: 200 }))) as typeof fetch;
    await expect(fetchJson("https://example.test", { timeoutMs: 5000 })).rejects.toMatchObject({
      code: "E_HTTP_PARSE",
      transient: true,
    });
  });

  test("timeout-fires: never-responding request rejects instead of hanging forever", async () => {
    globalThis.fetch = neverRespondingFetch();
    await expect(fetchJson("https://example.test", { timeoutMs: 20 })).rejects.toThrow(
      TransientError,
    );
  });
});
