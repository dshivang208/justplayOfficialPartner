/**
 * Mock data for the Dashboard Overview's KPI cards and alerts. Shapes
 * mirror what a future `dashboard-summary` backend endpoint would return.
 * Recent bookings are NOT here — as of Phase 3 they come straight from
 * `useBookings()` (see `lib/bookings.tsx`), so the Dashboard Overview and
 * the full Bookings list always agree.
 */

export type AlertLevel = "warning" | "info";

export type DashboardAlert = {
  id: string;
  level: AlertLevel;
  text: string;
  action: string;
  href?: string;
};

export type DashboardStats = {
  todayBookingsCount: number;
  nextSlotLabel: string | null;
  bookingsThisWeek: number;
  bookingsThisWeekDelta: number;
  revenueThisWeek: number;
  revenueThisWeekDelta: number;
  occupancyRate: number;
  occupancyRateDelta: number;
};

export const STATS_ACTIVE: DashboardStats = {
  todayBookingsCount: 6,
  nextSlotLabel: "6:00 PM \u2013 Box Cricket \u2013 Aditya M.",
  bookingsThisWeek: 41,
  bookingsThisWeekDelta: 12,
  revenueThisWeek: 36850,
  revenueThisWeekDelta: 8,
  occupancyRate: 74,
  occupancyRateDelta: -3,
};

export const STATS_EMPTY: DashboardStats = {
  todayBookingsCount: 0,
  nextSlotLabel: null,
  bookingsThisWeek: 0,
  bookingsThisWeekDelta: 0,
  revenueThisWeek: 0,
  revenueThisWeekDelta: 0,
  occupancyRate: 0,
  occupancyRateDelta: 0,
};

export const STATIC_ALERTS: DashboardAlert[] = [
  {
    id: "a3",
    level: "info",
    text: "Sunday evening slots (6\u20139 PM) are fully booked \u2014 consider adding more capacity",
    action: "Manage slots",
    href: "/dashboard/slots",
  },
];

export function formatINR(n: number) {
  return `\u20B9${n.toLocaleString("en-IN")}`;
}
