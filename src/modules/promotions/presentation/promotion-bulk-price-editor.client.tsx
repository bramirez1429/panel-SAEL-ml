"use client";

import { CheckOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  InputNumber,
  Space,
  Typography,
} from "antd";
import type { InputNumberProps } from "antd";

import { publicationTitlePresentation } from "@/shared/lib/publication-size";
import { PublicationSizeTag } from "@/shared/ui/publication-size-tag";

import type { SelectedPromotion } from "./promotion-global.store";
import {
  campaignDiscountRange,
  commonPromotionPriceRange,
  money,
  percentage,
  promotionDiscountPercent,
  promotionCampaignKey,
  promotionName,
  summarizeCampaignPrice,
  validSelectionPrice,
  type CampaignPrices,
  type CampaignPriceWarnings,
  type PromotionPrices,
  type CampaignPriceExclusions,
} from "./promotion-bulk-price.helpers";

type Props = Readonly<{
  selections: readonly SelectedPromotion[];
  prices: PromotionPrices;
  campaignPrices: CampaignPrices;
  excludedFromCampaign: CampaignPriceExclusions;
  campaignWarnings: CampaignPriceWarnings;
  campaignPriceApplied: Readonly<Record<string, boolean>>;
  onCampaignPriceChange: (campaignKey: string, price: number | null) => void;
  onApplyCampaignPrice: (campaignKey: string) => void;
  onPriceChange: (key: string, price: number | null) => void;
  onExcludedFromCampaignChange: (key: string, checked: boolean) => void;
}>;

export function PromotionBulkPriceEditor({
  selections,
  prices,
  campaignPrices,
  excludedFromCampaign,
  campaignWarnings,
  campaignPriceApplied,
  onCampaignPriceChange,
  onApplyCampaignPrice,
  onPriceChange,
  onExcludedFromCampaignChange,
}: Props) {
  const campaigns = groupByCampaign(selections);

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {campaigns.map(({ key, selections: campaignSelections }) => {
        const campaignPrice = campaignPrices[key] ?? null;
        const hasCampaignPrice = (
          campaignPrice !== null
          && Number.isFinite(campaignPrice)
          && campaignPrice > 0
        );
        const selectedItemKeys = campaignSelections
          .filter((selection) => excludedFromCampaign[selection.key] !== true)
          .map((selection) => selection.key);
        const canApplyCampaignPrice = (
          hasCampaignPrice && selectedItemKeys.length > 0
        );
        const summary = summarizeCampaignPrice(
          campaignSelections,
          excludedFromCampaign,
          campaignPrice,
        );
        const discountRange = campaignDiscountRange(
          campaignSelections,
          excludedFromCampaign,
          campaignPrice,
        );

        return (
          <Card key={key} size="small" title={promotionName(campaignSelections[0]!)}>
            <Space orientation="vertical" size="small" style={{ width: "100%" }}>
              <Typography.Text>
                {campaignSelections.length} {campaignSelections.length === 1 ? "publicación" : "publicaciones"}
              </Typography.Text>
              <CommonRange range={commonPromotionPriceRange(campaignSelections)} />
              <Typography.Text strong>Modificar precio para esta campaña</Typography.Text>
              <Space wrap>
                <PromotionCurrencyInput
                  aria-label={`Precio campaña ${promotionName(campaignSelections[0]!)}`}
                  controls={false}
                  min={0}
                  value={campaignPrice}
                  onChange={(price) => onCampaignPriceChange(key, price)}
                />
                <Button
                  aria-label={`Aplicar precio ${promotionName(campaignSelections[0]!)}`}
                  disabled={!canApplyCampaignPrice}
                  onClick={() => onApplyCampaignPrice(key)}
                >
                  Aplicar
                </Button>
              </Space>
              <CampaignDiscount range={discountRange} />
              <CampaignApplicationSummary
                summary={summary}
                campaignPrice={campaignPrice}
                campaignPriceApplied={campaignPriceApplied[key] === true}
              />

              <div>
                {campaignSelections.map((selection) => (
                  <PromotionPriceRow
                    key={selection.key}
                    selection={selection}
                    price={prices[selection.key] ?? null}
                    campaignPrice={campaignPrice}
                    campaignPriceApplied={campaignPriceApplied[key] === true}
                    hasCampaignPrice={hasCampaignPrice}
                    excludedFromCampaign={excludedFromCampaign[selection.key] === true}
                    invalidCampaignPrice={campaignWarnings[selection.key] ?? null}
                    onPriceChange={(price) => onPriceChange(selection.key, price)}
                    onExcludedFromCampaignChange={(checked) => (
                      onExcludedFromCampaignChange(selection.key, checked)
                    )}
                  />
                ))}
              </div>
            </Space>
          </Card>
        );
      })}
    </Space>
  );
}

