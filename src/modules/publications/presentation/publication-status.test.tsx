import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicationStatus } from "./publication-status";

describe("PublicationStatus", () => {
  it.each([
    ["active", "Activa"],
    ["paused", "Pausada"],
    ["closed", "Finalizada"],
  ])("maps %s to %s", (status, label) => {
    render(<PublicationStatus status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("humanizes unknown backend codes safely", () => {
    render(<PublicationStatus status="blocked_by_policy" />);
    expect(screen.getByText("Blocked By Policy")).toBeInTheDocument();
  });
});
