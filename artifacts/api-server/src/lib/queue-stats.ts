export type QueueAppointment = Record<string, unknown>;

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && String(value).trim() !== "" ? parsed : null;
}

export function computeQueueStats(appointments: QueueAppointment[]): {
  nowServing: number | null;
  waiting: number;
} {
  const servedNumbers = appointments
    .filter((item) => item.appointment_status === "checked_in" || item.appointment_status === "completed")
    .map((item) => toNumber(item.queue_number))
    .filter((value): value is number => value !== null);

  const nowServing = servedNumbers.length ? Math.max(...servedNumbers) : null;

  const waiting = appointments.filter((item) => {
    const status = typeof item.appointment_status === "string" ? item.appointment_status : "";
    const queueNumber = toNumber(item.queue_number);
    return (
      ["scheduled", "confirmed", "pending"].includes(status) &&
      queueNumber !== null &&
      (nowServing === null || queueNumber > nowServing)
    );
  }).length;

  return { nowServing, waiting };
}
