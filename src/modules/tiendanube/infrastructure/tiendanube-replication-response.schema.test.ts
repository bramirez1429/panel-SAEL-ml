import { describe, expect, it } from "vitest";
import { replicationResponseSchema } from "./tiendanube-replication-response.schema";

const response = (action: "created" | "updated") => ({
  ok: true,
  action,
  mercadolibreSourceId: "123e4567-e89b-42d3-a456-426614174000",
  tiendanubeProductId: "tn-10",
});

describe("replicationResponseSchema", () => {
  it("acepta created con UUID interno", () => {
    expect(replicationResponseSchema.safeParse(response("created")).success).toBe(true);
  });

  it("acepta updated con UUID interno", () => {
    expect(replicationResponseSchema.safeParse(response("updated")).success).toBe(true);
  });

  it("rechaza una respuesta sin UUID interno", () => {
    const invalid = { ok: true, action: "created", tiendanubeProductId: "tn-10" };
    expect(replicationResponseSchema.safeParse(invalid).success).toBe(false);
  });

  it("rechaza un identificador que no es UUID", () => {
    const invalid = { ok: true, action: "created", mercadolibreSourceId: "item:MLA1", tiendanubeProductId: "tn-10" };
    expect(replicationResponseSchema.safeParse(invalid).success).toBe(false);
  });
});
