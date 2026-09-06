// The single source of truth for clinic time display.
// Every screen formats dates/times through these helpers so a patient's
// appointment reads the same on the calendar, the dashboard, and the ticket.
export const CLINIC_TIMEZONE = "Africa/Cairo";

function localeFor(language?: string) {
  return language === "en" ? "en-EG" : "ar-EG";
}

export function formatClinicTime(
  value: string | Date | null | undefined,
  language?: string,
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeFor(language), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: CLINIC_TIMEZONE,
  }).format(d);
}

export function formatClinicDate(
  value: string | Date | null | undefined,
  language?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeFor(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: CLINIC_TIMEZONE,
    ...options,
  }).format(d);
}

export function formatClinicDateTime(
  value: string | Date | null | undefined,
  language?: string,
): string {
  if (!value) return "—";
  return `${formatClinicDate(value, language)} · ${formatClinicTime(value, language)}`;
}

