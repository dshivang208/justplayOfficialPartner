import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as supabase, r as useAuth } from "./auth-DbMKYDei.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/staff-CR_0WWjy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* JustPlay Partner — staff access (Backend Phase E).
*
* Combines two real sources into one list, same shape the UI already
* expects: `partner_venues` (owner + already-accepted staff, joined to
* `partners` for name/phone) and `staff_invites` with status='invited'
* (not yet accepted — no `partners` row may even exist for them yet, so
* their name/phone live on the invite itself). A StaffMember's `id`
* encodes which of the two it came from ("member:<partner_id>" vs
* "invite:<invite_id>") purely so `removeStaff` knows which RPC to call —
* this never leaks into the UI, which just treats `id` as an opaque key.
*/
var StaffContext = (0, import_react.createContext)(null);
function stripCountryCode(phone) {
	return phone.replace(/^\+?91/, "");
}
function StaffProvider({ children }) {
	const { partner } = useAuth();
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [staff, setStaff] = (0, import_react.useState)([]);
	const refresh = (0, import_react.useCallback)(async () => {
		if (!partner) {
			setStaff([]);
			return;
		}
		setLoading(true);
		const [membersRes, invitesRes] = await Promise.all([supabase.from("partner_venues").select("partner_id, role, created_at, partners(owner_name, phone)").eq("venue_id", partner.venueId).returns(), supabase.from("staff_invites").select("id, invited_name, invited_phone, created_at").eq("venue_id", partner.venueId).eq("status", "invited").returns()]);
		if (membersRes.error) console.error("fetch staff members failed:", membersRes.error.message);
		if (invitesRes.error) console.error("fetch staff invites failed:", invitesRes.error.message);
		const members = (membersRes.data ?? []).map((m) => ({
			id: `member:${m.partner_id}`,
			name: m.partners?.owner_name ?? "Team member",
			phone: stripCountryCode(m.partners?.phone ?? ""),
			role: m.role,
			status: "active",
			invitedAt: m.created_at
		}));
		const invites = (invitesRes.data ?? []).map((inv) => ({
			id: `invite:${inv.id}`,
			name: inv.invited_name ?? "Invited",
			phone: stripCountryCode(inv.invited_phone),
			role: "staff",
			status: "invited",
			invitedAt: inv.created_at
		}));
		const sorted = [...members, ...invites].sort((a, b) => {
			if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
			if (a.status !== b.status) return a.status === "active" ? -1 : 1;
			return a.invitedAt < b.invitedAt ? -1 : 1;
		});
		setStaff(sorted);
		setLoading(false);
	}, [partner]);
	(0, import_react.useEffect)(() => {
		refresh();
	}, [partner?.venueId]);
	const inviteStaff = (0, import_react.useCallback)(async (input) => {
		if (!partner) throw new Error("Not signed in.");
		const { error } = await supabase.rpc("partner_invite_staff", {
			p_venue_id: partner.venueId,
			p_name: input.name,
			p_phone: input.phone
		});
		if (error) throw new Error({
			ALREADY_HAS_ACCESS: "This phone number already has access to your venue.",
			INVITE_ALREADY_PENDING: "There's already a pending invite for this phone number.",
			PHONE_MUST_BE_10_DIGITS: "Enter a valid 10-digit phone number."
		}[error.message] ?? error.message ?? "Could not send the invite.");
		await refresh();
	}, [partner, refresh]);
	const removeStaff = (0, import_react.useCallback)((id) => {
		if (!partner) return;
		const previous = staff;
		setStaff((prev) => prev.filter((s) => s.id !== id));
		const [kind, key] = id.split(":", 2);
		(kind === "invite" ? supabase.rpc("partner_revoke_staff_invite", { p_invite_id: key }) : supabase.rpc("partner_remove_staff_member", {
			p_venue_id: partner.venueId,
			p_staff_partner_id: key
		})).then(({ error }) => {
			if (error) {
				console.error("removeStaff failed:", error.message);
				setStaff(previous);
			}
		});
	}, [partner, staff]);
	const value = (0, import_react.useMemo)(() => ({
		loading,
		staff,
		inviteStaff,
		removeStaff
	}), [
		loading,
		staff,
		inviteStaff,
		removeStaff
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffContext.Provider, {
		value,
		children
	});
}
function useStaff() {
	const ctx = (0, import_react.useContext)(StaffContext);
	if (!ctx) throw new Error("useStaff must be used inside <StaffProvider>");
	return ctx;
}
//#endregion
export { useStaff as n, StaffProvider as t };
