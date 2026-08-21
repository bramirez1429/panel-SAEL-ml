import { PublicationsView } from "@/modules/publications/presentation/publications-view";
import { parsePublicationsSearchParams } from "@/modules/publications/presentation/publications-search-params";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export default function PublicationsLoading() {
  return (
    <>
      <PageHeader
        description="Gestiona las publicaciones de tus canales de venta."
      />
      <PublicationsView
        filters={parsePublicationsSearchParams({})}
        state="loading"
      />
    </>
  );
}
