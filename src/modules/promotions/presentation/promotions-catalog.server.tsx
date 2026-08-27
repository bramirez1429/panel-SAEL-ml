import { createPromotionsRepository } from "../promotions.composition.server";
import { PromotionsTable } from "./promotions-table.client";

type Props = Readonly<{ params: Record<string, string | string[] | undefined>; mode: "Masivo" | "Individual"; selected: React.Key[] }>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export async function PromotionsCatalog({ params, mode, selected }: Props) {
  const page = await createPromotionsRepository().getCatalog({
    limit: 20, cursor: first(params.cursor) ?? null, search: first(params.search),
    productGroup: first(params.productGroup) as never, promotionStatus: first(params.promotionStatus) as never,
    promotionType: first(params.promotionType),
  });
  return <PromotionsTable page={page} mode={mode} selected={selected} onSelectionChange={() => undefined} />;
}
