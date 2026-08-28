import SkeletonInput from "antd/es/skeleton/Input";

export function PromotionCampaignItemsSkeleton() {
  return <div aria-label="Cargando publicaciones de la promoción">
    <SkeletonInput active block size="small" />
    <SkeletonInput active block size="small" />
    <SkeletonInput active block size="small" />
  </div>;
}
