import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { f as Outlet, g as Link, l as useLocation } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.slots-BoWmP_qK.js
var import_jsx_runtime = require_jsx_runtime();
var SECTIONS = [
	{
		to: "/dashboard/slots",
		label: "Calendar"
	},
	{
		to: "/dashboard/slots/setup",
		label: "Bulk Slot Setup"
	},
	{
		to: "/dashboard/slots/courts",
		label: "Courts & Sports"
	}
];
function SlotsLayout() {
	const location = useLocation();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-2xl font-semibold text-foreground sm:text-[28px]",
			children: "Slots & Inventory"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Manage availability, pricing and courts for your venue."
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
	] });
}
//#endregion
export { SlotsLayout as component };
