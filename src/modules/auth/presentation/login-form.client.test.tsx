import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ loginAction: vi.fn() }));

import { LoginForm } from "./login-form.client";

describe("LoginForm", () => {
  afterEach(() => {
    cleanup();
    mocks.loginAction.mockReset();
  });

  it("shows Zod validation errors without sending invalid credentials", async () => {
    const user = userEvent.setup();
    render(<LoginForm action={mocks.loginAction} />);

    await user.type(screen.getByLabelText("Email"), "email-invalido");
    await user.type(screen.getByLabelText("Contraseña"), "password");
    await user.click(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    );

    expect(
      await screen.findByText("Ingresá un email válido."),
    ).toBeInTheDocument();
    expect(mocks.loginAction).not.toHaveBeenCalled();
  });
});
