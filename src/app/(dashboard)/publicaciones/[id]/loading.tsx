import { PublicationDetailLoading } from "@/modules/publications/presentation/publication-detail-states";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export default function PublicationDetailRouteLoading() {
  return (
    <>
      <PageHeader description="Consulta la información y las variantes de la publicación." />
      <PublicationDetailLoading />
    </>
  );
}
