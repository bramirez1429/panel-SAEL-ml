import { describe, expect, it } from "vitest";
import { filterShipments, preparationStatus, type Shipment } from "./shipments.model";
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
