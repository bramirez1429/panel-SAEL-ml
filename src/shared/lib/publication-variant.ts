import {
  comparePublicationTitlesBySize,
  publicationTitlePresentation,
} from "./publication-size";

type PublicationVariantAttribute = Readonly<{
  id: string;
  name?: string | null;
  value: string | null;
}>;

type PublicationVariantSource = Readonly<{
  title: string;
  price: number | null;
  attributes?: readonly PublicationVariantAttribute[];
}>;

export type PublicationVariantGroup<T> = Readonly<{
  key: string;
  label: string;
  publications: readonly T[];
}>;

const ATTRIBUTE_PRIORITIES = [
  ["COLOR"],
  ["VARIANT", "VARIATION", "VARIANTE"],
  ["MODEL", "MODELO"],
  ["PRESENTATION", "PRESENTACION", "PACK"],
] as const;

export function publicationVariantGroup(
  publication: PublicationVariantSource,
): Readonly<{ key: string; label: string }> {
  const attributeLabel = usefulVariantAttribute(publication.attributes ?? []);
  const label = attributeLabel ?? fallbackVariantLabel(publication.title);

  return {
    key: normalizeVariantKey(label),
    label,
  };
}

export function groupPublicationsByVariant<T extends PublicationVariantSource>(
  publications: readonly T[],
): readonly PublicationVariantGroup<T>[] {
  const groups = new Map<string, { label: string; publications: T[] }>();

  publications.forEach((publication) => {
    const variant = publicationVariantGroup(publication);
    const group = groups.get(variant.key);

    if (group) {
      group.publications.push(publication);
    } else {
      groups.set(variant.key, {
        label: variant.label,
        publications: [publication],
      });
    }
  });

  return [...groups.entries()].map(([key, group]) => ({
    key,
    label: group.label,
    publications: [...group.publications].sort(comparePublicationsByPriceAndSize),
  }));
}

function comparePublicationsByPriceAndSize(
  left: PublicationVariantSource,
  right: PublicationVariantSource,
): number {
  const leftPrice = left.price ?? Number.MAX_SAFE_INTEGER;
  const rightPrice = right.price ?? Number.MAX_SAFE_INTEGER;

  if (leftPrice !== rightPrice) return leftPrice - rightPrice;
  return comparePublicationTitlesBySize(left.title, right.title);
}

function usefulVariantAttribute(
  attributes: readonly PublicationVariantAttribute[],
): string | null {
  for (const identifiers of ATTRIBUTE_PRIORITIES) {
    const attribute = attributes.find((candidate) => {
      if (!candidate.value?.trim()) return false;
      const descriptor = normalizeAttributeDescriptor(
        `${candidate.id} ${candidate.name ?? ""}`,
      );
      return identifiers.some((identifier) => descriptor.includes(identifier));
    });

    if (attribute?.value) return cleanLabel(attribute.value);
  }

  return null;
}

function fallbackVariantLabel(title: string): string {
  const titleWithoutSize = publicationTitlePresentation(title).title;
  const withoutOrphanSizeLabel = titleWithoutSize
    .replace(/\bTALLE\b/giu, " ")
    .replace(/\s{2,}/gu, " ")
    .trim();

  return withoutOrphanSizeLabel || title.trim() || "Otra variante";
}

function cleanLabel(value: string): string {
  return value.trim().replace(/\s{2,}/gu, " ");
}

function normalizeAttributeDescriptor(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toUpperCase();
}

function normalizeVariantKey(value: string): string {
  return normalizeAttributeDescriptor(cleanLabel(value)).toLowerCase();
}
