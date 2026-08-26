import type {
  Publication,
  PublicationsPage,
  PublicationType,
} from "../domain/publication.model";
import type { PublicationsRepository } from "../domain/publications.repository";

export type GetPublicationsQueryInput = Readonly<{
  page: number;
  pageSize: number;
  cursor: string | null;
  search: string;
  type: PublicationType | null;
  status: string | null;
}>;

function matchesFilters(
  publication: Publication,
  input: GetPublicationsQueryInput,
): boolean {
  const matchesType =
    input.type === null || publication.group.type === input.type;
  const matchesStatus =
    input.status === null || publication.status === input.status;

  return matchesType && matchesStatus;
}

/** Coordina la lectura y aplica filtros sólo sobre el lote del cursor recibido. */
export class GetPublicationsQuery {
  constructor(private readonly repository: PublicationsRepository) {}

  async execute(input: GetPublicationsQueryInput): Promise<PublicationsPage> {
    const page = await this.repository.getPublications({
      pageSize: input.pageSize,
      cursor: input.cursor,
      search: input.search,
    });
    const publications = page.publications.filter((publication) =>
      matchesFilters(publication, input),
    );

    return {
      ...page,
      page: input.page,
      cursor: input.cursor,
      publications,
      count: publications.length,
    };
  }
}
