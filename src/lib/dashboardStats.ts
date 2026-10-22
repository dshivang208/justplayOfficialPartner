/**
 * Real dashboard KPIs, computed from the same `bookings` the Bookings page
 * shows — so the overview and the full list can never disagree. Replaces the
 * old hardcoded "6 bookings today / 41 this week / ₹36,850 / 74%" numbers
 * that every partner with sports configured was shown regardless of what
 * had actually happened at their venue.
 *
 * "Last 7 days" = today and the six days before it, compared against the 7
 * days before that. Deliberately not "this calendar week": early in a
 * calendar week that would compare a day or two against a full previous
 * week and always read as a collapse.
 *
 * What counts:
 *  - a booking  = any non-cancelled booking (it held the slot, including a
 *                 no-show)
 *  - revenue    = money actually collected: non-cancelled AND paymentStatus
 *                 "paid". Pending cash isn't revenue yet; refunded isn't
 *                 either. Gross booking value (before JustPlay's commission),
 *                 the same `amount` the Bookings list shows.
 * Occupancy needs slot capacity, which bookings can't tell us — see
 * `useOccupancy.ts`.
 */
import type { Booking } from "@/data/bookings";

export type DashboardStats = {
  todayBookingsCount: number;
  /** e.g. "6:00 PM – Box Cricket – Aditya M.", or null if nothing is left today */
  nextSlotLabel: string | null;
  bookingsLast7Days: number;
  /** % change vs the previous 7 days. undefined when there's nothing to compare against. */
  bookingsDelta: number | undefined;
  revenueLast7Days: number;
  revenueDelta: number | undefined;
};

/** Local-time yyyy-mm-dd (NOT toISOString(), which is UTC and flips the date
 *  for ~5.5 hours every day in India). */
export function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftISODate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return localISODate(new Date(y!, m! - 1, d! + days));
}

function percentChange(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}

/** "18:00" -> "6:00 PM" */
function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const hour = h! % 12 === 0 ? 12 : h! % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${h! >= 12 ? "PM" : "AM"}`;
}

/** "Aditya Mehta" -> "Aditya M." */
function shortName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]![0]!.toUpperCase()}.`;
}

export function computeDashboardStats(bookings: Booking[], now: Date = new Date()): DashboardStats {
  const today = localISODate(now);
  const currentStart = shiftISODate(today, -6);
  const previousStart = shiftISODate(today, -13);
  const previousEnd = shiftISODate(today, -7);

  const live = bookings.filter((b) => b.status !== "cancelled");
  const collected = (b: Booking) => b.paymentStatus === "paid";

  const inCurrent = live.filter((b) => b.date >= currentStart && b.date <= today);
  const inPrevious = live.filter((b) => b.date >= previousStart && b.date <= previousEnd);

  const revenueCurrent = inCurrent.filter(collected).reduce((sum, b) => sum + b.amount, 0);
  const revenuePrevious = inPrevious.filter(collected).reduce((sum, b) => sum + b.amount, 0);

  const todays = live.filter((b) => b.date === today);
  const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const next = todays
    .filter((b) => b.status === "confirmed" && b.startTime > nowHHMM)
    .sort((a, b) => (a.startTime < b.startTime ? -1 : 1))[0];

  return {
    todayBookingsCount: todays.length,
    nextSlotLabel: next ? `${to12h(next.startTime)} \u2013 ${next.sport} \u2013 ${shortName(next.customerName)}` : null,
    bookingsLast7Days: inCurrent.length,
    bookingsDelta: percentChange(inCurrent.length, inPrevious.length),
    revenueLast7Days: revenueCurrent,
    revenueDelta: percentChange(revenueCurrent, revenuePrevious),
  };
}
