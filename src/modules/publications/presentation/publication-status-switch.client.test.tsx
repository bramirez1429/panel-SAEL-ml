import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublicationStatusSwitch } from "./publication-status-switch.client";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("PublicationStatusSwitch", () => {
  afterEach(() => {
    cleanup();
    refresh.mockClear();
  });

  it("sincroniza Tag y Switch al pausar una publicación Legacy completa", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, confirmed: "paused" });
    render(
      <PublicationStatusSwitch
        action={action}
        initialStatus="active"
        publicationId="MLA-1"
        target={{ type: "legacy", itemId: "MLA-1", variationId: null }}
      />,
    );

    const control = screen.getByRole("switch");
    expect(control).toBeChecked();
    fireEvent.click(control);

    await vi.waitFor(() => expect(screen.getByText("Pausada")).toBeInTheDocument());
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(action).toHaveBeenCalledWith({
      publicationId: "MLA-1",
      target: { type: "legacy", itemId: "MLA-1", variationId: null },
      status: "paused",
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("deshabilita el switch para publicaciones finalizadas", () => {
    render(
      <PublicationStatusSwitch
        initialStatus="closed"
        publicationId="MLA-1"
        target={{ type: "legacy", itemId: "MLA-1", variationId: null }}
      />,
    );

    expect(screen.getByText("Finalizada")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeDisabled();
  });
});
