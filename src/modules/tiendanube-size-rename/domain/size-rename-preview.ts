import type { TiendanubeProduct } from "@/modules/tiendanube/domain/tiendanube-products.model";

export type SizeRenameMapping = Readonly<Record<string, string>>;

export type SizeRenameChange = Readonly<{
  productId: string;
  productName: string;
  variantId: string;
  sku: string | null;
  color: string | null;
  oldSize: string;
  newSize: string;
}>;

export type SizeRenamePreview = Readonly<{
  changes: readonly SizeRenameChange[];
  warnings: readonly string[];
  selectedProducts: number;
  selectedVariants: number;
}>;

export function availableSizes(products: readonly TiendanubeProduct[]): readonly string[] {
  const sizes = new Set<string>();
  for (const product of products) {
    for (const variant of product.variants) {
      if (variant.size?.trim()) sizes.add(variant.size.trim());
    }
  }
  return [...sizes].sort((left, right) => left.localeCompare(right, "es", { numeric: true }));
}

/**
 * Read-only preview. Never issues requests or mutates existing products.
 * Detects duplicate size/color combinations after applying proposed mapping.
 */
export function previewSizeChanges(
  products: readonly TiendanubeProduct[],
  mapping: SizeRenameMapping,
): SizeRenamePreview {
  const changes: SizeRenameChange[] = [];
  const warnings = new Set<string>();
  let selectedVariants = 0;

  for (const product of products) {
    const futureVariants: {
      id: string;
      size: string | null;
      color: string | null;
      changed: boolean;
    }[] = [];

    for (const variant of product.variants) {
      selectedVariants += 1;
      const originalSize = variant.size?.trim() || null;
      const proposed = originalSize === null ? undefined : mapping[originalSize];
      const changed = proposed !== undefined && proposed.trim() !== originalSize;
      const nextSize = proposed === undefined ? originalSize : proposed.trim();

      if (changed && !nextSize) {
        warnings.add("El talle nuevo no puede estar vacío: " + product.name + " (" + variant.id + ").");
      }
      if (originalSize && changed && nextSize) {
        changes.push({
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          sku: variant.sku,
          color: variant.color,
          oldSize: originalSize,
          newSize: nextSize,
        });
      }

      futureVariants.push({
        id: variant.id,
        size: nextSize,
        color: variant.color,
        changed: Boolean(changed && nextSize),
      });
    }

    const combinations = new Map<string, typeof futureVariants>();
    for (const variant of futureVariants) {
      if (!variant.size) continue;
      const key = JSON.stringify([
        variant.color?.trim().toLocaleLowerCase("es") ?? "",
        variant.size.toLocaleLowerCase("es"),
      ]);
      const existing = combinations.get(key) ?? [];
      existing.push(variant);
      combinations.set(key, existing);
    }

    for (const duplicates of combinations.values()) {
      if (duplicates.length <= 1 || !duplicates.some((variant) => variant.changed)) continue;
      const example = duplicates[0];
      warnings.add(
        'Talles duplicados en "' + product.name + '": color ' +
        (example?.color || "sin color") + ", talle " + (example?.size || "sin talle") +
        " (" + duplicates.map((item) => item.id).join(", ") + ").",
      );
    }
  }

  return {
    changes,
    warnings: [...warnings],
    selectedProducts: products.length,
    selectedVariants,
  };
}

export type SizeColorGroup = Readonly<{
  color: string;
  products: number;
  variants: number;
  sizes: readonly Readonly<{
    size: string;
    variants: number;
    products: number;
  }>[];
}>;

/** Aggregates every loaded product across all colors without modifying data. */
export function groupSizesByColor(
  products: readonly TiendanubeProduct[],
): readonly SizeColorGroup[] {
  const colors = new Map<string, {
    productIds: Set<string>;
    variants: number;
    sizes: Map<string, { variants: number; productIds: Set<string> }>;
  }>();

  for (const product of products) {
    for (const variant of product.variants) {
      const color = variant.color?.trim() || "Sin color";
      const size = variant.size?.trim() || "Sin talle";
      const colorGroup = colors.get(color) ?? {
        productIds: new Set<string>(),
        variants: 0,
        sizes: new Map<string, { variants: number; productIds: Set<string> }>(),
      };
      colorGroup.productIds.add(product.id);
      colorGroup.variants += 1;
      const sizeGroup = colorGroup.sizes.get(size) ?? {
        variants: 0,
        productIds: new Set<string>(),
      };
      sizeGroup.variants += 1;
      sizeGroup.productIds.add(product.id);
      colorGroup.sizes.set(size, sizeGroup);
      colors.set(color, colorGroup);
    }
  }

  return [...colors].map(([color, data]) => ({
    color,
    products: data.productIds.size,
    variants: data.variants,
    sizes: [...data.sizes].map(([size, entry]) => ({
      size,
      variants: entry.variants,
      products: entry.productIds.size,
    })).sort((left, right) =>
      left.size.localeCompare(right.size, "es", { numeric: true }),
    ),
  })).sort((left, right) =>
    left.color.localeCompare(right.color, "es"),
  );
}
