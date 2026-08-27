import { describe, expect, it } from "vitest";
import { computeQueueStats } from "../queue-stats";

describe("computeQueueStats", () => {
  it("returns null/0 for an empty list", () => {
    expect(computeQueueStats([])).toEqual({ nowServing: null, waiting: 0 });
  });

  it("computes nowServing as the max served queue number", () => {
    const stats = computeQueueStats([
      { appointment_status: "checked_in", queue_number: 3 },
      { appointment_status: "completed", queue_number: 5 },
      { appointment_status: "scheduled", queue_number: 9 },
    ]);
    expect(stats.nowServing).toBe(5);
  });

  it("counts only active statuses above nowServing as waiting", () => {
    const stats = computeQueueStats([
      { appointment_status: "checked_in", queue_number: 5 },
      { appointment_status: "scheduled", queue_number: 6 },
      { appointment_status: "confirmed", queue_number: 8 },
      { appointment_status: "scheduled", queue_number: 4 }, // below nowServing
      { appointment_status: "cancelled", queue_number: 9 }, // not active
    ]);
    expect(stats.nowServing).toBe(5);
    expect(stats.waiting).toBe(2); // 6 and 8
  });

  it("treats string queue numbers as numeric", () => {
    const stats = computeQueueStats([
      { appointment_status: "completed", queue_number: "7" },
      { appointment_status: "scheduled", queue_number: "10" },
    ]);
    expect(stats.nowServing).toBe(7);
    expect(stats.waiting).toBe(1);
  });

  it("ignores rows without a queue number", () => {
    const stats = computeQueueStats([
      { appointment_status: "scheduled" },
      { appointment_status: "checked_in", queue_number: null },
    ]);
    expect(stats.nowServing).toBe(null);
    expect(stats.waiting).toBe(0);
  });
});
