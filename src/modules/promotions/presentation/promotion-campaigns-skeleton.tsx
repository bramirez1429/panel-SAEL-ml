import { Space } from "antd";
import SkeletonInput from "antd/es/skeleton/Input";

export function PromotionCampaignsSkeleton() {
  return <div className="promotions-layout" aria-label="Cargando promociones">
    <Space wrap><SkeletonInput active size="middle" style={{ width: 280 }} /></Space>
  </div>;
}
