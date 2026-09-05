// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  PromotionOption,
} from "../domain/promotions.repository";

import {
  DiscountCell,
  FinalPriceCell,
  NetCell,
  PromotionContent,
} from "./promotions-table-cells";

describe(
  "promotions-table-cells",
  () => {
    it(
      "muestra aporte vendedor y aporte Mercado Libre como ML",
      () => {
        render(
          <DiscountCell
            option={option()}
          />,
        );

        expect(
          screen.getByText(
            /5.524,80/,
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /9,2% a tu cargo/,
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /2.095,20/,
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /3,5% Mercado Libre/,
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "muestra Cyber Fest como nueva propuesta",
      () => {
        render(
          <PromotionContent
            option={option()}
          />,
        );

        expect(
          screen.getByText(
            "¡Nueva propuesta!",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "CYBER FEST",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Con aporte de Mercado Libre",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "prioriza precio real o máximo de campaña",
      () => {
        render(
          <FinalPriceCell
            option={option()}
          />,
        );

        expect(
          screen.getByText(
            /52.380/,
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "muestra recibís como estimado",
      () => {
        render(
          <NetCell
            option={option()}
          />,
        );

        expect(
          screen.getByText(
            /32.893,25/,
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "estimado",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);

function option(): PromotionOption {
  return {
    id: "CYBER-1",
    offerId: null,
    type: "DEAL",
    name: "Cyber Fest 09.09",
    status: "candidate",
    originalPrice: 60000,
    promotionPrice: 52380,
    minPromotionPrice: 48000,
    maxPromotionPrice: 52380,
    suggestedPromotionPrice: 51000,
    requiresPriceSelection: true,
    discountPercent: 12.7,
    sellerDiscountAmount: 5524.8,
    mercadoLibreBaseContributionAmount:
      2095.2,
    mercadoLibreBoostAmount: 0,
    mercadoLibreContributionAmount:
      2095.2,
    estimatedNetAmount: 32893.25,
    suggestedEstimatedNetAmount:
      null,
    startDate:
      "2026-08-31T00:00:00Z",
    finishDate:
      "2026-09-14T23:59:59Z",
    canApply: true,
    canRemove: false,
    saleEstimate: {
      saleFeeAmount: 10000,
      estimatedNetAmount:
        32893.25,
    },
  };
}
