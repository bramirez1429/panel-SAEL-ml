// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { HttpClient } from "./http-client.server";

const apiConfig = {
  baseUrl: "https://api.example.com",
  timeoutMs: 100,
} as const;

describe("HttpClient", () => {
  it("performs a server-side GET and returns text as unknown", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    fetchImplementation.mockResolvedValue(
      new Response("Hello World!", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      }),
    );
    const client = new HttpClient(apiConfig, fetchImplementation);

    await expect(client.get("/")).resolves.toBe("Hello World!");
    expect(fetchImplementation).toHaveBeenCalledWith(
      new URL("https://api.example.com/"),
      expect.objectContaining({
        cache: "no-store",
        method: "GET",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("translates non-successful HTTP responses", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    fetchImplementation.mockResolvedValue(
      new Response(null, { status: 503, statusText: "Unavailable" }),
    );
    const client = new HttpClient(apiConfig, fetchImplementation);

    await expect(client.get("/")).rejects.toMatchObject({
      code: "API_HTTP_ERROR",
      status: 503,
    });
  });

  it("translates invalid JSON bodies", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    fetchImplementation.mockResolvedValue(
      new Response("not-json", {
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new HttpClient(apiConfig, fetchImplementation);

    await expect(client.get("/")).rejects.toMatchObject({
      code: "API_INVALID_RESPONSE",
    });
  });

  it("translates network failures", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    fetchImplementation.mockRejectedValue(new TypeError("fetch failed"));
    const client = new HttpClient(apiConfig, fetchImplementation);

    await expect(client.get("/")).rejects.toMatchObject({
      code: "API_UNREACHABLE",
    });
  });

  it("aborts requests after the configured timeout", async () => {
    const fetchImplementation: typeof fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;

        if (!signal) {
          reject(new Error("Expected a timeout signal"));
          return;
        }

        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        });
      });
    const client = new HttpClient(
      { ...apiConfig, timeoutMs: 5 },
      fetchImplementation,
    );

    await expect(client.get("/")).rejects.toMatchObject({
      code: "API_TIMEOUT",
    });
  });

  it("rejects absolute or protocol-relative request paths", async () => {
    const client = new HttpClient(apiConfig, vi.fn<typeof fetch>());

    await expect(
      client.get("https://other.example.com/"),
    ).rejects.toMatchObject({ code: "API_CONFIGURATION_ERROR" });
  });
});
