"use server";

import { getSaleVariants } from "../application/get-sale-variants";
import { createSalesRepository } from "../sales.composition.server";

export async function loadSaleVariantsAction(saleId: string) {
  return getSaleVariants(
    createSalesRepository(),
    saleId,
  );
}

