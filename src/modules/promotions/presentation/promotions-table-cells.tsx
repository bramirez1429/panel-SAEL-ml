"use client";

import { Image, Space, Tag, Typography } from "antd";

import type { PromotionRow } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { CopyableText } from "./copyable-text.client";
import { formatPromotionPeriod } from "./promotion-period.formatter";

const missingValue = "—";

const percentFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function PublicationCell({
  publication,
}: Readonly<{
  publication: PromotionRow;
}>) {
  return (
    <Space align="start" size={12}>
      {publication.thumbnail ? (
        <Image
          alt={publication.title}
          src={publication.thumbnail}
          width={64}
          height={64}
          preview={false}
          style={{
            objectFit: "cover",
            borderRadius: 4,
          }}
        />
      ) : null}

      <div style={{ lineHeight: 1.45 }}>
        <Typography.Text strong>
          {publication.title}
        </Typography.Text>

        {publication.sku ? (
          <div>
            <Typography.Text type="secondary">
              SKU {publication.sku}
            </Typography.Text>
          </div>
        ) : null}

        <div>
          <CopyableText
            value={publication.itemId}
            label={publication.itemId}
            copyLabel="MLA"
            successMessage="MLA copiado"
          />
        </div>

        <div style={{ marginTop: 2 }}>
          <Typography.Text strong>
            {money(publication.price)}
          </Typography.Text>
        </div>

        {publication.stock !== null ? (
          <div>
            <Typography.Text type="secondary">
              Depósito: {publication.stock} u.
            </Typography.Text>
          </div>
        ) : null}

        {publication.installmentLabel ? (
          <div>
            <Typography.Text type="secondary">
              {publication.installmentLabel}
            </Typography.Text>
          </div>
        ) : null}

        {publication.freeShipping === true ? (
          <Tag
            bordered={false}
            style={{
              marginTop: 5,
              background: "#eaf6ff",
              color: "#3483fa",
              fontWeight: 700,
            }}
          >
            ENVÍO GRATIS
          </Tag>
        ) : null}
      </div>
    </Space>
  );
}

export function PromotionContent({
  option,
}: Readonly<{
  option: PromotionOption;
}>) {
  const period = formatPromotionPeriod(
    option.startDate,
    option.finishDate,
  );

  const hasMlContribution =
    (option.mercadoLibreContributionAmount ?? 0) > 0;

  return (
    <div style={{ lineHeight: 1.45 }}>
      {option.status === "candidate" ? (
        <Typography.Text
          strong
          style={{ color: "#3483fa" }}
        >
          ¡Nueva propuesta!
        </Typography.Text>
      ) : null}

      <div style={{ marginTop: 4 }}>
        <span
          style={{
            display: "inline-block",
            maxWidth: 210,
            padding: "3px 7px",
            borderRadius: 3,
            background: "#333",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {campaignLabel(option)}
        </span>
      </div>

      {hasMlContribution ? (
        <div style={{ marginTop: 4 }}>
          <Typography.Text
            style={{
              color: "#00a650",
              fontSize: 12,
            }}
          >
            Con aporte de Mercado Libre
          </Typography.Text>
        </div>
      ) : null}

      {period ? (
        <div>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12 }}
          >
            {period}
          </Typography.Text>
        </div>
      ) : null}

      <div style={{ marginTop: 5 }}>
        {option.status === "started" ? (
          <Tag color="green">ACTIVA</Tag>
        ) : null}

        {option.status === "pending" ? (
          <Tag color="blue">PROGRAMADA</Tag>
        ) : null}
      </div>
    </div>
  );
}

export function DiscountCell({
  option,
}: Readonly<{
  option: PromotionOption;
}>) {
  const originalPrice = option.originalPrice;

  const sellerPercent = percentageOf(
    option.sellerDiscountAmount,
    originalPrice,
  );

  const mlPercent = percentageOf(
    option.mercadoLibreContributionAmount,
    originalPrice,
  );

  if (
    option.sellerDiscountAmount === null &&
    option.mercadoLibreContributionAmount === null
  ) {
    return option.requiresPriceSelection === true
      ? "A definir"
      : missingValue;
  }

  return (
    <div style={{ lineHeight: 1.4 }}>
      {option.sellerDiscountAmount !== null ? (
        <div>
          <Typography.Text strong>
            {money(option.sellerDiscountAmount)}
          </Typography.Text>

          {sellerPercent !== null ? (
            <div>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 12 }}
              >
                {percent(sellerPercent)}% a tu cargo
              </Typography.Text>
            </div>
          ) : null}
        </div>
      ) : null}

      {option.mercadoLibreContributionAmount !== null &&
      option.mercadoLibreContributionAmount > 0 ? (
        <div style={{ marginTop: 8 }}>
          <Typography.Text
            strong
            style={{ color: "#00a650" }}
          >
            {money(
              option.mercadoLibreContributionAmount,
            )}
          </Typography.Text>

          <div>
            <Typography.Text
              style={{
                color: "#00a650",
                fontSize: 12,
              }}
            >
              {mlPercent !== null
                ? `${percent(mlPercent)}% Mercado Libre`
                : "Mercado Libre"}
            </Typography.Text>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FinalPriceCell({
  option,
}: Readonly<{
  option: PromotionOption;
}>) {
  if (
    option.promotionPrice !== null &&
    option.promotionPrice > 0
  ) {
    return (
      <Typography.Text
        strong
        style={{ fontSize: 16 }}
      >
        {money(option.promotionPrice)}
      </Typography.Text>
    );
  }

  if (option.requiresPriceSelection !== true) {
    return missingValue;
  }

  const suggested =
    option.suggestedPromotionPrice !== null &&
    option.suggestedPromotionPrice > 0
      ? option.suggestedPromotionPrice
      : null;

  const hasRange =
    option.minPromotionPrice !== null &&
    option.maxPromotionPrice !== null &&
    option.minPromotionPrice > 0 &&
    option.maxPromotionPrice > 0;

  return (
    <div>
      {suggested !== null ? (
        <Typography.Text strong>
          {money(suggested)} sugerido
        </Typography.Text>
      ) : (
        <Typography.Text>
          A definir
        </Typography.Text>
      )}

      {hasRange ? (
        <div>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11 }}
          >
            Rango {money(option.minPromotionPrice!)} -{" "}
            {money(option.maxPromotionPrice!)}
          </Typography.Text>
        </div>
      ) : null}
    </div>
  );
}

