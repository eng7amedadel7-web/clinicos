// The single source of truth for clinic time display.
// Every screen formats dates/times through these helpers so a patient's
// appointment reads the same on the calendar, the dashboard, and the ticket.
// MERUNA is multi-tenant across the Gulf: the timezone belongs to the CLINIC
// (clinics.timezone), not to the server or the browser. App.tsx seeds this
// module from the session's clinic settings once loaded.
export const DEFAULT_CLINIC_TIMEZONE = "Asia/Riyadh";
let clinicTimezone = DEFAULT_CLINIC_TIMEZONE;

export function getClinicTimezone(): string {
  return clinicTimezone;
}

export function setClinicTimezone(timezone?: string | null): void {
  const tz = timezone?.trim();
  if (tz) clinicTimezone = tz;
}

// Today's date (YYYY-MM-DD) in the clinic timezone — for day pickers.
export function clinicToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: clinicTimezone }).format(new Date());
}

// SLOT/APPOINTMENT TIMES use the product's documented storage convention:
// wall-clock times stored as UTC, displayed with UTC getters — the HH:MM the
// clinic typed is exactly the HH:MM every screen shows. Never convert these
// through a timezone.
function wallLocale(language?: string) {
  return language === "en" ? "en-GB" : "ar-EG";
}

export function formatWallTime(value: string | Date | null | undefined, language?: string): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(wallLocale(language), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d);
}

export function formatWallDate(value: string | Date | null | undefined, language?: string, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(wallLocale(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(d);
}

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
    timeZone: clinicTimezone,
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
    timeZone: clinicTimezone,
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

