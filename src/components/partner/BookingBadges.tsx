import type { BookingStatus, PaymentStatus } from "@/data/bookings";
import { statusLabel } from "@/data/bookings";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    confirmed: "bg-primary/10 text-primary",
    completed: "bg-secondary text-foreground",
    cancelled: "bg-destructive/10 text-destructive",
    no_show: "bg-accent/15 text-accent",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, { className: string; label: string }> = {
    paid: { className: "bg-primary/10 text-primary", label: "Paid" },
    pending: { className: "bg-accent/15 text-accent", label: "Pending" },
    refunded: { className: "bg-surface-raised text-muted-foreground", label: "Refunded" },
  };
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
}