function PromotionPriceRow({
  selection,
  price,
  campaignPrice,
  campaignPriceApplied,
  hasCampaignPrice,
  excludedFromCampaign,
  invalidCampaignPrice,
  onPriceChange,
  onExcludedFromCampaignChange,
}: Readonly<{
  selection: SelectedPromotion;
  price: number | null;
  campaignPrice: number | null;
  campaignPriceApplied: boolean;
  hasCampaignPrice: boolean;
  excludedFromCampaign: boolean;
  invalidCampaignPrice: number | null;
  onPriceChange: (price: number | null) => void;
  onExcludedFromCampaignChange: (checked: boolean) => void;
}>) {
  const editable = selection.option.requiresPriceSelection === true;
  const valid = validSelectionPrice(selection, price);
  const discount = promotionDiscountPercent(selection.option.originalPrice, price);
  const participatesInCampaignPrice = !excludedFromCampaign;
  const receivedCampaignPrice = (
    campaignPriceApplied
    && participatesInCampaignPrice
    && invalidCampaignPrice === null
    && price === campaignPrice
  );
  const titlePresentation = publicationTitlePresentation(
    selection.publicationTitle,
  );

  return (
    <div style={{ borderBottom: "1px solid #f0f0f0", padding: "12px 0" }}>
      <Space orientation="vertical" size={4} style={{ width: "100%" }}>
        <Typography.Text strong>{promotionName(selection)}</Typography.Text>
        <Typography.Text>{titlePresentation.title}</Typography.Text>
        <Space size="small" wrap>
          {titlePresentation.size ? (
            <PublicationSizeTag size={titlePresentation.size} />
          ) : null}
          <Typography.Text type="secondary">{selection.itemId}</Typography.Text>
        </Space>
        <Typography.Text>Precio actual: {money(selection.option.originalPrice)}</Typography.Text>
        <Typography.Text>
          Precio sugerido ML: {money(selection.option.suggestedPromotionPrice)}
        </Typography.Text>
        <Typography.Text>
          Precio promocional actual: {money(selection.option.promotionPrice)}
        </Typography.Text>
        <Checkbox
          aria-label={`Aplicar este precio a ${selection.itemId}`}
          checked={participatesInCampaignPrice}
          disabled={!hasCampaignPrice}
          onChange={(event) => (
            onExcludedFromCampaignChange(!event.target.checked)
          )}
        >
          Aplicar este precio a este ítem
        </Checkbox>
        {editable ? (
          <>
            <Typography.Text>
              Rango permitido: {money(selection.option.minPromotionPrice)} - {money(selection.option.maxPromotionPrice)}
            </Typography.Text>
            <Typography.Text>Precio a aplicar</Typography.Text>
            <PromotionCurrencyInput
              aria-label={`Precio a aplicar ${selection.itemId}`}
              controls={false}
              min={selection.option.minPromotionPrice ?? undefined}
              max={selection.option.maxPromotionPrice ?? undefined}
              status={valid ? undefined : "error"}
              value={price}
              onChange={onPriceChange}
              style={{ width: "100%" }}
            />
            {!valid ? (
              <Typography.Text type="danger">
                El precio debe estar dentro del rango permitido.
              </Typography.Text>
            ) : null}
          </>
        ) : null}
        {receivedCampaignPrice ? (
          <Typography.Text strong type="success">
            Nuevo precio promocional: {money(price)}
          </Typography.Text>
        ) : null}
        <Typography.Text>Descuento: {percentage(discount)}</Typography.Text>
        {invalidCampaignPrice !== null ? (
          <Alert
            showIcon
            type="warning"
            title={`${money(invalidCampaignPrice)} está fuera del rango permitido para esta promoción.`}
          />
        ) : null}
      </Space>
    </div>
  );
}

