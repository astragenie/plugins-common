// Shared mocked-fetch harness for this package's tests. Mirrors
// astramem-client/tests/daemon-client.test.ts's mockFetch convention so
// coverage style stays consistent across the two packages.

export interface CapturedRequest {
  url: string;
  method: string | undefined;
  headers: Headers;
  body: unknown;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function mockFetch(handler: (req: CapturedRequest) => Response): CapturedRequest[] {
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

/** Same cast site as `mockFetch` (a throwing handler is a valid `Response`
 * producer as far as the type system is concerned — it just never returns
 * normally), so this avoids re-deriving a `typeof fetch`-compatible cast. */
export function mockFetchReject(err: unknown): CapturedRequest[] {
  return mockFetch(() => {
    throw err;
  });
}

export const testConfigBase = {
  baseUrl: "http://127.0.0.1:7777",
  bearer: "test-bearer",
  projectId: undefined,
  profileEveryNTurns: 50,
  captureEnabled: true,
  recallEnabled: true,
  recallK: 5,
};
