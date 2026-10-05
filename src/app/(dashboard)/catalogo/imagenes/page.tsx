import { PageHeader } from "@/shared/ui/page-header/page-header";
import { CatalogImagesClient } from "@/modules/catalog/presentation/catalog-images.client";

export default function CatalogImagesPage() {
  return <>
    <PageHeader description="Administrá las imágenes y colores disponibles del catálogo mayorista." />
    <br/>
    <CatalogImagesClient />
  </>;
}
