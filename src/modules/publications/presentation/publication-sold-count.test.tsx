import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicationSoldCount } from "./publication-sold-count";

describe("PublicationSoldCount", () => {
  it.each([[0, "normal"], [19, "normal"], [20, "warm"], [49, "warm"], [50, "high"], [99, "high"], [100, "peak"]] as const)("clasifica %s vendidos como %s", (value, level) => {
    const { container } = render(<PublicationSoldCount value={value} />);
    expect(screen.getByText(String(value)).closest("span")).toHaveAttribute("data-sales-level", level);
    if (level === "normal") expect(container.querySelector("svg")).toBeNull();
    else expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
