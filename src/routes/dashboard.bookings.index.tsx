import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarX2, Download, Search } from "lucide-react";
import { useInventory } from "@/lib/inventory";
import { useBookings } from "@/lib/bookings";
import { formatINR } from "@/data/dashboard";
import { formatBookingId, statusLabel, type BookingStatus } from "@/data/bookings";
import { formatTimeLabel } from "@/data/inventory";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/partner/BookingBadges";
import { Button } from "@/components/partner/Button";

export const Route = createFileRoute("/dashboard/bookings/")({
  head: () => ({ meta: [{ title: "Bookings | JustPlay Partner" }] }),
  component: BookingsListPage,
});

const STATUS_FILTERS: { key: BookingStatus | "all"; label: string }[] = [
  { key: "all", label: "All statuses" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "no_show", label: "No-show" },
];

function dateLabel(dateISO: string) {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function BookingsListPage() {
  const { courts } = useInventory();
  const { bookings } = useBookings();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [courtId, setCourtId] = useState<string>("all");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => (courtId === "all" ? true : b.courtId === courtId))
      .filter((b) => (status === "all" ? true : b.status === status))
      .filter((b) => (dateFrom ? b.date >= dateFrom : true))
      .filter((b) => (dateTo ? b.date <= dateTo : true))
      .filter(
        (b) =>
          q === "" ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.includes(q) ||
          formatBookingId(b.id).toLowerCase().includes(q),
      )
      .sort((a, b) =>
        a.date === b.date ? (a.startTime < b.startTime ? 1 : -1) : a.date < b.date ? 1 : -1,
      );
  }, [bookings, search, courtId, status, dateFrom, dateTo]);

  const exportCsv = () => {
    downloadCsv(
      filtered.map((b) => ({
        "Booking ID": formatBookingId(b.id),
        Customer: b.customerName,
        Phone: b.customerPhone,
        "Sport/Court": `${b.sport} \u2014 ${b.courtName}`,
        Date: b.date,
        Time: `${b.startTime}\u2013${b.endTime}`,
        "Amount paid": b.amount,
        "Payment status": b.paymentStatus,
        "Payment method": b.paymentMethod,
        Status: statusLabel(b.status),
      })),
      `justplay-bookings-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  const openBooking = (id: string) =>
    void navigate({ to: "/dashboard/bookings/$bookingId", params: { bookingId: id } });

  const hasFilters = Boolean(search || courtId !== "all" || status !== "all" || dateFrom || dateTo);
  const clearFilters = () => {
    setSearch("");
    setCourtId("all");
    setStatus("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-[28px]">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every booking across your venue, filterable and exportable.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="surface-card mt-5 flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name or phone"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <select
          value={courtId}
          onChange={(e) => setCourtId(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="all">All courts</option>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus | "all")}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          aria-label="From date"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          aria-label="To date"
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-muted-foreground underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card mt-4 flex flex-col items-center justify-center rounded-2xl py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised">
            <CalendarX2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3.5 text-sm font-semibold text-foreground">
            {bookings.length === 0 ? "No bookings yet" : "No bookings match your filters"}
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {bookings.length === 0
              ? "Once your venue is live, bookings from the app and walk-ins will appear here."
              : "Try widening your date range or clearing a filter."}
          </p>
        </div>
      ) : (
        <div className="surface-card mt-4 overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="bg-surface-raised">
                {[
                  "Booking ID",
                  "Customer",
                  "Sport / Court",
                  "Date",
                  "Time",
                  "Amount",
                  "Payment",
                  "Status",
                ].map((h) => (
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
              {filtered.map((b, i) => (
                <tr
                  key={b.id}
                  onClick={() => openBooking(b.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openBooking(b.id)}
                  className={`cursor-pointer hover:bg-secondary/40 ${i === 0 ? "" : "border-t border-border"}`}
                >
                  <td className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">
                    {formatBookingId(b.id)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-foreground">
                    {b.customerName}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">
                    {b.sport} &middot; {b.courtName}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{dateLabel(b.date)}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">
                    {formatTimeLabel(b.startTime)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-foreground">
                    {formatINR(b.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <PaymentStatusBadge status={b.paymentStatus} />
                  </td>
                  <td className="px-4 py-3.5">
                    <BookingStatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
