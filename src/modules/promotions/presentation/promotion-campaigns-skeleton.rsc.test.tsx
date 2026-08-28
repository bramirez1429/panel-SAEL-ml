import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");

  return {
    ...actual,
    Skeleton: Object.freeze({}),
  };
});

import { PromotionCampaignsSkeleton } from "./promotion-campaigns-skeleton";

describe("PromotionCampaignsSkeleton en el runtime RSC", () => {
  it("renderiza SkeletonInput aunque el client reference no exponga propiedades estáticas", () => {
    render(<PromotionCampaignsSkeleton />);

    expect(screen.getByLabelText("Cargando promociones")).toBeInTheDocument();
    expect(document.querySelector(".ant-skeleton-input")).toBeInTheDocument();
  });
});
