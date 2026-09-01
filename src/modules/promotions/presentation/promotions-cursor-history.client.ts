"use client";

const STORAGE_PREFIX = "promotions:cursor-history:";
const CONTEXT_KEYS = ["search", "productGroup", "promotionStatus", "promotionType"] as const;

type SearchParamsReader = Readonly<Pick<URLSearchParams, "get">>;

export function promotionCursorContextKey(params: SearchParamsReader): string {
  const context = new URLSearchParams();
  CONTEXT_KEYS.forEach((key) => context.set(key, params.get(key) ?? ""));
  return `${STORAGE_PREFIX}${context.toString()}`;
}

export function rememberPromotionCursor(
  contextKey: string,
  page: number,
  cursor: string,
): void {
  if (typeof sessionStorage === "undefined" || page < 2 || !cursor) return;
  const history = readHistory(contextKey);
  history[String(page)] = cursor;
  sessionStorage.setItem(contextKey, JSON.stringify(history));
}

export function visitedPromotionCursor(
  contextKey: string,
  page: number,
): string | null {
  if (page === 1) return null;
  return readHistory(contextKey)[String(page)] ?? null;
}

export function resetPromotionCursorHistory(): void {
  if (typeof sessionStorage === "undefined") return;
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(key);
  }
}

function readHistory(contextKey: string): Record<string, string> {
  if (typeof sessionStorage === "undefined") return {};
  const stored = sessionStorage.getItem(contextKey);
  if (!stored) return {};
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
