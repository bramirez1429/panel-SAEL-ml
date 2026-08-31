const BUENOS_AIRES_TIME_ZONE = "America/Argentina/Buenos_Aires";
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "numeric",
  timeZone: BUENOS_AIRES_TIME_ZONE,
});

export function formatPromotionPeriod(
  startDate: string | null,
  finishDate: string | null,
): string | null {
  const start = formatPromotionDate(startDate);
  const finish = formatPromotionDate(finishDate);
  if (start && finish) return `${start} al ${finish}`;
  if (start) return `Desde ${start}`;
  if (finish) return `Hasta ${finish}`;
  return null;
}

function formatPromotionDate(value: string | null): string | null {
  if (!value?.trim()) return null;
  const date = parseDate(value.trim());
  if (!date) return null;
  const parts = dateFormatter.formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value;
  const monthNumber = Number(parts.find((part) => part.type === "month")?.value);
  const month = Number.isInteger(monthNumber) ? MONTHS[monthNumber - 1] : undefined;
  return day && month ? `${day}/${month}` : null;
}

function parseDate(value: string): Date | null {
  const dateOnly = DATE_ONLY_PATTERN.exec(value);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
      ? date
      : null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
