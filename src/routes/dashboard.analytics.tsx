import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { OwnerOnlyGuard } from "@/components/partner/OwnerOnlyGuard";
import { Button } from "@/components/partner/Button";
import { EarningsChart } from "@/components/partner/EarningsChart";
import { useBookings } from "@/lib/bookings";
import { localISODate, shiftISODate } from "@/lib/dashboardStats";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Analytics | JustPlay Partner" }] }),
  component: () => (
    <OwnerOnlyGuard>
      <AnalyticsPage />
    </OwnerOnlyGuard>
  ),
});

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface-card rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function BarList({ rows }: { rows: { label: string; value: number; display: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.every((r) => r.value === 0)) return <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-2 text-xs">
          <span className="w-14 shrink-0 text-muted-foreground">{r.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="gradient-primary h-full rounded-full" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right font-semibold text-foreground">{r.display}</span>
        </li>
      ))}
    </ul>
  );
}

function AnalyticsPage() {
  const { bookings } = useBookings();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const m = useMemo(() => {
    const todayIso = localISODate(new Date());
    const from = shiftISODate(todayIso, -(range - 1));
    const inRange = bookings.filter((b) => b.date >= from && b.date <= todayIso);
    const real = inRange.filter((b) => b.status === "confirmed" || b.status === "completed");
    const cancelled = inRange.filter((b) => b.status === "cancelled");
    const noShow = inRange.filter((b) => b.status === "no_show");
    const revenue = real.reduce((s, b) => s + b.amount, 0);

    const perDay = new Map<string, number>();
    for (let i = 0; i < range; i++) perDay.set(shiftISODate(from, i), 0);
    for (const b of real) perDay.set(b.date, (perDay.get(b.date) ?? 0) + b.amount);
    const trend = Array.from(perDay, ([date, amount]) => ({ date, amount }));

    const weekday = DAYS.map((label, i) => ({
      label,
      value: real.filter((b) => new Date(`${b.date}T00:00:00`).getDay() === i).length,
    }));
    const hours = new Map<number, number>();
    for (const b of real) {
      const h = Number(b.startTime.slice(0, 2));
      hours.set(h, (hours.get(h) ?? 0) + 1);
    }
    const peak = [...hours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([h, c]) => ({ label: `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`, value: c, display: `${c} bookings` }));

    const bySport = new Map<string, number>();
    for (const b of real) bySport.set(b.sport, (bySport.get(b.sport) ?? 0) + b.amount);
    const sports = [...bySport.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, display: inr(value) }));

    const byCourt = new Map<string, number>();
    for (const b of real) byCourt.set(b.courtName, (byCourt.get(b.courtName) ?? 0) + 1);
    const courts = [...byCourt.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, display: `${value}` }));

    // Repeat customers (by phone), across the whole booking history we have.
    const perCustomer = new Map<string, number>();
    for (const b of bookings.filter((x) => x.status !== "cancelled" && x.customerPhone)) {
      perCustomer.set(b.customerPhone, (perCustomer.get(b.customerPhone) ?? 0) + 1);
    }
    const customers = perCustomer.size;
    const repeat = [...perCustomer.values()].filter((c) => c > 1).length;
    const walkIns = real.filter((b) => b.source === "walk_in").length;

    return {
      revenue, count: real.length, cancelled: cancelled.length, noShow: noShow.length,
      avg: real.length ? revenue / real.length : 0,
      cancelRate: inRange.length ? (cancelled.length / inRange.length) * 100 : 0,
      trend, weekday: weekday.map((w) => ({ ...w, display: `${w.value}` })), peak, sports, courts,
      customers, repeat, walkIns, from, todayIso,
    };
  }, [bookings, range]);

  const exportCsv = () => {
    const rows = [["Date", "Revenue (INR)"], ...m.trend.map((t) => [t.date, String(t.amount)])];
    const csv = "﻿" + rows.map((r) => r.join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `justplay-revenue-${m.from}-to-${m.todayIso}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-[28px]">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">How your venue is performing.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-secondary p-1">
            {([7, 30, 90] as const).map((d) => (
              <button key={d} type="button" onClick={() => setRange(d)}
                className={"rounded-full px-3.5 py-1 text-sm font-semibold transition-colors " +
                  (range === d ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                {d}d
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={inr(m.revenue)} hint={`last ${range} days`} />
        <Stat label="Bookings" value={String(m.count)} hint={`${m.walkIns} walk-in`} />
        <Stat label="Avg booking value" value={inr(m.avg)} />
        <Stat label="Cancellation rate" value={`${m.cancelRate.toFixed(0)}%`} hint={`${m.cancelled} cancelled · ${m.noShow} no-show`} />
      </div>

      <div className="surface-card mt-5 rounded-2xl p-5">
        <h2 className="text-lg font-semibold">Daily revenue</h2>
        <div className="mt-3"><EarningsChart data={m.trend} /></div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="surface-card rounded-2xl p-5">
          <h2 className="text-lg font-semibold">Busiest days</h2>
          <div className="mt-3"><BarList rows={m.weekday} /></div>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <h2 className="text-lg font-semibold">Peak hours</h2>
          <div className="mt-3"><BarList rows={m.peak} /></div>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <h2 className="text-lg font-semibold">Revenue by sport</h2>
          <div className="mt-3"><BarList rows={m.sports} /></div>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <h2 className="text-lg font-semibold">Bookings by court</h2>
          <div className="mt-3"><BarList rows={m.courts} /></div>
        </div>
      </div>

      <div className="surface-card mt-5 rounded-2xl p-5">
        <h2 className="text-lg font-semibold">Customers</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{m.customers}</span> unique customers ·{" "}
          <span className="font-semibold text-foreground">{m.repeat}</span> have booked more than once
          {m.customers ? ` (${Math.round((m.repeat / m.customers) * 100)}% repeat rate)` : ""}.
        </p>
      </div>
    </div>
  );
}
