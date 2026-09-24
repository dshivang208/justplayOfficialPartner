import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as supabase, r as useAuth } from "./auth-DbMKYDei.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bookings-DKX0ntLe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
var BookingsContext = (0, import_react.createContext)(null);
function mapRow(row, flags) {
	const noShow = flags.find((f) => f.booking_id === row.id && f.flag_type === "no_show");
	const dispute = flags.find((f) => f.booking_id === row.id && f.flag_type === "dispute");
	const status = noShow ? "no_show" : row.status === "cancelled" || row.status === "cancelled_refunded" ? "cancelled" : row.status;
	const isWalkin = row.source === "walk_in";
	return {
		id: row.id,
		courtId: row.slots?.court_id ?? "",
		courtName: row.slots?.courts?.name ?? "Venue",
		sport: row.sport,
		date: row.date,
		startTime: row.slots?.start_time?.slice(0, 5) ?? "00:00",
		endTime: row.slots?.end_time?.slice(0, 5) ?? "00:00",
		customerName: isWalkin ? row.walkin_customer_name ?? "Walk-in customer" : row.users?.name || "Customer",
		customerPhone: isWalkin ? row.walkin_customer_phone ?? "" : row.users?.phone.replace(/^\+?91/, "") ?? "",
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
		createdAt: row.created_at
	};
}
var SELECT_COLUMNS = `
  id, slot_id, sport, date, price_paid, status, cancellation_reason,
  walkin_customer_name, walkin_customer_phone, source, payment_method, payment_status, notes, created_at,
  slots(court_id, start_time, end_time, courts(name)),
  users(name, phone)
`;
function BookingsProvider({ children }) {
	const { partner } = useAuth();
	const [bookings, setBookings] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const refresh = (0, import_react.useCallback)(async () => {
		if (!partner) {
			setBookings([]);
			return;
		}
		setLoading(true);
		const { data: rows, error } = await supabase.from("bookings").select(SELECT_COLUMNS).eq("venue_id", partner.venueId).in("status", [
			"confirmed",
			"completed",
			"cancelled",
			"cancelled_refunded"
		]).order("created_at", { ascending: false }).returns();
		if (error) {
			console.error("fetch bookings failed:", error.message);
			setBookings([]);
			setLoading(false);
			return;
		}
		const ids = (rows ?? []).map((r) => r.id);
		const { data: flagRows } = ids.length > 0 ? await supabase.from("booking_flags").select("booking_id, flag_type, reason, created_at").in("booking_id", ids).returns() : { data: [] };
		setBookings((rows ?? []).map((r) => mapRow(r, flagRows ?? [])));
		setLoading(false);
	}, [partner]);
	(0, import_react.useEffect)(() => {
		refresh();
	}, [partner?.venueId]);
	const getBooking = (0, import_react.useCallback)((id) => bookings.find((b) => b.id === id), [bookings]);
	const createWalkinBooking = (0, import_react.useCallback)(async (input) => {
		const { data, error } = await supabase.rpc("create_booking", {
			p_slot_ids: input.slotIds,
			p_credit_applied: 0,
			p_walkin_customer_name: input.customerName,
			p_walkin_customer_phone: input.customerPhone,
			p_walkin_payment_method: input.paymentMethod,
			p_walkin_payment_status: input.paymentStatus,
			p_walkin_amount: input.amount
		});
		if (error) throw new Error(error.message);
		await refresh();
		return mapRow(data, []);
	}, [refresh]);
	const markCompleted = (0, import_react.useCallback)(async (id) => {
		const { error } = await supabase.rpc("partner_mark_booking_completed", { p_booking_id: id });
		if (error) throw new Error(error.message);
		await refresh();
	}, [refresh]);
	const markNoShow = (0, import_react.useCallback)(async (id) => {
		const { error } = await supabase.rpc("partner_flag_booking", {
			p_booking_id: id,
			p_flag_type: "no_show",
			p_reason: "Customer did not show up"
		});
		if (error) throw new Error(error.message);
		await refresh();
	}, [refresh]);
	const cancelBooking = (0, import_react.useCallback)(async (id, reason) => {
		const { data, error } = await supabase.functions.invoke("cancel-booking-refund", { body: {
			booking_id: id,
			reason
		} });
		if (error) throw new Error(error.message || "Could not cancel this booking.");
		await refresh();
		return data ?? { refunded: false };
	}, [refresh]);
	const saveNotes = (0, import_react.useCallback)(async (id, notes) => {
		const { error } = await supabase.rpc("partner_save_booking_notes", {
			p_booking_id: id,
			p_notes: notes
		});
		if (error) throw new Error(error.message);
		await refresh();
	}, [refresh]);
	const flagBooking = (0, import_react.useCallback)(async (id, reason) => {
		const { error } = await supabase.rpc("partner_flag_booking", {
			p_booking_id: id,
			p_flag_type: "dispute",
			p_reason: reason
		});
		if (error) throw new Error(error.message);
		await refresh();
	}, [refresh]);
	const unflagBooking = (0, import_react.useCallback)(async (id) => {
		const { error } = await supabase.rpc("partner_unflag_booking", {
			p_booking_id: id,
			p_flag_type: "dispute"
		});
		if (error) throw new Error(error.message);
		await refresh();
	}, [refresh]);
	const value = (0, import_react.useMemo)(() => ({
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
		refresh
	}), [
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
		refresh
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingsContext.Provider, {
		value,
		children
	});
}
function useBookings() {
	const ctx = (0, import_react.useContext)(BookingsContext);
	if (!ctx) throw new Error("useBookings must be used inside <BookingsProvider>");
	return ctx;
}
//#endregion
export { useBookings as n, BookingsProvider as t };
