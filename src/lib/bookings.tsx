/**
 * JustPlay Partner — booking records (Backend Phase C).
 *
 * Bookings are fetched straight from the shared `bookings` table (scoped
 * to this partner's venue via the "bookings partner read venue" RLS policy
 * from Phase A), joined to `slots`/`courts` for court name + exact times
 * and to `users` for an online customer's name/phone (walk-ins store their
 * customer's name/phone directly, no join needed).
 *
 * `no_show` is NOT a `bookings.status` value in the real schema — it's a
 * `booking_flags` row, kept separate from the booking's lifecycle status
 * per the brief ("for future use", e.g. trust scoring). The `status` this
 * file exposes is a UI-facing derived value: the flag overrides the
 * underlying status for display purposes only.
 *
 * Cancellation reuses the consumer app's existing `cancel-booking-refund`
 * Edge Function completely unmodified — a partner calling it with their
 * own session now works because `cancel_booking()` (the RPC that function
 * wraps) was extended in this same backend phase to allow either the
 * customer or the venue's own partner to cancel. There is no second
 * refund pathway.
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
import type { Booking, BookingStatus, PaymentMethod } from "@/data/bookings";
import { supabase } from "./supabaseClient";
import { useAuth } from "./auth";

export type CreateWalkinBookingInput = {
  slotIds: string[];
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "paid" | "pending";
};

export type CancelResult = { refunded: boolean; refundError?: string };

type BookingsContextValue = {
  bookings: Booking[];
  loading: boolean;
  getBooking: (id: string) => Booking | undefined;
  createWalkinBooking: (input: CreateWalkinBookingInput) => Promise<Booking>;
  markCompleted: (id: string) => Promise<void>;
  markNoShow: (id: string) => Promise<void>;
  cancelBooking: (id: string, reason: string) => Promise<CancelResult>;
  saveNotes: (id: string, notes: string) => Promise<void>;
  flagBooking: (id: string, reason: string) => Promise<void>;
  unflagBooking: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const BookingsContext = createContext<BookingsContextValue | null>(null);

type BookingRow = {
  id: string;
  slot_id: string;
  sport: string;
  date: string;
  price_paid: number;
  status: "pending" | "confirmed" | "cancelled" | "cancelled_refunded" | "completed";
  cancellation_reason: string | null;
  walkin_customer_name: string | null;
  walkin_customer_phone: string | null;
  source: "online" | "walk_in";
  payment_method: PaymentMethod;
  payment_status: "paid" | "pending" | "refunded";
  notes: string;
  created_at: string;
  slots: {
    court_id: string;
    start_time: string;
    end_time: string;
    courts: { name: string } | null;
  } | null;
  users: { name: string; phone: string } | null;
};

type FlagRow = {
  booking_id: string;
  flag_type: "no_show" | "dispute";
  reason: string | null;
  created_at: string;
};

function mapRow(row: BookingRow, flags: FlagRow[]): Booking {
  const noShow = flags.find((f) => f.booking_id === row.id && f.flag_type === "no_show");
  const dispute = flags.find((f) => f.booking_id === row.id && f.flag_type === "dispute");

  const status: BookingStatus = noShow
    ? "no_show"
    : row.status === "cancelled" || row.status === "cancelled_refunded"
      ? "cancelled"
      : (row.status as "confirmed" | "completed");

  const isWalkin = row.source === "walk_in";

  return {
    id: row.id,
    courtId: row.slots?.court_id ?? "",
    courtName: row.slots?.courts?.name ?? "Venue",
    sport: row.sport,
    date: row.date,
    startTime: row.slots?.start_time?.slice(0, 5) ?? "00:00",
    endTime: row.slots?.end_time?.slice(0, 5) ?? "00:00",
    customerName: isWalkin
      ? (row.walkin_customer_name ?? "Walk-in customer")
      : row.users?.name || "Customer",
    customerPhone: isWalkin
      ? (row.walkin_customer_phone ?? "")
      : (row.users?.phone.replace(/^\+?91/, "") ?? ""),
    amount: row.price_paid,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status,
    source: row.source,
    notes: row.notes,
    cancellationReason: row.cancellation_reason,
    refundIssued: row.status === "cancelled_refunded",
    flagged: dispute != null,
    flagReason: dispute?.reason ?? null,
    flaggedAt: dispute?.created_at ?? null,
    createdAt: row.created_at,
  };
}

const SELECT_COLUMNS = `
  id, slot_id, sport, date, price_paid, status, cancellation_reason,
  walkin_customer_name, walkin_customer_phone, source, payment_method, payment_status, notes, created_at,
  slots(court_id, start_time, end_time, courts(name)),
  users(name, phone)
`;

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { partner } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!partner) {
      setBookings([]);
      return;
    }
    setLoading(true);

    const { data: rows, error } = await supabase
      .from("bookings")
      .select(SELECT_COLUMNS)
      .eq("venue_id", partner.venueId)
      .in("status", ["confirmed", "completed", "cancelled", "cancelled_refunded"])
      .order("created_at", { ascending: false })
      .returns<BookingRow[]>();

    if (error) {
      console.error("fetch bookings failed:", error.message);
      setBookings([]);
      setLoading(false);
      return;
    }

    const ids = (rows ?? []).map((r) => r.id);
    const { data: flagRows } =
      ids.length > 0
        ? await supabase
            .from("booking_flags")
            .select("booking_id, flag_type, reason, created_at")
            .in("booking_id", ids)
            .returns<FlagRow[]>()
        : { data: [] as FlagRow[] };

    setBookings((rows ?? []).map((r) => mapRow(r, flagRows ?? [])));
    setLoading(false);
  }, [partner]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.venueId]);

  const getBooking = useCallback((id: string) => bookings.find((b) => b.id === id), [bookings]);

  const createWalkinBooking = useCallback(
    async (input: CreateWalkinBookingInput) => {
      const { data, error } = await supabase.rpc("create_booking", {
        p_slot_ids: input.slotIds,
        p_credit_applied: 0,
        p_walkin_customer_name: input.customerName,
        p_walkin_customer_phone: input.customerPhone,
        p_walkin_payment_method: input.paymentMethod,
        p_walkin_payment_status: input.paymentStatus,
        p_walkin_amount: input.amount,
      });
      if (error) throw new Error(error.message);
      await refresh();
      return mapRow(data as BookingRow, []);
    },
    [refresh],
  );

  const markCompleted = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc("partner_mark_booking_completed", { p_booking_id: id });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const markNoShow = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc("partner_flag_booking", {
        p_booking_id: id,
        p_flag_type: "no_show",
        p_reason: "Customer did not show up",
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const cancelBooking = useCallback(
    async (id: string, reason: string): Promise<CancelResult> => {
      const { data, error } = await supabase.functions.invoke<CancelResult>(
        "cancel-booking-refund",
        {
          body: { booking_id: id, reason },
        },
      );
      if (error) throw new Error(error.message || "Could not cancel this booking.");
      await refresh();
      return data ?? { refunded: false };
    },
    [refresh],
  );

  const saveNotes = useCallback(
    async (id: string, notes: string) => {
      const { error } = await supabase.rpc("partner_save_booking_notes", {
        p_booking_id: id,
        p_notes: notes,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const flagBooking = useCallback(
    async (id: string, reason: string) => {
      const { error } = await supabase.rpc("partner_flag_booking", {
        p_booking_id: id,
        p_flag_type: "dispute",
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const unflagBooking = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc("partner_unflag_booking", {
        p_booking_id: id,
        p_flag_type: "dispute",
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<BookingsContextValue>(
    () => ({
      bookings,
      loading,
      getBooking,
      createWalkinBooking,
      markCompleted,
      markNoShow,
      cancelBooking,
      saveNotes,
      flagBooking,
      unflagBooking,
      refresh,
    }),
    [
      bookings,
      loading,
      getBooking,
      createWalkinBooking,
      markCompleted,
      markNoShow,
      cancelBooking,
      saveNotes,
      flagBooking,
      unflagBooking,
      refresh,
    ],
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used inside <BookingsProvider>");
  return ctx;
}
