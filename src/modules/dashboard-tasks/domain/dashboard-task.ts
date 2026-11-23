export type DashboardTask = Readonly<{
  id: string;
  title: string;
  publicationId: string;
  notes: string;
  dueDate: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}>;

const MAX_STORED_TASKS = 250;

export function parseDashboardTasks(raw: string | null): DashboardTask[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    const tasks: DashboardTask[] = [];

    for (const item of parsed.slice(0, MAX_STORED_TASKS)) {
      if (!isStoredTask(item) || seen.has(item.id)) continue;
      seen.add(item.id);
      tasks.push({
        id: item.id,
        title: item.title.slice(0, 160).trim(),
        publicationId: item.publicationId.slice(0, 80).trim(),
        notes: item.notes.slice(0, 500),
        dueDate: item.dueDate,
        done: item.done,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    }

    return tasks;
  } catch {
    return [];
  }
}

function isStoredTask(item: unknown): item is DashboardTask {
  if (!item || typeof item !== "object") return false;
  const value = item as Record<string, unknown>;
  return typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    typeof value.publicationId === "string" &&
    typeof value.notes === "string" &&
    (value.dueDate === null ||
      (typeof value.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.dueDate))) &&
    typeof value.done === "boolean" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string";
}

export function sortDashboardTasks(tasks: readonly DashboardTask[]): DashboardTask[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return Number(a.done) - Number(b.done);
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate !== b.dueDate) return a.dueDate ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function formatTaskDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day, 12));
}
