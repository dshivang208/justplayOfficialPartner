/**
 * Booking data model — shared types and pure helpers.
 *
 * The fetching / mutation logic lives in `src/lib/bookings.tsx`
 * (BookingsProvider + useBookings); this file only holds the types and
 * display helpers other modules import.
 */

export type BookingStatus = "confirmed" | "completed" | "cancelled" | "no_show";
export type PaymentStatus = "paid" | "pending" | "refunded";
export type PaymentMethod = "cash" | "upi" | "online";
export type BookingSource = "online" | "walk_in";

export type Booking = {
  id: string;
  courtId: string;
  courtName: string;
  sport: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM (24h) */
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  /** Whole rupees. */
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  source: BookingSource;
  notes: string;
  cancellationReason: string | null;
  refundIssued: boolean;
  flagged: boolean;
  flagReason: string | null;
  flaggedAt: string | null;
  createdAt: string;
};

/** Matches `cancel_booking()` — refund only when cancelled > 2h before the slot. */
export const CANCELLATION_WINDOW_HOURS = 2;

const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function statusLabel(s: BookingStatus): string {
  return STATUS_LABELS[s];
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  online: "Online (JustPlay app)",
};

export function paymentMethodLabel(m: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[m];
}

/** Short, human-friendly booking reference derived from the row's UUID. */
export function formatBookingId(id: string): string {
  return `JP-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/** Hours from now until the slot starts (venue time, IST). Negative if already started. */
export function hoursUntilSlot(b: Pick<Booking, "date" | "startTime">): number {
  const start = new Date(`${b.date}T${b.startTime}:00+05:30`).getTime();
  return (start - Date.now()) / 3_600_000;
}
