import type {
  TiendanubeProduct,
  TiendanubeProductVariant,
} from "@/modules/tiendanube/domain/tiendanube-products.model";

export type StockInputs = Readonly<Record<string, number | null>>;

export type StockUpdate = Readonly<{
  productId: string;
  variantId: string;
  size: string;
  expectedStock: number | null;
  stock: number;
}>;

export type UniqueSize = Readonly<{
  key: string;
  size: string;
  colors: readonly string[];
  variants: number;
  noStock: number;
  stockValues: readonly number[];
}>;

function keyOf(value: string): string {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toUpperCase();
}

function visibleVariants(products: readonly TiendanubeProduct[]) {
  const found: { productId: string; variant: TiendanubeProductVariant }[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    // "unlisted" is NOT visible; it should not be part of a global write.
    if (product.status !== "visible") continue;
    for (const variant of product.variants) {
      if (variant.visible === false || !variant.size?.trim()) continue;
      const id = product.id + ":" + variant.id;
      if (seen.has(id)) continue;
      seen.add(id);
      found.push({ productId: product.id, variant });
    }
  }
  return found;
}

/** Exactly one row per distinct size across every visible product/color. */
export function visibleUniqueSizes(products: readonly TiendanubeProduct[]): readonly UniqueSize[] {
  const sizes = new Map<string, {
    label: string;
    colors: Set<string>;
    stockValues: Set<number>;
    variants: number;
    noStock: number;
  }>();
  for (const { variant } of visibleVariants(products)) {
    const label = variant.size!.trim();
    const key = keyOf(label);
    const size = sizes.get(key) ?? {
      label, colors: new Set<string>(), stockValues: new Set<number>(),
      variants: 0, noStock: 0,
    };
    size.variants += 1;
    size.colors.add(variant.color?.trim() || "Sin color");
    if (variant.stock !== null) size.stockValues.add(variant.stock);
    if (variant.stock === 0) size.noStock += 1;
    sizes.set(key, size);
  }

  return [...sizes].map(([key, group]) => ({
    key,
    size: group.label,
    colors: [...group.colors].sort((a, b) => a.localeCompare(b, "es")),
    variants: group.variants,
    noStock: group.noStock,
    stockValues: [...group.stockValues].sort((a, b) => a - b),
  })).sort((a, b) => a.size.localeCompare(b.size, "es", { numeric: true }));
}

/** Only explicitly completed inputs are sent. Empty stock inputs mean NO CHANGE. */
export function planStockUpdates(
  products: readonly TiendanubeProduct[],
  values: StockInputs,
): readonly StockUpdate[] {
  return visibleVariants(products).flatMap(({ productId, variant }) => {
    const key = keyOf(variant.size!);
    const newStock = values[key];
    if (newStock === null || newStock === undefined ||
        !Number.isSafeInteger(newStock) || newStock < 0 || newStock > 1_000_000 ||
        variant.stock === newStock) return [];
    return [{
      productId,
      variantId: variant.id,
      size: variant.size!.trim(),
      expectedStock: variant.stock,
      stock: newStock,
    }];
  });
}
