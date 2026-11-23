import { describe, expect, it } from "vitest";

import {
  formatTaskDate,
  parseDashboardTasks,
  sortDashboardTasks,
  type DashboardTask,
} from "./dashboard-task";

const sample: DashboardTask = {
  id: "task-1",
  title: "Agregar remera nueva",
  publicationId: "MLA123456",
  notes: "Color negro, talle M",
  dueDate: "2026-11-30",
  done: false,
  createdAt: "2026-11-23T10:00:00.000Z",
  updatedAt: "2026-11-23T10:00:00.000Z",
};

describe("agenda del dashboard", () => {
  it("recupera tareas y números de publicación desde la memoria del navegador", () => {
    expect(parseDashboardTasks(JSON.stringify([sample]))).toEqual([sample]);
  });

  it("descarta contenido inválido y evita tareas duplicadas", () => {
    expect(parseDashboardTasks("not-json")).toEqual([]);
    expect(parseDashboardTasks(JSON.stringify([{ ...sample, title: "" }]))).toEqual([]);
    expect(parseDashboardTasks(JSON.stringify([sample, sample]))).toEqual([sample]);
  });

  it("prioriza pendientes con fecha y deja tareas terminadas al final", () => {
    const later = { ...sample, id: "later", dueDate: "2026-12-01" };
    const earlier = { ...sample, id: "earlier", dueDate: "2026-11-25" };
    const done = { ...sample, id: "done", done: true, dueDate: null };
    const noDate = { ...sample, id: "no-date", dueDate: null };
    expect(sortDashboardTasks([done, later, noDate, earlier]).map((item) => item.id)).toEqual([
      "earlier",
      "later",
      "no-date",
      "done",
    ]);
  });

  it("formatea fechas en español", () => {
    expect(formatTaskDate("2026-11-30")).toMatch(/30/);
  });
});
