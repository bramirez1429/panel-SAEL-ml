"use client";

import { Alert, Button, Modal, Space, Typography, message } from "antd";
import { useRef, useState } from "react";

import { publicationTitlePresentation } from "@/shared/lib/publication-size";
import { PublicationSizeTag } from "@/shared/ui/publication-size-tag";

import type { PromotionRow } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { applySelectionWithRetry } from "./apply-selection-with-retry.client";
import { PromotionCurrencyInput } from "./promotion-bulk-price-editor.client";
import {
  initialPromotionPrices,
  canEditPromotionPrice,
  money,
  percentage,
  promotionDiscountPercent,
  validSelectionPrice,
} from "./promotion-bulk-price.helpers";
import {
  promotionSelection,
  usePromotionGlobalStore,
} from "./promotion-global.store";
import { PromotionCampaignTag } from "./promotions-table-cells";

type Props = Readonly<{
  publication: PromotionRow;
  option: PromotionOption;
  onClose: () => void;
  onCompleted?: () => void | Promise<void>;
}>;

export function PromotionIndividualApplicationModal({
  publication,
  option,
  onClose,
  onCompleted,
}: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const activeRef = useRef(false);
  const selection = promotionSelection(publication, option);
  const initialPrice = initialPromotionPrices([selection])[selection.key] ?? null;
  const [draftPrice, setDraftPrice] = useState<number | null>(initialPrice);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(initialPrice);
  const [priceApplied, setPriceApplied] = useState(false);
  const [running, setRunning] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const invalidateOptions = usePromotionGlobalStore((state) => state.invalidateOptions);
  const editable = canEditPromotionPrice(option);
  const originalPrice = option.originalPrice ?? publication.price;
  const hasUnappliedDraft = editable && draftPrice !== selectedPrice;
  const canApplyDraft = editable && validSelectionPrice(selection, draftPrice);
  const canParticipate = (
    editable ? validSelectionPrice(selection, selectedPrice) : option.canApply
  ) && !hasUnappliedDraft;
  const displayedPromotionPrice = priceApplied
    ? selectedPrice
    : option.promotionPrice;
  const titlePresentation = publicationTitlePresentation(publication.title);

  function applyDraftPrice(): void {
    if (!canApplyDraft) return;
    setSelectedPrice(draftPrice);
    setPriceApplied(true);
    setFailure(null);
  }

  async function participate(): Promise<void> {
    if (activeRef.current || !canParticipate) return;

    activeRef.current = true;
    setRunning(true);
    setFailure(null);

    try {
      const result = await applySelectionWithRetry({
        itemId: publication.itemId,
        option: !editable || selectedPrice === null
          ? option
          : { ...option, promotionPrice: selectedPrice },
        selectedPrice: editable ? selectedPrice : null,
      });

      if (!result.ok) {
        setFailure(result.message);
        return;
      }

      invalidateOptions([publication.itemId]);
      await onCompleted?.();
      messageApi.success("Promoción aplicada correctamente.");
      onClose();
    } catch {
      setFailure("No pudimos aplicar la promoción.");
    } finally {
      setRunning(false);
      activeRef.current = false;
    }
  }

  return (
    <Modal
      open
      title={<PromotionCampaignTag option={option} />}
      width={620}
      closable={!running}
      keyboard={!running}
      mask={{ closable: !running }}
      onCancel={running ? undefined : onClose}
      styles={{
        body: { maxHeight: "65vh", overflowY: "auto" },
        footer: {
          position: "sticky",
          bottom: 0,
          zIndex: 2,
          marginTop: 16,
          padding: "12px 0 0",
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
        },
      }}
      footer={(
        <Button
          type="primary"
          loading={running}
          disabled={!canParticipate || running}
          onClick={() => void participate()}
        >
          Participar
        </Button>
      )}
    >
      {contextHolder}
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Typography.Text strong>{titlePresentation.title}</Typography.Text>
          <Space size="small" wrap style={{ display: "flex", marginTop: 6 }}>
            {titlePresentation.size ? (
              <PublicationSizeTag size={titlePresentation.size} />
            ) : null}
            <Typography.Text type="secondary">{publication.itemId}</Typography.Text>
          </Space>
        </div>

        <Space orientation="vertical" size={4} style={{ width: "100%" }}>
          <PriceLine label="Precio actual" value={money(originalPrice)} />
          <PriceLine label="Precio sugerido ML" value={money(option.suggestedPromotionPrice)} />
          <PriceLine label="Precio promocional actual" value={money(option.promotionPrice)} />
          {priceApplied ? (
            <Typography.Text strong type="success">
              Nuevo precio promocional: {money(selectedPrice)}
            </Typography.Text>
          ) : null}
          <PriceLine
            label="Descuento"
            value={percentage(promotionDiscountPercent(originalPrice, displayedPromotionPrice))}
          />
        </Space>

        {editable ? (
          <Space orientation="vertical" size="small" style={{ width: "100%" }}>
            <Typography.Text strong>Modificar precio para esta campaña</Typography.Text>
            <Space wrap>
              <PromotionCurrencyInput
                aria-label="Nuevo precio promocional"
                controls={false}
                min={option.minPromotionPrice ?? undefined}
                max={option.maxPromotionPrice ?? undefined}
                status={draftPrice === null || validSelectionPrice(selection, draftPrice) ? undefined : "error"}
                value={draftPrice}
                onChange={(price) => {
                  setDraftPrice(price);
                  setPriceApplied(false);
                }}
                style={{ width: 280 }}
              />
              <Button disabled={!canApplyDraft} onClick={applyDraftPrice}>Aplicar</Button>
            </Space>
            <Typography.Text>
              Descuento aprox.: {percentage(promotionDiscountPercent(originalPrice, draftPrice))}
            </Typography.Text>
            {hasUnappliedDraft ? (
              <Typography.Text type="warning">Presioná Aplicar para usar este precio.</Typography.Text>
            ) : null}
          </Space>
        ) : null}

        {failure ? <Alert showIcon type="error" title={failure} /> : null}
      </Space>
    </Modal>
  );
}

function PriceLine({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Typography.Text>
      <Typography.Text strong>{label}: </Typography.Text>
      {value}
    </Typography.Text>
  );
}
