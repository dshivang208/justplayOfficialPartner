import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { formatINR, type DashboardAlert } from "@/data/dashboard";
import { formatBookingId, type Booking } from "@/data/bookings";
import { formatTimeLabel } from "@/data/inventory";
import { BookingStatusBadge } from "./BookingBadges";

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaGood = true,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: number;
  deltaGood?: boolean;
  tone?: "primary" | "accent";
}) {
  const hasDelta = delta !== undefined && delta !== 0;
  const isPositive = (delta ?? 0) > 0;
  const deltaIsGood = isPositive === deltaGood;

  return (
    <div className="surface-card flex-1 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            tone === "accent" ? "bg-accent/15" : "bg-primary/10"
          }`}
        >
          <Icon className={`h-5 w-5 ${tone === "accent" ? "text-accent" : "text-primary"}`} />
        </div>
        {hasDelta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              deltaIsGood ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta ?? 0)}%
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-bold leading-none text-foreground">{value}</p>
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function AlertRow({ alert }: { alert: DashboardAlert }) {
  const cfg =
    alert.level === "warning"
      ? { color: "border-accent text-accent", bg: "bg-accent/10", Icon: AlertTriangle }
      : { color: "border-primary text-primary", bg: "bg-primary/5", Icon: Bell };
  const { Icon } = cfg;
  const [borderColor, textColor] = cfg.color.split(" ");

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border-l-4 px-3.5 py-3 ${borderColor} ${cfg.bg}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${textColor}`} />
      <p className="flex-1 text-sm leading-snug text-foreground">{alert.text}</p>
      {alert.href ? (
        <Link
          to={alert.href}
          className={`shrink-0 text-xs font-semibold underline underline-offset-2 ${textColor}`}
        >
          {alert.action}
        </Link>
      ) : (
        <span className={`shrink-0 text-xs font-semibold ${textColor}`}>{alert.action}</span>
      )}
    </div>
  );
}

function dateLabel(dateISO: string) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  if (dateISO === today) return "Today";
  if (dateISO === tomorrow) return "Tomorrow";
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center justify-center rounded-2xl py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
          <CalendarCheck className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mt-3.5 text-sm font-semibold text-foreground">No bookings yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Once your venue is approved and live, bookings will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      <table className="hidden w-full text-left sm:table">
        <thead>
          <tr className="bg-surface-raised">
            {["Sport", "When", "Customer", "Status", "Amount"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => (
            <tr key={b.id} className={i === 0 ? "" : "border-t border-border"}>
              <td className="p-0">
                <Link
                  to="/dashboard/bookings/$bookingId"
                  params={{ bookingId: b.id }}
                  className="block px-4 py-3.5 text-sm font-semibold text-foreground hover:text-primary"
                >
                  {b.sport}
                </Link>
              </td>
              <td className="px-4 py-3.5 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{dateLabel(b.date)}</span>{" "}
                {formatTimeLabel(b.startTime)}
              </td>
              <td className="px-4 py-3.5 text-sm text-muted-foreground">{b.customerName}</td>
              <td className="px-4 py-3.5">
                <BookingStatusBadge status={b.status} />
              </td>
              <td className="px-4 py-3.5 text-sm font-semibold text-foreground">
                {formatINR(b.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col divide-y divide-border sm:hidden">
        {bookings.map((b) => (
          <Link
            key={b.id}
            to="/dashboard/bookings/$bookingId"
            params={{ bookingId: b.id }}
            className="block px-4 py-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{b.sport}</span>
              <BookingStatusBadge status={b.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dateLabel(b.date)} &middot; {formatTimeLabel(b.startTime)} &middot;{" "}
              {formatBookingId(b.id)}
            </p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{b.customerName}</span>
              <span className="text-sm font-semibold text-foreground">{formatINR(b.amount)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-56 rounded-md bg-surface-raised" />
      <div className="mt-2 h-4 w-72 rounded-md bg-surface-raised" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-surface-raised" />
        ))}
      </div>
      <div className="mt-6 h-32 rounded-2xl bg-surface-raised" />
      <div className="mt-6 h-64 rounded-2xl bg-surface-raised" />
    </div>
  );
}
