import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as usePayouts } from "./payouts-BQdOpTXM.mjs";
import { i as formatINR } from "./dashboard-fdtWZGlf.mjs";
import { t as formatBookingId } from "./bookings-DZADHeQj.mjs";
import { i as statusLabel } from "./payouts-ZXT5tEQr.mjs";
import { M as Landmark, f as Smartphone, k as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Modal } from "./Modal-B2p3_zTG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.payouts.history-DtIoVBEq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StatusBadge({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${{
			processing: "bg-accent/15 text-accent",
			completed: "bg-primary/10 text-primary",
			failed: "bg-destructive/10 text-destructive"
		}[status]}`,
		children: statusLabel(status)
	});
}
function PayoutHistoryPage() {
	const { payoutBatches, loading } = usePayouts();
	const [openBatch, setOpenBatch] = (0, import_react.useState)(null);
	const sorted = [...payoutBatches].sort((a, b) => a.date < b.date ? 1 : -1);
	if (loading && sorted.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-[40vh] items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" })
	});
	if (sorted.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface-card flex flex-col items-center justify-center rounded-2xl py-20 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-semibold text-foreground",
			children: "No payouts yet"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 max-w-xs text-sm text-muted-foreground",
			children: "Once your venue starts taking bookings, payout batches will show up here."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "surface-card overflow-x-auto rounded-2xl",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[640px] text-left",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
				className: "bg-surface-raised",
				children: [
					"Date",
					"Amount",
					"Method",
					"Status"
				].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground",
					children: h
				}, h))
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sorted.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				onClick: () => setOpenBatch(b),
				tabIndex: 0,
				onKeyDown: (e) => e.key === "Enter" && setOpenBatch(b),
				className: `cursor-pointer hover:bg-secondary/40 ${i === 0 ? "" : "border-t border-border"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3.5 text-sm text-foreground",
						children: (/* @__PURE__ */ new Date(`${b.date}T00:00:00`)).toLocaleDateString("en-IN", {
							day: "numeric",
							month: "long",
							year: "numeric"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3.5 text-sm font-semibold text-foreground",
						children: formatINR(b.amount)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3.5 text-sm text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1.5",
							children: [b.method === "bank" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "h-3.5 w-3.5" }), b.method === "bank" ? "Bank transfer" : "UPI"]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3.5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: b.status })
					})
				]
			}, b.id)) })]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		open: openBatch != null,
		onClose: () => setOpenBatch(null),
		title: openBatch ? formatINR(openBatch.amount) + " payout" : "",
		description: openBatch ? (/* @__PURE__ */ new Date(`${openBatch.date}T00:00:00`)).toLocaleDateString("en-IN", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric"
		}) : void 0,
		width: "lg",
		children: openBatch && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col divide-y divide-border",
			children: [openBatch.lineItems.map((li) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between py-2.5 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted-foreground",
					children: [
						formatBookingId(li.bookingId),
						" · ",
						li.bookingLabel
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-semibold text-foreground",
					children: formatINR(li.netAmount)
				})]
			}, li.bookingId)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-bold text-foreground",
					children: "Total transferred"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-lg font-bold text-foreground",
					children: formatINR(openBatch.amount)
				})]
			})]
		})
	})] });
}
//#endregion
export { PayoutHistoryPage as component };
