export function kzt(n?: number): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("ru-KZ").format(n) + " ₸";
}

export function shortDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-KZ", { day: "numeric", month: "short" });
}

export function daysFromNow(d: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
}

export function daysUntil(iso?: string): number {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function initials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function maskPhones(text: string) {
  return text.replace(
    /(\+?\d[\d\s\-()]{7,}\d)/g,
    "***********"
  );
}
