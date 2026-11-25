import { z } from "zod";

export const stageSchema = z.enum(["TODAY", "UPCOMING", "OVERDUE", "TRANSIT", "FINISHED", "REVIEW", "MANAGED"]);
const lineSchema = z.object({
  key: z.string(), itemId: z.string().nullable(), variationId: z.string().nullable(), title: z.string(),
  sku: z.string().nullable(), color: z.string().nullable(), size: z.string().nullable(), quantity: z.number().int().positive(),
  unitPrice: z.number().nullable(), currency: z.string().nullable(), imageUrl: z.string().nullable(),
});
const orderSchema = z.object({
  orderId: z.string(), soldAt: z.string(), shipmentId: z.string().nullable(), completedAt: z.string().nullable(), cancelled: z.boolean().default(false), lines: z.array(lineSchema),
});
const shipmentSchema = z.object({
  key: z.string(), shipmentId: z.string().nullable(), stage: stageSchema,
  status: z.string().nullable(), substatus: z.string().nullable(), logistic: z.string().nullable(),
  deadline: z.string().nullable(), slaStatus: z.string().nullable(), issue: z.string().nullable(), orders: z.array(orderSchema),
});
export const shipmentsSchema = z.object({
  today: z.string(), fetchedAt: z.string(), days: z.number(), truncated: z.boolean(), unparsed: z.number(),
  preparationUnavailable: z.boolean(), cancellationUnavailable: z.boolean().default(false), shipments: z.array(shipmentSchema),
});
export type Shipment = z.infer<typeof shipmentSchema>;
export type ShipmentStage = z.infer<typeof stageSchema>;
export type ShipmentsData = z.infer<typeof shipmentsSchema>;
export type ShipmentStageFilter = ShipmentStage | "ALL";
export type PreparationFilter = "ALL" | "PENDING" | "COMPLETED" | "CANCELLED";
export const preparationFilters: ReadonlyArray<{ value: PreparationFilter; label: string }> = [
  { value: "ALL", label: "Todas" }, { value: "PENDING", label: "Pendientes" },
  { value: "COMPLETED", label: "Completadas" }, { value: "CANCELLED", label: "Canceladas" },
];
export const stages: ReadonlyArray<{ value: ShipmentStageFilter; label: string }> = [
  { value: "ALL", label: "Todos los envíos" },
  { value: "TODAY", label: "Envíos de hoy" }, { value: "UPCOMING", label: "Próximos días" },
  { value: "OVERDUE", label: "Atrasados" }, { value: "TRANSIT", label: "En tránsito" },
  { value: "FINISHED", label: "Finalizados" }, { value: "REVIEW", label: "Por revisar" },
  { value: "MANAGED", label: "Full" },
];
export function logisticsLabel(type: string | null) {
  switch (type) {
    case "self_service": return "Flex";
    case "drop_off": return "Punto de despacho";
    case "cross_docking": return "Colecta";
    case "xd_drop_off": return "Punto de despacho / XD";
    case "fulfillment": return "Full";
    case null: return "Modalidad sin informar";
    default: return "Otra modalidad (" + type + ")";
  }
}
export function preparationStatus(shipment: Shipment): Exclude<PreparationFilter, "ALL"> {
  if (shipment.status === "cancelled" || (shipment.orders.length > 0 && shipment.orders.every(o => o.cancelled))) return "CANCELLED";
  return shipment.orders.length > 0 && shipment.orders.every(o => o.completedAt) ? "COMPLETED" : "PENDING";
}
export function shippingStatus(shipment: Shipment) {
  if (preparationStatus(shipment) === "CANCELLED") return "Cancelado";
  if (shipment.substatus === "buyer_rescheduled") return "Reprogramado por el comprador";
  if (shipment.stage === "TRANSIT") return "En tránsito";
  if (shipment.substatus === "ready_to_print") return "Etiqueta lista para imprimir";
  if (shipment.substatus === "printed") return "Etiqueta impresa";
  if (shipment.substatus === "buffered") return "Etiqueta aún no habilitada";
  if (shipment.stage === "REVIEW") return shipment.issue ?? "Revisar estado";
  switch (shipment.status) {
    case "pending": return "Pendiente";
    case "handling": return "En preparación";
    case "ready_to_ship": return "Listo para enviar";
    case "shipped": case "in_transit": return "En tránsito";
    case "delivered": return "Entregado";
    case "not_delivered": return "No entregado";
    case "cancelled": return "Cancelado";
    case "returned": return "Devuelto";
    default: return shipment.status ?? "Estado sin informar";
  }
}
export function filterShipments(shipments: readonly Shipment[], stage: ShipmentStageFilter, query: string, preparation: PreparationFilter = "ALL") {
  const q = query.trim().toLocaleLowerCase("es");
  return shipments.filter(s => (stage === "ALL" || s.stage === stage) && (preparation === "ALL" || preparationStatus(s) === preparation) && (!q || [s.shipmentId, logisticsLabel(s.logistic),
    ...s.orders.flatMap(o => [o.orderId, ...o.lines.flatMap(l => [l.title, l.sku, l.color, l.size])])]
    .some(v => v?.toLocaleLowerCase("es").includes(q))))
    .sort((a,b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999") || (b.orders[0]?.soldAt ?? "").localeCompare(a.orders[0]?.soldAt ?? ""));
}
