import { describe, expect, it } from "vitest";
import { replicationResponseSchema } from "./tiendanube-replication-response.schema";

const response = (action: "created" | "updated") => ({
  ok: true,
  action,
  sourceKey: "item:MLA1",
  tiendanubeProductId: "tn-10",
});

describe("replicationResponseSchema", () => {
  it("acepta created con sourceKey", () => {
    expect(replicationResponseSchema.safeParse(response("created")).success).toBe(true);
  });

  it("acepta updated con sourceKey", () => {
    expect(replicationResponseSchema.safeParse(response("updated")).success).toBe(true);
  });

  it("rechaza una respuesta sin sourceKey", () => {
    const invalid = { ok: true, action: "created", tiendanubeProductId: "tn-10" };
    expect(replicationResponseSchema.safeParse(invalid).success).toBe(false);
  });

  it("rechaza el contrato legacy con mercadolibreSourceId", () => {
    const legacy = { ok: true, action: "created", mercadolibreSourceId: "uuid-1", tiendanubeProductId: "tn-10" };
    expect(replicationResponseSchema.safeParse(legacy).success).toBe(false);
  });
});
