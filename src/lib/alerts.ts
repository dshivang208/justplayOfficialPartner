/**
 * Shared "needs your attention" alert list — built once here so the
 * Dashboard Overview's alert section and the top-nav notification bell
 * (DashboardShell) can never drift out of sync by each recomputing it
 * slightly differently.
 *
 * Every alert here is derived from the partner's real data (pending
 * payment collection, a refund clawback, the next scheduled payout).
 * There are no hardcoded/example alerts anywhere — if nothing needs
 * attention, the list is genuinely empty.
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