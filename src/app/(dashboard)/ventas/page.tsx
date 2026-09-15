import { RecentSales } from "@/modules/sales/presentation/recent-sales.server";

export const dynamic = "force-dynamic";

export default function SalesPage() {
  return (
    <div data-dashboard-full-width="true">
      <RecentSales />
    </div>
  );
}

