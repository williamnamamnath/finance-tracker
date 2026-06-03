export type Frequency = "none" | "daily" | "weekly" | "bi-weekly" | "monthly" | "annually" | "custom";

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  none: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  "bi-weekly": "Bi-weekly",
  monthly: "Monthly",
  annually: "Annually",
  custom: "Custom date",
};

export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function todayKey(): string {
  return toISODateString(new Date());
}

const OCCURRENCE_COUNTS: Partial<Record<Frequency, number>> = {
  daily: 30,
  weekly: 12,
  "bi-weekly": 12,
  monthly: 12,
  annually: 3,
};

export function generateOccurrences(startDateKey: string, frequency: Frequency): string[] {
  if (frequency === "none" || frequency === "custom") {
    return [startDateKey];
  }
  const start = new Date(startDateKey + "T12:00:00");
  const count = OCCURRENCE_COUNTS[frequency] ?? 1;
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    if (frequency === "daily") d.setDate(start.getDate() + i);
    else if (frequency === "weekly") d.setDate(start.getDate() + i * 7);
    else if (frequency === "bi-weekly") d.setDate(start.getDate() + i * 14);
    else if (frequency === "monthly") d.setMonth(start.getMonth() + i);
    else if (frequency === "annually") d.setFullYear(start.getFullYear() + i);
    dates.push(d);
  }
  return dates.map(toISODateString);
}
