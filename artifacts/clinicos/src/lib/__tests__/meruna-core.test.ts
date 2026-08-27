import { formatMessageTime, formatRelativeTime } from "@/components/inbox/inbox-icons";
import { appointmentDateLabel } from "@/lib/search-api";

// Core logic helpers for analytics and calculation validation
export function calculateRates(total: number, completed: number, cancelled: number, noShow: number) {
  return {
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    noShowRate: total > 0 ? Math.round((noShow / total) * 100) : 0,
  };
}

export function calculateWeekOverWeek(thisWeek: number, lastWeek: number): number | null {
  if (lastWeek <= 0) return null;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

// Verification runner
export function runMerunaLogicTests() {
  const results: Array<{ test: string; passed: boolean; error?: string }> = [];

  function assert(name: string, condition: boolean) {
    if (condition) {
      results.push({ test: name, passed: true });
    } else {
      results.push({ test: name, passed: false, error: "Assertion failed" });
      console.error(`❌ Test failed: ${name}`);
    }
  }

  // Test 1: Rates calculation
  const rates = calculateRates(100, 75, 15, 10);
  assert("Rates: completionRate is 75%", rates.completionRate === 75);
  assert("Rates: cancellationRate is 15%", rates.cancellationRate === 15);
  assert("Rates: noShowRate is 10%", rates.noShowRate === 10);

  // Test 2: Zero division guard
  const zeroRates = calculateRates(0, 0, 0, 0);
  assert("Zero total: handles 0 gracefully without NaN", zeroRates.completionRate === 0 && zeroRates.cancellationRate === 0);

  // Test 3: Week-over-week calculation
  assert("Week over week: +50% growth", calculateWeekOverWeek(150, 100) === 50);
  assert("Week over week: -20% drop", calculateWeekOverWeek(80, 100) === -20);
  assert("Week over week: null when previous was 0", calculateWeekOverWeek(50, 0) === null);

  // Test 4: Relative time format
  const justNow = new Date().toISOString();
  assert("Relative time: Just now / الآن", formatRelativeTime(justNow, true) === "Just now");
  assert("Relative time (ar): الآن", formatRelativeTime(justNow, false) === "الآن");

  // Test 5: Appointment label format
  assert("Date label: null fallback (ar)", appointmentDateLabel(null, "ar") === "بدون موعد");
  assert("Date label: null fallback (en)", appointmentDateLabel(null, "en") === "No date");

  return results;
}
