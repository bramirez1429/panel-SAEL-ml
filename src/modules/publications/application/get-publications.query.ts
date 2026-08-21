import type {
  Publication,
  PublicationsPage,
  PublicationType,
} from "../domain/publication.model";
import type { PublicationsRepository } from "../domain/publications.repository";

export type GetPublicationsQueryInput = Readonly<{
  page: number;
  pageSize: number;
  search: string;
  type: PublicationType | null;
  status: string | null;
}>;

function matchesFilters(
  publication: Publication,
  input: GetPublicationsQueryInput,
): boolean {
  const normalizedSearch = input.search.trim().toLocaleLowerCase("es");
  const matchesSearch =
    normalizedSearch.length === 0 ||
    publication.title.toLocaleLowerCase("es").includes(normalizedSearch);
  const matchesType = input.type === null || publication.group.type === input.type;
  const matchesStatus =
    input.status === null || publication.status === input.status;

  return matchesSearch && matchesType && matchesStatus;
}

/**
 * Caso de uso de lectura. Coordina el repositorio sin conocer su implementación
 * HTTP ni detalles del proveedor de origen.
 */
export class GetPublicationsQuery {
  constructor(private readonly repository: PublicationsRepository) {}

  async execute(input: GetPublicationsQueryInput): Promise<PublicationsPage> {
    const page = await this.repository.getPublications({
      page: input.page,
      pageSize: input.pageSize,
    });
    const publications = page.publications.filter((publication) =>
      matchesFilters(publication, input),
    );

    if (publications.length === page.publications.length) {
      return page;
    }

    return {
      ...page,
      publications,
      // NestJS no acepta filtros: count describe esta página filtrada, mientras
      // total y totalPages conservan el alcance global informado por el backend.
      count: publications.length,
    };
  }
}
