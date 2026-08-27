const formatter = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
function format(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/u.exec(value);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  if (Number.isNaN(date.getTime())) return null;
  const parts = formatter.formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;
  return day && month && year ? `${day} ${month.replace(/\.$/u, "")}. ${year}` : null;
}
export function formatPromotionPeriod(startDate: string | null, finishDate: string | null): string {
  const start = startDate ? format(startDate) : null; const finish = finishDate ? format(finishDate) : null;
  if (start && finish) return `Vigencia: ${start} al ${finish}`;
  if (start) return `Desde ${start}`;
  if (finish) return `Hasta ${finish}`;
  return "Sin fecha informada";
}
