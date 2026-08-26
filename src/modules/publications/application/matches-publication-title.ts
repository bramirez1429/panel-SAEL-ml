/** Normaliza texto de búsqueda para comparar títulos sin acentos ni puntuación. */
export function normalizePublicationSearchText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

export function matchesPublicationTitle(title: string, search: string): boolean {
  const normalizedSearch = normalizePublicationSearchText(search);
  if (!normalizedSearch) return true;
  const normalizedTitle = normalizePublicationSearchText(title);
  return normalizedSearch.split(" ").every((token) => normalizedTitle.includes(token));
}
