/**
 * Booking data model.
 *
 * Bookings are the single source of truth for slot occupancy — the Phase 2
 * calendar derives a slot's "booked" status by looking up a live (non-
 * cancelled) booking for that court/date/time, not from a separate flag.
 * That's what makes cancelling a booking here immediately free the slot
 * back up on the calendar: there's only one record to update, not two.
 *
 * Shape mirrors what the consumer app's `bookings` table already looks
 * like (user/venue/sport/date/time/price_paid/status), extended with the
 * fields a venue front desk needs: payment method, internal notes, a
 * no-show/dispute flag, and a walk-in vs. online source.
 */

export type BookingStatus = "confirmed" | "completed" | "cancelled" | "no_show";
export type PaymentMethod = "cash" | "upi" | "online";
export type PaymentStatus = "paid" | "pending" | "refunded";
export type BookingSource = "walk_in" | "online";

export type Booking = {
  id: string;
  courtId: string;
  courtName: string;
  sport: string;
  date: string; // yyyy-mm-dd
  startTime: string; // "18:00"
  endTime: string; // "19:00"
  customerName: string;
  customerPhone: string;
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
  createdAt: string; // ISO timestamp
};

/** Slots inside this window of the booking's start time are not eligible
 *  for a free cancellation — matches the same 2-hour policy the consumer
 *  app already shows customers at checkout. */
export const CANCELLATION_WINDOW_HOURS = 2;

export function bookingSlotStart(b: Pick<Booking, "date" | "startTime">): Date {
  return new Date(`${b.date}T${b.startTime}:00`);
}

export function hoursUntilSlot(
  b: Pick<Booking, "date" | "startTime">,
  now: Date = new Date(),
): number {
  return (bookingSlotStart(b).getTime() - now.getTime()) / 3_600_000;
}

/** Whether a refund is owed under policy, based on how much notice the
 *  cancellation gave relative to the slot's start time. Informational —
 *  the owner can still issue a refund as a courtesy regardless. */
export function refundOwedUnderPolicy(b: Booking, cancelledAt: Date = new Date()): boolean {
  if (b.paymentStatus !== "paid") return false;
  return hoursUntilSlot(b, cancelledAt) >= CANCELLATION_WINDOW_HOURS;
}

export function paymentMethodLabel(m: PaymentMethod): string {
  return m === "cash" ? "Cash" : m === "upi" ? "UPI" : "Online";
}

export function statusLabel(s: BookingStatus): string {
  switch (s) {
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "no_show":
      return "No-show";
  }
}

export function formatBookingId(id: string) {
  return `JP-${id.replace(/\D/g, "").slice(-6).padStart(6, "0")}`;
}
