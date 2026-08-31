import { describe, expect, it } from "vitest";

import { promotionOptionToRemovalSelection } from "./promotion-removal.mapper";

describe("promotionOptionToRemovalSelection", () => {
  it.each([
    [
      { type: "DEAL", id: "P1", offerId: null },
      { promotionType: "DEAL", promotionId: "P1", offerId: null },
    ],
    [
      { type: "SELLER_CAMPAIGN", id: "S1", offerId: null },
      { promotionType: "SELLER_CAMPAIGN", promotionId: "S1", offerId: null },
    ],
    [
      { type: "SMART", id: "P2", offerId: "O2" },
      { promotionType: "SMART", promotionId: "P2", offerId: "O2" },
    ],
    [
      { type: "PRICE_DISCOUNT", id: null, offerId: null },
      { promotionType: "PRICE_DISCOUNT", promotionId: null, offerId: null },
    ],
  ])("normaliza una baja específica", (option, expected) => {
    expect(promotionOptionToRemovalSelection(option)).toEqual(expected);
  });

  it.each([
    { type: "DEAL", id: null, offerId: null },
    { type: "SELLER_CAMPAIGN", id: null, offerId: null },
    { type: "SMART", id: "P1", offerId: null },
    { type: "UNKNOWN", id: "P1", offerId: null },
  ])("rechaza opciones incompletas", (option) => {
    expect(promotionOptionToRemovalSelection(option)).toBeNull();
  });
});
