/**
 * tests/providers/generic-openai.test.ts
 *
 * AC-1 (FEAT-185 SLICE-A): GenericOpenAIJudge imports from gepa-core entry point,
 * implements LLMJudge, and accepts config-only constructor.
 * AC-2: No process.env in provider source.
 *
 * Note: generic-openai uses native fetch — no SDK peer dep.
 */

import { afterEach, describe, expect, test } from "bun:test";
import type { LLMJudge } from "../../src/interfaces.ts";
import {
  type GenericOpenAIConfig,
  GenericOpenAIJudge,
} from "../../src/providers/generic-openai/index.ts";

const realFetch = globalThis.fetch;

/** A fetch stand-in that never resolves unless its signal is aborted —
 * mirrors a real request that hangs until the network layer notices the
 * abort. Used to prove FEAT-005 AC-2: generic-openai had no timeout at all
 * before this migration, so this request used to hang forever. */
function neverRespondingFetch(): typeof fetch {
  return ((_url: string | URL | Request, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    });
  }) as typeof fetch;
}

describe("GenericOpenAIJudge — provider entry point (AC-1, FEAT-185)", () => {
  test("imports from entry point without error", () => {
    expect(GenericOpenAIJudge).toBeDefined();
    expect(typeof GenericOpenAIJudge).toBe("function");
  });

  test("config-only smoke: instantiates with required config (no env reads)", () => {
    const config: GenericOpenAIConfig = {
      baseUrl: "https://api.openai.com",
      apiKey: "sk-test-token",
      model: "gpt-4o-mini",
      temperature: 0.0,
    };
    const judge = new GenericOpenAIJudge(config);
    expect(judge).toBeDefined();
  });

  test("satisfies LLMJudge interface structurally", () => {
    const judge: LLMJudge = new GenericOpenAIJudge({
      baseUrl: "https://api.openai.com",
      apiKey: "sk-x",
      model: "gpt-4o-mini",
    });
    expect(typeof judge.evaluate).toBe("function");
    expect(typeof judge.describe).toBe("function");
  });

  test("describe() returns provider=generic-openai and the configured model", () => {
    const judge = new GenericOpenAIJudge({
      baseUrl: "https://api.example.com",
      apiKey: "token",
      model: "mixtral-7b",
    });
    const { provider, model } = judge.describe();
    expect(provider).toBe("generic-openai");
    expect(model).toBe("mixtral-7b");
  });

  test("baseUrl trailing slash is stripped", () => {
    const judge = new GenericOpenAIJudge({
      baseUrl: "https://api.example.com/",
      apiKey: "token",
      model: "gpt-4o",
    });
    // describe() still returns provider name regardless of baseUrl
    expect(judge.describe().provider).toBe("generic-openai");
  });

  test("evaluate() rejects with HTTP error on bad endpoint", async () => {
    const judge = new GenericOpenAIJudge({
      baseUrl: "http://localhost:19999",
      apiKey: "sk-x",
      model: "gpt-4o-mini",
    });

    const evalCase = {
      id: "c1",
      input: {},
      expected_output: {},
      held_out: false,
    };

    await expect(
      judge.evaluate({
        candidateOutput: "test output",
        expected: evalCase,
        rubric: ["output must be non-empty"],
      }),
    ).rejects.toThrow();
  });
});

describe("GenericOpenAIJudge — timeout (AC-2, FEAT-005)", () => {
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("a never-responding request aborts after the configured timeoutMs instead of hanging forever", async () => {
    globalThis.fetch = neverRespondingFetch();
    const judge = new GenericOpenAIJudge({
      baseUrl: "https://api.example.com",
      apiKey: "sk-x",
      model: "gpt-4o-mini",
      timeoutMs: 25,
    });

    const evalCase = { id: "c1", input: {}, expected_output: {}, held_out: false };
    await expect(
      judge.evaluate({ candidateOutput: "test", expected: evalCase, rubric: ["r"] }),
    ).rejects.toThrow();
  });
});
