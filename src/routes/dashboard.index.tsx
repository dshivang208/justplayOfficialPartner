import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Clock, IndianRupee, Percent } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBookings } from "@/lib/bookings";
import { usePayouts } from "@/lib/payouts";
import { buildDashboardAlerts } from "@/lib/alerts";
import { computeDashboardStats } from "@/lib/dashboardStats";
import { useOccupancy } from "@/lib/useOccupancy";
import { formatINR } from "@/data/dashboard";
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

/** StatCard only wants a `delta` prop when there is one to show. */
const withDelta = (d: number | undefined) => (d === undefined ? {} : { delta: d });

function greetingFor(now: Date) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function DashboardOverviewPage() {
  const { partner } = useAuth();
  const { bookings: allBookings, hydrated, loadError, refresh } = useBookings();
  const { pendingDeductions, pendingNet } = usePayouts();
  const { occupancy, error: occupancyError } = useOccupancy(
    partner?.venueId ?? null,
    allBookings.length,
  );

  // Ticks once a minute so "next: 6:00 PM" and the greeting move on by
  // themselves instead of freezing at whatever time the page was opened.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayDate = useMemo(
    () => now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
    [now],
  );

  const stats = useMemo(() => computeDashboardStats(allBookings, now), [allBookings, now]);

  const recentBookings = useMemo(
    () => [...allBookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 7),
    [allBookings],
  );

  if (!partner) return null;
  // Real loading state — not a fixed delay, and no zeroed KPIs flashing
  // before the first request has even been sent.
  if (!hydrated) return <SkeletonDashboard />;

  const isNewPartner = partner.sports.length === 0;
  const alerts = buildDashboardAlerts({ bookings: allBookings, pendingDeductions, pendingNet });

  // If the bookings request failed, an empty list would read as "no bookings"
  // and "₹0" — wrong, and worse than saying nothing. Show a dash instead.
  const bookingsOk = loadError === null;
  const dash = "\u2014";
  const occupancyValue =
    occupancyError || !occupancy || occupancy.rate === null ? dash : `${occupancy.rate}%`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-[28px]">
            {isNewPartner
              ? `Welcome, ${partner.ownerName.split(" ")[0]}`
              : `${greetingFor(now)}, ${partner.ownerName.split(" ")[0]}`}
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
              {!bookingsOk
                ? "Couldn't load today's bookings"
                : stats.todayBookingsCount === 0
                  ? "No bookings today yet"
                  : `${stats.todayBookingsCount} booking${stats.todayBookingsCount === 1 ? "" : "s"}${
                      stats.nextSlotLabel ? ` \u00b7 next: ${stats.nextSlotLabel}` : " \u00b7 none left today"
                    }`}
            </p>
          </div>
        </div>
      </div>

      {!bookingsOk && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-l-4 border-destructive bg-destructive/5 px-4 py-3">
          <p className="text-sm text-foreground">
            We couldn&apos;t load your bookings, so the numbers below aren&apos;t shown rather than
            risk showing wrong ones.
          </p>
          <button
            onClick={() => void refresh()}
            className="text-sm font-semibold text-primary underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Bookings · last 7 days"
          value={bookingsOk ? stats.bookingsLast7Days : dash}
          {...withDelta(bookingsOk ? stats.bookingsDelta : undefined)}
        />
        <StatCard
          icon={IndianRupee}
          label="Revenue · last 7 days"
          value={bookingsOk ? formatINR(stats.revenueLast7Days) : dash}
          {...withDelta(bookingsOk ? stats.revenueDelta : undefined)}
          tone="accent"
        />
        <StatCard
          icon={Percent}
          label="Occupancy · last 7 days"
          value={occupancyValue}
          {...withDelta(occupancy?.delta)}
        />
        <StatCard
          icon={Clock}
          label="Bookings today"
          value={bookingsOk ? stats.todayBookingsCount : dash}
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
          <BookingsTable bookings={recentBookings} />
        </div>
      </div>
    </div>
  );
}
