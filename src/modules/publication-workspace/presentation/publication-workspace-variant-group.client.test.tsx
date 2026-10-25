import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { PublicationWorkspaceVariantGroup } from "./publication-workspace-variant-group.client";

afterEach(cleanup);

it("no monta los editores cerrados y conserva su estado al reabrir", async () => {
  const user = userEvent.setup();
  const mounted = vi.fn();

  function TestEditor() {
    useEffect(() => {
      mounted();
    }, []);
    return <input aria-label="SKU de prueba" defaultValue="" />;
  }

  render(
    <PublicationWorkspaceVariantGroup
      label="Negro"
      count={2}
      imageUrl="https://images.example.com/negro.jpg"
    >
      <TestEditor />
    </PublicationWorkspaceVariantGroup>,
  );

  expect(screen.getByRole("button", { name: "Abrir Negro" }))
    .toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("img", { name: "Imagen de Negro" }))
    .toBeInTheDocument();
  expect(screen.queryByRole("textbox", { name: "SKU de prueba" }))
    .not.toBeInTheDocument();
  expect(mounted).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "Abrir Negro" }));
  const input = screen.getByRole("textbox", { name: "SKU de prueba" });
  await user.type(input, "SKU-CAMBIO");
  expect(input).toHaveValue("SKU-CAMBIO");
  expect(mounted).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "Cerrar Negro" }));
  expect(input).not.toBeVisible();
  await user.click(screen.getByRole("button", { name: "Abrir Negro" }));
  expect(screen.getByRole("textbox", { name: "SKU de prueba" })).toBe(input);
  expect(input).toHaveValue("SKU-CAMBIO");
  expect(mounted).toHaveBeenCalledTimes(1);
});
