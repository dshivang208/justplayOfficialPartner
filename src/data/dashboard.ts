/**
 * Shared dashboard types and the ₹ formatter. This file used to hold mock
 * KPI numbers (a fixed "6 bookings today / ₹36,850 this week / 74%
 * occupancy" shown to every partner) and a made-up "Sunday evening slots are
 * fully booked" alert — both are gone. KPIs are now computed from the
 * partner's real bookings and slots (see `lib/dashboardStats.ts` and
 * `lib/useOccupancy.ts`); alerts are built from real data in `lib/alerts.ts`.
 */

export type AlertLevel = "warning" | "info";

export type DashboardAlert = {
  id: string;
  level: AlertLevel;
  text: string;
  action: string;
  href?: string;
};

export function formatINR(n: number) {
  return `\u20B9${n.toLocaleString("en-IN")}`;
}
