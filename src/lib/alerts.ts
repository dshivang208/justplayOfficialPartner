/**
 * Shared "needs your attention" alert list — built once here so the
 * Dashboard Overview's alert section and the top-nav notification bell
 * (DashboardShell) can never drift out of sync by each recomputing it
 * slightly differently.
 *
 * Deliberately only the REAL, backend-derived alerts (pending payment
 * collection, a refund clawback, the next scheduled payout) — not
 * `STATIC_ALERTS` from `data/dashboard.ts`, which is tied to the still-
 * mock KPI stats (out of scope for this pass, see the Phase E brief's
 * "no analytics dashboards beyond Phase 1" note) and would make the bell
 * permanently show a fake unread notification regardless of anything a
 * partner has actually done.
 */
import type { Booking } from "@/data/bookings";
import { formatBookingId } from "@/data/bookings";
import { formatINR, type DashboardAlert } from "@/data/dashboard";
import { nextPayoutDate, type PendingDeduction } from "@/data/payouts";

export function buildDashboardAlerts(input: {
  bookings: Booking[];
  pendingDeductions: PendingDeduction[];
  pendingNet: number;
}): DashboardAlert[] {
  const { bookings, pendingDeductions, pendingNet } = input;
  const alerts: DashboardAlert[] = [];

  const pendingPaymentsCount = bookings.filter(
    (b) => b.paymentStatus === "pending" && (b.status === "confirmed" || b.status === "completed"),
  ).length;
  if (pendingPaymentsCount > 0) {
    alerts.push({
      id: "pending-payments",
      level: "warning",
      text: `${pendingPaymentsCount} booking${pendingPaymentsCount === 1 ? "" : "s"} still ${pendingPaymentsCount === 1 ? "has" : "have"} payment collection pending`,
      action: "Review bookings",
      href: "/dashboard/bookings",
    });
  }

  if (pendingDeductions.length > 0) {
    const first = pendingDeductions[0]!;
    alerts.push({
      id: "deduction",
      level: "warning",
      text: `A refund deduction of ${formatINR(first.netAmount)} will apply to your next payout (${formatBookingId(first.bookingId)} refunded)`,
      action: "View payout",
      href: "/dashboard/payouts",
    });
  }

  if (pendingNet > 0) {
    alerts.push({
      id: "payout",
      level: "info",
      text: `Payout of ${formatINR(pendingNet)} is scheduled for ${nextPayoutDate().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}`,
      action: "View payout",
      href: "/dashboard/payouts",
    });
  }

  return alerts;
}