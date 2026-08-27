"use client";

import { Select, Space } from "antd";
import { useRouter, useSearchParams } from "next/navigation";

type Props = Readonly<{ children?: React.ReactNode }>;

const audiences = [
  { label: "Todos", value: "" },
  { label: "Mujer", value: "WOMEN" },
  { label: "Niña", value: "GIRLS" },
] as const;

export function PromotionsView({ children }: Props) {
  const router = useRouter();
  const current = useSearchParams();
  const navigate = (value: string) => {
    const params = new URLSearchParams(current);
    if (value) params.set("audience", value);
    else params.delete("audience");
    params.delete("cursor");
    router.push(`/promociones?${params}`);
  };
  return <div className="promotions-layout">
    <Space wrap aria-label="Filtros de promociones">
      <Select aria-label="Público" options={[...audiences]} value={current.get("audience") ?? ""} onChange={navigate} />
    </Space>
    {children}
  </div>;
}
