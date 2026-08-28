import { Skeleton, Space } from "antd";

export function PromotionCampaignsSkeleton() {
  return <div className="promotions-layout" aria-label="Cargando promociones">
    <Space wrap>
      <Skeleton.Input active size="middle" style={{ width: 280 }} />
      <Skeleton.Input active size="middle" style={{ width: 150 }} />
    </Space>
    <Skeleton active title={false} paragraph={{ rows: 5, width: ["100%", "100%", "92%", "96%", "88%"] }} />
  </div>;
}
