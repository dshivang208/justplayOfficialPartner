import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as useNotificationPrefs } from "./notifications-CPFj2m05.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.settings.notifications-Ch6nTuQR.js
var import_jsx_runtime = require_jsx_runtime();
function Toggle({ checked, onChange, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "switch",
		"aria-checked": checked,
		"aria-label": label,
		onClick: () => onChange(!checked),
		className: `relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-surface-raised"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-1"}` })
	});
}
var EVENTS = [
	{
		key: "newBooking",
		label: "New booking",
		description: "Someone books a slot at your venue"
	},
	{
		key: "cancellation",
		label: "Cancellation",
		description: "A booking is cancelled"
	},
	{
		key: "payout",
		label: "Payout",
		description: "A payout is processed or scheduled"
	},
	{
		key: "lowOccupancy",
		label: "Low occupancy",
		description: "Upcoming slots are unusually empty"
	}
];
var CHANNELS = [
	{
		key: "sms",
		label: "SMS"
	},
	{
		key: "email",
		label: "Email"
	},
	{
		key: "inApp",
		label: "In-app"
	}
];
function NotificationsPage() {
	const { prefs, toggle } = useNotificationPrefs();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface-card overflow-hidden rounded-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[1fr_repeat(3,80px)] items-center gap-2 border-b border-border bg-surface-raised px-5 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[11px] font-bold uppercase tracking-wide text-muted-foreground",
				children: "Event"
			}), CHANNELS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground",
				children: c.label
			}, c.key))]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col divide-y divide-border",
			children: EVENTS.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-[1fr_repeat(3,80px)] items-center gap-2 px-5 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold text-foreground",
					children: event.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-muted-foreground",
					children: event.description
				})] }), CHANNELS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						checked: prefs[event.key][c.key],
						onChange: () => toggle(event.key, c.key),
						label: `${event.label} via ${c.label}`
					})
				}, c.key))]
			}, event.key))
		})]
	});
}
//#endregion
export { NotificationsPage as component };
