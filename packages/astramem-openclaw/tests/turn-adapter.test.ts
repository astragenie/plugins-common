import { describe, expect, test } from "bun:test";
import { extractTurnText } from "../src/turn-adapter.ts";

describe("extractTurnText", () => {
  test("extracts from a messages[] array (role/text shape)", () => {
    const event = {
      messages: [
        { role: "user", text: "what's the plan" },
        { role: "assistant", text: "here's the plan" },
      ],
    };
    expect(extractTurnText(event)).toEqual([
      { role: "user", text: "what's the plan" },
      { role: "assistant", text: "here's the plan" },
    ]);
  });

  test("extracts from a messages[] array (role/content shape)", () => {
    const event = {
      messages: [
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi there" },
      ],
    };
    expect(extractTurnText(event)).toEqual([
      { role: "user", text: "hello" },
      { role: "assistant", text: "hi there" },
    ]);
  });

  test("falls back to finalMessages when messages is absent", () => {
    const event = { finalMessages: [{ role: "user", text: "hey" }] };
    expect(extractTurnText(event)).toEqual([{ role: "user", text: "hey" }]);
  });

  test("falls back to flat userMessage/assistantReply fields", () => {
    const event = { userMessage: "what time is it", assistantReply: "3pm" };
    expect(extractTurnText(event)).toEqual([
      { role: "user", text: "what time is it" },
      { role: "assistant", text: "3pm" },
    ]);
  });

  test("falls back to prompt/reply field aliases", () => {
    const event = { prompt: "hi", reply: "hello" };
    expect(extractTurnText(event)).toEqual([
      { role: "user", text: "hi" },
      { role: "assistant", text: "hello" },
    ]);
  });

  test("returns [] for an unrecognized shape", () => {
    expect(extractTurnText({ somethingElse: 42 })).toEqual([]);
    expect(extractTurnText(null)).toEqual([]);
    expect(extractTurnText(undefined)).toEqual([]);
    expect(extractTurnText("not an object")).toEqual([]);
  });

  test("skips message entries missing a recognizable role or text", () => {
    const event = {
      messages: [
        { role: "system", text: "ignored" },
        { role: "user", text: "" },
        { role: "assistant" },
      ],
    };
    expect(extractTurnText(event)).toEqual([]);
  });
});
