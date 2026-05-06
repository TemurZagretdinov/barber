export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateISO: string, amount: number): string {
  const date = new Date(`${dateISO}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function formatDateLong(dateISO: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${dateISO}T00:00:00`));
}

export function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hour, minute));
}

export function dateLabel(dateISO: string): string {
  return dateISO === todayISO() ? "Today" : formatDateLong(dateISO);
}
