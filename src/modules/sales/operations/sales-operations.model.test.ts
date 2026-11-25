import { describe, expect, it } from "vitest";
import { selectSalesOrders, summarizeSalesOrders, type SaleOrder } from "./sales-operations.model";

function order(orderId: string, soldAt: string, status: SaleOrder["status"] = "PENDING", channel: SaleOrder["channel"] = "MERCADOLIBRE"): SaleOrder {
  return { orderId, soldAt, status, channel, buyer: null, shippingStatus: null, completedAt: null, completedBy: null, unread: true, quantity: 1, amount: null, currency: null, lines: [] };
}
const orders = [
  order("1", "2026-11-25T02:59:59Z"),
  order("2", "2026-11-25T03:00:00Z", "COMPLETED"),
  order("3", "2026-11-23T17:00:00Z", "CANCELLED"),
  order("4", "2026-11-19T03:00:00Z", "PENDING", "TIENDANUBE"),
  order("5", "2026-11-19T02:59:59Z"),
  order("6", "2026-10-26T03:00:00Z"),
  order("7", "2026-10-26T02:59:59Z"),
];
describe("sales filters", () => {
  const today = "2026-11-25";
  it("uses the Argentina midnight boundary and includes yesterday only", () => {
    expect(selectSalesOrders(orders, today, "today", "ALL").map(o => o.orderId)).toEqual(["2"]);
    expect(selectSalesOrders(orders, today, "yesterday", "ALL").map(o => o.orderId)).toEqual(["1"]);
  });
  it("includes seven or 31 calendar days with inclusive bounds", () => {
    expect(selectSalesOrders(orders, today, "week", "ALL").map(o => o.orderId)).toEqual(["1", "2", "3", "4"]);
    expect(selectSalesOrders(orders, today, "month", "ALL").map(o => o.orderId)).toEqual(["1", "2", "3", "4", "5", "6"]);
  });
  it("recalculates the summary from the same period and channel, excluding cancellations from sales", () => {
    expect(summarizeSalesOrders(selectSalesOrders(orders, today, "week", "ALL"))).toEqual({ sales: 3, pending: 2, completed: 1, cancelled: 1, ml: 2, tn: 1, unread: 3 });
    expect(summarizeSalesOrders(selectSalesOrders(orders, today, "week", "TIENDANUBE")).sales).toBe(1);
    expect(summarizeSalesOrders(selectSalesOrders(orders, today, "week", "ALL", "2")).completed).toBe(1);
  });
});
