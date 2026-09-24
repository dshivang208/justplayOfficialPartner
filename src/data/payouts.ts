/**
 * Payouts data model (Backend Phase D).
 *
 * Every amount here is now SERVER-COMPUTED, not derived client-side:
 * commission is a per-court rate set by a future admin panel (0 by
 * default — see `courts.commission_rate` in the Phase D migration), so
 * there is no single COMMISSION_RATE constant anymore, and no netAmount()/
 * commissionAmount() helpers to (mis)apply it. A line item's `netAmount`
 * IS the number the venue actually gets for that booking, full stop —
 * always trust it over recomputing anything from `grossAmount`.
 */

export type PayoutStatus = "processing" | "completed" | "failed";
export type PayoutMethodType = "bank" | "upi";
export type VerificationStatus = "verified" | "pending" | "failed";

export type PayoutLineItem = {
  bookingId: string;
  bookingLabel: string;
  /** Pre-commission amount (price_paid minus any wallet credit applied). */
  grossAmount: number;
  /** What the venue actually receives for this booking — commission already deducted. */
  netAmount: number;
  date: string; // yyyy-mm-dd, the booking's date — used for the earnings trend
};

export type PayoutBatch = {
  id: string;
  date: string; // yyyy-mm-dd
  /** Net amount actually transferred — sum of netAmount across lineItems. */
  amount: number;
  status: PayoutStatus;
  method: PayoutMethodType;
  lineItems: PayoutLineItem[];
};

export type PendingDeduction = {
  id: string;
  bookingId: string;
  bookingLabel: string;
  /** Amount being clawed back — already net, same figure it was originally paid out at. */
  netAmount: number;
  reason: string;
  loggedAt: string;
};

export type BankDetails = { accountHolderName: string; accountNumber: string; ifsc: string };
export type UpiDetails = { upiId: string };

export type PayoutSettings = {
  method: PayoutMethodType;
  bank: BankDetails | null;
  upi: UpiDetails | null;
  verificationStatus: VerificationStatus;
  updatedAt: string | null;
};

export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `\u2022\u2022\u2022\u2022 ${digits.slice(-4)}`;
}

/** Payouts run weekly, every Monday, for the previous week's earnings —
 *  returns the next Monday strictly after `from`. */
export function nextPayoutDate(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMonday);
  return d;
}

export type TrendPoint = { date: string; amount: number };

/** Real daily net-earnings trend for the last `days` days, built from
 *  actual line items (pending + already-paid-out) rather than fake/random
 *  data — payouts themselves are weekly batches, but the chart wants
 *  daily granularity, so it's bucketed by each booking's own date. Days
 *  with no bookings show as 0, not omitted, so the x-axis stays continuous. */
export function dailyEarningsTrend(
  items: Pick<PayoutLineItem, "date" | "netAmount">[],
  days: number,
): TrendPoint[] {
  const totalsByDate = new Map<string, number>();
  for (const item of items) {
    totalsByDate.set(item.date, (totalsByDate.get(item.date) ?? 0) + item.netAmount);
  }

  const points: TrendPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    points.push({ date: dateStr, amount: totalsByDate.get(dateStr) ?? 0 });
  }
  return points;
}

export function statusLabel(s: PayoutStatus): string {
  switch (s) {
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
  }
}

export function verificationLabel(s: VerificationStatus): string {
  switch (s) {
    case "verified":
      return "Verified";
    case "pending":
      return "Pending verification";
    case "failed":
      return "Verification failed";
  }
}