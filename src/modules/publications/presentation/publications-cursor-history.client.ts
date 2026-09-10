"use client";

const PREFIX = "publications:cursor-history:";
const CONTEXT_KEYS = ["search", "type", "status"] as const;

export function publicationsCursorContextKey(params: Pick<URLSearchParams, "get">): string {
  const context = new URLSearchParams();
  CONTEXT_KEYS.forEach((key) => context.set(key, params.get(key) ?? ""));
  return `${PREFIX}${context.toString()}`;
}

export function rememberPublicationsCursor(contextKey: string, page: number, cursor: string): void {
  if (typeof sessionStorage === "undefined" || page < 2 || !cursor) return;
  const history = readHistory(contextKey);
  history[String(page)] = cursor;
  sessionStorage.setItem(contextKey, JSON.stringify(history));
}

export function visitedPublicationsCursor(contextKey: string, page: number): string | null {
  if (page === 1) return null;
  return readHistory(contextKey)[String(page)] ?? null;
}

export function resetPublicationsCursorHistory(): void {
  if (typeof sessionStorage === "undefined") return;
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(PREFIX)) sessionStorage.removeItem(key);
  }
}

function readHistory(contextKey: string): Record<string, string> {
  if (typeof sessionStorage === "undefined") return {};
  const stored = sessionStorage.getItem(contextKey);
  if (!stored) return {};
  try {
    const value: unknown = JSON.parse(stored);
    if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  } catch { return {}; }
}
