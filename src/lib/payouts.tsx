/**
 * JustPlay Partner — payouts & earnings state (Backend Phase D).
 *
 * Three real data sources, no seeded/mock data left:
 *   - `payout_accounts` (this venue's bank/UPI beneficiary + verification
 *     status) — read directly, RLS already scopes it to the owner.
 *   - `payouts` + `payout_line_items` (history of what's already been
 *     paid out) — read directly, same RLS pattern as `lib/bookings.tsx`.
 *   - `partner_pending_payout_line_items` + `payout_deductions` (what's
 *     NOT yet paid out) — the RPC is the single source of truth for
 *     "pending", since it's the exact function `cashfree-run-payout` uses
 *     to decide what a real payout batch would include; recomputing that
 *     client-side from `useBookings()` would both duplicate the
 *     commission logic AND miss `credit_applied`, which this app's
 *     `Booking` type doesn't even expose.
 *
 * Writes go through the Phase D Edge Functions, never direct table
 * writes — `payout_accounts`/`payouts`/etc have no client write policies
 * on purpose (see the Phase D migration).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type BankDetails,
  type PayoutBatch,
  type PayoutLineItem,
  type PayoutSettings,
  type PendingDeduction,
  type UpiDetails,
  type VerificationStatus,
} from "@/data/payouts";
import { supabase } from "./supabaseClient";
import { useAuth } from "./auth";

type SavePayoutSettingsInput =
  { method: "bank"; bank: BankDetails } | { method: "upi"; upi: UpiDetails };

/** What the save-beneficiary Edge Function reports back — surfaced to the
 *  settings page so a Cashfree-side rejection isn't silently swallowed. */
export type SaveResult = { verified: boolean; message?: string };

type RunPayoutResult = {
  mode: "manual";
  result: { payoutId?: string; amount?: number; skipped?: string; error?: string };
};

type PayoutsContextValue = {
  loading: boolean;
  payoutBatches: PayoutBatch[];
  pendingLineItems: PayoutLineItem[];
  pendingDeductions: PendingDeduction[];
  pendingNet: number;
  payoutSettings: PayoutSettings;
  getBatch: (id: string) => PayoutBatch | undefined;
  savePayoutSettings: (input: SavePayoutSettingsInput) => Promise<SaveResult>;
  runPayoutNow: () => Promise<RunPayoutResult["result"]>;
  refresh: () => Promise<void>;
};

const PayoutsContext = createContext<PayoutsContextValue | null>(null);

const EMPTY_SETTINGS: PayoutSettings = {
  method: "bank",
  bank: null,
  upi: null,
  verificationStatus: "pending",
  updatedAt: null,
};

type BookingLabelRow = {
  date: string;
  sport: string;
  walkin_customer_name: string | null;
  users: { name: string } | null;
} | null;

function bookingLabel(row: BookingLabelRow): string {
  if (!row) return "Booking";
  const customer = row.walkin_customer_name ?? row.users?.name ?? "Customer";
  return `${customer} \u2014 ${row.sport}`;
}

type PayoutAccountRow = {
  method: "bank" | "upi";
  account_holder_name: string | null;
  account_number: string | null;
  ifsc: string | null;
  upi_id: string | null;
  verification_status: VerificationStatus;
  updated_at: string;
};

function mapAccountRow(row: PayoutAccountRow | null): PayoutSettings {
  if (!row) return EMPTY_SETTINGS;
  return {
    method: row.method,
    bank:
      row.method === "bank" && row.account_holder_name && row.account_number && row.ifsc
        ? {
            accountHolderName: row.account_holder_name,
            accountNumber: row.account_number,
            ifsc: row.ifsc,
          }
        : null,
    upi: row.method === "upi" && row.upi_id ? { upiId: row.upi_id } : null,
    verificationStatus: row.verification_status,
    updatedAt: row.updated_at,
  };
}

type PayoutRow = {
  id: string;
  amount: number;
  status: PayoutBatch["status"];
  payout_method: PayoutBatch["method"];
  payout_date: string;
  payout_line_items: {
    booking_id: string;
    amount: number;
    bookings: (BookingLabelRow & { price_paid: number; credit_applied: number }) | null;
  }[];
};

function mapPayoutRow(row: PayoutRow): PayoutBatch {
  return {
    id: row.id,
    date: row.payout_date,
    amount: row.amount,
    status: row.status,
    method: row.payout_method,
    lineItems: row.payout_line_items.map((li) => ({
      bookingId: li.booking_id,
      bookingLabel: bookingLabel(li.bookings),
      netAmount: li.amount,
      grossAmount: li.bookings ? li.bookings.price_paid - li.bookings.credit_applied : li.amount,
      date: li.bookings?.date ?? row.payout_date,
    })),
  };
}

type PendingLineItemRow = {
  booking_id: string;
  customer_name: string;
  sport: string;
  date: string;
  gross_amount: number;
  net_amount: number;
};

type DeductionRow = {
  id: string;
  booking_id: string;
  amount: number;
  reason: string;
  created_at: string;
  bookings: BookingLabelRow;
};

