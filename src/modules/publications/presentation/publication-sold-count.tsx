import { FireFilled } from "@ant-design/icons";

import styles from "./publications-view.module.css";

export function PublicationSoldCount({ value, compact = false }: Readonly<{ value: number | null; compact?: boolean }>) {
  if (value === null) return <span title="Dato no disponible">—</span>;
  const level = value >= 100 ? "peak" : value >= 50 ? "high" : value >= 20 ? "warm" : "normal";
  return <span className={`${styles.soldCount} ${styles[`sold_${level}`]}`} data-sales-level={level}><strong>{value}</strong>{level !== "normal" ? <FireFilled aria-label={compact ? undefined : salesLabel(level)} aria-hidden={compact} /> : null}</span>;
}

function salesLabel(level: "warm" | "high" | "peak"): string {
  if (level === "peak") return "Ventas excepcionales";
  if (level === "high") return "Ventas altas";
  return "Buen nivel de ventas";
}
