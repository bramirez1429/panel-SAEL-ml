import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PublicationDetail } from "../domain/publication.model";
import {
  PublicationDetailError,
  PublicationDetailLoading,
} from "./publication-detail-states";
import { PublicationDetailView } from "./publication-detail-view";

const familyDetail: PublicationDetail = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Familia real",
  channel: "MERCADO_LIBRE",
  status: "active",
  thumbnailUrl: null,
  pictures: [],
  permalink: "https://example.com/family",
  price: { from: 1000, to: 1500, currency: "ARS" },
  stock: 7,
  sold: 3,
  attributes: [],
  group: {
    key: "family:200",
    type: "USER_PRODUCT",
    familyId: "200",
    userProductId: "UP-200",
    itemId: null,
    childrenCount: 1,
  },
  variants: [
    {
      id: "variant-1",
      itemId: "MLA100",
      userProductId: "MLAU100",
      label: "Azul",
      title: "Variante azul",
      thumbnailUrl: null,
      pictures: [
        { id: "BLUE-1", url: "https://example.com/blue-1.jpg" },
        { id: "BLUE-2", url: "https://example.com/blue-2.jpg" },
      ],
      status: "active",
      price: { amount: 1000, currency: "ARS" },
      stock: 7,
      sold: 3,
      sku: null,
      attributes: [{ id: "COLOR", value: "Azul" }],
      permalink: "https://example.com/variant",
    },
  ],
};

describe("PublicationDetailView", () => {
  afterEach(cleanup);

  it("renders real parent data and keeps advanced editing available", async () => {
    const user = userEvent.setup();
    render(<PublicationDetailView publication={familyDetail} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Familia real" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Familia").length).toBeGreaterThan(0);
    expect(screen.getByText("ARS 1.000 – ARS 1.500")).toBeInTheDocument();
    expect(screen.getAllByText("200").length).toBeGreaterThan(0);
    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(screen.getByText("2", { selector: ".ant-statistic-content-value-int" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver imagen 2 de Azul" })).toBeInTheDocument();
    await user.click(screen.getByText("Edición avanzada"));
    expect(screen.getByText("UP-200")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /expand row/i })).toHaveLength(1);
  });

  it("keeps missing legacy relations and sold values explicit", () => {
    render(
      <PublicationDetailView
        publication={{
          ...familyDetail,
          title: "Legacy sin variaciones",
          permalink: null,
          sold: null,
          group: {
            ...familyDetail.group,
            type: "LEGACY",
            familyId: null,
            itemId: "MLA100",
          },
          variants: [],
        }}
      />,
    );

    expect(screen.getByText("Anterior")).toBeInTheDocument();
    expect(screen.getByText("Variante sin color")).toBeInTheDocument();
    expect(screen.getByText("MLA100")).toBeInTheDocument();
    expect(screen.getAllByTitle("Dato no disponible").length).toBeGreaterThan(
      0,
    );
  });
});

describe("publication detail states", () => {
  afterEach(cleanup);

  it("renders an accessible loading state", () => {
    render(<PublicationDetailLoading />);

    expect(
      screen.getByLabelText("Cargando detalle de la publicación"),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("does not hide controlled errors", () => {
    render(<PublicationDetailError message="El backend respondió con HTTP 400." />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El backend respondió con HTTP 400.",
    );
  });
});
