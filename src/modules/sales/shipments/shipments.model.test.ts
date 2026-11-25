import { describe, expect, it } from "vitest";
import { filterShipments, preparationStatus, selectDailyShipments, type Shipment } from "./shipments.model";
const make = (key: string, completedAt: string | null, status = "ready_to_ship"): Shipment => ({
  key, shipmentId: key, stage: status === "cancelled" ? "FINISHED" : "TODAY",
  status, substatus: null, logistic: "self_service", deadline: null, slaStatus: null, issue: null,
  orders: [{ orderId: key, shipmentId: key, soldAt: "2026-11-24T20:00:00Z", completedAt, cancelled: false, lines: [] }],
});
describe("shipment preparation filters", () => {
  const pending = make("1", null), done = make("2", "2026-11-25T03:00:00Z"), cancelled = make("3", "2026-11-25T03:00:00Z", "cancelled");
  const all = [pending, done, cancelled];
  it("gives official cancellation priority over a completed checkbox", () => {
    expect(preparationStatus(cancelled)).toBe("CANCELLED");
  });
  it("filters across dispatch dates without hiding cancelled shipments", () => {
    expect(filterShipments(all, "ALL", "", "PENDING")).toEqual([pending]);
    expect(filterShipments(all, "ALL", "", "COMPLETED")).toEqual([done]);
    expect(filterShipments(all, "ALL", "", "CANCELLED")).toEqual([cancelled]);
    expect(filterShipments(all, "TODAY", "", "CANCELLED")).toEqual([]);
  });
});


describe("solapas de envíos de hoy", () => {
  const today = "2026-11-25";
  const pending = make("1", null);
  const completed = make("2", "2026-11-25T04:00:00Z");
  const cancelled = { ...make("3", null, "cancelled"), terminalAt: "2026-11-25T03:00:00Z" };
  const finalized: Shipment = { ...make("4", null, "delivered"), stage: "FINISHED", terminalAt: "2026-11-26T02:59:59Z" };
  const old = { ...cancelled, key: "5", terminalAt: "2026-11-25T02:59:59Z" };
  const upcoming: Shipment = { ...make("6", null), stage: "UPCOMING" };
  const unknown = { ...cancelled, key: "7", terminalAt: null };
  const all = [pending, completed, cancelled, finalized, old, upcoming, unknown];
  it("solo incluye el día operativo argentino y no mezcla históricos", () => {
    expect(selectDailyShipments(all, today)).toEqual([pending, completed, cancelled, finalized]);
  });
  it("separa los cuatro estados sin contar una cancelación como finalizada", () => {
    expect(selectDailyShipments(all, today, "PENDING")).toEqual([pending]);
    expect(selectDailyShipments(all, today, "COMPLETED")).toEqual([completed]);
    expect(selectDailyShipments(all, today, "CANCELLED")).toEqual([cancelled]);
    expect(selectDailyShipments(all, today, "FINISHED")).toEqual([finalized]);
  });
});
