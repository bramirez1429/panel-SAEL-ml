import SkeletonInput from "antd/es/skeleton/Input";

export function PromotionCampaignItemsSkeleton() {
  return <div aria-label="Cargando publicaciones de la promoci\u00f3n">
    <SkeletonInput active block size="small" />
    <SkeletonInput active block size="small" />
    <SkeletonInput active block size="small" />
  </div>;
}
