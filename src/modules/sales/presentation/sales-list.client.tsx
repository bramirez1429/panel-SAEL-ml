"use client";

import { Empty } from "antd";
import { useMemo, useState } from "react";

import type { RecentSalesResponse } from "../domain/sales.model";
import { SaleCard } from "./sale-card";
import {
  SalesToolbar,
  type SalesFilter,
} from "./sales-toolbar.client";

type Props = Readonly<{
  data: RecentSalesResponse;
}>;

export function SalesList({ data }: Props) {
  const [filter, setFilter] = useState<SalesFilter>("ALL");

  const sales = useMemo(
    () => filterSales(data.items, filter),
    [data.items, filter],
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SalesToolbar
        value={filter}
        onChange={setFilter}
      />

      {sales.length === 0 ? (
        <Empty description="No hay ventas para mostrar." />
      ) : (
        sales.map((sale) => (
          <SaleCard
            key={sale.saleId}
            sale={sale}
          />
        ))
      )}
    </div>
  );
}

function filterSales(
  sales: RecentSalesResponse["items"],
  filter: SalesFilter,
) {
  if (filter === "MERCADOLIBRE") {
    return sales.filter((sale) => sale.channel === "MERCADOLIBRE");
  }

  if (filter === "TIENDANUBE") {
    return sales.filter((sale) => sale.channel === "TIENDANUBE");
  }

  if (filter === "DIFFERENCES") {
    return sales.filter(
      (sale) =>
        sale.hasStockDifference === true ||
        sale.mappingStatus === "UNLINKED" ||
        sale.mappingStatus === "AMBIGUOUS",
    );
  }

  return sales;
}

