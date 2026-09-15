import { Alert } from "antd";

import { getRecentSales } from "../application/get-recent-sales";
import { syncRecentSales } from "../application/sync-recent-sales";
import { createSalesRepository } from "../sales.composition.server";
import { SalesList } from "./sales-list.client";

export async function RecentSales() {
  const repository = createSalesRepository();

  try {
    await syncRecentSales(repository, 48);
  } catch (error) {
    console.error("[SALES SYNC SSR]", error);
  }

  try {
    const sales = await getRecentSales(repository, 48);

    return <SalesList data={sales} />;
  } catch {
    return (
      <Alert
        showIcon
        type="error"
        message="No se pudieron cargar las ventas."
        description="Verificá la conexión con el backend e intentá nuevamente."
      />
    );
  }
}
