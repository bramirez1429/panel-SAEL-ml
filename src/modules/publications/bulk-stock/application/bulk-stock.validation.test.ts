import { describe, expect, it } from "vitest";

import {
  removeUnselectedQuantities,
  validateBulkStockJobRequest,
  validateBulkStockForm,
  validateBulkStockPreviewRequest,
} from "./bulk-stock.validation";

describe("bulk stock validation", () => {
  it("mantiene el productType interno aunque la etiqueta sea visual", () => {
    expect(validateBulkStockForm({
      productType: "REMERA_MUJER",
      sizes: ["38"],
      quantityBySize: { "38": 0 },
    })).toEqual({
      valid: true,
      request: {
        productType: "REMERA_MUJER",
        sizes: [{ size: "38", quantity: 0 }],
      },
    });
  });

  it("acepta quantity 0, quantity 3 y múltiples talles", () => {
    const result = validateBulkStockForm({
      productType: "BUZO_MUJER",
      sizes: ["40", "42"],
      quantityBySize: { "40": 0, "42": 3 },
    });

    expect(result).toEqual({
      valid: true,
      request: {
        productType: "BUZO_MUJER",
        sizes: [
          { size: "40", quantity: 0 },
          { size: "42", quantity: 3 },
        ],
      },
    });
  });

  it("elimina el stock asociado cuando se elimina un talle", () => {
    expect(removeUnselectedQuantities(
      { "40": 4, "42": 2, "44": 0 },
      ["40", "44"],
    )).toEqual({ "40": 4, "44": 0 });
  });

  it("requiere un entero no negativo para cada talle", () => {
    const result = validateBulkStockForm({
      productType: "REMERA_MUJER",
      sizes: ["40", "42", "44"],
      quantityBySize: { "40": 1.5, "42": -1 },
    });

    expect(result).toMatchObject({
      valid: false,
      fieldErrors: {
        "quantity.40": expect.any(String),
        "quantity.42": expect.any(String),
        "quantity.44": expect.any(String),
      },
    });
  });

  it("rechaza un payload realmente inválido", () => {
    expect(validateBulkStockPreviewRequest({
      productType: "BUZO_MUJER",
      sizes: [{ size: "40", quantity: -1 }],
    })).toBeNull();
    expect(validateBulkStockPreviewRequest({
      productType: "TIPO_INEXISTENTE",
      sizes: [{ size: "40", quantity: 0 }],
    })).toBeNull();
    expect(validateBulkStockPreviewRequest({
      productType: "BUZO_MUJER",
      sizes: [{ size: "", quantity: 3 }],
    })).toBeNull();
  });

  it("normaliza un request válido sin perder quantity 0", () => {
    expect(validateBulkStockPreviewRequest({
      productType: "BUZO_MUJER",
      sizes: [
        { size: " 40 ", quantity: 0 },
        { size: "42", quantity: 3 },
      ],
    })).toEqual({
      productType: "BUZO_MUJER",
      sizes: [
        { size: "40", quantity: 0 },
        { size: "42", quantity: 3 },
      ],
    });
  });

  it("valida un job con cuatro targets USER_PRODUCT y LEGACY", () => {
    const targets = [
      jobTarget("MLAU1", "USER_PRODUCT", 0, { familyId: "1", userProductId: "MLAU1" }),
      jobTarget("MLAU2", "USER_PRODUCT", 3, { familyId: "1", userProductId: "MLAU2" }),
      jobTarget("MLA3:7", "LEGACY", 0, { variationId: null }),
      jobTarget("MLA4:8", "LEGACY", 2, { variationId: "8" }),
    ];

    expect(validateBulkStockJobRequest({ targets })).toEqual({ targets });
    expect(validateBulkStockJobRequest({
      targets: [jobTarget("MLAU1", "USER_PRODUCT", 0, { familyId: null, userProductId: "MLAU1" })],
    })).toBeNull();
  });
});

function jobTarget(
  identifier: string,
  model: "USER_PRODUCT" | "LEGACY",
  requestedQuantity: number,
  fields: Readonly<{ familyId?: string | null; userProductId?: string | null; variationId?: string | null }>,
) {
  return {
    identifier,
    title: "Brooklyn",
    color: "Negro",
    size: "40",
    itemId: `MLA${identifier.replace(/\D/g, "").slice(0, 1) || "1"}`,
    userProductId: fields.userProductId ?? null,
    variationId: fields.variationId ?? null,
    familyId: fields.familyId ?? null,
    model,
    currentQuantity: 1,
    requestedQuantity,
    currentStatus: "paused",
    needsChange: true,
    editable: true,
  } as const;
}
