"use client";

import { Alert, Button, InputNumber, Modal, Space, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PromotionCampaign } from "../domain/promotion-campaign.model";
import type { PromotionCampaignItem } from "../domain/promotion-campaign-items.model";
import { applyDealPromotion } from "./apply-deal-promotion.action";
import { useSingleSubmission } from "./use-single-submission.client";

type Props = Readonly<{
  campaign: PromotionCampaign;
  item: PromotionCampaignItem;
  onClose: () => void;
}>;

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function DealPromotionModal({ campaign, item, onClose }: Props) {
  const router = useRouter();
  const submission = useSingleSubmission();
  const [price, setPrice] = useState<number | null>(() => initialPrice(item));
  const [failure, setFailure] = useState<string | null>(null);
  const validationError = validatePrice(price, item);

  async function confirm(): Promise<void> {
    if (price === null || validationError) return;
    setFailure(null);
    const attempt = await submission.run(() => applyDealPromotion({
      itemId: item.itemId,
      promotionId: campaign.id,
      dealPrice: price,
    }));
    if (!attempt.started) return;
    if (!attempt.value.ok) {
      setFailure(attempt.value.message);
      return;
    }
    void message.success("Promoción aplicada correctamente.");
    onClose();
    router.refresh();
  }

  const closeSafely = () => {
    if (!submission.loading) onClose();
  };

  return <Modal
    title="Aplicar promoción"
    open
    onCancel={closeSafely}
    closable={!submission.loading}
    mask={{ closable: !submission.loading }}
    keyboard={!submission.loading}
    footer={<Space>
      <Button onClick={closeSafely} disabled={submission.loading}>Cancelar</Button>
      <Button
        type="primary"
        loading={submission.loading}
        disabled={Boolean(validationError) || submission.loading}
        onClick={() => void confirm()}
      >
        Confirmar
      </Button>
    </Space>}
  >
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <div>
        <Typography.Text strong>{item.title ?? item.itemId}</Typography.Text>
        <br />
        <Typography.Text type="secondary">{item.itemId}</Typography.Text>
      </div>
      <FinancialLine label="Precio actual" value={money(item.currentPrice)} />
      <FinancialLine label="Precio sugerido ML" value={money(positive(item.suggestedPromotionPrice))} />
      <FinancialLine label="Rango permitido" value={rangeText(item)} />
      <label>
        <Typography.Text>Precio a aplicar</Typography.Text>
        <InputNumber<number>
          aria-label="Precio a aplicar"
          value={price}
          onChange={setPrice}
          precision={0}
          style={{ display: "block", width: "100%" }}
        />
      </label>
      {validationError ? <Typography.Text type="danger">{validationError}</Typography.Text> : null}
      <FinancialLine label="Aporte ML actual" value={item.mercadoLibreContributionAmount === null ? "ML no informa" : money(item.mercadoLibreContributionAmount)} />
      <FinancialLine label="Tu descuento estimado" value={estimatedSellerDiscount(item, price)} />
      <FinancialLine label="Vos recibís aprox." value="Se actualizará al confirmar" />
      {failure ? <Alert type="error" showIcon title={failure} /> : null}
    </Space>
  </Modal>;
}

function FinancialLine({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div><Typography.Text strong>{label}: </Typography.Text>{value}</div>;
}

function initialPrice(item: PromotionCampaignItem): number | null {
  const suggested = positive(item.suggestedPromotionPrice);
  if (suggested === null) return null;
  return validatePrice(suggested, item) ? null : suggested;
}

function validatePrice(price: number | null, item: PromotionCampaignItem): string | null {
  if (price === null || !Number.isFinite(price)) return "Ingresá un precio.";
  if (price <= 0) return "El precio debe ser mayor a cero.";
  if (item.minPromotionPrice !== null && price < item.minPromotionPrice) {
    return `El precio mínimo es ${money(item.minPromotionPrice)}.`;
  }
  if (item.maxPromotionPrice !== null && price > item.maxPromotionPrice) {
    return `El precio máximo es ${money(item.maxPromotionPrice)}.`;
  }
  return null;
}

function estimatedSellerDiscount(item: PromotionCampaignItem, price: number | null): string {
  if (item.currentPrice === null || price === null || item.mercadoLibreContributionAmount === null) {
    return "A definir";
  }
  return money(Math.max(0, item.currentPrice - price - item.mercadoLibreContributionAmount));
}

function rangeText(item: PromotionCampaignItem): string {
  if (item.minPromotionPrice !== null && item.maxPromotionPrice !== null) {
    return `${money(item.minPromotionPrice)} - ${money(item.maxPromotionPrice)}`;
  }
  if (item.minPromotionPrice !== null) return `Desde ${money(item.minPromotionPrice)}`;
  if (item.maxPromotionPrice !== null) return `Hasta ${money(item.maxPromotionPrice)}`;
  return "—";
}

function positive(value: number | null): number | null {
  return value !== null && value > 0 ? value : null;
}

function money(value: number | null): string {
  return value === null ? "—" : currencyFormatter.format(value);
}
