import { SalesWorkspace } from "@/modules/sales/operations/sales-operations-view.client";

export const dynamic = "force-dynamic";

export default async function SalesPage({ searchParams }: Readonly<{ searchParams: Promise<{ order?: string | string[] }> }>) {
  const params = await searchParams;
  const order = Array.isArray(params.order) ? params.order[0] : params.order;
  const focusOrder = order && /^(MERCADOLIBRE|TIENDANUBE):[1-9]\d{0,39}$/.test(order) ? order : undefined;
  return <SalesWorkspace key={focusOrder ?? "sales"} focusOrder={focusOrder} />;
}
