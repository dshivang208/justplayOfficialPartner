import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Clock, IndianRupee, Percent } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBookings } from "@/lib/bookings";
import { usePayouts } from "@/lib/payouts";
import { buildDashboardAlerts } from "@/lib/alerts";
import { STATIC_ALERTS, STATS_ACTIVE, STATS_EMPTY, formatINR } from "@/data/dashboard";
import {
  AlertRow,
  BookingsTable,
  SkeletonDashboard,
  StatCard,
} from "@/components/partner/DashboardWidgets";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard | JustPlay Partner" }] }),
  component: DashboardOverviewPage,
});

function DashboardOverviewPage() {
  const { partner } = useAuth();
  const { bookings: allBookings } = useBookings();
  const { pendingDeductions, pendingNet } = usePayouts();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const todayDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
    [],
  );

  const recentBookings = useMemo(
    () => [...allBookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 7),
    [allBookings],
  );

  if (!partner) return null;

  // A brand-new partner (just approved, no bookings recorded yet) sees the
  // empty state; an established partner sees the populated demo data.
  // Real data replaces both once the backend lands.
  const isNewPartner = partner.sports.length === 0;
  const stats = isNewPartner ? STATS_EMPTY : STATS_ACTIVE;

  const dynamicAlerts = buildDashboardAlerts({
    bookings: allBookings,
    pendingDeductions,
    pendingNet,
  });
  const alerts = isNewPartner ? [] : [...dynamicAlerts, ...STATIC_ALERTS];

  if (loading) return <SkeletonDashboard />;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-[28px]">
            {isNewPartner
              ? `Welcome, ${partner.ownerName.split(" ")[0]}`
              : `Good afternoon, ${partner.ownerName.split(" ")[0]}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {partner.venueName} &middot; {todayDate}
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-2.5">
          <Clock className="h-4 w-4 text-primary" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Today
            </p>
            <p className="text-sm font-semibold text-foreground">
              {stats.todayBookingsCount > 0
                ? `${stats.todayBookingsCount} booking${stats.todayBookingsCount === 1 ? "" : "s"} \u00b7 next: ${stats.nextSlotLabel}`
                : "No bookings today yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Bookings this week"
          value={stats.bookingsThisWeek}
          delta={stats.bookingsThisWeekDelta}
        />
        <StatCard
          icon={IndianRupee}
          label="Revenue this week"
          value={`\u20B9${stats.revenueThisWeek.toLocaleString("en-IN")}`}
          delta={stats.revenueThisWeekDelta}
          tone="accent"
        />
        <StatCard
          icon={Percent}
          label="Occupancy rate"
          value={`${stats.occupancyRate}%`}
          delta={stats.occupancyRateDelta}
        />
        <StatCard
          icon={Clock}
          label="Bookings today"
          value={stats.todayBookingsCount}
          tone="accent"
        />
      </div>

      {alerts.length > 0 && (
        <div className="mt-7">
          <h2 className="font-display text-[15px] font-semibold text-foreground">
            Needs your attention
          </h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {alerts.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-foreground">
            Recent bookings
          </h2>
          {recentBookings.length > 0 && (
            <Link
              to="/dashboard/bookings"
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div className="mt-3">
          <BookingsTable bookings={isNewPartner ? [] : recentBookings} />
        </div>
      </div>
    </div>
  );
}