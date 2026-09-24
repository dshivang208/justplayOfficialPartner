import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as supabase, r as useAuth } from "./auth-DbMKYDei.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/venueProfile-CzdchA95.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* JustPlay Partner — venue profile & business details (Backend Phase E).
*
* Reads/writes the real `venues` row for this partner's venue. Minor
* fields (description/photos/amenities) are optimistic: local state
* updates immediately, the write happens in the background, and a
* failure reverts to the exact pre-update snapshot + logs, rather than
* surfacing a blocking error for what's meant to feel instant. The
* review-gated fields (name/address) and business details are explicit
* user actions with a Save/Submit button already in the UI, so those
* return Promises the route files await and can show a real error for.
*/
var AMENITY_OPTIONS = [
	"Parking",
	"Floodlights",
	"Changing Rooms",
	"Washrooms",
	"Drinking Water",
	"Cafeteria",
	"Equipment Rental",
	"First Aid"
];
var VenueProfileContext = (0, import_react.createContext)(null);
var EMPTY_PROFILE = {
	name: "",
	description: "",
	address: "",
	photos: [],
	amenities: [],
	operationalStatus: "live",
	legalBusinessName: "",
	gstNumber: null,
	pendingName: null,
	pendingAddress: null
};
function mapVenueRow(row) {
	return {
		name: row.name,
		description: row.about ?? "",
		address: row.address,
		photos: row.photos ?? [],
		amenities: row.amenities ?? [],
		operationalStatus: row.is_active ? "live" : "paused",
		legalBusinessName: row.legal_business_name ?? "",
		gstNumber: row.gst_number,
		pendingName: row.pending_name,
		pendingAddress: row.pending_address
	};
}
function VenueProfileProvider({ children }) {
	const { partner } = useAuth();
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [profile, setProfile] = (0, import_react.useState)(EMPTY_PROFILE);
	const refresh = (0, import_react.useCallback)(async () => {
		if (!partner) {
			setProfile(EMPTY_PROFILE);
			return;
		}
		setLoading(true);
		const { data, error } = await supabase.from("venues").select("name, about, address, photos, amenities, is_active, legal_business_name, gst_number, pending_name, pending_address").eq("id", partner.venueId).maybeSingle();
		if (error) console.error("fetch venue profile failed:", error.message);
		setProfile(data ? mapVenueRow(data) : EMPTY_PROFILE);
		setLoading(false);
	}, [partner]);
	(0, import_react.useEffect)(() => {
		refresh();
	}, [partner?.venueId]);
	/** Optimistic: applies `patch` immediately (via the functional form of
	*  setState, so `previous` is always the true current state regardless
	*  of this callback's own closure staleness), persists in the
	*  background, and reverts to exactly that `previous` snapshot if the
	*  save fails — never to some other in-between/optimistic value. */
	const saveMinor = (0, import_react.useCallback)((patch, rpcArgs) => {
		if (!partner) return;
		let previous = null;
		setProfile((p) => {
			previous = p;
			return {
				...p,
				...patch
			};
		});
		supabase.rpc("partner_save_venue_minor", {
			p_venue_id: partner.venueId,
			...rpcArgs
		}).then(({ error }) => {
			if (error) {
				console.error("partner_save_venue_minor failed:", error.message);
				if (previous) setProfile(previous);
			}
		});
	}, [partner]);
	const updateDescription = (0, import_react.useCallback)((description) => saveMinor({ description }, { p_about: description }), [saveMinor]);
	const updateAmenities = (0, import_react.useCallback)((amenities) => saveMinor({ amenities }, { p_amenities: amenities }), [saveMinor]);
	const addPhoto = (0, import_react.useCallback)((dataUrl) => {
		const photos = [...profile.photos, dataUrl];
		saveMinor({ photos }, { p_photos: photos });
	}, [profile.photos, saveMinor]);
	const removePhoto = (0, import_react.useCallback)((index) => {
		const photos = profile.photos.filter((_, i) => i !== index);
		saveMinor({ photos }, { p_photos: photos });
	}, [profile.photos, saveMinor]);
	const reorderPhoto = (0, import_react.useCallback)((index, direction) => {
		const next = [...profile.photos];
		const target = index + direction;
		if (target < 0 || target >= next.length) return;
		[next[index], next[target]] = [next[target], next[index]];
		saveMinor({ photos: next }, { p_photos: next });
	}, [profile.photos, saveMinor]);
	const submitMajorChange = (0, import_react.useCallback)(async (input) => {
		if (!partner) throw new Error("Not signed in.");
		const { data, error } = await supabase.rpc("partner_submit_venue_major_change", {
			p_venue_id: partner.venueId,
			p_name: input.name ?? null,
			p_address: input.address ?? null
		});
		if (error) throw new Error(error.message || "Could not submit that change.");
		if (data) setProfile(mapVenueRow(data));
	}, [partner]);
	const discardPendingChange = (0, import_react.useCallback)(async () => {
		if (!partner) throw new Error("Not signed in.");
		const { data, error } = await supabase.rpc("partner_discard_venue_pending_change", { p_venue_id: partner.venueId });
		if (error) throw new Error(error.message || "Could not discard the pending change.");
		if (data) setProfile(mapVenueRow(data));
	}, [partner]);
	const updateBusinessDetails = (0, import_react.useCallback)(async (input) => {
		if (!partner) throw new Error("Not signed in.");
		const { data, error } = await supabase.rpc("partner_update_business_details", {
			p_venue_id: partner.venueId,
			p_legal_business_name: input.legalBusinessName,
			p_gst_number: input.gstNumber
		});
		if (error) throw new Error(error.message || "Could not save business details.");
		if (data) setProfile(mapVenueRow(data));
	}, [partner]);
	const toggleOperationalStatus = (0, import_react.useCallback)(async () => {
		if (!partner) throw new Error("Not signed in.");
		const nextActive = profile.operationalStatus !== "live";
		const { data, error } = await supabase.rpc("partner_set_venue_active", {
			p_venue_id: partner.venueId,
			p_is_active: nextActive
		});
		if (error) throw new Error(error.message || "Could not update venue status.");
		if (data) setProfile(mapVenueRow(data));
	}, [partner, profile.operationalStatus]);
	const reviewPending = profile.pendingName != null || profile.pendingAddress != null;
	const value = (0, import_react.useMemo)(() => ({
		loading,
		profile,
		reviewPending,
		updateDescription,
		updateAmenities,
		addPhoto,
		removePhoto,
		reorderPhoto,
		submitMajorChange,
		discardPendingChange,
		updateBusinessDetails,
		toggleOperationalStatus
	}), [
		loading,
		profile,
		reviewPending,
		updateDescription,
		updateAmenities,
		addPhoto,
		removePhoto,
		reorderPhoto,
		submitMajorChange,
		discardPendingChange,
		updateBusinessDetails,
		toggleOperationalStatus
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VenueProfileContext.Provider, {
		value,
		children
	});
}
function useVenueProfile() {
	const ctx = (0, import_react.useContext)(VenueProfileContext);
	if (!ctx) throw new Error("useVenueProfile must be used inside <VenueProfileProvider>");
	return ctx;
}
//#endregion
export { VenueProfileProvider as n, useVenueProfile as r, AMENITY_OPTIONS as t };
