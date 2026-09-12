import type {
  Publication,
  PublicationsPage,
  PublicationType,
} from "../domain/publication.model";
import type { PublicationsRepository } from "../domain/publications.repository";
import { parsePublicationSearch } from "@/shared/lib/publication-search";
import {
  matchesPublicationQuickFilters,
  type PublicationQuickFilter,
} from "./publication-quick-filter";

export type PublicationFamilySearch = (familyId: string) => Promise<readonly Readonly<{
  itemId: string;
  familyId: string | null;
}>[]>;

export type GetPublicationsQueryInput = Readonly<{
  page: number;
  pageSize: number;
  cursor: string | null;
  search: string;
  type: PublicationType | null;
  status: string | null;
  quickFilters: readonly PublicationQuickFilter[];
}>;

function matchesFilters(
  publication: Publication,
  input: GetPublicationsQueryInput,
): boolean {
  const matchesType =
    input.type === null || publication.group.type === input.type;
  const matchesStatus =
    input.status === null || publication.status === input.status;

  return matchesType
    && matchesStatus
    && matchesPublicationQuickFilters(publication, input.quickFilters);
}

/** Coordina la lectura y aplica filtros sólo sobre el lote del cursor recibido. */
export class GetPublicationsQuery {
  constructor(
    private readonly repository: PublicationsRepository,
    private readonly searchFamily?: PublicationFamilySearch,
  ) {}

  async execute(input: GetPublicationsQueryInput): Promise<PublicationsPage> {
    const criteria = parsePublicationSearch(input.search);
    if (criteria?.type === "FAMILY" && this.searchFamily) {
      return this.getFamilyPublications(criteria.value, input);
    }

    const page = await this.repository.getPublications({
      pageSize: input.pageSize,
      cursor: input.cursor,
      search: input.search,
    });
    const publications = page.publications
      .filter((publication) => matchesFilters(publication, input))
      .sort((left, right) => (right.sold ?? 0) - (left.sold ?? 0));

    return {
      ...page,
      page: input.page,
      cursor: input.cursor,
      publications,
      count: publications.length,
    };
  }

  private async getFamilyPublications(
    familyId: string,
    input: GetPublicationsQueryInput,
  ): Promise<PublicationsPage> {
    const matches = await this.searchFamily!(familyId);
    const familyMatch = matches[0];
    const detail = familyMatch ? await this.repository.getById(familyMatch.itemId) : null;
    const publications = detail && matchesFilters(detail, input) ? [detail] : [];

    return {
      publications,
      page: 1,
      pageSize: input.pageSize,
      cursor: null,
      nextCursor: null,
      done: true,
      count: publications.length,
      productsCount: publications.length,
    };
  }
}
