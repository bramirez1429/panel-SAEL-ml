import { describe, expect, it } from "vitest";

import {
  getLoginFieldErrors,
  loginInputSchema,
} from "./login-input.schema";

describe("loginInputSchema", () => {
  it("normalizes a valid email without changing the password", () => {
    expect(
      loginInputSchema.parse({
        email: "  USER@Example.COM ",
        password: " password with spaces ",
      }),
    ).toEqual({
      email: "user@example.com",
      password: " password with spaces ",
    });
  });

  it.each([
    [{ email: "not-an-email", password: "password" }, "email"],
    [{ email: "user@example.com", password: "" }, "password"],
  ] as const)("rejects invalid login input", (input, field) => {
    const validation = loginInputSchema.safeParse(input);

    expect(validation.success).toBe(false);
    if (validation.success) {
      return;
    }

    expect(getLoginFieldErrors(validation.error)[field]).toBeTruthy();
  });
});
