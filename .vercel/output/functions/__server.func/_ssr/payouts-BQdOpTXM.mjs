import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as supabase, r as useAuth } from "./auth-DbMKYDei.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payouts-BQdOpTXM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
var PayoutsContext = (0, import_react.createContext)(null);
var EMPTY_SETTINGS = {
	method: "bank",
	bank: null,
	upi: null,
	verificationStatus: "pending",
	updatedAt: null
};
function bookingLabel(row) {
	if (!row) return "Booking";
	return `${row.walkin_customer_name ?? row.users?.name ?? "Customer"} \u2014 ${row.sport}`;
}
function mapAccountRow(row) {
	if (!row) return EMPTY_SETTINGS;
	return {
		method: row.method,
		bank: row.method === "bank" && row.account_holder_name && row.account_number && row.ifsc ? {
			accountHolderName: row.account_holder_name,
			accountNumber: row.account_number,
			ifsc: row.ifsc
		} : null,
		upi: row.method === "upi" && row.upi_id ? { upiId: row.upi_id } : null,
		verificationStatus: row.verification_status,
		updatedAt: row.updated_at
	};
}
function mapPayoutRow(row) {
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
			date: li.bookings?.date ?? row.payout_date
		}))
	};
}
function PayoutsProvider({ children }) {
	const { partner } = useAuth();
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [payoutBatches, setPayoutBatches] = (0, import_react.useState)([]);
	const [pendingLineItems, setPendingLineItems] = (0, import_react.useState)([]);
	const [pendingDeductions, setPendingDeductions] = (0, import_react.useState)([]);
	const [payoutSettings, setPayoutSettings] = (0, import_react.useState)(EMPTY_SETTINGS);
	const refresh = (0, import_react.useCallback)(async () => {
		if (!partner) {
			setPayoutBatches([]);
			setPendingLineItems([]);
			setPendingDeductions([]);
			setPayoutSettings(EMPTY_SETTINGS);
			return;
		}
		setLoading(true);
		const [accountRes, payoutsRes, pendingRes, deductionsRes] = await Promise.all([
			supabase.from("payout_accounts").select("method, account_holder_name, account_number, ifsc, upi_id, verification_status, updated_at").eq("venue_id", partner.venueId).maybeSingle(),
			supabase.from("payouts").select("id, amount, status, payout_method, payout_date, payout_line_items(booking_id, amount, bookings(date, sport, walkin_customer_name, price_paid, credit_applied, users(name)))").eq("venue_id", partner.venueId).order("payout_date", { ascending: false }).returns(),
			supabase.rpc("partner_pending_payout_line_items", { p_venue_id: partner.venueId }),
			supabase.from("payout_deductions").select("id, booking_id, amount, reason, created_at, bookings(date, sport, walkin_customer_name, users(name))").eq("venue_id", partner.venueId).is("applied_to_payout_id", null).returns()
		]);
		if (accountRes.error) console.error("fetch payout_accounts failed:", accountRes.error.message);
		if (payoutsRes.error) console.error("fetch payouts failed:", payoutsRes.error.message);
		if (pendingRes.error) console.error("fetch pending payout line items failed:", pendingRes.error.message);
		if (deductionsRes.error) console.error("fetch payout_deductions failed:", deductionsRes.error.message);
		setPayoutSettings(mapAccountRow(accountRes.data ?? null));
		setPayoutBatches((payoutsRes.data ?? []).map(mapPayoutRow));
		setPendingLineItems((pendingRes.data ?? []).map((r) => ({
			bookingId: r.booking_id,
			bookingLabel: `${r.customer_name} \u2014 ${r.sport}`,
			grossAmount: r.gross_amount,
			netAmount: r.net_amount,
			date: r.date
		})));
		setPendingDeductions((deductionsRes.data ?? []).map((d) => ({
			id: d.id,
			bookingId: d.booking_id,
			bookingLabel: bookingLabel(d.bookings),
			netAmount: d.amount,
			reason: d.reason,
			loggedAt: d.created_at
		})));
		setLoading(false);
	}, [partner]);
	(0, import_react.useEffect)(() => {
		refresh();
	}, [partner?.venueId]);
	const getBatch = (0, import_react.useCallback)((id) => payoutBatches.find((b) => b.id === id), [payoutBatches]);
	const pendingNet = (0, import_react.useMemo)(() => {
		return pendingLineItems.reduce((sum, li) => sum + li.netAmount, 0) - pendingDeductions.reduce((sum, d) => sum + d.netAmount, 0);
	}, [pendingLineItems, pendingDeductions]);
	const savePayoutSettings = (0, import_react.useCallback)(async (input) => {
		if (!partner) throw new Error("Not signed in.");
		const body = input.method === "bank" ? {
			venue_id: partner.venueId,
			method: "bank",
			account_holder_name: input.bank.accountHolderName,
			account_number: input.bank.accountNumber,
			ifsc: input.bank.ifsc,
			customer_phone: partner.phone
		} : {
			venue_id: partner.venueId,
			method: "upi",
			upi_id: input.upi.upiId,
			customer_phone: partner.phone
		};
		const { data, error } = await supabase.functions.invoke("cashfree-save-beneficiary", { body });
		if (error) throw new Error(error.message || "Could not save payout details.");
		if (!data) throw new Error("Could not save payout details.");
		await refresh();
		return data.message !== void 0 ? {
			verified: data.verified,
			message: data.message
		} : { verified: data.verified };
	}, [partner, refresh]);
	const runPayoutNow = (0, import_react.useCallback)(async () => {
		if (!partner) throw new Error("Not signed in.");
		const { data, error } = await supabase.functions.invoke("cashfree-run-payout", { body: { venue_id: partner.venueId } });
		if (error) throw new Error(error.message || "Could not run payout.");
		if (!data) throw new Error("Could not run payout.");
		await refresh();
		return data.result;
	}, [partner, refresh]);
	const value = (0, import_react.useMemo)(() => ({
		loading,
		payoutBatches,
		pendingLineItems,
		pendingDeductions,
		pendingNet,
		payoutSettings,
		getBatch,
		savePayoutSettings,
		runPayoutNow,
		refresh
	}), [
		loading,
		payoutBatches,
		pendingLineItems,
		pendingDeductions,
		pendingNet,
		payoutSettings,
		getBatch,
		savePayoutSettings,
		runPayoutNow,
		refresh
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayoutsContext.Provider, {
		value,
		children
	});
}
function usePayouts() {
	const ctx = (0, import_react.useContext)(PayoutsContext);
	if (!ctx) throw new Error("usePayouts must be used inside <PayoutsProvider>");
	return ctx;
}
//#endregion
export { usePayouts as n, PayoutsProvider as t };
