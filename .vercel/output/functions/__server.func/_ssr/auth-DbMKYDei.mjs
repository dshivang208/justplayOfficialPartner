import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-DbMKYDei.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Single shared Supabase client for the browser.
*
* This is the SAME Supabase project as the consumer JustPlay app — see
* README.md — just a distinct `storageKey` so a browser that's logged into
* both apps (same machine, different ports/origins in dev) keeps two
* independent local sessions rather than one clobbering the other.
*/
var supabaseUrl = {
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/",
	"VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucXBoZ3pob2t1Ym9kam1zZW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MzEzNDUsImV4cCI6MjEwMzUwNzM0NX0.2h66UtM9e2Tep-POompjQTIrtwpbUsHhib4SoZ1EbCU",
	"VITE_SUPABASE_URL": "https://onqphgzhokubodjmseos.supabase.co"
}["VITE_SUPABASE_URL"];
var supabaseAnonKey = {
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/",
	"VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucXBoZ3pob2t1Ym9kam1zZW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MzEzNDUsImV4cCI6MjEwMzUwNzM0NX0.2h66UtM9e2Tep-POompjQTIrtwpbUsHhib4SoZ1EbCU",
	"VITE_SUPABASE_URL": "https://onqphgzhokubodjmseos.supabase.co"
}["VITE_SUPABASE_ANON_KEY"];
if (!supabaseUrl || !supabaseAnonKey) console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project's URL + anon key.");
var supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", { auth: {
	persistSession: true,
	autoRefreshToken: true,
	detectSessionInUrl: false,
	storageKey: "justplay-partner.supabase.auth"
} });
/**
* JustPlay Partner — auth state (Backend Phase A).
*
* Real Supabase Auth session + real `public.partners` / `public.partner_venues`
* rows. OTP delivery itself is still mocked (no SMS provider wired up
* anywhere in this project yet, consumer app included) — this file reuses
* the consumer app's `mock-otp-verify` Edge Function unchanged to mint a
* real session for a phone number, then does partner-specific work on top:
* looking up (or, via `partner-signup`, creating) this person's
* `partners` + venue + `partner_venues` link.
*
* SWAP POINT FOR REAL SMS: identical to the consumer app — only
* `mock-otp-verify`'s OTP-validation step changes; this file, the RLS
* policies, and every downstream screen stay as-is.
*
* The exported shape (types, `useAuth()` fields) stays close to the Phase
* 1-5 mock so the rest of the app keeps working, with one addition:
* `venueId`, which downstream phases (B/C/D/E) need to scope their real
* queries to this partner's actual venue.
*/
var PartnerAuthContext = (0, import_react.createContext)(null);
var APPROVAL_TO_STATUS = {
	pending: "pending",
	approved: "active",
	rejected: "rejected"
};
async function fetchPartnerContext(userId) {
	const { data: partnerRow, error: partnerError } = await supabase.from("partners").select("phone, owner_name, business_name, approval_status").eq("id", userId).maybeSingle();
	if (partnerError) {
		console.error("fetchPartnerContext: partners lookup failed:", partnerError.message);
		return null;
	}
	if (!partnerRow) return null;
	const { data: links, error: linksError } = await supabase.from("partner_venues").select("role, venues(id, name, area, sports_offered)").eq("partner_id", userId).returns();
	if (linksError) {
		console.error("fetchPartnerContext: partner_venues lookup failed:", linksError.message);
		return null;
	}
	const ownerLink = links?.find((l) => l.role === "owner") ?? links?.[0];
	if (!ownerLink?.venues) return null;
	return {
		id: userId,
		businessName: partnerRow.business_name,
		ownerName: partnerRow.owner_name,
		phone: partnerRow.phone.replace(/^\+?91/, ""),
		venueId: ownerLink.venues.id,
		venueName: ownerLink.venues.name,
		area: ownerLink.venues.area ?? "",
		sports: ownerLink.venues.sports_offered ?? [],
		status: APPROVAL_TO_STATUS[partnerRow.approval_status] ?? "pending",
		role: ownerLink.role
	};
}
function PartnerAuthProvider({ children }) {
	const [session, setSession] = (0, import_react.useState)(null);
	const [partner, setPartner] = (0, import_react.useState)(null);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let active = true;
		(async () => {
			const { data: { session: initialSession } } = await supabase.auth.getSession();
			if (!active) return;
			if (initialSession) {
				setSession(initialSession);
				const ctx = await fetchPartnerContext(initialSession.user.id);
				if (!active) return;
				setPartner(ctx);
			}
			setHydrated(true);
		})();
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
			setSession(newSession);
			if (!newSession) setPartner(null);
		});
		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, []);
	/** SWAP POINT (send step): no-op today since there's no SMS provider yet. */
	const requestOtp = (0, import_react.useCallback)(async (_phone) => {
		await new Promise((r) => setTimeout(r, 700));
	}, []);
	/** SWAP POINT (verify step): mock-checks the code via the shared
	*  Edge Function, then mints a REAL session. */
	const verifyOtp = (0, import_react.useCallback)(async (phone, code) => {
		if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code we sent you.");
		const digits = phone.replace(/\D/g, "").slice(-10);
		if (digits.length !== 10) throw new Error("Enter a valid 10-digit Indian mobile number.");
		const { data: fnData, error: fnError } = await supabase.functions.invoke("mock-otp-verify", { body: {
			phone: digits,
			otp: code
		} });
		if (fnError) throw new Error(fnError.message || "Verification failed. Try again.");
		if (!fnData) throw new Error("Verification failed. Try again.");
		const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
			token_hash: fnData.tokenHash,
			type: "magiclink"
		});
		if (verifyError || !verifyData.session) throw new Error(verifyError?.message ?? "Could not start session. Try again.");
		setSession(verifyData.session);
		const ctx = await fetchPartnerContext(verifyData.session.user.id);
		setPartner(ctx);
		return { hasPartnerAccount: ctx != null };
	}, []);
	const signup = (0, import_react.useCallback)(async (input) => {
		const { data, error } = await supabase.functions.invoke("partner-signup", { body: {
			businessName: input.businessName,
			ownerName: input.ownerName,
			city: input.city
		} });
		if (error) throw new Error(error.message || "Could not create your partner account. Try again.");
		if (!data) throw new Error("Could not create your partner account. Try again.");
		const ctx = await fetchPartnerContext(data.partnerId);
		setPartner(ctx);
	}, []);
	const refreshPartnerContext = (0, import_react.useCallback)(async () => {
		if (!session) return;
		const ctx = await fetchPartnerContext(session.user.id);
		setPartner(ctx);
	}, [session]);
	const logout = (0, import_react.useCallback)(() => {
		setSession(null);
		setPartner(null);
		supabase.auth.signOut().catch((e) => console.error("signOut failed:", e));
	}, []);
	const value = (0, import_react.useMemo)(() => ({
		partner,
		isAuthenticated: Boolean(session),
		hydrated,
		requestOtp,
		verifyOtp,
		signup,
		refreshPartnerContext,
		logout
	}), [
		partner,
		session,
		hydrated,
		requestOtp,
		verifyOtp,
		signup,
		refreshPartnerContext,
		logout
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartnerAuthContext.Provider, {
		value,
		children
	});
}
function useAuth() {
	const ctx = (0, import_react.useContext)(PartnerAuthContext);
	if (!ctx) throw new Error("useAuth must be used inside <PartnerAuthProvider>");
	return ctx;
}
//#endregion
export { supabase as n, useAuth as r, PartnerAuthProvider as t };
