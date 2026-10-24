"use client";

import { Button } from "antd";

type Props = Readonly<{
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}>;

/** UI-only. The data request starts in the parent exclusively on click. */
export function PromotionColorAccordion({ label, count, expanded, onToggle }: Props) {
  return (
    <Button
      type="text"
      aria-expanded={expanded}
      aria-label={`${expanded ? "Ocultar" : "Mostrar"} talles de ${label}`}
      onClick={onToggle}
      style={{
        background: "#f3f7fc",
        border: "1px solid #e5eaf1",
        borderRadius: 6,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        height: "auto",
        minHeight: 48,
        padding: "10px 16px",
        textAlign: "left",
      }}
    >
      <span><span aria-hidden="true">{expanded ? "▾" : "▸"}</span>{" "}<strong>{label}</strong></span>
      <span>{count} ${count === 1 ? "publicación" : "publicaciones"}</span>
    </Button>
  );
}
