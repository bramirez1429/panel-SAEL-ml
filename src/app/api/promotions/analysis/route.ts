import { NextResponse } from "next/server";

import { createPromotionsRepository } from "@/modules/promotions/promotions.composition.server";
import type { PromotionAudience } from "@/modules/promotions/domain/promotion-analysis.model";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: Request): Promise<NextResponse> {
  const params = new URL(request.url).searchParams;
  const promotionId = params.get("promotionId")?.trim();
  if (!promotionId) {
    return NextResponse.json({ message: "promotionId es obligatorio." }, { status: 400 });
  }

  const audience = parseAudience(params.get("audience"));
  if (params.has("audience") && !audience) {
    return NextResponse.json({ message: "audience debe ser WOMEN o GIRLS." }, { status: 400 });
  }

  const limit = parseLimit(params.get("limit"));
  if (limit === null) {
    return NextResponse.json({ message: "limit debe ser un entero entre 1 y 50." }, { status: 400 });
  }

  try {
    const page = await createPromotionsRepository().analyze({
      promotionId,
      audience: audience ?? undefined,
      limit,
      cursor: params.get("cursor")?.trim() || null,
    });
    return NextResponse.json(page);
  } catch {
    return NextResponse.json({ message: "No se pudo analizar la promoción." }, { status: 502 });
  }
}

function parseAudience(value: string | null): PromotionAudience | null {
  return value === "WOMEN" || value === "GIRLS" ? value : null;
}

function parseLimit(value: string | null): number | null {
  if (value === null || value === "") return DEFAULT_LIMIT;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_LIMIT ? parsed : null;
}
