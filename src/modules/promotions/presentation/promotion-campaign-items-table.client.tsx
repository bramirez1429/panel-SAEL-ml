"use client";

import { Button, Space, Table } from "antd";
import type { TableColumnsType } from "antd";
import { useRouter, useSearchParams } from "next/navigation";

import type {
  PromotionCampaignItem,
  PromotionCampaignItems,
} from "../domain/promotion-campaign-items.model";

type Props = Readonly<{
  promotionId: string;
  page: PromotionCampaignItems;
}>;

const missingValue = "\u2014";

const columns: TableColumnsType<PromotionCampaignItem> = [
  { title: "Publicaci\u00f3n", dataIndex: "itemId", key: "itemId" },
  {
    title: "Estado",
    dataIndex: "status",
    key: "status",
    render: (status: string | undefined) => status ?? missingValue,
  },
  { title: "Precio actual", dataIndex: "price", key: "price", render: formatPrice },
  {
    title: "Precio promoci\u00f3n",
    dataIndex: "promotionPrice",
    key: "promotionPrice",
    render: formatPrice,
  },
];

export function PromotionCampaignItemsTable({ promotionId, page }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paging = page.paging;
  const previousOffset = paging && paging.offset > 0
    ? Math.max(0, paging.offset - paging.limit)
    : null;
  const nextOffset = paging && paging.offset + paging.limit < paging.total
    ? paging.offset + paging.limit
    : null;

  const changeOffset = (offset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("promotionId", promotionId);
    params.set("offset", String(offset));
    params.delete("cursor");
    router.push(`/promociones?${params.toString()}`);
  };

  if (page.items.length === 0) {
    return <p>No hay publicaciones disponibles para esta promoci\u00f3n.</p>;
  }

  return <section aria-label="Publicaciones de la promoci\u00f3n">
    <Table<PromotionCampaignItem>
      columns={columns}
      dataSource={[...page.items]}
      pagination={false}
      rowKey="itemId"
      size="small"
    />
    {previousOffset !== null || nextOffset !== null ? <Space>
      {previousOffset !== null ? <Button onClick={() => changeOffset(previousOffset)}>Anterior</Button> : null}
      {nextOffset !== null ? <Button onClick={() => changeOffset(nextOffset)}>Siguiente</Button> : null}
    </Space> : null}
  </section>;
}

function formatPrice(price: number | undefined): string {
  if (price === undefined) return missingValue;
  return `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(price)}`;
}