export function PayoutsProvider({ children }: { children: ReactNode }) {
  const { partner } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>([]);
  const [pendingLineItems, setPendingLineItems] = useState<PayoutLineItem[]>([]);
  const [pendingDeductions, setPendingDeductions] = useState<PendingDeduction[]>([]);
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>(EMPTY_SETTINGS);

  const refresh = useCallback(async () => {
    if (!partner) {
      setPayoutBatches([]);
      setPendingLineItems([]);
      setPendingDeductions([]);
      setPayoutSettings(EMPTY_SETTINGS);
      return;
    }
    setLoading(true);

    const [accountRes, payoutsRes, pendingRes, deductionsRes] = await Promise.all([
      supabase
        .from("payout_accounts")
        .select(
          "method, account_holder_name, account_number, ifsc, upi_id, verification_status, updated_at",
        )
        .eq("venue_id", partner.venueId)
        .maybeSingle<PayoutAccountRow>(),
      supabase
        .from("payouts")
        .select(
          "id, amount, status, payout_method, payout_date, payout_line_items(booking_id, amount, bookings(date, sport, walkin_customer_name, price_paid, credit_applied, users(name)))",
        )
        .eq("venue_id", partner.venueId)
        .order("payout_date", { ascending: false })
        .returns<PayoutRow[]>(),
      supabase.rpc("partner_pending_payout_line_items", { p_venue_id: partner.venueId }),
      supabase
        .from("payout_deductions")
        .select(
          "id, booking_id, amount, reason, created_at, bookings(date, sport, walkin_customer_name, users(name))",
        )
        .eq("venue_id", partner.venueId)
        .is("applied_to_payout_id", null)
        .returns<DeductionRow[]>(),
    ]);

    if (accountRes.error) console.error("fetch payout_accounts failed:", accountRes.error.message);
    if (payoutsRes.error) console.error("fetch payouts failed:", payoutsRes.error.message);
    if (pendingRes.error)
      console.error("fetch pending payout line items failed:", pendingRes.error.message);
    if (deductionsRes.error)
      console.error("fetch payout_deductions failed:", deductionsRes.error.message);

    setPayoutSettings(mapAccountRow(accountRes.data ?? null));
    setPayoutBatches((payoutsRes.data ?? []).map(mapPayoutRow));
    setPendingLineItems(
      ((pendingRes.data ?? []) as PendingLineItemRow[]).map((r) => ({
        bookingId: r.booking_id,
        bookingLabel: `${r.customer_name} \u2014 ${r.sport}`,
        grossAmount: r.gross_amount,
        netAmount: r.net_amount,
        date: r.date,
      })),
    );
    setPendingDeductions(
      (deductionsRes.data ?? []).map((d) => ({
        id: d.id,
        bookingId: d.booking_id,
        bookingLabel: bookingLabel(d.bookings),
        netAmount: d.amount,
        reason: d.reason,
        loggedAt: d.created_at,
      })),
    );

    setLoading(false);
  }, [partner]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.venueId]);

  const getBatch = useCallback(
    (id: string) => payoutBatches.find((b) => b.id === id),
    [payoutBatches],
  );

  const pendingNet = useMemo(() => {
    const earnings = pendingLineItems.reduce((sum, li) => sum + li.netAmount, 0);
    const deductions = pendingDeductions.reduce((sum, d) => sum + d.netAmount, 0);
    return earnings - deductions;
  }, [pendingLineItems, pendingDeductions]);

  const savePayoutSettings = useCallback(
    async (input: SavePayoutSettingsInput): Promise<SaveResult> => {
      if (!partner) throw new Error("Not signed in.");

      const body =
        input.method === "bank"
          ? {
              venue_id: partner.venueId,
              method: "bank" as const,
              account_holder_name: input.bank.accountHolderName,
              account_number: input.bank.accountNumber,
              ifsc: input.bank.ifsc,
              customer_phone: partner.phone,
            }
          : {
              venue_id: partner.venueId,
              method: "upi" as const,
              upi_id: input.upi.upiId,
              customer_phone: partner.phone,
            };

      const { data, error } = await supabase.functions.invoke<{
        saved: boolean;
        verified: boolean;
        message?: string;
      }>("cashfree-save-beneficiary", { body });

      if (error) throw new Error(error.message || "Could not save payout details.");
      if (!data) throw new Error("Could not save payout details.");

      await refresh();
      return data.message !== undefined
        ? { verified: data.verified, message: data.message }
        : { verified: data.verified };
    },
    [partner, refresh],
  );

  const runPayoutNow = useCallback(async () => {
    if (!partner) throw new Error("Not signed in.");

    const { data, error } = await supabase.functions.invoke<RunPayoutResult>(
      "cashfree-run-payout",
      {
        body: { venue_id: partner.venueId },
      },
    );
    if (error) throw new Error(error.message || "Could not run payout.");
    if (!data) throw new Error("Could not run payout.");

    await refresh();
    return data.result;
  }, [partner, refresh]);

  const value = useMemo<PayoutsContextValue>(
    () => ({
      loading,
      payoutBatches,
      pendingLineItems,
      pendingDeductions,
      pendingNet,
      payoutSettings,
      getBatch,
      savePayoutSettings,
      runPayoutNow,
      refresh,
    }),
    [
      loading,
      payoutBatches,
      pendingLineItems,
      pendingDeductions,
      pendingNet,
      payoutSettings,
      getBatch,
      savePayoutSettings,
      runPayoutNow,
      refresh,
    ],
  );

  return <PayoutsContext.Provider value={value}>{children}</PayoutsContext.Provider>;
}

export function usePayouts() {
  const ctx = useContext(PayoutsContext);
  if (!ctx) throw new Error("usePayouts must be used inside <PayoutsProvider>");
  return ctx;
}