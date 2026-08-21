import { describe, expect, it } from "vitest";

import { backendStatusResponseSchema } from "./backend-status.schema";

describe("backendStatusResponseSchema", () => {
  it("accepts the verified NestJS response", () => {
    expect(backendStatusResponseSchema.parse("Hello World!")).toBe(
      "Hello World!",
    );
  });

  it("rejects responses outside the verified contract", () => {
    expect(() => backendStatusResponseSchema.parse({ status: "ok" })).toThrow();
  });
});
