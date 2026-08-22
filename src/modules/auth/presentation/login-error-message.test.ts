import { describe, expect, it } from "vitest";

import { ApiError } from "@/shared/api/api-error";

import { getLoginErrorMessage } from "./login-error-message";

describe("getLoginErrorMessage", () => {
  it("returns a neutral message for rejected credentials", () => {
    const error = new ApiError(
      "Technical backend message",
      "API_HTTP_ERROR",
      { status: 401 },
    );

    expect(getLoginErrorMessage(error)).toBe(
      "Email o contraseña incorrectos.",
    );
  });

  it.each([
    ["API_TIMEOUT", "tardó demasiado"],
    ["API_UNREACHABLE", "No pudimos conectarnos"],
    ["API_INVALID_RESPONSE", "respuesta inválida"],
  ] as const)("maps %s without exposing internals", (code, message) => {
    const error = new ApiError("Do not expose this", code);

    expect(getLoginErrorMessage(error)).toContain(message);
    expect(getLoginErrorMessage(error)).not.toContain("Do not expose this");
  });

  it("uses a generic message for unexpected failures", () => {
    expect(getLoginErrorMessage(new Error("secret"))).toBe(
      "No pudimos iniciar sesión. Intentá nuevamente.",
    );
  });
});
