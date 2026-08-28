"use client";

import { Button, Image, Space, Table } from "antd";
import type { TableColumnsType } from "antd";
import { useRouter, useSearchParams } from "next/navigation";

import type { PromotionCampaign } from "../domain/promotion-campaign.model";
import type {
  PromotionCampaignItem,
  PromotionCampaignItems,
} from "../domain/promotion-campaign-items.model";

type Props = Readonly<{
  campaign: PromotionCampaign;
  page: PromotionCampaignItems;
}>;

const missingValue = "—";
const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function PromotionCampaignItemsTable({ campaign, page }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paging = page.paging;
  const previousOffset = paging && paging.offset > 0
    ? Math.max(0, paging.offset - paging.limit)
    : null;
  const nextOffset = paging && paging.offset + paging.limit < paging.total
    ? paging.offset + paging.limit
    : null;
  const columns = campaignColumns(campaign.name);

  const changeOffset = (offset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("promotionId", campaign.id);
    params.set("offset", String(offset));
    params.delete("cursor");
    router.push(`/promociones?${params.toString()}`);
  };

  if (page.items.length === 0) {
    return <p>No hay publicaciones disponibles para esta promoción.</p>;
  }

  return <section aria-label="Publicaciones de la promoción">
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

function campaignColumns(campaignName: string | null): TableColumnsType<PromotionCampaignItem> {
  return [
    {
      title: "Imagen",
      dataIndex: "thumbnail",
      key: "thumbnail",
      render: (thumbnail: string | null, item) => thumbnail
        ? <Image alt={item.title ?? item.itemId} height={56} preview={false} src={thumbnail} width={56} />
        : <div aria-label="Sin imagen" style={{ alignItems: "center", background: "#f5f5f5", display: "flex", height: 56, justifyContent: "center", width: 56 }}>{missingValue}</div>,
    },
    {
      title: "Publicación",
      dataIndex: "title",
      key: "title",
      render: (title: string | null, item) => <div>
        <div>{title ?? missingValue}</div>
        <small>{item.itemId}</small>
      </div>,
    },
    { title: "Promo", key: "promotion", render: () => campaignName ?? missingValue },
    { title: "Elegibles", key: "eligible", render: (_, item) => item.eligible ? "1/1" : missingValue },
    {
      title: "Precio promo",
      dataIndex: "promotionPrice",
      key: "promotionPrice",
      render: (_, item) => formatPromotionPrice(item),
    },
    { title: "Tu descuento", dataIndex: "sellerDiscountAmount", key: "sellerDiscountAmount", render: formatPrice },
    { title: "Aporte ML", dataIndex: "mercadoLibreContributionAmount", key: "mercadoLibreContributionAmount", render: formatPrice },
    { title: "Vos recibís aprox.", dataIndex: "estimatedNetAmount", key: "estimatedNetAmount", render: formatPrice },
    { title: "Acción", key: "action", render: (_, item) => formatAction(item.status) },
  ];
}

function formatPrice(price: number | null): string {
  return price === null ? missingValue : currencyFormatter.format(price);
}

function formatPromotionPrice(item: PromotionCampaignItem) {
  const promotionPrice = positivePrice(item.promotionPrice);
  if (promotionPrice !== null) return formatPrice(promotionPrice);
  if (item.requiresPriceSelection !== true) return missingValue;

  const suggestedPrice = positivePrice(item.suggestedPromotionPrice);
  const minPrice = positivePrice(item.minPromotionPrice);
  const maxPrice = positivePrice(item.maxPromotionPrice);
  const range = minPrice !== null && maxPrice !== null
    ? `Rango ${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
    : null;

  return <div>
    <div>{suggestedPrice === null ? "Definir precio" : `${formatPrice(suggestedPrice)} sugerido`}</div>
    {range ? <small>{range}</small> : null}
  </div>;
}

function positivePrice(price: number | null): number | null {
  return price !== null && price > 0 ? price : null;
}

function formatAction(status: string | null): string {
  if (status === "candidate") return "Aplicar";
  if (status === "started") return "Activa";
  if (status === "pending") return "Programada";
  return missingValue;
}
