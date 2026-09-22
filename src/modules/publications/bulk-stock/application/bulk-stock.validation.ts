import {
  BULK_STOCK_PRODUCT_TYPES,
  type BulkStockPreviewRequest,
  type BulkStockProductType,
  type CreateBulkStockJobRequest,
} from "../domain/bulk-stock.model";

export type BulkStockFormValues = Readonly<{
  productType: BulkStockProductType | null;
  sizes: readonly string[];
  quantityBySize: Readonly<Record<string, number | null | undefined>>;
}>;

export type BulkStockValidationResult =
  | Readonly<{ valid: true; request: BulkStockPreviewRequest }>
  | Readonly<{ valid: false; fieldErrors: Readonly<Record<string, string>> }>;

export function validateBulkStockForm(values: BulkStockFormValues): BulkStockValidationResult {
  const fieldErrors: Record<string, string> = {};
  if (!values.productType || !BULK_STOCK_PRODUCT_TYPES.includes(values.productType)) {
    fieldErrors.productType = "Seleccioná un tipo.";
  }

  const sizes = values.sizes.map((size) => size.trim());
  if (
    sizes.length === 0 ||
    sizes.length > 100 ||
    sizes.some((size) => !size) ||
    new Set(sizes.map(normalizeSize)).size !== sizes.length
  ) {
    fieldErrors.sizes = "Seleccioná al menos un talle válido, sin repetir.";
  }

  for (const size of sizes.filter(Boolean)) {
    const quantity = values.quantityBySize[size];
    if (!isValidQuantity(quantity)) {
      fieldErrors[`quantity.${size}`] = "Ingresá un entero mayor o igual a cero.";
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !values.productType) {
    return { valid: false, fieldErrors };
  }

  return {
    valid: true,
    request: {
      productType: values.productType,
      sizes: sizes.map((size) => ({
        size,
        quantity: values.quantityBySize[size] as number,
      })),
    },
  };
}

export function validateBulkStockPreviewRequest(value: unknown): BulkStockPreviewRequest | null {
  if (!isRecord(value) || !isProductType(value.productType) || !Array.isArray(value.sizes)) {
    return null;
  }
  if (value.sizes.length === 0 || value.sizes.length > 100) return null;

  const seen = new Set<string>();
  const sizes: Array<{ size: string; quantity: number }> = [];
  for (const entry of value.sizes) {
    if (!isRecord(entry)) return null;
    const size = typeof entry.size === "string" ? entry.size.trim() : "";
    const quantity = entry.quantity;
    const normalizedSize = normalizeSize(size);
    if (
      !size ||
      !isValidQuantity(quantity) ||
      seen.has(normalizedSize)
    ) {
      return null;
    }
    seen.add(normalizedSize);
    sizes.push({ size, quantity: quantity as number });
  }

  return { productType: value.productType, sizes };
}

export function validateBulkStockJobRequest(value: unknown): CreateBulkStockJobRequest | null {
  if (!isRecord(value) || !Array.isArray(value.targets) || value.targets.length === 0) return null;

  const targets = value.targets.map((entry) => validateJobTarget(entry));
  return targets.every((target): target is NonNullable<typeof target> => target !== null)
    ? { targets: targets as CreateBulkStockJobRequest["targets"] }
    : null;
}

function validateJobTarget(value: unknown): CreateBulkStockJobRequest["targets"][number] | null {
  if (!isRecord(value)) return null;
  const model = value.model;
  const itemId = text(value.itemId);
  const identifier = text(value.identifier);
  const size = text(value.size);
  const currentQuantity = value.currentQuantity;
  const requestedQuantity = value.requestedQuantity;
  const familyId = nullableText(value.familyId);
  const userProductId = nullableText(value.userProductId);
  const variationId = nullableText(value.variationId);

  if (
    (model !== "USER_PRODUCT" && model !== "LEGACY") ||
    !/^MLA\d+$/u.test(itemId) ||
    !identifier ||
    !size ||
    !isValidQuantity(currentQuantity) ||
    !isValidQuantity(requestedQuantity) ||
    typeof value.needsChange !== "boolean" ||
    typeof value.editable !== "boolean"
  ) return null;

  if (model === "USER_PRODUCT") {
    if (!/^MLAU\d+$/u.test(userProductId ?? "") || !/^\d+$/u.test(familyId ?? "")) return null;
  } else if (variationId !== null && !/^\d+$/u.test(variationId)) {
    return null;
  }

  return value as CreateBulkStockJobRequest["targets"][number];
}

export function removeUnselectedQuantities(
  quantityBySize: Readonly<Record<string, number | null | undefined>>,
  selectedSizes: readonly string[],
): Readonly<Record<string, number | null | undefined>> {
  const selected = new Set(selectedSizes);
  return Object.fromEntries(Object.entries(quantityBySize).filter(([size]) => selected.has(size)));
}

function isProductType(value: unknown): value is BulkStockProductType {
  return BULK_STOCK_PRODUCT_TYPES.includes(value as BulkStockProductType);
}

function isValidQuantity(quantity: unknown): quantity is number {
  return Number.isInteger(quantity) && (quantity as number) >= 0;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const result = text(value);
  return result || null;
}

function normalizeSize(size: string): string {
  return size.normalize("NFD").replace(/\p{M}+/gu, "").toUpperCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
