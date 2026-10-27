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
