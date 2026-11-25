import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { salesOperationsClient } from "@/modules/sales/operations/sales-operations.server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const result = await salesOperationsClient().get("/sales/shipments", { timeoutMs: 55000 });
    return NextResponse.json(result, { headers: privateHeaders });
  } catch (error) {
    unstable_rethrow(error);
    console.error("[shipments] query failed");
    return NextResponse.json({ message: "No se pudieron consultar los envíos de Mercado Libre." }, { status: 503, headers: privateHeaders });
  }
}

export async function POST(request: Request) {
  const input: unknown = await request.json().catch(() => null);
  if (typeof input !== "object" || input === null || !("orderId" in input) || typeof input.orderId !== "string" ||
      !/^[1-9]\d{0,39}$/.test(input.orderId) || !("completed" in input) || typeof input.completed !== "boolean") {
    return NextResponse.json({ message: "Pedido inválido" }, { status: 400, headers: privateHeaders });
  }
  try {
    const result = await salesOperationsClient().post("/sales/shipments/complete", { orderId: input.orderId, completed: input.completed }, { timeoutMs: 15000 });
    return NextResponse.json(result, { headers: privateHeaders });
  } catch (error) {
    unstable_rethrow(error);
    return NextResponse.json({ message: "No se pudo guardar la preparación." }, { status: 503, headers: privateHeaders });
  }
}
