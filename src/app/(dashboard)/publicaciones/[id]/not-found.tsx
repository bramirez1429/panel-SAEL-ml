import { Result } from "antd";

import { BackToPublicationsLink } from "@/modules/publications/presentation/publication-back-link";

export default function PublicationDetailNotFound() {
  return (
    <Result
      extra={<BackToPublicationsLink />}
      status="404"
      subTitle="La publicación solicitada no existe o ya no está disponible."
      title="Publicación no encontrada"
    />
  );
}
