import { describe, expect, it } from "vitest";

import { getSyncProgressAppearance } from "./sync-circular-progress";

describe("SyncCircularProgress", () => {
  it("usa azul durante el progreso y gris para los segmentos pendientes", () => {
    expect(getSyncProgressAppearance("RUNNING")).toEqual({
      status: "active",
      strokeColor: "#1677ff",
      railColor: "#d9d9d9",
    });
  });

  it("usa verde solamente cuando el backend informa COMPLETED", () => {
    expect(getSyncProgressAppearance("COMPLETED").strokeColor).toBe("#52c41a");
    expect(getSyncProgressAppearance("COMPLETED").status).toBe("success");
    expect(getSyncProgressAppearance("CANCELLED").strokeColor).toBe("#1677ff");
    expect(getSyncProgressAppearance("CANCELLED").status).toBe("normal");
    expect(getSyncProgressAppearance("COMPLETED_WITH_ERRORS").strokeColor).toBe("#1677ff");
  });
});
