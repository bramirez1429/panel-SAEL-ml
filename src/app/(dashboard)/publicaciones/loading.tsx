import { PublicationsView } from "@/modules/publications/presentation/publications-view";
import { parsePublicationsSearchParams } from "@/modules/publications/presentation/publications-search-params";

export default function PublicationsLoading() {
  return (
    <PublicationsView
      filters={parsePublicationsSearchParams({})}
      state="loading"
    />
  );
}