export function NetCell({
  option,
}: Readonly<{
  option: PromotionOption;
}>) {
  if (option.estimatedNetAmount !== null) {
    return (
      <div>
        <Typography.Text
          strong
          style={{ fontSize: 15 }}
        >
          {money(option.estimatedNetAmount)}
        </Typography.Text>

        <div>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11 }}
          >
            estimado
          </Typography.Text>
        </div>
      </div>
    );
  }

  if (
    option.requiresPriceSelection === true &&
    option.suggestedEstimatedNetAmount !== null
  ) {
    return (
      <div>
        <Typography.Text strong>
          ≈ {money(option.suggestedEstimatedNetAmount)}
        </Typography.Text>

        <div>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11 }}
          >
            con precio sugerido
          </Typography.Text>
        </div>
      </div>
    );
  }

  return option.requiresPriceSelection === true
    ? "Se calcula al elegir precio"
    : "No disponible";
}

export function RecommendationText({
  option,
}: Readonly<{
  option: PromotionOption;
}>) {
  const recommendation = recommendationOf(option);

  return (
    <div style={{ marginBottom: 8 }}>
      <Typography.Text strong>
        {recommendation.title}
      </Typography.Text>

      <div>
        <Typography.Text
          type="secondary"
          style={{ fontSize: 12 }}
        >
          {recommendation.description}
        </Typography.Text>
      </div>
    </div>
  );
}

export function optionName(
  option: PromotionOption,
): string {
  return (
    option.name ??
    "Promoción de Mercado Libre"
  );
}

export function finalPriceOf(
  option: PromotionOption,
): number | null {
  if (
    option.promotionPrice !== null &&
    option.promotionPrice > 0
  ) {
    return option.promotionPrice;
  }

  if (option.requiresPriceSelection !== true) {
    return null;
  }

  if (
    option.maxPromotionPrice !== null &&
    option.maxPromotionPrice > 0
  ) {
    return option.maxPromotionPrice;
  }

  if (
    option.suggestedPromotionPrice !== null &&
    option.suggestedPromotionPrice > 0
  ) {
    return option.suggestedPromotionPrice;
  }

  return null;
}

function recommendationOf(
  option: PromotionOption,
): Readonly<{
  title: string;
  description: string;
}> {
  if (option.status === "started") {
    return {
      title: "Descuento atractivo",
      description:
        "Tu publicación ya está participando.",
    };
  }

  if (option.status === "pending") {
    return {
      title: "Promoción programada",
      description:
        "Se activará en la fecha informada.",
    };
  }

  if (
    option.status === "candidate" &&
    (option.mercadoLibreContributionAmount ?? 0) > 0
  ) {
    return {
      title: "Potenciá tu descuento",
      description:
        "Participá y aprovechá el aporte de Mercado Libre.",
    };
  }

  if (option.status === "candidate") {
    return {
      title: "Sumate a la promoción",
      description:
        "Podés aumentar la visibilidad de esta publicación.",
    };
  }

  return {
    title: "Sin tareas pendientes",
    description:
      "No hay acciones requeridas para esta promoción.",
  };
}

function campaignLabel(
  option: PromotionOption,
): string {
  const raw = (
    option.name ??
    option.type ??
    "Promoción"
  ).trim();

  const normalized = raw.toLowerCase();

  if (normalized.includes("cyber")) {
    return "CYBER FEST";
  }

  if (
    normalized.includes("meli+") ||
    normalized.includes("meli plus")
  ) {
    return "CAMPAÑA MELI+";
  }

  return raw;
}

function percentageOf(
  amount: number | null,
  originalPrice: number | null,
): number | null {
  if (
    amount === null ||
    originalPrice === null ||
    originalPrice <= 0
  ) {
    return null;
  }

  return (amount / originalPrice) * 100;
}

function money(value: number): string {
  const cents =
    Math.abs(Math.round(value * 100)) % 100;

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits:
      cents === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function percent(value: number): string {
  return percentFormatter.format(value);
}
