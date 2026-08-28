import { Alert } from "antd";

export function PromotionCampaignsError() {
  return <Alert type="error" showIcon message="No pudimos cargar las promociones de Mercado Libre. Intentá nuevamente." />;
}