function CampaignApplicationSummary({
  summary,
  campaignPrice,
  campaignPriceApplied,
}: Readonly<{
  summary: ReturnType<typeof summarizeCampaignPrice>;
  campaignPrice: number | null;
  campaignPriceApplied: boolean;
}>) {
  return (
    <Space orientation="vertical" size={0} style={{ marginTop: 8 }}>
      {campaignPriceApplied ? (
        <Typography.Text type="success">
          <CheckOutlined /> Precio {money(campaignPrice)} aplicado a {summary.appliedCount} de {summary.eligibleCount} promociones
        </Typography.Text>
      ) : null}
      {!campaignPriceApplied
        && campaignPrice !== null
        && Number.isFinite(campaignPrice)
        && campaignPrice > 0 ? (
        <Typography.Text type="warning">
          {summary.eligibleCount === summary.excludedCount
            ? "Seleccioná al menos un ítem para aplicar este precio."
            : "Presioná Aplicar para usar este precio en las promociones."}
        </Typography.Text>
      ) : null}
      {campaignPriceApplied && summary.excludedCount > 0 ? (
        <Typography.Text>
          {summary.excludedCount} {summary.excludedCount === 1 ? "promoción mantiene" : "promociones mantienen"} su precio promocional
        </Typography.Text>
      ) : null}
      {campaignPriceApplied && summary.rejectedCount > 0 ? (
        <Typography.Text type="warning">
          {summary.rejectedCount} {summary.rejectedCount === 1 ? "promoción no acepta" : "promociones no aceptan"} {money(campaignPrice)} por su rango permitido
        </Typography.Text>
      ) : null}
    </Space>
  );
}

export function PromotionCurrencyInput(props: InputNumberProps<number>) {
  return (
    <Space.Compact style={{ width: props.style?.width }}>
      <Button disabled>$</Button>
      <InputNumber<number> {...props} style={{ ...props.style, width: "100%" }} />
    </Space.Compact>
  );
}

function CommonRange({
  range,
}: Readonly<{
  range: ReturnType<typeof commonPromotionPriceRange>;
}>) {
  if (range === null) return null;
  if (!range.hasIntersection) {
    return (
      <Typography.Text type="warning">
        No existe un rango común para esta campaña.
      </Typography.Text>
    );
  }

  return (
    <Typography.Text type="secondary">
      Rango común permitido: {money(range.minimum)} - {money(range.maximum)}
    </Typography.Text>
  );
}

function CampaignDiscount({
  range,
}: Readonly<{
  range: ReturnType<typeof campaignDiscountRange>;
}>) {
  if (range === null) return <Typography.Text>Descuento aprox.: —</Typography.Text>;
  const value = range.minimum === range.maximum
    ? percentage(range.minimum)
    : `${percentage(range.minimum)} - ${percentage(range.maximum)}`;
  return <Typography.Text>Descuento aprox.: {value}</Typography.Text>;
}

function groupByCampaign(selections: readonly SelectedPromotion[]) {
  const groups = new Map<string, SelectedPromotion[]>();
  for (const selection of selections) {
    const key = promotionCampaignKey(selection);
    const group = groups.get(key);
    if (group) group.push(selection);
    else groups.set(key, [selection]);
  }
  return [...groups].map(([key, campaignSelections]) => ({
    key,
    selections: campaignSelections as readonly SelectedPromotion[],
  }));
}
