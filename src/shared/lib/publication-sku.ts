import { publicationTitlePresentation } from "@/shared/lib/publication-size";

type PublicationSkuSource = Readonly<{
  title: string;
  attributes?: readonly Readonly<{
    id: string;
    name: string | null;
    value: string | null;
  }>[];
}>;

const COLOR_ABBREVIATIONS: readonly Readonly<{
  names: readonly string[];
  abbreviation: string;
}>[] = [
  { names: ["BLANCO", "BLANCA"], abbreviation: "BLA" },
  { names: ["NEGRO", "NEGRA"], abbreviation: "NEG" },
  { names: ["MARRON"], abbreviation: "MAR" },
  { names: ["ROSA"], abbreviation: "ROS" },
  { names: ["LILA"], abbreviation: "LIL" },
  { names: ["GRIS"], abbreviation: "GRI" },
  { names: ["ROJO", "ROJA"], abbreviation: "ROJ" },
  { names: ["AZUL"], abbreviation: "AZU" },
  { names: ["VERDE"], abbreviation: "VER" },
  { names: ["CRUDO", "CRUDA"], abbreviation: "CRU" },
];

export function generatePublicationSku(publication: PublicationSkuSource): string | null {
  const normalizedTitle = normalizeText(publication.title);
  const garmentType = garmentTypeSegment(normalizedTitle);
  if (!garmentType) return null;

  const pack = /\bPACK\s*X\s*(\d+)\b/u.exec(normalizedTitle)?.[1];
  const hasVNeck = /\b(?:CUELLO\s+(?:EN\s+)?V|ESCOTE\s+V)\b/u.test(normalizedTitle);
  const color = colorSegment(publication, normalizedTitle);
  const size = publicationTitlePresentation(publication.title).size;

  return [garmentType, pack ? `P${pack}` : null, hasVNeck ? "V" : null, color, size]
    .filter((segment): segment is string => Boolean(segment))
    .join("-");
}

function garmentTypeSegment(title: string): string | null {
  const isWoman = /\bMUJER(?:ES)?\b/u.test(title);
  const isGirl = /\b(?:NINA|NINAS|NENA|NENAS)\b/u.test(title);

  if (/\bREMERAS?\b/u.test(title)) return isWoman ? "RM" : isGirl ? "RN" : null;
  if (/\bBUZOS?\b/u.test(title)) return isWoman ? "BM" : isGirl ? "BN" : null;
  if (/\bHOODIES?\b/u.test(title)) return isWoman ? "HM" : isGirl ? "HN" : null;
  return null;
}

function colorSegment(publication: PublicationSkuSource, title: string): string | null {
  const colorAttribute = publication.attributes?.find((attribute) => {
    const identifier = normalizeText(`${attribute.id} ${attribute.name ?? ""}`);
    return identifier.includes("COLOR") && Boolean(attribute.value?.trim());
  });

  if (colorAttribute?.value) return abbreviateColor(colorAttribute.value);

  const knownColor = COLOR_ABBREVIATIONS.find(({ names }) =>
    names.some((name) => new RegExp(`\\b${name}\\b`, "u").test(title)),
  );
  return knownColor?.abbreviation ?? null;
}

function abbreviateColor(value: string): string | null {
  const normalizedValue = normalizeText(value);
  const knownColor = COLOR_ABBREVIATIONS.find(({ names }) =>
    names.some((name) => new RegExp(`\\b${name}\\b`, "u").test(normalizedValue)),
  );
  if (knownColor) return knownColor.abbreviation;

  const firstWord = normalizedValue.match(/[A-Z0-9]+/u)?.[0];
  return firstWord ? firstWord.slice(0, 3) : null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toUpperCase()
    .replace(/\s+/gu, " ")
    .trim();
}
