import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as supabase, r as useAuth } from "./auth-DbMKYDei.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-CPFj2m05.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* JustPlay Partner — notification preferences (Backend Phase E).
*
* True CRUD against `partner_settings`, scoped to this signed-in partner
* (RLS: `auth.uid() = partner_id`) — plain client reads/writes, no RPC
* needed, per the brief's own "straightforward CRUD" framing. Toggling a
* single cell is optimistic (flip locally, upsert in the background,
* revert + log on failure) so the toggle grid still feels instant.
*/
var DEFAULT_PREFS = {
	newBooking: {
		sms: true,
		email: false,
		inApp: true
	},
	cancellation: {
		sms: true,
		email: true,
		inApp: true
	},
	payout: {
		sms: false,
		email: true,
		inApp: true
	},
	lowOccupancy: {
		sms: false,
		email: false,
		inApp: true
	}
};
var NotificationPrefsContext = (0, import_react.createContext)(null);
function NotificationPrefsProvider({ children }) {
	const { partner } = useAuth();
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [prefs, setPrefs] = (0, import_react.useState)(DEFAULT_PREFS);
	(0, import_react.useEffect)(() => {
		if (!partner) {
			setPrefs(DEFAULT_PREFS);
			return;
		}
		setLoading(true);
		supabase.from("partner_settings").select("notification_prefs").eq("partner_id", partner.id).maybeSingle().then(({ data, error }) => {
			if (error) console.error("fetch partner_settings failed:", error.message);
			setPrefs(data?.notification_prefs ?? DEFAULT_PREFS);
			setLoading(false);
		});
	}, [partner]);
	const toggle = (0, import_react.useCallback)((event, channel) => {
		if (!partner) return;
		let next = null;
		setPrefs((prev) => {
			next = {
				...prev,
				[event]: {
					...prev[event],
					[channel]: !prev[event][channel]
				}
			};
			return next;
		});
		supabase.from("partner_settings").upsert({
			partner_id: partner.id,
			notification_prefs: next,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}, { onConflict: "partner_id" }).then(({ error }) => {
			if (error) {
				console.error("save notification_prefs failed:", error.message);
				setPrefs((prev) => ({
					...prev,
					[event]: {
						...prev[event],
						[channel]: !prev[event][channel]
					}
				}));
			}
		});
	}, [partner]);
	const value = (0, import_react.useMemo)(() => ({
		loading,
		prefs,
		toggle
	}), [
		loading,
		prefs,
		toggle
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationPrefsContext.Provider, {
		value,
		children
	});
}
function useNotificationPrefs() {
	const ctx = (0, import_react.useContext)(NotificationPrefsContext);
	if (!ctx) throw new Error("useNotificationPrefs must be used inside <NotificationPrefsProvider>");
	return ctx;
}
//#endregion
export { useNotificationPrefs as n, NotificationPrefsProvider as t };
