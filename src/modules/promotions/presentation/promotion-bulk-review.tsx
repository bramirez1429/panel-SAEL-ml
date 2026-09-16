import { Space, Typography } from "antd";

import type { SelectedPromotion } from "./promotion-global.store";
import { money, promotionName } from "./promotion-bulk-price.helpers";

type Props = Readonly<{
  selections: readonly SelectedPromotion[];
}>;

export function PromotionBulkReview({ selections }: Props) {
  return (
    <div>
      {selections.map((selection) => (
        <div key={selection.key} style={{ borderBottom: "1px solid #f0f0f0", padding: "12px 0" }}>
          <Space orientation="vertical" size={2} style={{ width: "100%" }}>
            <Typography.Text strong>{promotionName(selection)}</Typography.Text>
            <Typography.Text>{selection.publicationTitle}</Typography.Text>
            <Typography.Text type="secondary">{selection.itemId}</Typography.Text>
            <Typography.Text>
              Precio actual: {money(selection.option.originalPrice)}
            </Typography.Text>
            {selection.option.suggestedPromotionPrice !== null ? (
              <Typography.Text>
                Precio sugerido ML: {money(selection.option.suggestedPromotionPrice)}
              </Typography.Text>
            ) : selection.option.promotionPrice !== null ? (
              <Typography.Text>
                Precio promocional: {money(selection.option.promotionPrice)}
              </Typography.Text>
            ) : null}
          </Space>
        </div>
      ))}
    </div>
  );
}
