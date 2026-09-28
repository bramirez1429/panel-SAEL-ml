import { Descriptions, Typography } from "antd";

import type { PromotionOption } from "../domain/promotions.repository";
import {
  percentage,
  promotionDiscountPercent,
} from "./promotion-bulk-price.helpers";
import { formatPromotionPeriod } from "./promotion-date.helpers";

type Props = Readonly<{ option: PromotionOption }>;

export function PromotionFinancialSummary({ option }: Props) {
  const buyerSaving =
    option.originalPrice !== null && option.promotionPrice !== null
      ? option.originalPrice - option.promotionPrice
      : null;
  const discountPercent = option.discountPercent ?? promotionDiscountPercent(
    option.originalPrice,
    option.promotionPrice,
  );
  return (
    <Descriptions column={1} size="small">
      <Descriptions.Item label="Precio de lista">
        {money(option.originalPrice)}
      </Descriptions.Item>
      <Descriptions.Item label="Descuento">
        {percentage(discountPercent)}
        {buyerSaving === null ? null : (
          <Typography.Text type="secondary">
            {` · Ahorrás ${money(buyerSaving)}`}
          </Typography.Text>
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Precio final">
        {money(option.promotionPrice)}
      </Descriptions.Item>
      <Descriptions.Item label="Costo estimado de Mercado Libre">
        {option.saleEstimate
          ? `-${money(option.saleEstimate.saleFeeAmount)}`
          : "—"}
      </Descriptions.Item>
      <Descriptions.Item label="Vos recibís aprox.">
        {money(option.saleEstimate?.estimatedNetAmount ?? null)}
      </Descriptions.Item>
      <Descriptions.Item label="Vigencia">
        {formatPromotionPeriod(option.startDate, option.finishDate)}
      </Descriptions.Item>
    </Descriptions>
  );
}

function money(value: number | null): string {
  return value === null ? "—" : `$${value.toLocaleString("es-AR")}`;
}
