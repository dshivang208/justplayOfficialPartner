import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as supabase, r as useAuth } from "./auth-DbMKYDei.mjs";
import { c as fetchPriceRules, o as fetchCourts, s as fetchExceptions } from "./inventory-OoBm9l3h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inventory-BgKRcK7F.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* JustPlay Partner — slot & inventory state (Backend Phase B).
*
* Courts, price bands and exceptions are fetched from the real `courts` /
* `venue_pricing` / `venue_exceptions` tables, scoped to the signed-in
* partner's venue. Every mutation calls one of the `partner_*` RPCs from
* `20260829040000_partner_phase_b_slots.sql` (never a raw client
* INSERT/UPDATE — those tables have no client write policies on purpose),
* then refetches so this context and the database can never drift apart.
*
* Slot data itself (individual bookable rows for a visible date range)
* intentionally does NOT live here — it's fetched directly by whichever
* calendar view is on screen (see `dashboard.slots.index.tsx`), the same
* way the consumer app fetches its own availability, rather than being
* held as global state that would need range-aware invalidation.
* `blockSlot`/`unblockSlot` live here anyway for API consistency with the
* rest of this context, even though their effect (a slots row changing) is
* visible somewhere this provider doesn't track — the caller re-fetches
* its own visible range afterward.
*/
var InventoryContext = (0, import_react.createContext)(null);
function InventoryProvider({ children }) {
	const { partner } = useAuth();
	const [courts, setCourts] = (0, import_react.useState)([]);
	const [priceRules, setPriceRules] = (0, import_react.useState)([]);
	const [exceptions, setExceptions] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const refresh = (0, import_react.useCallback)(async () => {
		if (!partner) {
			setCourts([]);
			setPriceRules([]);
			setExceptions([]);
			return;
		}
		setLoading(true);
		const [c, p, e] = await Promise.all([
			fetchCourts(partner.venueId),
			fetchPriceRules(partner.venueId),
			fetchExceptions(partner.venueId)
		]);
		setCourts(c);
		setPriceRules(p);
		setExceptions(e);
		setLoading(false);
	}, [partner]);
	(0, import_react.useEffect)(() => {
		refresh();
	}, [partner?.venueId]);
	const priceRulesForCourt = (0, import_react.useCallback)((courtId) => priceRules.filter((r) => r.courtId === courtId), [priceRules]);
	const addCourt = (0, import_react.useCallback)(async (input) => {
		if (!partner) throw new Error("Not signed in");
		const { data, error } = await supabase.rpc("partner_add_court", {
			p_venue_id: partner.venueId,
			p_sport: input.sport,
			p_name: input.name
		});
		if (error) throw new Error(error.message);
		await refresh();
		return {
			id: data.id,
			name: data.name,
			sport: data.sport,
			status: data.status,
			opensAt: data.opens_at,
			closesAt: data.closes_at,
			slotDurationMinutes: data.slot_duration_minutes,
			slotsGeneratedUntil: data.slots_generated_until
		};
	}, [partner, refresh]);
	const updateCourt = (0, import_react.useCallback)(async (courtId, patch) => {
		const { error } = await supabase.rpc("partner_update_court", {
			p_court_id: courtId,
			p_name: patch.name,
			p_sport: patch.sport,
			p_status: patch.status
		});
		if (error) throw new Error(error.message);
		await refresh();
	}, [refresh]);
	const deleteCourt = (0, import_react.useCallback)(async (courtId) => {
		const { error } = await supabase.rpc("partner_delete_court", { p_court_id: courtId });
		if (error) throw new Error(error.message);
		await refresh();
	}, [refresh]);
	const runBulkSetup = (0, import_react.useCallback)(async (input) => {
		const { error } = await supabase.rpc("partner_generate_slots", {
			p_court_id: input.courtId,
			p_opens_at: input.opensAt,
			p_closes_at: input.closesAt,
			p_duration_mins: input.slotDurationMinutes,
			p_price_bands: input.priceRules.map((r) => ({
				label: r.label,
				start_time: r.startTime,
				end_time: r.endTime,
				price: r.pricePerSlot
			})),
			p_generate_days: input.generateDays
		});
		if (error) throw new Error(error.message);
		await refresh();
	}, [refresh]);
	const addException = (0, import_react.useCallback)(async (input) => {
		if (!partner) throw new Error("Not signed in");
		const { error } = await supabase.rpc("partner_add_venue_exception", {
			p_venue_id: partner.venueId,
			p_date: input.date,
			p_type: input.type,
			p_opens_at: input.opensAt ?? null,
			p_closes_at: input.closesAt ?? null,
			p_reason: input.reason
		});
		if (error) throw new Error(error.message);
		await refresh();
	}, [partner, refresh]);
	const removeException = (0, import_react.useCallback)(async (id) => {
		const { error } = await supabase.rpc("partner_remove_venue_exception", { p_exception_id: id });
		if (error) throw new Error(error.message);
		await refresh();
	}, [refresh]);
	const blockSlot = (0, import_react.useCallback)(async (slotIds, reason) => {
		const { error } = await supabase.rpc("partner_block_slots", {
			p_slot_ids: slotIds,
			p_reason: reason
		});
		if (error) throw new Error(error.message);
	}, []);
	const unblockSlot = (0, import_react.useCallback)(async (slotIds) => {
		const { error } = await supabase.rpc("partner_unblock_slots", { p_slot_ids: slotIds });
		if (error) throw new Error(error.message);
	}, []);
	const value = (0, import_react.useMemo)(() => ({
		courts,
		priceRules,
		exceptions,
		loading,
		priceRulesForCourt,
		addCourt,
		updateCourt,
		deleteCourt,
		runBulkSetup,
		addException,
		removeException,
		blockSlot,
		unblockSlot,
		refresh
	}), [
		courts,
		priceRules,
		exceptions,
		loading,
		priceRulesForCourt,
		addCourt,
		updateCourt,
		deleteCourt,
		runBulkSetup,
		addException,
		removeException,
		blockSlot,
		unblockSlot,
		refresh
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InventoryContext.Provider, {
		value,
		children
	});
}
function useInventory() {
	const ctx = (0, import_react.useContext)(InventoryContext);
	if (!ctx) throw new Error("useInventory must be used inside <InventoryProvider>");
	return ctx;
}
//#endregion
export { useInventory as n, InventoryProvider as t };
