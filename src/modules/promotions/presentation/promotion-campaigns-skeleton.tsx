import { Skeleton, Space } from "antd";

export function PromotionCampaignsSkeleton() {
  return <div className="promotions-layout" aria-label="Cargando promociones">
    <Space wrap><Skeleton.Input active size="middle" style={{ width: 280 }} /></Space>
  </div>;
}
