import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { f as Outlet, g as Link, l as useLocation } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as OwnerOnlyGuard } from "./OwnerOnlyGuard-D0Idbyn6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.payouts-SafxbCs4.js
var import_jsx_runtime = require_jsx_runtime();
var SECTIONS = [
	{
		to: "/dashboard/payouts",
		label: "Overview"
	},
	{
		to: "/dashboard/payouts/history",
		label: "Payout History"
	},
	{
		to: "/dashboard/payouts/settings",
		label: "Bank Details"
	}
];
function PayoutsLayout() {
	const location = useLocation();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OwnerOnlyGuard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-2xl font-semibold text-foreground sm:text-[28px]",
			children: "Payouts & Earnings"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Track what you've earned, what's coming, and where it lands."
		})] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5 flex gap-1 border-b border-border",
			children: SECTIONS.map((s) => {
				const active = location.pathname === s.to;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: s.to,
					className: `border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`,
					children: s.label
				}, s.to);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
		})
	] }) });
}
//#endregion
export { PayoutsLayout as component };
