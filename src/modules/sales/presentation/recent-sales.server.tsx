import { Alert } from "antd";
import { unstable_rethrow } from "next/navigation";
import { getRecentSales } from "../application/get-recent-sales";
import { createSalesRepository } from "../sales.composition.server";
import { SalesList } from "./sales-list.client";

export async function RecentSales() {
  const repository = createSalesRepository();

  try {
    const sales = await getRecentSales(repository, 24);

    return <SalesList data={sales} />;
  } catch (error) {
    unstable_rethrow(error);

    console.error("[SALES LOAD ERROR]", error);

    return (
      <Alert
        type="error"
        showIcon
        title="No se pudieron cargar las ventas recientes."
      />
    );
  }
}
