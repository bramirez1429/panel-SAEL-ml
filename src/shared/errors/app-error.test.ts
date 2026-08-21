import { describe, expect, it } from "vitest";

import { AppError } from "./app-error";

describe("AppError", () => {
  it("inherits from Error", () => {
    const error = new AppError("Something failed", "UNEXPECTED_ERROR");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it("preserves the message", () => {
    const error = new AppError("Something failed", "UNEXPECTED_ERROR");

    expect(error.message).toBe("Something failed");
  });

  it("preserves the typed error code", () => {
    const error = new AppError("Something failed", "UNEXPECTED_ERROR");

    expect(error.code).toBe("UNEXPECTED_ERROR");
  });

  it("supports an optional cause", () => {
    const cause = new Error("Original failure");
    const error = new AppError("Something failed", "UNEXPECTED_ERROR", {
      cause,
    });

    expect(error.cause).toBe(cause);
  });
});
