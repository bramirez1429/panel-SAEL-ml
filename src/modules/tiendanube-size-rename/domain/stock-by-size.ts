import type {
  TiendanubeProduct,
  TiendanubeProductVariant,
} from "@/modules/tiendanube/domain/tiendanube-products.model";

export type StockInputs = Readonly<Record<string, number | null>>;

export type StockUpdate = Readonly<{
  productId: string;
  variantId: string;
  size: string;
  color: string | null;
  expectedStock: number | null;
  stock: number;
}>;

export type ColorSize = Readonly<{
  key: string;
  size: string;
  variants: number;
}>;

export type ColorSizeGroup = Readonly<{
  key: string;
  color: string;
  sizes: readonly ColorSize[];
}>;

function normalize(value: string): string {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toUpperCase();
}

/** A stock field applies to one color/size combination, never all colors. */
export function colorSizeKey(color: string | null, size: string): string {
  return JSON.stringify([normalize(color ?? ""), normalize(size)]);
}

function visibleVariants(products: readonly TiendanubeProduct[]) {
  const found: { productId: string; variant: TiendanubeProductVariant }[] = [];
  const seen = new Set<string>();

  for (const product of products) {
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

/**
 * Only distinct colors are shown; each color contains each size once.
 * "Crema", "Negro" and "Beige" are never merged into one stock input.
 */
export function visibleColorSizes(
  products: readonly TiendanubeProduct[],
): readonly ColorSizeGroup[] {
  const groups = new Map<string, {
    color: string;
    sizes: Map<string, { size: string; variants: number }>;
  }>();

  for (const { variant } of visibleVariants(products)) {
    const rawColor = variant.color?.trim() || null;
    const colorKey = normalize(rawColor ?? "");
    const group = groups.get(colorKey) ?? {
      color: rawColor ?? "Sin color",
      sizes: new Map<string, { size: string; variants: number }>(),
    };
    const size = variant.size!.trim();
    const sizeKey = normalize(size);
    const row = group.sizes.get(sizeKey) ?? { size, variants: 0 };
    row.variants += 1;
    group.sizes.set(sizeKey, row);
    groups.set(colorKey, group);
  }

  return [...groups].map(([key, group]) => ({
    key,
    color: group.color,
    sizes: [...group.sizes].map(([_, row]) => ({
      key: colorSizeKey(key, row.size),
      size: row.size,
      variants: row.variants,
    })).sort((a, b) => a.size.localeCompare(b.size, "es", { numeric: true })),
  })).sort((a, b) => a.color.localeCompare(b.color, "es"));
}

/** Empty inputs mean NO CHANGE; 0 is a valid stock update. */
export function planStockUpdates(
  products: readonly TiendanubeProduct[],
  values: StockInputs,
): readonly StockUpdate[] {
  return visibleVariants(products).flatMap(({ productId, variant }) => {
    const color = variant.color?.trim() || null;
    const key = colorSizeKey(color, variant.size!);
    const newStock = values[key];
    if (newStock === null || newStock === undefined ||
        !Number.isSafeInteger(newStock) || newStock < 0 || newStock > 1_000_000 ||
        variant.stock === newStock) return [];

    return [{
      productId,
      variantId: variant.id,
      size: variant.size!.trim(),
      color,
      expectedStock: variant.stock,
      stock: newStock,
    }];
  });
}
