import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { i as statusLabel } from "./bookings-DZADHeQj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BookingBadges-BvGD7nzv.js
var import_jsx_runtime = require_jsx_runtime();
function BookingStatusBadge({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${{
			confirmed: "bg-primary/10 text-primary",
			completed: "bg-secondary text-foreground",
			cancelled: "bg-destructive/10 text-destructive",
			no_show: "bg-accent/15 text-accent"
		}[status]}`,
		children: statusLabel(status)
	});
}
function PaymentStatusBadge({ status }) {
	const s = {
		paid: {
			className: "bg-primary/10 text-primary",
			label: "Paid"
		},
		pending: {
			className: "bg-accent/15 text-accent",
			label: "Pending"
		},
		refunded: {
			className: "bg-surface-raised text-muted-foreground",
			label: "Refunded"
		}
	}[status];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`,
		children: s.label
	});
}
//#endregion
export { PaymentStatusBadge as n, BookingStatusBadge as t };
